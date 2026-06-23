# 表达框架文档平台设计

## 目标

构建一个个人优先、可扩展到公司内多人使用的文档工作台。用户提供飞书云文档链接或 Markdown 初稿，并自行选择文档类型；系统不依赖内容意图识别来决定类型，而是在用户选择的类型下，从参考文档定义的表达框架中推荐最合适的 1–2 种，同时套用该类型的格式要求、写作规范和提交前 Checklist，将原文映射并重组为框架化成稿。用户可以切换框架、查看推荐理由与原文出处、补充缺失信息，最终在降低 AI 味后创建一份新的飞书云文档；原文始终保持不变。

成功标准：用户能从一篇松散初稿出发，在一个工作台内完成“选择文档类型—导入—推荐—比较—规范检查—补充—去 AI 味—生成”，得到结构清晰、事实边界明确、符合该文档类型撰写要求、可直接提交的飞书文档。

## 产品边界

### 第一版包含

- 用户在上传或导入前自行选择文档类型，第一版支持 OKR 复盘、用户调研报告、竞品分析报告、会议纪要。
- 飞书云文档链接导入；无权限或未配置飞书时支持 Markdown 粘贴。
- 六种输出范式：PREP、金字塔原理、SCQA、4F、故事五要素、STAR。
- 每种文档类型拥有独立的格式要求、写作规范、质量检查项和推荐框架偏好。类型由用户选择，不由 AI 自动判定；AI 只在选定类型内做框架推荐、结构化改写和规范检查。
- 参考文档与《四类文档写作规范与结构框架》中的撰写规范规则集：结论前置、数据支撑、受众导向、标题即逻辑、结论与背景分离、建议可执行、格式一致性和提交前自检。
- 四类文档的结构模板：OKR 达成总览/逐项复盘/跨目标洞察/下一步调整；用户调研背景/方法/核心发现/用户分层/建议；竞品分析背景/竞品一览/分维度对比/综合判断/建议；会议纪要决策内容/讨论重点/Todo/附录。
- 系统推荐首选与备选框架，显示匹配度和推荐理由；用户可手动切换任意框架。
- 按框架槽位映射原文、重组段落、精简重复、润色表达，并生成摘要、结论和建议。
- 成稿前执行规范检查，逐项展示通过、需修改、缺信息三类结果；用户可以接受系统修正或补充信息后重新生成。
- 发布前执行去 AI 味终稿处理：保留事实与结构，不新增事实，清理模板化路标词、讲义腔、协作口吻、等厚段落和机械总结。
- 每个成稿区块显示原文出处；事实不足时显示“待补充”和引导问题，不编造数字、来源或业务事实。
- 用户确认成稿后创建新的飞书文档，标题默认为“原文标题-结构化版”；原文不修改。
- 飞书写入失败时保留成稿，并允许复制或下载 Markdown。
- 公司 AI 网关与模型选择。网关端点为 `https://ops-ai-gateway.yc345.tv/v1/chat/completions`，后端通过环境变量保存地址、密钥和模型白名单。

### 第一版不包含

- 团队管理后台、角色权限、计费和用量统计。
- 多人同时编辑、批注同步和完整历史版本系统。
- 用户自定义新框架的可视化编辑器。
- 自动识别文档类型并替用户选择类型。
- PDF、Word 等二进制文档解析。
- 自动覆盖或局部改写原飞书文档。

## 文档类型

文档类型是工作台的第一层约束，先于表达框架生效。用户选择类型后，系统使用该类型的格式要求、写作规范、质量检查项和框架推荐偏好；表达框架是第二层结构化方法，帮助同一类型下的内容选择更合适的叙述方式。

第一版文档类型固定为：

| 类型 ID | 类型名称 | 主要用途 | 推荐结构 |
| --- | --- | --- | --- |
| `okr-review` | OKR 复盘 | 阶段目标进展、结果归因、问题复盘、下一步计划 | 核心结论、OKR 达成总览、逐项复盘、跨目标洞察、下一步调整、附录 |
| `user-research` | 用户调研报告 | 研究问题、样本与方法、用户声音、洞察和建议 | 核心结论、研究背景、研究方法、核心发现、用户分层、建议、附录 |
| `competitor-analysis` | 竞品分析报告 | 竞品选择、对比维度、差异结论、机会和建议 | 核心结论、分析背景、竞品一览、分维度对比、综合判断、建议、附录 |
| `meeting-minutes` | 会议纪要 | 会议背景、讨论结论、决策、行动项和责任人 | 会议信息、核心结论、决策内容、讨论重点、下一步 Todo、附录 |

