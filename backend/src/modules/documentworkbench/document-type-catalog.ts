import type { DocumentTypeDefinition, DocumentTypeRule } from './documentworkbench.types'

const rulesVersion = '2026-06-23'

const commonWritingRules = [
  {
    id: 'conclusion-first',
    label: '结论前置',
    description: '开头必须有核心结论，禁止把关键判断藏在末尾。',
    severity: 'blocking',
  },
  {
    id: 'evidence-backed',
    label: '数据支撑',
    description: '判断性表述必须有数据或事实依据，并注明数据局限。',
    severity: 'blocking',
  },
  {
    id: 'audience-oriented',
    label: '受众导向',
    description: '结构围绕读者最关心的问题排列。',
    severity: 'warning',
  },
  {
    id: 'heading-as-logic',
    label: '标题即逻辑',
    description: '读完标题应能概括全文，标题顺序体现优先级。',
    severity: 'warning',
  },
  {
    id: 'separate-background',
    label: '结论与背景分离',
    description: '正文放判断和行动项，背景材料进入附录。',
    severity: 'warning',
  },
  {
    id: 'actionable-next-step',
    label: '建议可执行',
    description: '下一步写清楚谁、做什么、为什么。',
    severity: 'blocking',
  },
  {
    id: 'format-consistency',
    label: '格式一致性',
    description: '高亮、表格说明和列表排序规则保持一致。',
    severity: 'info',
  },
] satisfies DocumentTypeRule[]

const commonMethodologyRules = [
  {
    id: 'human-judgment-first',
    label: '思考在前，AI 在后',
    description: '核心结论、关键判断、业务洞察必须来自用户，AI 只辅助表达和检查。',
    severity: 'blocking',
  },
  {
    id: 'human-feel',
    label: '写出人感',
    description: '报告要有个人视角、用户视角和具体洞察，避免抽象套话。',
    severity: 'warning',
  },
  {
    id: 'memorable-reader-value',
    label: '读者能记住',
    description: '删掉读者不需要的信息，让关键信息可被快速记住。',
    severity: 'warning',
  },
  {
    id: 'summary-insight-action',
    label: '总结到洞察再到建议',
    description: '每节按总结、洞察、建议推进，洞察不能重复事实。',
    severity: 'warning',
  },
] satisfies DocumentTypeRule[]

const commonQualityRules = [
  {
    id: 'titles-readable-alone',
    label: '标题可独立传达主线',
    description: '连读所有小标题应知道文档在讲什么。',
    severity: 'warning',
  },
  {
    id: 'claims-have-evidence',
    label: '判断有支撑',
    description: '所有结论性表述都有数字、事实、用户原声或明确来源。',
    severity: 'blocking',
  },
  {
    id: 'opening-synced-with-body',
    label: '开头结论与正文同步',
    description: '正文新增关键发现后，开头结论和摘要同步更新。',
    severity: 'blocking',
  },
  {
    id: 'ai-logic-review',
    label: 'AI 逻辑检查',
    description: '完成后检查逻辑漏洞、遗漏项和表述矛盾。',
    severity: 'info',
  },
] satisfies DocumentTypeRule[]

