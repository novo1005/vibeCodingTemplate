import { nanoid } from '@/utils/id'
import { BadRequestError, NotFoundError } from '@/utils/http-error'
import { env } from '@/config/env'
import { createDeterministicAiGateway, createHttpAiGateway, type AiGateway } from './ai-gateway'
import { documentTypes, getDocumentType } from './document-type-catalog'
import { frameworks, getFramework } from './framework-catalog'
import { createDisabledLarkGateway, type LarkGateway } from './lark-gateway'
import { documentWorkbenchRepository, type CreateSessionInput } from './documentworkbench.repository'
import type { DocumentWorkbench } from './documentworkbench.schema'
import type {
  DocumentWorkbenchFinalizeBodySchema,
  DocumentWorkbenchImportBody,
  DocumentWorkbenchPreviewBody,
} from './documentworkbench.schema'
import type { DocumentWorkbenchSession } from './documentworkbench.types'
import { normalizeDraft } from './normalizer'

interface SessionRepository {
  create(input: CreateSessionInput): Promise<DocumentWorkbenchSession>
  findById(id: string): Promise<DocumentWorkbenchSession | null>
  save(session: DocumentWorkbenchSession): Promise<DocumentWorkbenchSession>
}

type FinalizeInput = typeof DocumentWorkbenchFinalizeBodySchema._type

interface ServiceDeps {
  repository: SessionRepository
  aiGateway: AiGateway
  larkGateway: LarkGateway
  now: () => string
  createId: () => string
}

function requireSession(session: DocumentWorkbenchSession | null) {
  if (!session) throw NotFoundError('document workbench session')
  return session
}

function touch(session: DocumentWorkbenchSession, now: string) {
  return { ...session, updatedAt: now }
}

