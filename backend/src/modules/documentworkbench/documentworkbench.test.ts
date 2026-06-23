import assert from 'node:assert/strict'
import { AppError } from '@/utils/http-error'
import { createDeterministicAiGateway, createHttpAiGateway, extractJsonObject } from './ai-gateway'
import { documentTypes } from './document-type-catalog'
import { createDisabledLarkGateway } from './lark-gateway'
import { createDocumentWorkbenchService } from './documentworkbench.service'
import { normalizeDraft } from './normalizer'
import { frameworks } from './framework-catalog'
import type { CreateSessionInput } from './documentworkbench.repository'
import type { DocumentWorkbenchSession } from './documentworkbench.types'
import {
  DocumentWorkbenchImportBodySchema,
  DocumentWorkbenchPreviewBodySchema,
} from './documentworkbench.schema'

function testDocumentTypes() {
  assert.equal(documentTypes.length, 4)
  assert.deepEqual(
    documentTypes.map((item) => item.typeId),
    ['okr-review', 'user-research', 'competitor-analysis', 'meeting-minutes'],
  )
  const okr = documentTypes.find((item) => item.typeId === 'okr-review')
  assert.ok(okr)
  assert.ok(okr.requiredSections.includes('okr-overview'))
  assert.ok(okr.qualityRules.some((rule) => rule.id === 'okr-controllable-factors'))
}

function testFrameworks() {
  assert.equal(frameworks.length, 6)
  const pyramid = frameworks.find((item) => item.frameworkId === 'pyramid')
  assert.ok(pyramid)
  assert.ok(pyramid.slots.some((slot) => slot.slotId === 'core-conclusion'))
}

function testImportSchemaRequiresDocumentType() {
  assert.throws(() => DocumentWorkbenchImportBodySchema.parse({ markdown: '# Draft' }))
  const parsed = DocumentWorkbenchImportBodySchema.parse({
    documentType: 'user-research',
    sourceType: 'markdown',
    markdown: '# 用户调研初稿',
  })
  assert.equal(parsed.documentType, 'user-research')
}

function testPreviewSchemaAcceptsFramework() {
  const parsed = DocumentWorkbenchPreviewBodySchema.parse({
    frameworkId: 'pyramid',
    model: 'default-model',
    supplements: [],
  })
  assert.equal(parsed.frameworkId, 'pyramid')
}

function testNormalizeDraft() {
  const result = normalizeDraft({
    title: '原始标题',
    markdown: '# 原始标题\n\n第一段内容。\n\n- 列表内容\n\n第二段内容。',
  })
  assert.equal(result.title, '原始标题')
  assert.deepEqual(
    result.paragraphs.map((item) => item.id),
    ['p-001', 'p-002', 'p-003'],
  )
  assert.equal(result.paragraphs[1]?.text, '列表内容')
}

function testExtractJsonObject() {
  assert.deepEqual(extractJsonObject('```json\n{"ok":true}\n```'), { ok: true })
  assert.deepEqual(extractJsonObject('prefix {"ok":true} suffix'), { ok: true })
}

async function testDeterministicGateway() {
  const gateway = createDeterministicAiGateway()
  const recommendation = await gateway.recommend({
    model: 'local',
    documentType: documentTypes[0]!,
    frameworks,
    paragraphs: [{ id: 'p-001', index: 0, text: 'KR 达成 80%，需要复盘原因。' }],
  })
  assert.equal(recommendation[0]?.frameworkId, 'four-f')
}

async function testHttpGatewayUsesAiForPreviewAndFinalize() {
  const calls: unknown[] = []
  const aiPreview = {
    frameworkId: 'prep',
    title: 'AI 改写后的会议纪要',
    summary: 'AI 已按会议纪要规范重新组织内容。',
    sections: [
      {
        slotId: 'meeting-background',
        heading: '会议背景',
        content: '团队决定上线文档工具，以减少反复返工。',
        sourceParagraphIds: ['p-001'],
        rewriteNote: '压缩原文并补足会议背景表达。',
        evidenceStatus: 'supported',
        missingQuestion: null,
      },
    ],
    qualityChecks: [],
    missingCount: 0,
    markdown: '# AI 改写后的会议纪要\n\n团队决定上线文档工具，以减少反复返工。',
  }
  const aiFinal = {
    ...aiPreview,
    markdown: '# AI 终稿\n\n团队决定上线文档工具，先由张三在 6 月 30 日前完成 API。',
    deAiNotes: ['删掉模板腔，保留责任人与时间信息。'],
  }
  const fetchMock: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body))
    calls.push(body)
    const payload = body.messages.some((message: { content: string }) =>
      message.content.includes('"task":"finalize"'),
    )
      ? aiFinal
      : aiPreview
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(payload) } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const gateway = createHttpAiGateway(
    {
      AI_GATEWAY_API_KEY: 'test-key',
      AI_GATEWAY_BASE_URL: 'https://example.test/v1/chat/completions',
      AI_GATEWAY_TIMEOUT_MS: 30000,
    } as never,
    fetchMock,
  )

  const preview = await gateway.preview({
    model: 'company-model',
    documentType: documentTypes.find((item) => item.typeId === 'meeting-minutes')!,
    frameworks,
    framework: frameworks.find((item) => item.frameworkId === 'prep')!,
    paragraphs: [
      { id: 'p-001', index: 0, text: '决定上线文档工具。' },
      { id: 'p-002', index: 1, text: '张三 6 月 30 日前完成 API。' },
    ],
    supplements: [],
  })
  assert.equal(preview.markdown, aiPreview.markdown)

  const finalDocument = await gateway.finalize({
    model: 'company-model',
    documentType: documentTypes.find((item) => item.typeId === 'meeting-minutes')!,
    preview,
    acceptedQualityRuleIds: [],
    skipDeAi: false,
  })
  assert.equal(finalDocument.markdown, aiFinal.markdown)
  assert.ok(finalDocument.deAiNotes.includes('删掉模板腔，保留责任人与时间信息。'))
  assert.equal(calls.length, 2)
}