export const documentTypes: DocumentTypeDefinition[] = [
  {
    typeId: 'okr-review',
    label: 'OKR 复盘',
    description: '阶段目标进展、结果归因、问题复盘、下一步计划。',
    rulesVersion,
    preferredFrameworkIds: ['four-f', 'star', 'pyramid'],
    requiredSections: [
      'core-conclusion',
      'okr-overview',
      'okr-review-items',
      'cross-goal-insights',
      'next-adjustments',
      'appendix',
    ],
    sectionTemplate: [
      {
        id: 'core-conclusion',
        heading: '核心结论',
        description: '本期 OKR 整体完成情况一句话总结 + 最关键的认知或调整方向。',
        required: true,
      },
      {
        id: 'okr-overview',
        heading: 'OKR 达成总览',
        description: '目标、关键结果、目标值、实际值、达成率、自评。',
        required: true,
      },
      {
        id: 'okr-review-items',
        heading: '逐项复盘',
        description: '逐个目标说明达成情况、做到/没做到、客观原因、可控因素、关键认知。',
        required: true,
      },
      {
        id: 'cross-goal-insights',
        heading: '跨目标洞察',
        description: '提炼 2-3 个团队层面的核心认知。',
        required: true,
      },
      {
        id: 'next-adjustments',
        heading: '下一步调整',
        description: '复盘暴露的问题、调整方向、负责人、时间节点。',
        required: true,
      },
      { id: 'appendix', heading: '附录', description: '数据来源说明、过程记录。', required: false },
    ],
    writingRules: commonWritingRules,
    methodologyRules: commonMethodologyRules,
    qualityRules: [
      ...commonQualityRules,
      {
        id: 'okr-result-before-reason',
        label: '先结果再原因',
        description: '先说达成了多少，再分析为什么。',
        severity: 'blocking',
      },
      {
        id: 'okr-controllable-factors',
        label: '区分可控因素',
        description: '可控因素要有明确归因和反思，不能全推给外部。',
        severity: 'blocking',
      },
      {
        id: 'okr-no-self-defense',
        label: '避免自我辩护',
        description: '没达成的要说清为什么，而不是解释为什么这不是问题。',
        severity: 'warning',
      },
      {
        id: 'okr-cross-goal-insights',
        label: '跨目标洞察',
        description: '提炼 2-3 条跨目标核心认知，不写清单式复盘。',
        severity: 'warning',
      },
      {
        id: 'okr-next-step-linked',
        label: '下一步回应问题',
        description: '下一步必须针对本次复盘暴露的问题。',
        severity: 'blocking',
      },
    ],
  },
  {
    typeId: 'user-research',
    label: '用户调研报告',
    description: '研究问题、样本与方法、用户声音、洞察和建议。',
    rulesVersion,
    preferredFrameworkIds: ['pyramid', 'scqa'],
    requiredSections: [
      'core-conclusion',
      'research-background',
      'research-method',
      'core-findings',
      'user-segments',
      'recommendations',
      'appendix',
    ],
    sectionTemplate: [
      { id: 'core-conclusion', heading: '核心结论', description: '回答业务核心问题的 2-3 条关键结论。', required: true },
      { id: 'research-background', heading: '研究背景', description: '业务问题、研究目的和时间范围。', required: true },
      { id: 'research-method', heading: '研究方法', description: '方法、样本量、招募标准、执行方式和局限性。', required: true },
      { id: 'core-findings', heading: '核心发现', description: '按业务影响力排序，标题即结论。', required: true },
      { id: 'user-segments', heading: '用户分层', description: '如适用，说明分层逻辑和各层特征。', required: false },
      { id: 'recommendations', heading: '建议', description: '用户发现、建议方向、优先级、执行路径。', required: true },
      { id: 'appendix', heading: '附录', description: '访谈提纲、问卷原题、原始统计、脱敏受访者信息。', required: false },
    ],
    writingRules: commonWritingRules,
    methodologyRules: commonMethodologyRules,
    qualityRules: [
      ...commonQualityRules,
      { id: 'research-business-question', label: '研究目的对应业务问题', description: '每条结论都要能回答调研前对齐的业务问题。', severity: 'blocking' },
      { id: 'research-method-clear', label: '方法论清楚', description: '样本量、招募标准、调研方式和方法局限不能省略。', severity: 'blocking' },
      { id: 'research-user-voice', label: '用户原声出现', description: '定性判断需附用户原话，不能只写用户普遍反映。', severity: 'blocking' },
      { id: 'research-say-vs-do', label: '区分说和做', description: '行为数据优先于自我报告，两者有出入时要说明。', severity: 'warning' },
      { id: 'research-prioritized-findings', label: '结论有优先级', description: '发现按业务影响力排序。', severity: 'warning' },
      { id: 'research-advice-traceable', label: '建议可追溯', description: '每条建议对应具体用户洞察。', severity: 'blocking' },
    ],
  },
  {
    typeId: 'competitor-analysis',
    label: '竞品分析报告',
    description: '竞品选择、对比维度、差异结论、机会和建议。',
    rulesVersion,
    preferredFrameworkIds: ['pyramid', 'scqa', 'prep'],
    requiredSections: [
      'core-conclusion',
      'analysis-background',
      'competitor-overview',
      'dimension-comparison',
      'integrated-judgment',
      'recommendations',
      'appendix',
    ],
    sectionTemplate: [
      { id: 'core-conclusion', heading: '核心结论', description: '市场格局、差异化机会、对我们的影响。', required: true },
      { id: 'analysis-background', heading: '分析背景', description: '分析目的、竞品范围、分析维度、数据来源。', required: true },
      { id: 'competitor-overview', heading: '竞品一览', description: '按相关性排序，包含定位、用户、规模、关系和一句话结论。', required: true },
      { id: 'dimension-comparison', heading: '分维度对比', description: '每个维度说明分析目的、表格和本维度小结。', required: true },
      { id: 'integrated-judgment', heading: '综合判断', description: '市场格局、差异化机会、风险或威胁。', required: true },
      { id: 'recommendations', heading: '建议', description: '竞品洞察、建议方向、优先级。', required: true },
      { id: 'appendix', heading: '附录', description: '各竞品详细资料、数据来源与局限性。', required: false },
    ],
    writingRules: commonWritingRules,
    methodologyRules: commonMethodologyRules,
    qualityRules: [
      ...commonQualityRules,
      { id: 'competitor-scope-confirmed', label: '竞品范围已确认', description: '竞品名单和选取标准需与业务方确认。', severity: 'blocking' },
      { id: 'competitor-dimensions-business-led', label: '维度对应业务关注', description: '分析维度聚焦业务关注点，不求多。', severity: 'blocking' },
      { id: 'competitor-table-has-judgment', label: '表格后有判断', description: '每个分维度表格后必须有文字小结和判断。', severity: 'blocking' },
      { id: 'competitor-one-line-conclusion', label: '竞品一句话结论', description: '每个竞品都有核心差异和对我们的启示。', severity: 'warning' },
      { id: 'competitor-relevance-order', label: '按相关性排序', description: '竞品按本次分析目的相关性排序。', severity: 'warning' },
      { id: 'competitor-meaning-for-us', label: '说明对我们的意义', description: '描述竞品现象后必须回答所以对我们意味着什么。', severity: 'blocking' },
    ],
  },
  {
    typeId: 'meeting-minutes',
    label: '会议纪要',
    description: '会议背景、讨论结论、决策、行动项和责任人。',
    rulesVersion,
    preferredFrameworkIds: ['prep', 'pyramid'],
    requiredSections: [
      'meeting-info',
      'core-conclusion',
      'decisions',
      'discussion-highlights',
      'todos',
      'appendix',
    ],
    sectionTemplate: [
      { id: 'meeting-info', heading: '会议信息', description: '时间、地点、参会人、纪要整理人。', required: true },
      { id: 'core-conclusion', heading: '核心结论', description: '这次会议最重要的一句话：决定了什么或确认了什么。', required: true },
      { id: 'decisions', heading: '决策内容', description: '决策事项、决策结果、决策依据、备注。', required: true },
      { id: 'discussion-highlights', heading: '讨论重点', description: '支撑决策的关键信息和讨论逻辑。', required: true },
      { id: 'todos', heading: '下一步 Todo', description: '事项、负责人、截止时间、备注。', required: true },
      { id: 'appendix', heading: '附录', description: '背景信息、未决事项、参考资料。', required: false },
    ],
    writingRules: commonWritingRules,
    methodologyRules: commonMethodologyRules,
    qualityRules: [
      ...commonQualityRules,
      { id: 'minutes-audience-first', label: '先问受众', description: '写之前明确纪要给谁看、对方最想看到什么。', severity: 'warning' },
      { id: 'minutes-core-decision-first', label: '核心决策最前', description: '第一句话写会议决定或确认了什么。', severity: 'blocking' },
      { id: 'minutes-importance-order', label: '按重要性排序', description: '按重要性而非会议进程排序。', severity: 'warning' },
      { id: 'minutes-decision-vs-discussion', label: '区分决策和讨论', description: '决策在正文，讨论过程放附录。', severity: 'blocking' },
      { id: 'minutes-todo-owner-date', label: 'Todo 有负责人和时间', description: 'Todo 必须有负责人和截止时间。', severity: 'blocking' },
      { id: 'minutes-background-in-appendix', label: '背景放附录', description: '和本次决策无直接关联的背景信息放附录。', severity: 'warning' },
    ],
  },
]

export function getDocumentType(typeId: DocumentTypeDefinition['typeId']) {
  return documentTypes.find((item) => item.typeId === typeId) ?? null
}
