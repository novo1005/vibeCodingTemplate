import { z } from 'zod'

export const DocumentTypeIdSchema = z.enum([
  'okr-review',
  'user-research',
  'competitor-analysis',
  'meeting-minutes',
])

export const FrameworkIdSchema = z.enum([
  'prep',
  'pyramid',
  'scqa',
  'four-f',
  'story-five',
  'star',
])

export const SourceTypeSchema = z.enum(['lark', 'markdown'])

export const SessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
})

export const SupplementSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().default(''),
  relatedSectionId: z.string().optional(),
})

export const NormalizedParagraphSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  text: z.string(),
})

export const FrameworkScoreSchema = z.object({
  frameworkId: FrameworkIdSchema,
  score: z.number().min(0).max(100),
  reason: z.string(),
  recommendedRank: z.number().int().positive().nullable(),
})

export const StructuredSectionSchema = z.object({
  slotId: z.string(),
  heading: z.string(),
  content: z.string(),
  sourceParagraphIds: z.array(z.string()),
  rewriteNote: z.string(),
  evidenceStatus: z.enum(['supported', 'missing', 'user-supplied']),
  missingQuestion: z.string().nullable(),
})

export const QualityCheckItemSchema = z.object({
  ruleId: z.string(),
  label: z.string(),
  status: z.enum(['passed', 'needs_revision', 'missing_info']),
  reason: z.string(),
  suggestedRevision: z.string().nullable(),
  requiresUserInput: z.boolean(),
  relatedSectionIds: z.array(z.string()),
})

export const StructuredPreviewSchema = z.object({
  frameworkId: FrameworkIdSchema,
  title: z.string(),
  summary: z.string(),
  sections: z.array(StructuredSectionSchema),
  qualityChecks: z.array(QualityCheckItemSchema),
  missingCount: z.number().int().nonnegative(),
  markdown: z.string(),
})

export const FinalizedDocumentSchema = StructuredPreviewSchema.extend({
  deAiNotes: z.array(z.string()),
})

export const DocumentworkbenchSchema = z.object({
  id: z.string(),
  documentType: DocumentTypeIdSchema,
  documentTypeRulesVersion: z.string(),
  sourceType: SourceTypeSchema,
  originalTitle: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const DocumentWorkbenchCreateSchema = z.object({
  title: z.string().min(1).max(120),
  done: z.boolean().optional().default(false),
})

export const DocumentWorkbenchUpdateSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    done: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.done !== undefined, {
    message: 'At least one of `title` or `done` is required',
  })

export const DocumentWorkbenchIdSchema = z.object({
  id: z.string().min(1),
})

export const DocumentWorkbenchSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(),
})

export const DocumentWorkbenchImportBodySchema = z
  .object({
    documentType: DocumentTypeIdSchema,
    sourceType: SourceTypeSchema,
    larkUrl: z.string().url().optional(),
    markdown: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === 'lark' && !value.larkUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'larkUrl is required for lark import' })
    }
    if (value.sourceType === 'markdown' && !value.markdown?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'markdown is required for markdown import' })
    }
  })

export const DocumentWorkbenchRecommendBodySchema = z.object({
  model: z.string().min(1),
})

export const DocumentWorkbenchPreviewBodySchema = z.object({
  frameworkId: FrameworkIdSchema,
  model: z.string().min(1),
  supplements: z.array(SupplementSchema).default([]),
})

export const DocumentWorkbenchQualityCheckBodySchema = z.object({
  model: z.string().min(1),
})

export const DocumentWorkbenchFinalizeBodySchema = z.object({
  model: z.string().min(1),
  acceptedQualityRuleIds: z.array(z.string()).default([]),
  skipDeAi: z.boolean().default(false),
})

export const DocumentWorkbenchPublishBodySchema = z.object({
  title: z.string().min(1).max(160),
  confirmed: z.literal(true),
})

export type DocumentTypeId = z.infer<typeof DocumentTypeIdSchema>
export type FrameworkId = z.infer<typeof FrameworkIdSchema>
export type NormalizedParagraph = z.infer<typeof NormalizedParagraphSchema>
export type FrameworkScore = z.infer<typeof FrameworkScoreSchema>
export type StructuredSection = z.infer<typeof StructuredSectionSchema>
export type QualityCheckItem = z.infer<typeof QualityCheckItemSchema>
export type StructuredPreview = z.infer<typeof StructuredPreviewSchema>
export type FinalizedDocument = z.infer<typeof FinalizedDocumentSchema>
export type Documentworkbench = z.infer<typeof DocumentworkbenchSchema>
export type DocumentWorkbench = z.infer<typeof DocumentWorkbenchSchema>
export type DocumentWorkbenchCreateInput = z.infer<typeof DocumentWorkbenchCreateSchema>
export type DocumentWorkbenchUpdateInput = z.infer<typeof DocumentWorkbenchUpdateSchema>
export type DocumentWorkbenchImportBody = z.infer<typeof DocumentWorkbenchImportBodySchema>
export type DocumentWorkbenchPreviewBody = z.infer<typeof DocumentWorkbenchPreviewBodySchema>
