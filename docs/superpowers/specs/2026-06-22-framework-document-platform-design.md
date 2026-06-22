# 表达框架文档平台设计

## 目标

构建一个个人优先、可扩展到公司内多人使用的文档工作台。用户提供飞书云文档链接或 Markdown 初稿，系统分析写作意图，从参考文档定义的表达框架中推荐最合适的 1–2 种，将原文映射并重组为框架化成稿。用户可以切换框架、查看推荐理由与原文出处、补充缺失信息，最终创建一份新的飞书云文档；原文始终保持不变。

成功标准：用户能从一篇松散初稿出发，在一个工作台内完成“导入—推荐—比较—补充—生成”，得到结构清晰、事实边界明确、可直接提交的飞书文档。

## 产品边界

### 第一版包含

- 飞书云文档链接导入；无权限或未配置飞书时支持 Markdown 粘贴。
- 工作汇报/复盘、调研/竞品分析两类内容意图识别。
- 六种输出范式：PREP、金字塔原理、SCQA、4F、故事五要素、STAR。
- 系统推荐首选与备选框架，显示匹配度和推荐理由；用户可手动切换任意框架。
- 按框架槽位映射原文、重组段落、精简重复、润色表达，并生成摘要、结论和建议。
- 每个成稿区块显示原文出处；事实不足时显示“待补充”和引导问题，不编造数字、来源或业务事实。
- 用户确认成稿后创建新的飞书文档，标题默认为“原文标题-结构化版”；原文不修改。
- 飞书写入失败时保留成稿，并允许复制或下载 Markdown。
- 公司 AI 网关与模型选择。网关端点为 `https://ops-ai-gateway.yc345.tv/v1/chat/completions`，后端通过环境变量保存地址、密钥和模型白名单。

### 第一版不包含

- 团队管理后台、角色权限、计费和用量统计。
- 多人同时编辑、批注同步和完整历史版本系统。
- 用户自定义新框架的可视化编辑器。
- PDF、Word 等二进制文档解析。
- 自动覆盖或局部改写原飞书文档。

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

## 用户流程

1. 用户进入工作台，粘贴飞书链接或 Markdown，选择公司网关允许的模型。
2. 后端读取并规范化初稿，保留段落编号作为可追溯来源。
3. AI 返回文档意图、六种框架匹配度、推荐理由和首选/备选框架；后端以 Zod 严格校验。
4. 工作台显示框架列表。用户接受推荐或切换框架。
5. 后端按选定框架生成结构化预览。每个区块包含内容、来源段落、改写说明、证据状态和待补问题。
6. 用户填写缺失信息或保留“待补充”，随后确认成稿。
7. 系统创建新的飞书云文档并返回链接。原文不写入、不覆盖。

## 页面与交互

工作台采用一个主页面和阶段状态，不拆成冗长向导：

- 导入区：飞书链接、Markdown 兜底、模型选择、开始分析。
- 左侧框架栏：六种框架、匹配度、首选/备选标记和推荐理由。
- 主预览区：结构化成稿，支持“结构预览 / 原文对照 / 待补信息”三个视图。
- 来源标记：每个区块显示来源段落编号；点击可在原文对照中定位。
- 待补卡片：说明缺少什么、为什么影响成稿，并提供输入框。
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
- `framework recommender`：构造推荐请求，调用 AI 网关，并验证匹配度结果。
- `draft transformer`：按选定框架生成区块、来源映射和待补信息。
- `Lark document gateway`：隔离飞书读取、OAuth 和新文档创建细节。
- `AI gateway`：隔离 `/v1/chat/completions` 请求格式、超时、重试和 JSON 提取。
- `repository`：保存处理会话、规范化原文、推荐结果、当前框架、补充信息和预览快照；不保存公司 AI API Key。

前端以 Pinia store 管理工作台状态：`idle → importing → recommending → previewing → ready → publishing → published`，失败状态保留已成功的数据，使用户可以重试而无需重新导入。

## 飞书身份与安全

第一版使用飞书个人 OAuth，读取当前用户有权访问的文档，并以当前用户身份创建新文档。应用凭据、OAuth client secret、refresh token 加密密钥和 AI 网关密钥只存在后端。访问令牌不返回前端，日志不得记录文档全文、令牌或密钥。

身份层保留 `userId` 与连接记录边界，但第一版只开放单用户使用。扩展到公司多人时增加应用登录态和用户映射，不改变文档处理 API 与框架引擎。

Markdown 模式不要求飞书授权；发布飞书文档时才要求已建立飞书连接。

## API 合同

所有响应继续遵循 `{ code, data, message }`。

