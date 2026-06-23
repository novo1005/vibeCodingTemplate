import { db } from '@/db'
import type {
  DocumentWorkbench,
  DocumentWorkbenchCreateInput,
  DocumentWorkbenchUpdateInput,
  DocumentTypeId,
  FrameworkId,
  FrameworkScore,
  NormalizedParagraph,
  QualityCheckItem,
  StructuredPreview,
  FinalizedDocument,
} from './documentworkbench.schema'
import type { DocumentWorkbenchSession, SessionStatus } from './documentworkbench.types'

interface SessionRow {
  id: string
  document_type: DocumentTypeId
  document_type_rules_version: string
  source_type: 'lark' | 'markdown'
  source_url: string | null
  original_title: string
  normalized_paragraphs: string
  recommendation: string
  current_framework: FrameworkId | null
  preview: string | null
  quality_checks: string
  supplements: string
  final_document: string | null
  published_url: string | null
  status: SessionStatus
  created_at: string | Date
  updated_at: string | Date
}

export interface CreateSessionInput {
  id: string
  documentType: DocumentTypeId
  documentTypeRulesVersion: string
  sourceType: 'lark' | 'markdown'
  sourceUrl: string | null
  originalTitle: string
  normalizedParagraphs: NormalizedParagraph[]
  now: string
}

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  return JSON.parse(value) as T
}

function toDomain(row: SessionRow): DocumentWorkbenchSession {
  return {
    id: row.id,
    documentType: row.document_type,
    documentTypeRulesVersion: row.document_type_rules_version,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    originalTitle: row.original_title,
    normalizedParagraphs: parseJson<NormalizedParagraph[]>(row.normalized_paragraphs, []),
    recommendation: parseJson<FrameworkScore[]>(row.recommendation, []),
    currentFramework: row.current_framework,
    preview: parseJson<StructuredPreview | null>(row.preview, null),
    qualityChecks: parseJson<QualityCheckItem[]>(row.quality_checks, []),
    supplements: parseJson<
      Array<{ id: string; question: string; answer: string; relatedSectionId?: string }>
    >(row.supplements, []),
    finalDocument: parseJson<FinalizedDocument | null>(row.final_document, null),
    publishedUrl: row.published_url,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function legacyItem(): DocumentWorkbench {
  return {
    id: 'legacy-scaffold',
    title: 'Document workbench scaffold',
    done: false,
    createdAt: new Date(0).toISOString(),
  }
}

export const documentWorkbenchRepository = {
  async create(input: CreateSessionInput): Promise<DocumentWorkbenchSession> {
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

    await db.execute(
      `INSERT INTO document_workbench_sessions (
        id,
        document_type,
        document_type_rules_version,
        source_type,
        source_url,
        original_title,
        normalized_paragraphs,
        recommendation,
        current_framework,
        preview,
        quality_checks,
        supplements,
        final_document,
        published_url,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.documentType,
        session.documentTypeRulesVersion,
        session.sourceType,
        session.sourceUrl,
        session.originalTitle,
        JSON.stringify(session.normalizedParagraphs),
        JSON.stringify(session.recommendation),
        session.currentFramework,
        JSON.stringify(session.preview),
        JSON.stringify(session.qualityChecks),
        JSON.stringify(session.supplements),
        JSON.stringify(session.finalDocument),
        session.publishedUrl,
        session.status,
        session.createdAt,
        session.updatedAt,
      ],
    )

    return session
  },

  async findById(id: string): Promise<DocumentWorkbenchSession | null> {
    const row = await db.queryOne<SessionRow>(
      'SELECT * FROM document_workbench_sessions WHERE id = ?',
      [id],
    )
    return row ? toDomain(row) : null
  },

  async save(session: DocumentWorkbenchSession): Promise<DocumentWorkbenchSession> {
    await db.execute(
      `UPDATE document_workbench_sessions SET
        document_type = ?,
        document_type_rules_version = ?,
        source_type = ?,
        source_url = ?,
        original_title = ?,
        normalized_paragraphs = ?,
        recommendation = ?,
        current_framework = ?,
        preview = ?,
        quality_checks = ?,
        supplements = ?,
        final_document = ?,
        published_url = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        session.documentType,
        session.documentTypeRulesVersion,
        session.sourceType,
        session.sourceUrl,
        session.originalTitle,
        JSON.stringify(session.normalizedParagraphs),
        JSON.stringify(session.recommendation),
        session.currentFramework,
        JSON.stringify(session.preview),
        JSON.stringify(session.qualityChecks),
        JSON.stringify(session.supplements),
        JSON.stringify(session.finalDocument),
        session.publishedUrl,
        session.status,
        session.updatedAt,
        session.id,
      ],
    )
    return session
  },

  async legacyList(): Promise<DocumentWorkbench[]> {
    return []
  },

  async legacyFindById(id: string): Promise<DocumentWorkbench | null> {
    return id === 'legacy-scaffold' ? legacyItem() : null
  },

  async legacyCreate(input: DocumentWorkbenchCreateInput): Promise<DocumentWorkbench> {
    return { ...legacyItem(), id: 'legacy-scaffold', title: input.title, done: input.done ?? false }
  },

  async legacyUpdate(
    id: string,
    input: DocumentWorkbenchUpdateInput,
  ): Promise<DocumentWorkbench | null> {
    const current = await this.legacyFindById(id)
    if (!current) return null
    return {
      ...current,
      title: input.title ?? current.title,
      done: input.done ?? current.done,
    }
  },

  async legacyRemove(id: string): Promise<boolean> {
    return id === 'legacy-scaffold'
  },
}
