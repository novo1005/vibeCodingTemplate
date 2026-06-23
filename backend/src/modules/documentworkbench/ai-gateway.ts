import type { Env } from '@/config/env'
import type {
  FinalizedDocument,
  FrameworkScore,
  NormalizedParagraph,
  QualityCheckItem,
  StructuredPreview,
} from './documentworkbench.schema'
import type { DocumentTypeDefinition, FrameworkDefinition } from './documentworkbench.types'

export interface RecommendInput {
  model: string
  documentType: DocumentTypeDefinition
  frameworks: FrameworkDefinition[]
  paragraphs: NormalizedParagraph[]
}

export interface PreviewInput extends RecommendInput {
  framework: FrameworkDefinition
  supplements: Array<{ id: string; question: string; answer: string; relatedSectionId?: string }>
}

export interface QualityCheckInput {
  model: string
  documentType: DocumentTypeDefinition
  preview: StructuredPreview
}

export interface FinalizeInput {
  model: string
  documentType: DocumentTypeDefinition
  preview: StructuredPreview
  acceptedQualityRuleIds: string[]
  skipDeAi: boolean
}

export interface AiGateway {
  recommend(input: RecommendInput): Promise<FrameworkScore[]>
  preview(input: PreviewInput): Promise<StructuredPreview>
  qualityCheck(input: QualityCheckInput): Promise<QualityCheckItem[]>
  finalize(input: FinalizeInput): Promise<FinalizedDocument>
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
}

export function extractJsonObject(text: string): unknown {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  const first = stripped.indexOf('{')
  const last = stripped.lastIndexOf('}')
  if (first === -1 || last === -1 || last < first) {
    throw new Error('AI response did not contain a JSON object')
  }
  return JSON.parse(stripped.slice(first, last + 1))
}

function paragraphSummary(paragraphs: NormalizedParagraph[]) {
  return paragraphs.map((item) => item.text).join('\n').slice(0, 1200)
}

function makeQualityChecks(documentType: DocumentTypeDefinition, markdown: string): QualityCheckItem[] {
  return documentType.qualityRules.map((rule) => {
    const requiresEvidence = rule.id === 'claims-have-evidence'
    const hasNumber = /\d/.test(markdown)
    const missing = requiresEvidence && !hasNumber
    return {
      ruleId: rule.id,
      label: rule.label,
      status: missing ? 'missing_info' : 'passed',
      reason: missing ? '未检测到数字或明确事实支撑。' : `符合「${rule.label}」要求。`,
      suggestedRevision: missing ? '补充具体数据、事实依据或来源说明。' : null,
      requiresUserInput: missing,
      relatedSectionIds: [],
    }
  })
}

export function createDeterministicAiGateway(): AiGateway {
  return {
    async recommend(input) {
      const preferred = input.documentType.preferredFrameworkIds
      return input.frameworks
        .map((framework) => {
          const preferredIndex = preferred.indexOf(framework.frameworkId)
          const recommendedRank = preferredIndex >= 0 ? preferredIndex + 1 : null
          return {
            frameworkId: framework.frameworkId,
            score: recommendedRank ? 100 - preferredIndex * 8 : 58,
            reason: recommendedRank
              ? `「${input.documentType.label}」优先适配 ${framework.label}。`
              : `${framework.label} 可作为手动切换备选。`,
            recommendedRank,
          }
        })
        .sort((a, b) => b.score - a.score)
    },

    async preview(input) {
      const source = paragraphSummary(input.paragraphs)
      const sections = input.documentType.sectionTemplate.map((section) => ({
        slotId: section.id,
        heading: section.heading,
        content: source ? `${section.description}\n\n${source}` : section.description,
        sourceParagraphIds: input.paragraphs.slice(0, 3).map((item) => item.id),
        rewriteNote: `按「${input.documentType.label}」结构和「${input.framework.label}」框架整理。`,
        evidenceStatus: input.paragraphs.length > 0 ? ('supported' as const) : ('missing' as const),
        missingQuestion: input.paragraphs.length > 0 ? null : `请补充「${section.heading}」所需信息。`,
      }))
      const markdown = [
        `# ${input.documentType.label}-结构化版本`,
        '',
        `> 核心结论：基于 ${input.framework.label} 框架生成。`,
        '',
        ...sections.flatMap((section) => [`## ${section.heading}`, '', section.content, '']),
      ].join('\n')
      const qualityChecks = makeQualityChecks(input.documentType, markdown)
      return {
        frameworkId: input.framework.frameworkId,
        title: `${input.documentType.label}-结构化版本`,
        summary: `基于 ${input.documentType.label} 规则和 ${input.framework.label} 框架生成。`,
        sections,
        qualityChecks,
        missingCount: qualityChecks.filter((item) => item.status === 'missing_info').length,
        markdown,
      }
    },

    async qualityCheck(input) {
      return makeQualityChecks(input.documentType, input.preview.markdown)
    },

    async finalize(input) {
      return {
        ...input.preview,
        deAiNotes: input.skipDeAi
          ? ['用户选择跳过去 AI 味处理。']
          : ['压缩模板化表达，保留事实、结构、标题层级和来源映射。'],
      }
    },
  }
}

async function callChatCompletion(env: Env, model: string, messages: Array<{ role: string; content: string }>) {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new Error('AI gateway API key is not configured')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.AI_GATEWAY_TIMEOUT_MS)
  try {
    const response = await fetch(env.AI_GATEWAY_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`AI gateway request failed with ${response.status}`)
    }
    const body = (await response.json()) as ChatCompletionResponse
    const content = body.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('AI gateway response did not contain message content')
    }
    return extractJsonObject(content)
  } finally {
    clearTimeout(timer)
  }
}

export function createHttpAiGateway(env: Env): AiGateway {
  const fallback = createDeterministicAiGateway()

  return {
    async recommend(input) {
      const output = await callChatCompletion(env, input.model, [
        {
          role: 'system',
          content: 'Return JSON with a scores array. Do not invent facts.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'recommend-framework',
            documentType: input.documentType,
            frameworks: input.frameworks,
            paragraphs: input.paragraphs,
          }),
        },
      ])
      if (typeof output === 'object' && output && 'scores' in output && Array.isArray(output.scores)) {
        return output.scores as FrameworkScore[]
      }
      return fallback.recommend(input)
    },

    async preview(input) {
      const output = await callChatCompletion(env, input.model, [
        {
          role: 'system',
          content: 'Return JSON matching StructuredPreview. Keep source mappings. Do not invent facts.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'preview',
            documentType: input.documentType,
            framework: input.framework,
            paragraphs: input.paragraphs,
            supplements: input.supplements,
          }),
        },
      ])
      if (typeof output === 'object' && output && 'markdown' in output) {
        return output as StructuredPreview
      }
      return fallback.preview(input)
    },

    async qualityCheck(input) {
      return fallback.qualityCheck(input)
    },

    async finalize(input) {
      return fallback.finalize(input)
    },
  }
}
