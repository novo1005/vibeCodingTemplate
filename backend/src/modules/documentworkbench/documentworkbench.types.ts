import type {
  DocumentWorkbench,
  DocumentTypeId,
  FinalizedDocument,
  FrameworkId,
  FrameworkScore,
  NormalizedParagraph,
  QualityCheckItem,
  StructuredPreview,
} from './documentworkbench.schema'

export type { DocumentWorkbench }

export interface DocumentWorkbenchRow {
  id: string
  title: string
  done: number | boolean
  created_at: string | Date
}

export type SessionStatus =
  | 'imported'
  | 'recommended'
  | 'previewed'
  | 'quality_checked'
  | 'finalized'
  | 'published'

export interface DocumentTypeRule {
  id: string
  label: string
  description: string
  severity: 'info' | 'warning' | 'blocking'
}

export interface DocumentTypeSection {
  id: string
  heading: string
  description: string
  required: boolean
}

export interface DocumentTypeDefinition {
  typeId: DocumentTypeId
  label: string
  description: string
  rulesVersion: string
  requiredSections: string[]
  sectionTemplate: DocumentTypeSection[]
  writingRules: DocumentTypeRule[]
  methodologyRules: DocumentTypeRule[]
  qualityRules: DocumentTypeRule[]
  preferredFrameworkIds: FrameworkId[]
}

export interface FrameworkSlot {
  slotId: string
  label: string
  description: string
  required: boolean
  missingQuestion: string
}

export interface FrameworkDefinition {
  frameworkId: FrameworkId
  label: string
  description: string
  slots: FrameworkSlot[]
}

export interface DocumentWorkbenchSession {
  id: string
  documentType: DocumentTypeId
  documentTypeRulesVersion: string
  sourceType: 'lark' | 'markdown'
  sourceUrl: string | null
  originalTitle: string
  normalizedParagraphs: NormalizedParagraph[]
  recommendation: FrameworkScore[]
  currentFramework: FrameworkId | null
  preview: StructuredPreview | null
  qualityChecks: QualityCheckItem[]
  supplements: Array<{ id: string; question: string; answer: string; relatedSectionId?: string }>
  finalDocument: FinalizedDocument | null
  publishedUrl: string | null
  status: SessionStatus
  createdAt: string
  updatedAt: string
}