每个类型配置包含 `typeId`、中文名、使用场景、推荐框架偏好、固定结构模板、专项规范、质量检查项和附录规则。规则源来自 `/Users/zhang/Desktop/casual/[方案]四类文档写作规范与结构框架.md`，进入代码时作为版本化 seed 配置，不在提示词里手写散落。

专项规范摘要：

- OKR 复盘：先结果再原因；区分客观原因和可控因素；避免自我辩护；提炼 2–3 条跨目标核心认知；下一步必须回应本次复盘暴露的问题。
- 用户调研报告：研究目的对应业务问题；方法交代样本量、招募标准和执行方式；必须出现用户原声；区分“用户说的”和“用户做的”；结论按业务影响力排序；建议可追溯到具体发现。
- 竞品分析报告：竞品范围和分析维度需与业务方确认；表格后必须有文字小结和判断；每个竞品有一句话结论；竞品按相关性排序；区分现象和判断。
- 会议纪要：先问受众；第一句话写会议决定或确认了什么；按重要性而非会议进程排序；区分决策和讨论过程；Todo 必须有负责人和时间节点；背景放附录。

## 六种框架定义

框架定义是后端可测试的领域配置，不写死在提示词或前端页面中。

| 框架 | 固定槽位 | 主要适用场景 |
| --- | --- | --- |
| PREP | 观点、理由、例证、重申观点 | 快速汇报、短篇观点表达 |
| 金字塔原理 | 核心结论、3–5 个 MECE 分论点、事实/数据/案例 | 工作汇报、调研和竞品报告 |
| SCQA | 情境、冲突、问题、答案 | 问题分析、方案提议 |
| 4F | 事实、感受、发现、未来行动 | 复盘、深度反思 |
| 故事五要素 | 背景、冲突、行动、高潮、结局/启示 | 案例叙事、增强感染力 |
| STAR | 情境、任务、行动、结果 | 项目复盘、个人或团队成果陈述 |

每个槽位包含稳定 ID、中文名称、说明、是否必需、允许的证据类型和缺失时的引导问题。切换框架时重新执行映射与生成，但保留原始导入内容和用户已经填写的补充信息。

## 撰写规范与质量门禁

参考文档和《四类文档写作规范与结构框架》同时提供输出框架和写作规范。系统不能只把初稿套入框架，还要检查生成结果是否符合用户所选文档类型的提交要求。规范以可版本化的领域配置保存，不散落在提示词中。

统一规范规则分为八类：

- 结论前置：开头必须有核心结论，禁止把关键判断藏在末尾。
- 数据支撑：所有判断性表述必须有数据或事实依据，模糊描述要替换成具体数字，并注明数据局限。
- 受众导向：写之前明确文档给谁看、对方最想看什么，结构围绕受众需求排列。
- 标题即逻辑：小标题顺序体现优先级；读完标题应能概括全文；除非时序本身重要，否则不按信息产生时间排序。
- 结论与背景分离：正文放决策、判断、建议、行动项；行业知识、过程记录、原始素材和补充数据放附录。
- 建议可执行：结尾必须有下一步或建议，并写清楚谁、做什么、为什么。
- 格式一致性：高亮方式统一；表格顶部说明分析维度或选取标准；列表和表格按重要性、体量、时间或类别排序。
- 提交前自检：连读标题、检查判断是否有支撑、检查开头结论与正文同步、修改后同步摘要，并让 AI 做逻辑漏洞、遗漏项和矛盾检查。

写作方法论作为质量提示和 UI 引导，不直接替用户产出结论：先自行思考再用 AI 辅助；核心判断和业务洞察必须来自用户；每节按“总结 → 洞察 → 建议”推进；长段落加小标题；每部分总结用数字编号；以“读者愿意看、能记住”为最高标准。

检查结果采用 `passed`、`needs_revision`、`missing_info` 三种状态。`needs_revision` 代表系统可以自动改写，例如摘要缺层级、结论未前置；`missing_info` 代表必须由用户补充或明确保留待补，例如缺少数据来源、用户访谈证据、竞品排序依据。

去 AI 味是发布前的最后一道处理，而不是替代事实检查。它只在已确认的结构化成稿上做保真润色：保留框架槽位、标题层级、来源映射和用户补充信息；不新增案例、数据和结论；重点减少模板句、路标词、二分对照壳、协作口吻、等厚段落和段尾机械总结。

## 用户流程

