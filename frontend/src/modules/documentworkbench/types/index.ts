export type DocumentTypeId = 'okr-review' | 'user-research' | 'competitor-analysis' | 'meeting-minutes'
export type FrameworkId = 'prep' | 'pyramid' | 'scqa' | 'four-f' | 'story-five' | 'star'

export type WorkbenchStatus =
  | 'idle'
  | 'importing'
  | 'recommending'
  | 'previewing'
  | 'quality-checking'
  | 'ready'
  | 'finalizing'
  | 'finalized'
  | 'publishing'
  | 'published'
  | 'failed'

export interface Documentworkbench {
  id: string
  documentType: DocumentTypeId
  documentTypeRulesVersion: string
  sourceType: 'lark' | 'markdown'
  originalTitle: string
  status: string
  createdAt: string
  updatedAt: string
}

export type DocumentWorkbench = Documentworkbench

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

export interface DocumentType {
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

export interface FrameworkSummary {
  frameworkId: FrameworkId
  label: string
  description: string
}

export interface FrameworkScore {
  frameworkId: FrameworkId
  score: number
  reason: string
  recommendedRank: number | null
}

export interface QualityCheckItem {
  ruleId: string
  label: string
  status: 'passed' | 'needs_revision' | 'missing_info'
  reason: string
  suggestedRevision: string | null
  requiresUserInput: boolean
  relatedSectionIds: string[]
}

export interface StructuredSection {
  slotId: string
  heading: string
  content: string
  sourceParagraphIds: string[]
  rewriteNote: string
  evidenceStatus: 'supported' | 'missing' | 'user-supplied'
  missingQuestion: string | null
}

export interface StructuredPreview {
  frameworkId: FrameworkId
  title: string
  summary: string
  sections: StructuredSection[]
  qualityChecks: QualityCheckItem[]
  missingCount: number
  markdown: string
}

export interface FinalizedDocument extends StructuredPreview {
  deAiNotes: string[]
}

export interface NormalizedParagraph {
  id: string
  index: number
  text: string
}

export interface ImportResponse {
  id: string
  documentType: DocumentTypeId
  originalTitle: string
  normalizedParagraphs: NormalizedParagraph[]
}

export interface WorkbenchConfig {
  models: string[]
  defaultModel: string
  documentTypes: DocumentType[]
  frameworks: FrameworkSummary[]
  aiConnected: boolean
  larkConnected: boolean
}

export interface SupplementInput {
  id: string
  question: string
  answer: string
  relatedSectionId?: string
}

export interface ImportDraftInput {
  documentType: DocumentTypeId
  sourceType: 'lark' | 'markdown'
  larkUrl?: string
  markdown?: string
}

export interface PreviewInput {
  frameworkId: FrameworkId
  model: string
  supplements: SupplementInput[]
}