- `GET /api/document-workbench/config`：返回可选模型、六种框架摘要和飞书连接状态。
- `GET /api/document-workbench/lark/connect`：发起个人 OAuth。
- `GET /api/document-workbench/lark/callback`：处理 OAuth 回调，仅保存服务端连接状态。
- `POST /api/document-workbench/import`：输入飞书链接或 Markdown，返回处理会话和带稳定段落 ID 的规范化初稿。
- `POST /api/document-workbench/:sessionId/recommend`：输入模型，返回六种匹配度、推荐理由、首选和备选框架。
- `POST /api/document-workbench/:sessionId/preview`：输入框架 ID、模型和补充信息，返回框架化区块。
- `PATCH /api/document-workbench/:sessionId/supplements`：保存用户补充信息。
- `POST /api/document-workbench/:sessionId/publish`：输入标题和确认标记，创建新的飞书文档并返回链接。
- `GET /api/document-workbench/:sessionId/export.md`：下载当前预览的 Markdown。

关键响应类型：

- `FrameworkScore`：`frameworkId`、`score`、`reason`、`recommendedRank`。
- `StructuredSection`：`slotId`、`heading`、`content`、`sourceParagraphIds`、`rewriteNote`、`evidenceStatus`、`missingQuestion`。
- `StructuredPreview`：`frameworkId`、`title`、`summary`、`sections`、`missingCount`、`markdown`。

## 数据存储

`document_workbench_sessions` 由模块自己维护 SQLite 与 PostgreSQL 配对迁移。主要字段包括：字符串 ID、来源类型、原文标题、规范化内容 JSON 文本、推荐结果 JSON 文本、当前框架、补充信息 JSON 文本、预览 JSON 文本、状态和 ISO 时间戳。

飞书 OAuth 连接与处理会话分离。连接数据至少包含用户标识、加密后的 refresh token、过期时间和更新时间。生产环境必须设置令牌加密密钥；开发环境允许使用单用户本地配置，但仍不把明文令牌写入日志。

## AI 网关合同

- 基础地址、API Key、模型白名单、默认模型、超时和重试次数来自后端环境变量。
- 请求使用 OpenAI Chat Completions 兼容格式；模型由白名单校验后传给网关。
- 推荐与重构使用不同的系统提示和 Zod 输出 schema。
- 模型输出必须是 JSON；后端先去除可能的代码围栏，再解析和校验。
- schema 不匹配时可进行一次携带校验错误的修复请求；第二次仍失败则返回可重试错误，不产生预览或飞书文档。
- 提示词明确禁止新增未经原文或用户补充信息支持的事实。模型必须把证据不足的必需槽位标记为 `missing`。

## 错误处理

- 飞书链接无效：在导入阶段阻止继续，并提示正确链接格式。
- 飞书无权限或授权过期：保留页面输入，提示重新授权；不回退为“读取到空文档”。
- AI 网关超时或限流：使用有上限的重试，返回可重试状态并保留会话。
- AI 返回非法 JSON：执行一次修复请求；仍失败则展示结构化错误，不写飞书。
- 用户切换框架时生成失败：保留上一个成功预览，并允许重试。
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
- 所有来源映射只引用规范化段落 ID，不向模型暴露数据库内部 ID。
- 发布必须携带显式 `confirmed: true`，service 再次验证当前预览存在且无未保存变更。

## Execution order

1. 安装仓库 Superpowers，确认前后端依赖与基线验证结果。
2. 使用仓库 scaffold 脚本创建前后端 `document-workbench` 模块骨架。
3. 先写失败测试和后端 schema，再实现框架目录、AI 结果校验和纯函数映射。
4. 添加会话迁移与 repository，保持 SQLite/PostgreSQL 配对。
5. 实现公司 AI 网关与飞书文档 gateway 的测试替身和适配器。
6. 完成 import、recommend、preview、supplements、publish 和 export API。
7. 前端先建立类型与 API 映射，再实现 store、工作台组件和页面状态。
8. 完成 OAuth/Markdown 降级和发布幂等流程。
9. 运行单元、集成、类型、lint、构建和架构验证，修复所有错误。

## Verification

- 后端单元测试：六种框架槽位、模型输出 schema、来源映射、缺失信息、幂等发布。
- 后端集成测试：Markdown 导入到预览；飞书 gateway 测试替身导入与发布；网关异常重试。
- 前端组件与 store 测试：状态流转、框架切换、上一个预览保留、待补信息和发布确认。
- API 合同测试：后端 Zod 字段、前端类型和路径完全对齐。
- 运行 `npm run type-check`、`npm run lint` 和 `npm run build`（前后端分别执行）。
- 运行 `bash .agents/skills/vibecoding-verify/scripts/verify.sh`，完成标准为 `verify: ALL PASSED`。