1. 用户进入工作台，先选择文档类型，再粘贴飞书链接或 Markdown，并选择公司网关允许的模型。
2. 后端读取并规范化初稿，保留段落编号作为可追溯来源，同时保存用户选择的文档类型。
3. AI 在用户选择的文档类型范围内返回六种框架匹配度、推荐理由、适用的规范规则集和首选/备选框架；后端以 Zod 严格校验。AI 不返回或覆盖文档类型。
4. 工作台显示框架列表。用户接受推荐或切换框架。
5. 后端按选定框架生成结构化预览。每个区块包含内容、来源段落、改写说明、证据状态和待补问题。
6. 系统按撰写规范和 Checklist 生成质量检查结果，展示自动修正建议和必须补充的信息。
7. 用户逐项确认系统修正，填写缺失信息或保留“待补充”，随后生成确认版。
8. 系统对确认版执行去 AI 味终稿处理，并展示终稿差异摘要。
9. 用户确认发布后，系统创建新的飞书云文档并返回链接。原文不写入、不覆盖。

## 页面与交互

工作台采用一个主页面和阶段状态，不拆成冗长向导：

- 类型选择区：OKR 复盘、用户调研报告、竞品分析报告、会议纪要；用户必须先选类型才能开始分析。
- 导入区：飞书链接、Markdown 兜底、模型选择、开始分析。
- 左侧框架栏：六种框架、匹配度、首选/备选标记和推荐理由。
- 主预览区：结构化成稿，支持“结构预览 / 原文对照 / 待补信息”三个视图。
- 规范检查区：展示通用规范、文档类型专项规范、结构模板完整性、数据支撑、用户声音、竞品分析、Todo 责任人、可执行建议、数据来源附录和 AI 痕迹等检查项；每项显示状态、原因、建议改法和是否需要用户补充。
- 来源标记：每个区块显示来源段落编号；点击可在原文对照中定位。
- 待补卡片：说明缺少什么、为什么影响成稿，并提供输入框。
- 去 AI 味预览：发布前显示保真润色后的终稿，以及被压缩或改写的模板化表达摘要。
- 发布区：标题编辑、生成新飞书文档、复制/下载 Markdown。

页面不提供“直接修改原文”入口。切换框架会明确提示预览将重新生成，但不会丢失初稿和补充信息。

## 当前结构

- 后端采用 `backend/src/modules/todo/` 展示闭环模块：schema、types、repository、service、controller、routes 和唯一出口 `index.ts`；`backend/src/routes.ts` 聚合模块。
- 后端请求与响应形状由 Zod schema 定义，controller 解析输入，service 承载业务规则，repository 只能通过 `src/db` 接口访问 SQLite/PostgreSQL。
- 环境变量集中在 `backend/src/config/env.ts` 校验。
- 前端采用 `frontend/src/modules/todo/` 展示闭环模块：api、types、store、composables、components、views、routes 和唯一出口 `index.ts`。
- 前端业务 API 必须经模块 `api/` 调用 `frontend/src/utils/request.ts`；`frontend/src/router/index.ts` 统一注册模块路由。
- 前端已有 BaseButton、BaseInput、BaseModal、BaseEmpty、BaseTable，可复用或按复用规则补充通用组件。

## 目标架构

新增一个名为 `document-workbench` 的前后端闭环模块，统一拥有导入、分析、预览和发布流程。模块内按职责拆分服务，避免与其他业务模块直接互相导入。

后端数据流：

`controller → document-workbench service → Lark gateway / AI gateway / framework engine → repository → db interface`

- `framework catalog`：六种框架及槽位的纯领域定义。
- `document type catalog`：四种文档类型及其格式要求、结构模板、写作规范、质量检查项和框架推荐偏好；配置需带规则版本，便于后续更新团队规范。
- `framework recommender`：基于用户选择的文档类型构造推荐请求，调用 AI 网关，并验证匹配度结果。
- `draft transformer`：按选定框架生成区块、来源映射和待补信息。
- `writing standards checker`：根据用户选择的文档类型、参考文档规范与 Checklist 检查摘要、结论、层级、数据、用户声音、竞品分析、建议和来源附录。
- `de-ai finalizer`：在用户确认结构化版本后执行保真润色，降低 AI 味并保持事实、结构和来源映射不变。
- `Lark document gateway`：隔离飞书读取、OAuth 和新文档创建细节。
- `AI gateway`：隔离 `/v1/chat/completions` 请求格式、超时、重试和 JSON 提取。
- `repository`：保存处理会话、规范化原文、推荐结果、当前框架、补充信息和预览快照；不保存公司 AI API Key。

前端以 Pinia store 管理工作台状态：`idle → importing → recommending → previewing → quality-checking → ready → finalizing → finalized → publishing → published`，失败状态保留已成功的数据，使用户可以重试而无需重新导入。

