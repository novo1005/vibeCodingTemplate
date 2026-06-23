import type { FrameworkDefinition } from './documentworkbench.types'

export const frameworks: FrameworkDefinition[] = [
  {
    frameworkId: 'prep',
    label: 'PREP',
    description: '观点、理由、例证、重申观点，适合快速汇报和短篇观点表达。',
    slots: [
      {
        slotId: 'point',
        label: '观点',
        description: '先抛出观点或结论。',
        required: true,
        missingQuestion: '这篇文档最核心的观点是什么？',
      },
      {
        slotId: 'reason',
        label: '理由',
        description: '说明为什么这个观点成立。',
        required: true,
        missingQuestion: '支撑观点的主要理由是什么？',
      },
      {
        slotId: 'example',
        label: '例证',
        description: '用事实、数据、案例证明。',
        required: true,
        missingQuestion: '有哪些事实、数据或案例可以证明？',
      },
      {
        slotId: 'point-repeat',
        label: '重申观点',
        description: '用一句话收束。',
        required: true,
        missingQuestion: '最终希望读者记住哪句话？',
      },
    ],
  },
  {
    frameworkId: 'pyramid',
    label: '金字塔原理',
    description: '先结果后过程，先总括后细节。',
    slots: [
      {
        slotId: 'core-conclusion',
        label: '核心结论',
        description: '明确表达核心观点或结论。',
        required: true,
        missingQuestion: '核心结论是什么？',
      },
      {
        slotId: 'supporting-points',
        label: '3-5 个分论点',
        description: '相互独立、尽量穷尽的分论点。',
        required: true,
        missingQuestion: '可以拆成哪 3-5 个分论点？',
      },
      {
        slotId: 'evidence',
        label: '事实论证',
        description: '每个分论点下提供事实、数据或案例。',
        required: true,
        missingQuestion: '每个分论点有什么证据？',
      },
    ],
  },
  {
    frameworkId: 'scqa',
    label: 'SCQA',
    description: '情境、冲突、问题、答案，适合问题分析和方案提议。',
    slots: [
      {
        slotId: 'situation',
        label: '情境',
        description: '描述当前背景和现状。',
        required: true,
        missingQuestion: '当前背景和现状是什么？',
      },
      {
        slotId: 'complication',
        label: '冲突',
        description: '指出现状中的问题或矛盾。',
        required: true,
        missingQuestion: '现状中最关键的问题或矛盾是什么？',
      },
      {
        slotId: 'question',
        label: '问题',
        description: '提出需要解决的核心问题。',
        required: true,
        missingQuestion: '这份文档要回答的核心问题是什么？',
      },
      {
        slotId: 'answer',
        label: '答案',
        description: '给出解决方案、判断或建议。',
        required: true,
        missingQuestion: '你的解决方案或建议是什么？',
      },
    ],
  },
  {
    frameworkId: 'four-f',
    label: '4F',
    description: '事实、感受、发现、未来行动，适合复盘和反思。',
    slots: [
      {
        slotId: 'fact',
        label: '事实',
        description: '发生了什么，有哪些客观数据和事实。',
        required: true,
        missingQuestion: '有哪些客观事实和数据？',
      },
      {
        slotId: 'feeling',
        label: '感受',
        description: '相关人员对此有何感受和反应。',
        required: false,
        missingQuestion: '相关人员的反应或感受是什么？',
      },
      {
        slotId: 'finding',
        label: '发现',
        description: '从事实中得到的洞察。',
        required: true,
        missingQuestion: '从这些事实中得到什么发现？',
      },
      {
        slotId: 'future',
        label: '未来行动',
        description: '基于发现采取的下一步行动。',
        required: true,
        missingQuestion: '下一步要做什么？',
      },
    ],
  },
  {
    frameworkId: 'story-five',
    label: '故事五要素',
    description: '背景、冲突、行动、高潮、结局/启示，适合案例叙事。',
    slots: [
      {
        slotId: 'background',
        label: '背景',
        description: '时间、地点、人物等基本信息。',
        required: true,
        missingQuestion: '故事背景是什么？',
      },
      {
        slotId: 'conflict',
        label: '冲突',
        description: '核心挑战或问题。',
        required: true,
        missingQuestion: '核心挑战是什么？',
      },
      {
        slotId: 'action',
        label: '行动',
        description: '采取了哪些行动解决问题。',
        required: true,
        missingQuestion: '采取了哪些行动？',
      },
      {
        slotId: 'climax',
        label: '高潮',
        description: '最关键的转折点。',
        required: false,
        missingQuestion: '关键转折点是什么？',
      },
      {
        slotId: 'ending',
        label: '结局/启示',
        description: '最终结果和启示。',
        required: true,
        missingQuestion: '最终结果和启示是什么？',
      },
    ],
  },
  {
    frameworkId: 'star',
    label: 'STAR',
    description: '情境、任务、行动、结果，适合项目复盘和成果陈述。',
    slots: [
      {
        slotId: 'situation',
        label: '情境',
        description: '当时的背景和约束。',
        required: true,
        missingQuestion: '当时的背景是什么？',
      },
      {
        slotId: 'task',
        label: '任务',
        description: '需要完成的目标或职责。',
        required: true,
        missingQuestion: '当时要完成什么任务？',
      },
      {
        slotId: 'action',
        label: '行动',
        description: '采取的关键行动。',
        required: true,
        missingQuestion: '采取了哪些关键行动？',
      },
      {
        slotId: 'result',
        label: '结果',
        description: '产生的结果、数据和影响。',
        required: true,
        missingQuestion: '结果是什么，有哪些数据或影响？',
      },
    ],
  },
]

export function getFramework(frameworkId: FrameworkDefinition['frameworkId']) {
  return frameworks.find((item) => item.frameworkId === frameworkId) ?? null
}
