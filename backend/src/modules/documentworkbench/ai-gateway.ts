import type { Env } from '@/config/env'
import { BadGatewayError } from '@/utils/http-error'
import type {
  FinalizedDocument,
  FrameworkScore,
  NormalizedParagraph,
  QualityCheckItem,
  StructuredPreview,
} from './documentworkbench.schema'
import {
  FinalizedDocumentSchema,
  FrameworkScoreSchema,
  QualityCheckItemSchema,
  StructuredPreviewSchema,
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

function paragraphSummary(paragraphs: NormalizedParagraph[], sectionIndex = 0) {
  if (paragraphs.length === 0) return ''
  const windowSize = Math.max(1, Math.ceil(paragraphs.length / 3))
  const start = (sectionIndex * windowSize) % paragraphs.length
  return paragraphs
    .slice(start, start + windowSize)
    .map((item) => item.text)
    .join('\n')
    .slice(0, 1200)
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
      const sections = input.documentType.sectionTemplate.map((section, index) => {
        const source = paragraphSummary(input.paragraphs, index)
        const sourceParagraphIds = input.paragraphs
          .slice(index % Math.max(1, input.paragraphs.length), index % Math.max(1, input.paragraphs.length) + 1)
          .map((item) => item.id)
        return {
          slotId: section.id,
          heading: section.heading,
          content: source ? `${section.description}\n\n${source}` : section.description,
          sourceParagraphIds,
          rewriteNote: `当前为本地规则模式，仅做结构占位；配置 AI 网关后会生成改写版本。`,
          evidenceStatus: input.paragraphs.length > 0 ? ('supported' as const) : ('missing' as const),
          missingQuestion: input.paragraphs.length > 0 ? null : `请补充「${section.heading}」所需信息。`,
        }
      })
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

async function callChatCompletion(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  fetcher: typeof fetch,
) {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new Error('AI gateway API key is not configured')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.AI_GATEWAY_TIMEOUT_MS)
  try {
    const response = await fetcher(env.AI_GATEWAY_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
      signal: controller.signal,
    })
    if (!response.ok) {
      let detail = ''
      try {
        const body = (await response.json()) as { message?: string; error?: string }
        detail = body.message || body.error || ''
      } catch {
        detail = response.statusText || ''
      }
      throw BadGatewayError(
        `AI 网关请求失败 (${response.status})${detail ? `：${detail}` : ''}`,
      )
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

function parseOrThrow<T>(name: string, schema: { parse: (value: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value)
  } catch (error) {
    throw new Error(`AI gateway returned invalid ${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function createHttpAiGateway(env: Env, fetcher: typeof fetch = fetch): AiGateway {
  return {
    async recommend(input) {
      const output = await callChatCompletion(env, input.model, [
        {
          role: 'system',
          content:
            '你是中文业务文档架构顾问。只返回 JSON：{"scores":[...]}。不要编造事实，按文档类型、原文内容和框架适配度评分。',
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
      ], fetcher)
      if (typeof output === 'object' && output && 'scores' in output && Array.isArray(output.scores)) {
        return output.scores.map((score) => parseOrThrow('FrameworkScore', FrameworkScoreSchema, score))
      }
      throw new Error('AI gateway returned invalid recommendation payload')
    },

    async preview(input) {
      const output = await callChatCompletion(env, input.model, [
        {
          role: 'system',
          content: [
            '你是中文业务文档改稿助手。必须按用户选择的文档类型规范和结构框架，把松散初稿改成可提交的结构化版本。',
            '只返回 JSON，结构必须匹配 StructuredPreview。',
            '必须真实改写：合并重复、补齐标题、调整顺序、压缩口水话、把结论前置。',
            '不要把同一段原文原封不动复制到每个章节。',
            '不要编造事实；缺信息时在 missingQuestion 标出问题。',
            '每个 section.content 必须是改写后的正文，不是写作说明。',
            'markdown 必须是完整的新文档。',
          ].join('\n'),
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
      ], fetcher)
      return parseOrThrow('StructuredPreview', StructuredPreviewSchema, output)
    },

    async qualityCheck(input) {
      const output = await callChatCompletion(env, input.model, [
        {
          role: 'system',
          content: [
            '你是中文业务文档质检助手。只返回 JSON：{"checks":[...]}。',
            '按文档类型的 writingRules、methodologyRules、qualityRules 检查结构化预览。',
            '指出缺失信息、需要用户确认的事实和可直接修改的表达问题。',
            '不要给泛泛建议，每条 suggestedRevision 要能直接指导修改。',
          ].join('\n'),
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'quality-check',
            documentType: input.documentType,
            preview: input.preview,
          }),
        },
      ], fetcher)
      if (typeof output === 'object' && output && 'checks' in output && Array.isArray(output.checks)) {
        return output.checks.map((check) =>
          parseOrThrow('QualityCheckItem', QualityCheckItemSchema, check),
        )
      }
      throw new Error('AI gateway returned invalid quality check payload')
    },

    async finalize(input) {
      const output = await callChatCompletion(env, input.model, [
        {
          role: 'system',
          content: [
            '你是中文终稿编辑。只返回 JSON，结构必须匹配 FinalizedDocument。',
            '基于 StructuredPreview 生成最终可提交文档。',
            '执行去 AI 味：去掉模板腔、讲义腔、路标词堆叠、机械小标题和重复收束句。',
            '保留原意、事实、数据、责任人、时间节点和标题层级，不新增事实。',
            input.skipDeAi ? '用户选择跳过去 AI 味，只做必要格式整理。' : '必须让正文读起来像真人业务文档，不像模型答案。',
          ].join('\n'),
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'finalize',
            documentType: input.documentType,
            preview: input.preview,
            acceptedQualityRuleIds: input.acceptedQualityRuleIds,
            skipDeAi: input.skipDeAi,
          }),
        },
      ], fetcher)
      return parseOrThrow('FinalizedDocument', FinalizedDocumentSchema, output)
    },
  }
}