## 飞书身份与安全

第一版使用飞书个人 OAuth，读取当前用户有权访问的文档，并以当前用户身份创建新文档。应用凭据、OAuth client secret、refresh token 加密密钥和 AI 网关密钥只存在后端。访问令牌不返回前端，日志不得记录文档全文、令牌或密钥。

身份层保留 `userId` 与连接记录边界，但第一版只开放单用户使用。扩展到公司多人时增加应用登录态和用户映射，不改变文档处理 API 与框架引擎。

Markdown 模式不要求飞书授权；发布飞书文档时才要求已建立飞书连接。

## API 合同

所有响应继续遵循 `{ code, data, message }`。

- `GET /api/document-workbench/config`：返回可选模型、四种文档类型、六种框架摘要和飞书连接状态。
- `GET /api/document-workbench/lark/connect`：发起个人 OAuth。
- `GET /api/document-workbench/lark/callback`：处理 OAuth 回调，仅保存服务端连接状态。
- `POST /api/document-workbench/import`：输入文档类型与飞书链接或 Markdown，返回处理会话和带稳定段落 ID 的规范化初稿。
- `POST /api/document-workbench/:sessionId/recommend`：输入模型，返回用户所选文档类型下的六种匹配度、推荐理由、首选和备选框架。
- `POST /api/document-workbench/:sessionId/preview`：输入框架 ID、模型和补充信息，返回框架化区块和规范检查初稿。
- `POST /api/document-workbench/:sessionId/quality-check`：输入当前预览 ID 和模型，返回撰写规范与 Checklist 的逐项检查结果。
- `PATCH /api/document-workbench/:sessionId/supplements`：保存用户补充信息。
- `POST /api/document-workbench/:sessionId/finalize`：输入用户确认的检查项与模型，返回去 AI 味后的终稿。
- `POST /api/document-workbench/:sessionId/publish`：输入标题和确认标记，创建新的飞书文档并返回链接。
- `GET /api/document-workbench/:sessionId/export.md`：下载当前预览的 Markdown。

关键响应类型：

- `FrameworkScore`：`frameworkId`、`score`、`reason`、`recommendedRank`。
- `DocumentType`：`typeId`、`label`、`description`、`rulesVersion`、`requiredSections`、`sectionTemplate`、`writingRules`、`methodologyRules`、`qualityRules`、`preferredFrameworkIds`。
- `StructuredSection`：`slotId`、`heading`、`content`、`sourceParagraphIds`、`rewriteNote`、`evidenceStatus`、`missingQuestion`。
- `QualityCheckItem`：`ruleId`、`label`、`status`、`reason`、`suggestedRevision`、`requiresUserInput`、`relatedSectionIds`。
- `StructuredPreview`：`frameworkId`、`title`、`summary`、`sections`、`qualityChecks`、`missingCount`、`markdown`。
- `FinalizedDocument`：`title`、`summary`、`sections`、`qualityChecks`、`deAiNotes`、`markdown`。

## 数据存储

`document_workbench_sessions` 由模块自己维护 SQLite 与 PostgreSQL 配对迁移。主要字段包括：字符串 ID、文档类型、文档类型规则版本、来源类型、原文标题、规范化内容 JSON 文本、推荐结果 JSON 文本、当前框架、补充信息 JSON 文本、预览 JSON 文本、质量检查 JSON 文本、终稿 JSON 文本、状态和 ISO 时间戳。

飞书 OAuth 连接与处理会话分离。连接数据至少包含用户标识、加密后的 refresh token、过期时间和更新时间。生产环境必须设置令牌加密密钥；开发环境允许使用单用户本地配置，但仍不把明文令牌写入日志。

## AI 网关合同

- 基础地址、API Key、模型白名单、默认模型、超时和重试次数来自后端环境变量。
- 请求使用 OpenAI Chat Completions 兼容格式；模型由白名单校验后传给网关。
- 推荐、重构、质量检查和去 AI 味终稿使用不同的系统提示和 Zod 输出 schema；所有提示都显式包含用户选择的文档类型和该类型规范。
- 模型输出必须是 JSON；后端先去除可能的代码围栏，再解析和校验。
- schema 不匹配时可进行一次携带校验错误的修复请求；第二次仍失败则返回可重试错误，不产生预览或飞书文档。
- 提示词明确禁止新增未经原文或用户补充信息支持的事实。模型必须把证据不足的必需槽位标记为 `missing`。
- 去 AI 味提示词明确要求保留事实、结论、来源映射、标题层级和用户确认过的补充信息；只允许做表达层面的保真润色。

## 错误处理