export function createDocumentWorkbenchService(deps: ServiceDeps) {
  return {
    getConfig() {
      const models = env.AI_GATEWAY_MODELS.split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      return {
        models,
        defaultModel: env.AI_GATEWAY_DEFAULT_MODEL,
        documentTypes,
        frameworks: frameworks.map(({ frameworkId, label, description }) => ({
          frameworkId,
          label,
          description,
        })),
        aiConnected: Boolean(env.AI_GATEWAY_API_KEY),
        larkConnected: false,
      }
    },

    async importDraft(input: DocumentWorkbenchImportBody) {
      const documentType = getDocumentType(input.documentType)
      if (!documentType) throw BadRequestError('Unsupported document type')

      const source =
        input.sourceType === 'lark'
          ? await deps.larkGateway.importDocument(input.larkUrl ?? '')
          : { title: 'Markdown 初稿', markdown: input.markdown ?? '' }

      const normalized = normalizeDraft(source)
      return deps.repository.create({
        id: deps.createId(),
        documentType: documentType.typeId,
        documentTypeRulesVersion: documentType.rulesVersion,
        sourceType: input.sourceType,
        sourceUrl: input.sourceType === 'lark' ? (input.larkUrl ?? null) : null,
        originalTitle: normalized.title,
        normalizedParagraphs: normalized.paragraphs,
        now: deps.now(),
      })
    },

    async recommend(sessionId: string, input: { model: string }) {
      const session = requireSession(await deps.repository.findById(sessionId))
      const documentType = getDocumentType(session.documentType)
      if (!documentType) throw BadRequestError('Unsupported document type')

      const recommendation = await deps.aiGateway.recommend({
        model: input.model,
        documentType,
        frameworks,
        paragraphs: session.normalizedParagraphs,
      })

      const next = touch(
        {
          ...session,
          recommendation,
          status: 'recommended',
        },
        deps.now(),
      )
      await deps.repository.save(next)
      return recommendation
    },

    async preview(sessionId: string, input: DocumentWorkbenchPreviewBody) {
      const session = requireSession(await deps.repository.findById(sessionId))
      const documentType = getDocumentType(session.documentType)
      const framework = getFramework(input.frameworkId)
      if (!documentType) throw BadRequestError('Unsupported document type')
      if (!framework) throw BadRequestError('Unsupported framework')

      const preview = await deps.aiGateway.preview({
        model: input.model,
        documentType,
        frameworks,
        framework,
        paragraphs: session.normalizedParagraphs,
        supplements: input.supplements,
      })

      await deps.repository.save(
        touch(
          {
            ...session,
            currentFramework: input.frameworkId,
            preview,
            qualityChecks: preview.qualityChecks,
            supplements: input.supplements,
            status: 'previewed',
          },
          deps.now(),
        ),
      )
      return preview
    },

    async qualityCheck(sessionId: string, input: { model: string }) {
      const session = requireSession(await deps.repository.findById(sessionId))
      const documentType = getDocumentType(session.documentType)
      if (!documentType) throw BadRequestError('Unsupported document type')
      if (!session.preview) throw BadRequestError('Preview must be generated before quality check')

      const qualityChecks = await deps.aiGateway.qualityCheck({
        model: input.model,
        documentType,
        preview: session.preview,
      })
      await deps.repository.save(touch({ ...session, qualityChecks, status: 'quality_checked' }, deps.now()))
      return qualityChecks
    },

    async saveSupplements(
      sessionId: string,
      input: Array<{ id: string; question: string; answer: string; relatedSectionId?: string }>,
    ) {
      const session = requireSession(await deps.repository.findById(sessionId))
      const next = touch({ ...session, supplements: input }, deps.now())
      await deps.repository.save(next)
      return next.supplements
    },

    async finalize(sessionId: string, input: FinalizeInput) {
      const session = requireSession(await deps.repository.findById(sessionId))
      const documentType = getDocumentType(session.documentType)
      if (!documentType) throw BadRequestError('Unsupported document type')
      if (!session.preview) throw BadRequestError('Preview must be generated before finalize')

      const finalDocument = await deps.aiGateway.finalize({
        model: input.model,
        documentType,
        preview: session.preview,
        acceptedQualityRuleIds: input.acceptedQualityRuleIds,
        skipDeAi: input.skipDeAi,
      })

      await deps.repository.save(touch({ ...session, finalDocument, status: 'finalized' }, deps.now()))
      return finalDocument
    },

    async publish(sessionId: string, input: { title: string; confirmed: true }) {
      const session = requireSession(await deps.repository.findById(sessionId))
      if (session.publishedUrl) return { url: session.publishedUrl }
      if (!session.finalDocument) throw BadRequestError('Final document must exist before publishing')

      const published = await deps.larkGateway.publishDocument({
        title: input.title,
        markdown: session.finalDocument.markdown,
      })
      await deps.repository.save(
        touch({ ...session, publishedUrl: published.url, status: 'published' }, deps.now()),
      )
      return published
    },

    async exportMarkdown(sessionId: string) {
      const session = requireSession(await deps.repository.findById(sessionId))
      return session.finalDocument?.markdown ?? session.preview?.markdown ?? ''
    },

    list(): Promise<DocumentWorkbench[]> {
      return documentWorkbenchRepository.legacyList()
    },

    async get(id: string): Promise<DocumentWorkbench> {
      const item = await documentWorkbenchRepository.legacyFindById(id)
      if (!item) throw NotFoundError('document workbench item')
      return item
    },

    create(input: { title: string; done?: boolean }): Promise<DocumentWorkbench> {
      return documentWorkbenchRepository.legacyCreate({ title: input.title, done: input.done ?? false })
    },

    async update(id: string, input: { title?: string; done?: boolean }): Promise<DocumentWorkbench> {
      const exists = await documentWorkbenchRepository.legacyFindById(id)
      if (!exists) throw NotFoundError('document workbench item')
      const updated = await documentWorkbenchRepository.legacyUpdate(id, input)
      if (!updated) throw NotFoundError('document workbench item')
      return updated
    },

    async remove(id: string): Promise<{ id: string }> {
      const ok = await documentWorkbenchRepository.legacyRemove(id)
      if (!ok) throw NotFoundError('document workbench item')
      return { id }
    },
  }
}

export const documentWorkbenchService = createDocumentWorkbenchService({
  repository: documentWorkbenchRepository,
  aiGateway: env.AI_GATEWAY_API_KEY ? createHttpAiGateway(env) : createDeterministicAiGateway(),
  larkGateway: createDisabledLarkGateway(),
  now: () => new Date().toISOString(),
  createId: () => nanoid(),
})