async function testHttpGatewayReportsReadableGatewayErrors() {
  const fetchMock: typeof fetch = async () =>
    new Response(JSON.stringify({ message: 'invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

  const gateway = createHttpAiGateway(
    {
      AI_GATEWAY_API_KEY: 'bad-key',
      AI_GATEWAY_BASE_URL: 'https://example.test/v1/chat/completions',
      AI_GATEWAY_TIMEOUT_MS: 30000,
    } as never,
    fetchMock,
  )

  await assert.rejects(
    () =>
      gateway.recommend({
        model: 'company-model',
        documentType: documentTypes[0]!,
        frameworks,
        paragraphs: [{ id: 'p-001', index: 0, text: 'KR 达成 80%。' }],
      }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 502 &&
      error.message.includes('AI 网关请求失败') &&
      error.message.includes('401'),
  )
}

function createInMemoryRepositoryForTest(sessions: Map<string, DocumentWorkbenchSession>) {
  return {
    async create(input: CreateSessionInput) {
      const session: DocumentWorkbenchSession = {
        id: input.id,
        documentType: input.documentType,
        documentTypeRulesVersion: input.documentTypeRulesVersion,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        originalTitle: input.originalTitle,
        normalizedParagraphs: input.normalizedParagraphs,
        recommendation: [],
        currentFramework: null,
        preview: null,
        qualityChecks: [],
        supplements: [],
        finalDocument: null,
        publishedUrl: null,
        status: 'imported',
        createdAt: input.now,
        updatedAt: input.now,
      }
      sessions.set(session.id, session)
      return session
    },
    async findById(id: string) {
      return sessions.get(id) ?? null
    },
    async save(session: DocumentWorkbenchSession) {
      sessions.set(session.id, session)
      return session
    },
  }
}

async function testMarkdownServiceFlow() {
  const sessions = new Map<string, DocumentWorkbenchSession>()
  const repository = createInMemoryRepositoryForTest(sessions)
  const service = createDocumentWorkbenchService({
    repository,
    aiGateway: createDeterministicAiGateway(),
    larkGateway: createDisabledLarkGateway(),
    now: () => '2026-06-23T00:00:00.000Z',
    createId: () => `session-${sessions.size + 1}`,
  })

  const imported = await service.importDraft({
    documentType: 'meeting-minutes',
    sourceType: 'markdown',
    markdown: '# 例会\n\n决定上线文档工具。\n\n张三 6 月 30 日前完成 API。',
  })
  assert.equal(imported.documentType, 'meeting-minutes')

  const recommended = await service.recommend(imported.id, { model: 'local' })
  assert.equal(recommended[0]?.frameworkId, 'prep')

  const preview = await service.preview(imported.id, {
    frameworkId: 'prep',
    model: 'local',
    supplements: [],
  })
  assert.ok(preview.markdown.includes('决策内容'))

  const finalDocument = await service.finalize(imported.id, {
    model: 'local',
    acceptedQualityRuleIds: [],
    skipDeAi: false,
  })
  assert.ok(finalDocument.deAiNotes.length > 0)
}

testDocumentTypes()
testFrameworks()
testImportSchemaRequiresDocumentType()
testPreviewSchemaAcceptsFramework()
testNormalizeDraft()
testExtractJsonObject()
await testDeterministicGateway()
await testHttpGatewayUsesAiForPreviewAndFinalize()
await testHttpGatewayReportsReadableGatewayErrors()
await testMarkdownServiceFlow()

console.log('document-workbench tests: OK')