- 飞书链接无效：在导入阶段阻止继续，并提示正确链接格式。
- 未选择文档类型：在导入阶段阻止继续，提示用户先选择 OKR 复盘、用户调研报告、竞品分析报告或会议纪要之一。
- 飞书无权限或授权过期：保留页面输入，提示重新授权；不回退为“读取到空文档”。
- AI 网关超时或限流：使用有上限的重试，返回可重试状态并保留会话。
- AI 返回非法 JSON：执行一次修复请求；仍失败则展示结构化错误，不写飞书。
- 用户切换框架时生成失败：保留上一个成功预览，并允许重试。
- 质量检查发现缺少关键事实：允许用户补充、保留待补或下载 Markdown；发布前继续提醒风险，但不强制阻断。
- 去 AI 味终稿失败：保留结构化预览，允许跳过去 AI 味直接发布，发布区明确标注“未执行去 AI 味”。
- 发布失败：保留预览和 Markdown，用户可再次发布或下载，不重复创建已成功的文档。
- 重复发布：使用会话状态和幂等键返回既有文档链接。

## Change boundary

预计新增或修改：

- 新增 `backend/src/modules/document-workbench/` 及模块自有迁移。
- 修改 `backend/src/routes.ts` 注册模块。
- 修改 `backend/src/config/env.ts` 和 `.env.example` 增加飞书及 AI 网关配置。
- 仅在真正通用时新增 `backend/src/utils/` 下的加密或 HTTP 辅助工具。
- 新增 `frontend/src/modules/document-workbench/`。
- 修改 `frontend/src/router/index.ts` 注册工作台并将首页指向工作台。
- 必要时新增可复用的 BaseTabs、BaseSelect、BaseTextarea 等基础组件。
- 新增模块测试、AI/Lark gateway 合同测试和端到端主流程测试。

不修改 todo 模块业务逻辑，不让 document-workbench 直接依赖 todo 模块，不绕过现有 `db`、`request`、响应包装和模块出口规则。

## Contracts

- 后端 schema 是 API 单一事实源，前端类型逐字段镜像。
- `/api/document-workbench` 是唯一业务前缀。
- 框架 ID 固定为 `prep`、`pyramid`、`scqa`、`four-f`、`story-five`、`star`。
- 文档类型 ID 固定为 `okr-review`、`user-research`、`competitor-analysis`、`meeting-minutes`；会话创建后不自动变更类型，用户如需换类型需要重新分析。
- 会话保存创建时使用的文档类型规则版本；后续规则升级不静默改变已有会话结果。
- 所有来源映射只引用规范化段落 ID，不向模型暴露数据库内部 ID。
- 发布必须携带显式 `confirmed: true`，service 再次验证当前终稿存在且无未保存变更；如果用户选择跳过去 AI 味，则验证当前结构化预览和风险确认记录存在。

## Execution order

1. 安装仓库 Superpowers，确认前后端依赖与基线验证结果。
2. 使用仓库 scaffold 脚本创建前后端 `document-workbench` 模块骨架。
3. 先写失败测试和后端 schema，再实现框架目录、AI 结果校验和纯函数映射。
4. 实现文档类型目录、撰写规范目录、质量检查 schema、去 AI 味终稿 schema 和对应纯函数边界。
5. 添加会话迁移与 repository，保持 SQLite/PostgreSQL 配对。
6. 实现公司 AI 网关与飞书文档 gateway 的测试替身和适配器。
7. 完成 import、recommend、preview、quality-check、supplements、finalize、publish 和 export API。
8. 前端先建立类型与 API 映射，再实现 store、工作台组件和页面状态。
9. 完成 OAuth/Markdown 降级、质量检查确认、去 AI 味终稿和发布幂等流程。
10. 运行单元、集成、类型、lint、构建和架构验证，修复所有错误。

## Verification

- 后端单元测试：四种文档类型配置、结构模板、专项规范、六种框架槽位、撰写规范规则、模型输出 schema、来源映射、缺失信息、去 AI 味保真约束、幂等发布。
- 后端集成测试：Markdown 导入到预览；质量检查；去 AI 味终稿；飞书 gateway 测试替身导入与发布；网关异常重试。
- 前端组件与 store 测试：状态流转、框架切换、上一个预览保留、规范检查确认、待补信息、去 AI 味预览和发布确认。
- API 合同测试：后端 Zod 字段、前端类型和路径完全对齐。
- 运行 `npm run type-check`、`npm run lint` 和 `npm run build`（前后端分别执行）。
- 运行 `bash .agents/skills/vibecoding-verify/scripts/verify.sh`，完成标准为 `verify: ALL PASSED`。
