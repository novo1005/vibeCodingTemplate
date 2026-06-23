import type { DocumentType, FrameworkScore, StructuredPreview } from './types'

const documentTypeExample: DocumentType = {
  typeId: 'okr-review',
  label: 'OKR 复盘',
  description: '阶段目标进展、结果归因、问题复盘、下一步计划。',
  rulesVersion: '2026-06-23',
  requiredSections: ['core-conclusion'],
  sectionTemplate: [
    { id: 'core-conclusion', heading: '核心结论', description: '一句话总结。', required: true },
  ],
  writingRules: [],
  methodologyRules: [],
  qualityRules: [],
  preferredFrameworkIds: ['four-f'],
}

const frameworkScoreExample: FrameworkScore = {
  frameworkId: 'four-f',
  score: 95,
  reason: '适合复盘。',
  recommendedRank: 1,
}

const previewExample: StructuredPreview = {
  frameworkId: 'four-f',
  title: '结构化版本',
  summary: '核心结论',
  sections: [],
  qualityChecks: [],
  missingCount: 0,
  markdown: '# 结构化版本',
}

void documentTypeExample
void frameworkScoreExample
void previewExample
