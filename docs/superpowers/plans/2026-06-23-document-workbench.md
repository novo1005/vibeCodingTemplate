# Document Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local full-stack document workbench where a user selects a document type, imports a Feishu link or Markdown draft, generates a structured version under the selected writing rules, quality-checks it, reduces AI tone, and publishes or exports the result.

**Architecture:** Add one closed-loop backend module and one closed-loop frontend module named `documentworkbench`. Backend owns document type rules, framework rules, session persistence, AI gateway, Lark gateway, and API contracts; frontend owns the workbench route, API client, Pinia store, and module-private UI components. Keep all business code inside the module; only route registration, env config, and truly generic UI primitives are shared.

**Tech Stack:** Backend Node.js + Fastify + TypeScript + zod + SQLite/Postgres migrations; frontend Vue 3 + TypeScript + Pinia + Vue Router + Less; company AI gateway is OpenAI Chat Completions compatible at `/v1/chat/completions`.

---

## Architecture design checkpoint

**Current structure**

- Backend follows closed-loop modules under `backend/src/modules/<name>/` with `schema`, `types`, `repository`, `service`, `controller`, `routes`, `index`, and paired `migrations/sqlite|pg`.
- Backend route aggregation is in `backend/src/routes.ts`; env validation is in `backend/src/config/env.ts`.
- Frontend follows closed-loop modules under `frontend/src/modules/<name>/` with `api`, `types`, `store`, `components`, `views`, `routes`, and `index`.
- Frontend route aggregation is in `frontend/src/router/index.ts`; module API clients call `frontend/src/utils/request.ts`.
- Repo verification gate is `bash .agents/skills/vibecoding-verify/scripts/verify.sh`.

**Target architecture**

- Backend module flow: `routes → controller → service → repository / ai gateway / lark gateway / catalogs`.
- Frontend module flow: `DocumentWorkbenchView → store → api → utils/request`.
- Catalogs are pure TypeScript data and functions so they can be tested without network or database.
- AI and Feishu are behind gateway interfaces so unit tests use deterministic fakes and local development can still use Markdown export if credentials are not configured.

**Change boundary**

- Create `backend/src/modules/documentworkbench/`.
- Modify `backend/src/routes.ts`, `backend/src/config/env.ts`, and `backend/.env.example`.
- Create `frontend/src/modules/documentworkbench/`.
- Modify `frontend/src/router/index.ts`.
- Add generic frontend primitives only if used outside this module; otherwise keep UI components module-private.
- Do not modify todo business logic.
- Do not import between business modules.

**Contracts**

- Backend API prefix: `/api/documentworkbench`.
- Document type IDs: `okr-review`, `user-research`, `competitor-analysis`, `meeting-minutes`.
- Framework IDs: `prep`, `pyramid`, `scqa`, `four-f`, `story-five`, `star`.
- API response envelope remains `{ code, data, message }`.
- Session stores `documentType`, `documentTypeRulesVersion`, normalized paragraphs, recommendation result, selected framework, preview, quality checks, supplements, final document, publish status, and timestamps.

**Execution order**

1. Prepare isolated worktree and load execution skills.
2. Scaffold backend and frontend modules with repo scripts.
3. Add backend schemas, catalog rules, and pure tests.
4. Add backend repository, migrations, and service tests.
5. Add AI and Lark gateway adapters with fakes.
6. Add backend controllers/routes and register module.
7. Add frontend types/API/store and compile-first checks.
8. Add frontend view/components and route registration.
9. Run backend/frontend type-check, lint, build, and repo verification.

**Verification**

- Backend: `cd backend && npm run type-check && npm run lint && npm run build`.
- Frontend: `cd frontend && npm run type-check && npm run lint && npm run build`.
- Repo: `bash .agents/skills/vibecoding-verify/scripts/verify.sh`.

---

## File structure

### Backend files to create

- `backend/src/modules/documentworkbench/documentworkbench.schema.ts` — all zod request/response/path schemas and inferred DTOs.
- `backend/src/modules/documentworkbench/documentworkbench.types.ts` — DB row/domain types inferred from schemas plus gateway interfaces.
- `backend/src/modules/documentworkbench/document-type-catalog.ts` — four document type rules, section templates, methodology rules, and quality rules.
- `backend/src/modules/documentworkbench/framework-catalog.ts` — six framework definitions and slot metadata.
- `backend/src/modules/documentworkbench/normalizer.ts` — markdown/text normalization into stable paragraph IDs.
- `backend/src/modules/documentworkbench/ai-gateway.ts` — company gateway HTTP client, JSON extraction, schema validation, repair retry.
- `backend/src/modules/documentworkbench/lark-gateway.ts` — Feishu URL parsing, import/publish gateway interface, disabled-mode errors when env is missing.
- `backend/src/modules/documentworkbench/documentworkbench.repository.ts` — session persistence through `@/db`.
- `backend/src/modules/documentworkbench/documentworkbench.service.ts` — import, recommend, preview, quality-check, supplement, finalize, publish, export orchestration.
- `backend/src/modules/documentworkbench/documentworkbench.controller.ts` — zod parsing and `success()` responses.
- `backend/src/modules/documentworkbench/documentworkbench.routes.ts` — Fastify route registration under module prefix.
- `backend/src/modules/documentworkbench/index.ts` — module plugin export.
- `backend/src/modules/documentworkbench/migrations/sqlite/0002_create_document_workbench.sql` — SQLite session table.
- `backend/src/modules/documentworkbench/migrations/pg/0002_create_document_workbench.sql` — Postgres session table using portable JSON-as-text columns.
- `backend/src/modules/documentworkbench/documentworkbench.test.ts` — `tsx`-run unit checks for catalogs, normalization, schema parsing, repository mapping, and service fakes.

### Backend files to modify

- `backend/src/routes.ts` — register document workbench plugin.
- `backend/src/config/env.ts` — add AI and Feishu env variables.
- `backend/.env.example` — document local env keys.
- `backend/package.json` — add `test:document-workbench` script using existing `tsx`.

### Frontend files to create

- `frontend/src/modules/documentworkbench/types/index.ts` — mirror backend DTO fields used by UI.
- `frontend/src/modules/documentworkbench/api/index.ts` — API client using `http`.
- `frontend/src/modules/documentworkbench/store/index.ts` — Pinia state machine.
- `frontend/src/modules/documentworkbench/components/DocumentTypePicker.vue` — required document type selector.
- `frontend/src/modules/documentworkbench/components/SourceInputPanel.vue` — Feishu link / Markdown input and model select.
- `frontend/src/modules/documentworkbench/components/FrameworkSelector.vue` — framework scores and manual switch.
- `frontend/src/modules/documentworkbench/components/StructuredPreview.vue` — preview sections and source markers.
- `frontend/src/modules/documentworkbench/components/QualityCheckPanel.vue` — passed/revision/missing quality checks.
- `frontend/src/modules/documentworkbench/components/FinalizePanel.vue` — de-AI notes, final document, publish/export controls.
- `frontend/src/modules/documentworkbench/views/DocumentWorkbenchView.vue` — page composition.
- `frontend/src/modules/documentworkbench/routes.ts` — module route list.
- `frontend/src/modules/documentworkbench/index.ts` — route export.
- `frontend/src/modules/documentworkbench/type-contracts.ts` — compile-time contract sample imported nowhere, included by `vue-tsc`.

### Frontend files to modify

- `frontend/src/router/index.ts` — add `documentWorkbenchRoutes` to the default layout children and make root route redirect to the workbench if current root points to todo.

---

### Task 0: Execution setup and baseline

**Files:**
- Read: `docs/superpowers/specs/2026-06-22-framework-document-platform-design.md`
- Read: `AGENTS.md`
- Read: `backend/AGENTS.md`
- Read: `frontend/AGENTS.md`
- No code changes.

- [ ] **Step 1: Start in an isolated workspace**

Use `superpowers:using-git-worktrees` before code execution. If the current checkout is not already isolated, ask the user whether to create a git worktree. Do not scaffold or edit code before this decision.

- [ ] **Step 2: Load implementation skills**

Load these skills before editing files:

```text
vibecoding-codex-workflow
vibecoding-architecture-design
vibecoding-fullstack-module
vibecoding-backend-module
vibecoding-frontend-module
superpowers:test-driven-development
```

- [ ] **Step 3: Confirm clean repo state**

Run:

```bash
git status --short
```

Expected: no output, or only unrelated user-owned changes that are not touched.

- [ ] **Step 4: Run baseline verification**

Run:

```bash
bash .agents/skills/vibecoding-verify/scripts/verify.sh
```

Expected: `verify: ALL PASSED`. If baseline fails, stop and report the failure before starting feature work.

- [ ] **Step 5: Commit baseline note only if needed**

If no files changed, do not commit. If execution created local lockfile or generated verification artifacts, inspect them and either discard generated artifacts with user approval or commit only intentional setup changes.

---

### Task 1: Scaffold closed-loop modules

**Files:**
- Create: `backend/src/modules/documentworkbench/**`
- Create: `frontend/src/modules/documentworkbench/**`
- Modify only through scaffold scripts first.

- [ ] **Step 1: Run backend scaffold**

Run:

```bash
node .agents/skills/vibecoding-backend-module/scripts/scaffold.mjs documentworkbench
```

Expected: `backend/src/modules/documentworkbench/` exists with schema, types, repository, service, controller, routes, index, and migration folders.

- [ ] **Step 2: Run frontend scaffold**

Run:

```bash
node .agents/skills/vibecoding-frontend-module/scripts/scaffold.mjs documentworkbench
```

Expected: `frontend/src/modules/documentworkbench/` exists with api, types, store, components, views, routes, and index.

- [ ] **Step 3: Run architecture verify after scaffolding**

Run:

```bash
bash .agents/skills/vibecoding-verify/scripts/verify.sh
```

Expected: module anatomy checks pass or report only scaffold-specific rename issues.

- [ ] **Step 4: Commit scaffold**

Run:

```bash
git add backend/src/modules/documentworkbench frontend/src/modules/documentworkbench
git commit -m "chore: scaffold document workbench modules"
```

Expected: commit created.

---

### Task 2: Backend schemas and catalog tests

**Files:**
- Modify: `backend/package.json`
- Create/Modify: `backend/src/modules/documentworkbench/documentworkbench.schema.ts`
- Create/Modify: `backend/src/modules/documentworkbench/documentworkbench.types.ts`
- Create: `backend/src/modules/documentworkbench/document-type-catalog.ts`
- Create: `backend/src/modules/documentworkbench/framework-catalog.ts`
- Create: `backend/src/modules/documentworkbench/documentworkbench.test.ts`

- [ ] **Step 1: Add a backend module test script**

Modify `backend/package.json` scripts to include:

```json
"test:document-workbench": "tsx src/modules/documentworkbench/documentworkbench.test.ts"
```

Keep existing scripts unchanged.

- [ ] **Step 2: Write the failing catalog/schema test**

Create `backend/src/modules/documentworkbench/documentworkbench.test.ts` with:

```ts
import assert from 'node:assert/strict'
import { documentTypes } from './document-type-catalog'
import { frameworks } from './framework-catalog'
import {
  DocumentWorkbenchImportBodySchema,
  DocumentWorkbenchPreviewBodySchema,
} from './documentworkbench.schema'

function testDocumentTypes() {
  assert.equal(documentTypes.length, 4)
  assert.deepEqual(
    documentTypes.map((item) => item.typeId),
    ['okr-review', 'user-research', 'competitor-analysis', 'meeting-minutes'],
  )
  const okr = documentTypes.find((item) => item.typeId === 'okr-review')
  assert.ok(okr)
  assert.ok(okr.requiredSections.includes('okr-overview'))
  assert.ok(okr.qualityRules.some((rule) => rule.id === 'okr-controllable-factors'))
}

function testFrameworks() {
  assert.equal(frameworks.length, 6)
  const pyramid = frameworks.find((item) => item.frameworkId === 'pyramid')
  assert.ok(pyramid)
  assert.ok(pyramid.slots.some((slot) => slot.slotId === 'core-conclusion'))
}

function testImportSchemaRequiresDocumentType() {
  assert.throws(() => DocumentWorkbenchImportBodySchema.parse({ markdown: '# Draft' }))
  const parsed = DocumentWorkbenchImportBodySchema.parse({
    documentType: 'user-research',
    sourceType: 'markdown',
    markdown: '# 用户调研初稿',
  })
  assert.equal(parsed.documentType, 'user-research')
}

function testPreviewSchemaAcceptsFramework() {
  const parsed = DocumentWorkbenchPreviewBodySchema.parse({
    frameworkId: 'pyramid',
    model: 'default-model',
    supplements: [],
  })
  assert.equal(parsed.frameworkId, 'pyramid')
}

testDocumentTypes()
testFrameworks()
testImportSchemaRequiresDocumentType()
testPreviewSchemaAcceptsFramework()

console.log('document-workbench tests: OK')
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
cd backend && npm run test:document-workbench
```

Expected: FAIL with module-not-found errors for `document-type-catalog`, `framework-catalog`, or schema exports.

- [ ] **Step 4: Implement `documentworkbench.schema.ts`**

Replace the scaffold schema with zod schemas covering:

```ts
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

export const FinalizedDocumentSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(StructuredSectionSchema),
  qualityChecks: z.array(QualityCheckItemSchema),
  deAiNotes: z.array(z.string()),
  markdown: z.string(),
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
export type DocumentWorkbenchImportBody = z.infer<typeof DocumentWorkbenchImportBodySchema>
export type DocumentWorkbenchPreviewBody = z.infer<typeof DocumentWorkbenchPreviewBodySchema>
```

- [ ] **Step 5: Implement `documentworkbench.types.ts`**

Define:

```ts
import type {
  DocumentTypeId,
  FinalizedDocument,
  FrameworkId,
  FrameworkScore,
  NormalizedParagraph,
  QualityCheckItem,
  StructuredPreview,
} from './documentworkbench.schema'

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
```

- [ ] **Step 6: Implement `document-type-catalog.ts`**

Create four definitions with `rulesVersion: '2026-06-23'`. Include the common rule IDs:

```ts
const commonWritingRules = [
  { id: 'conclusion-first', label: '结论前置', description: '开头必须有核心结论，禁止把关键判断藏在末尾。', severity: 'blocking' },
  { id: 'evidence-backed', label: '数据支撑', description: '判断性表述必须有数据或事实依据，并注明数据局限。', severity: 'blocking' },
  { id: 'audience-oriented', label: '受众导向', description: '结构围绕读者最关心的问题排列。', severity: 'warning' },
  { id: 'heading-as-logic', label: '标题即逻辑', description: '读完标题应能概括全文，标题顺序体现优先级。', severity: 'warning' },
  { id: 'separate-background', label: '结论与背景分离', description: '正文放判断和行动项，背景材料进入附录。', severity: 'warning' },
  { id: 'actionable-next-step', label: '建议可执行', description: '下一步写清楚谁、做什么、为什么。', severity: 'blocking' },
  { id: 'format-consistency', label: '格式一致性', description: '高亮、表格说明和列表排序规则保持一致。', severity: 'info' },
] satisfies DocumentTypeRule[]
```

Add `commonMethodologyRules` and `commonQualityRules` before `documentTypes`:

```ts
const commonMethodologyRules = [
  { id: 'human-judgment-first', label: '思考在前，AI 在后', description: '核心结论、关键判断、业务洞察必须来自用户，AI 只辅助表达和检查。', severity: 'blocking' },
  { id: 'human-feel', label: '写出人感', description: '报告要有个人视角、用户视角和具体洞察，避免抽象套话。', severity: 'warning' },
  { id: 'memorable-reader-value', label: '读者能记住', description: '删掉读者不需要的信息，让关键信息可被快速记住。', severity: 'warning' },
  { id: 'summary-insight-action', label: '总结到洞察再到建议', description: '每节按总结、洞察、建议推进，洞察不能重复事实。', severity: 'warning' },
] satisfies DocumentTypeRule[]

const commonQualityRules = [
  { id: 'titles-readable-alone', label: '标题可独立传达主线', description: '连读所有小标题应知道文档在讲什么。', severity: 'warning' },
  { id: 'claims-have-evidence', label: '判断有支撑', description: '所有结论性表述都有数字、事实、用户原声或明确来源。', severity: 'blocking' },
  { id: 'opening-synced-with-body', label: '开头结论与正文同步', description: '正文新增关键发现后，开头结论和摘要同步更新。', severity: 'blocking' },
  { id: 'ai-logic-review', label: 'AI 逻辑检查', description: '完成后检查逻辑漏洞、遗漏项和表述矛盾。', severity: 'info' },
] satisfies DocumentTypeRule[]
```

Create `documentTypes` as four complete `DocumentTypeDefinition` objects with these exact section templates and preferred framework IDs:

- `okr-review`: preferred frameworks `four-f`, `star`, `pyramid`; sections `core-conclusion`/核心结论, `okr-overview`/OKR 达成总览, `okr-review-items`/逐项复盘, `cross-goal-insights`/跨目标洞察, `next-adjustments`/下一步调整, `appendix`/附录; type-specific quality rules `okr-result-before-reason`, `okr-controllable-factors`, `okr-no-self-defense`, `okr-cross-goal-insights`, `okr-next-step-linked`.
- `user-research`: preferred frameworks `pyramid`, `scqa`; sections `core-conclusion`/核心结论, `research-background`/研究背景, `research-method`/研究方法, `core-findings`/核心发现, `user-segments`/用户分层, `recommendations`/建议, `appendix`/附录; type-specific quality rules `research-business-question`, `research-method-clear`, `research-user-voice`, `research-say-vs-do`, `research-prioritized-findings`, `research-advice-traceable`.
- `competitor-analysis`: preferred frameworks `pyramid`, `scqa`, `prep`; sections `core-conclusion`/核心结论, `analysis-background`/分析背景, `competitor-overview`/竞品一览, `dimension-comparison`/分维度对比, `integrated-judgment`/综合判断, `recommendations`/建议, `appendix`/附录; type-specific quality rules `competitor-scope-confirmed`, `competitor-dimensions-business-led`, `competitor-table-has-judgment`, `competitor-one-line-conclusion`, `competitor-relevance-order`, `competitor-meaning-for-us`.
- `meeting-minutes`: preferred frameworks `prep`, `pyramid`; sections `meeting-info`/会议信息, `core-conclusion`/核心结论, `decisions`/决策内容, `discussion-highlights`/讨论重点, `todos`/下一步 Todo, `appendix`/附录; type-specific quality rules `minutes-audience-first`, `minutes-core-decision-first`, `minutes-importance-order`, `minutes-decision-vs-discussion`, `minutes-todo-owner-date`, `minutes-background-in-appendix`.

- [ ] **Step 7: Implement `framework-catalog.ts`**

Create six `FrameworkDefinition` entries:

```ts
export const frameworks: FrameworkDefinition[] = [
  {
    frameworkId: 'prep',
    label: 'PREP',
    description: '观点、理由、例证、重申观点，适合快速汇报和短篇观点表达。',
    slots: [
      { slotId: 'point', label: '观点', description: '先抛出观点或结论。', required: true, missingQuestion: '这篇文档最核心的观点是什么？' },
      { slotId: 'reason', label: '理由', description: '说明为什么这个观点成立。', required: true, missingQuestion: '支撑观点的主要理由是什么？' },
      { slotId: 'example', label: '例证', description: '用事实、数据、案例证明。', required: true, missingQuestion: '有哪些事实、数据或案例可以证明？' },
      { slotId: 'point-repeat', label: '重申观点', description: '用一句话收束。', required: true, missingQuestion: '最终希望读者记住哪句话？' },
    ],
  },
  {
    frameworkId: 'pyramid',
    label: '金字塔原理',
    description: '先结果后过程，先总括后细节。',
    slots: [
      { slotId: 'core-conclusion', label: '核心结论', description: '明确表达核心观点或结论。', required: true, missingQuestion: '核心结论是什么？' },
      { slotId: 'supporting-points', label: '3-5 个分论点', description: '相互独立、尽量穷尽的分论点。', required: true, missingQuestion: '可以拆成哪 3-5 个分论点？' },
      { slotId: 'evidence', label: '事实论证', description: '每个分论点下提供事实、数据或案例。', required: true, missingQuestion: '每个分论点有什么证据？' },
    ],
  },
  {
    frameworkId: 'scqa',
    label: 'SCQA',
    description: '情境、冲突、问题、答案，适合问题分析和方案提议。',
    slots: [
      { slotId: 'situation', label: '情境', description: '描述当前背景和现状。', required: true, missingQuestion: '当前背景和现状是什么？' },
      { slotId: 'complication', label: '冲突', description: '指出现状中的问题或矛盾。', required: true, missingQuestion: '现状中最关键的问题或矛盾是什么？' },
      { slotId: 'question', label: '问题', description: '提出需要解决的核心问题。', required: true, missingQuestion: '这份文档要回答的核心问题是什么？' },
      { slotId: 'answer', label: '答案', description: '给出解决方案、判断或建议。', required: true, missingQuestion: '你的解决方案或建议是什么？' },
    ],
  },
  {
    frameworkId: 'four-f',
    label: '4F',
    description: '事实、感受、发现、未来行动，适合复盘和反思。',
    slots: [
      { slotId: 'fact', label: '事实', description: '发生了什么，有哪些客观数据和事实。', required: true, missingQuestion: '有哪些客观事实和数据？' },
      { slotId: 'feeling', label: '感受', description: '相关人员对此有何感受和反应。', required: false, missingQuestion: '相关人员的反应或感受是什么？' },
      { slotId: 'finding', label: '发现', description: '从事实中得到的洞察。', required: true, missingQuestion: '从这些事实中得到什么发现？' },
      { slotId: 'future', label: '未来行动', description: '基于发现采取的下一步行动。', required: true, missingQuestion: '下一步要做什么？' },
    ],
  },
  {
    frameworkId: 'story-five',
    label: '故事五要素',
    description: '背景、冲突、行动、高潮、结局/启示，适合案例叙事。',
    slots: [
      { slotId: 'background', label: '背景', description: '时间、地点、人物等基本信息。', required: true, missingQuestion: '故事背景是什么？' },
      { slotId: 'conflict', label: '冲突', description: '核心挑战或问题。', required: true, missingQuestion: '核心挑战是什么？' },
      { slotId: 'action', label: '行动', description: '采取了哪些行动解决问题。', required: true, missingQuestion: '采取了哪些行动？' },
      { slotId: 'climax', label: '高潮', description: '最关键的转折点。', required: false, missingQuestion: '关键转折点是什么？' },
      { slotId: 'ending', label: '结局/启示', description: '最终结果和启示。', required: true, missingQuestion: '最终结果和启示是什么？' },
    ],
  },
  {
    frameworkId: 'star',
    label: 'STAR',
    description: '情境、任务、行动、结果，适合项目复盘和成果陈述。',
    slots: [
      { slotId: 'situation', label: '情境', description: '当时的背景和约束。', required: true, missingQuestion: '当时的背景是什么？' },
      { slotId: 'task', label: '任务', description: '需要完成的目标或职责。', required: true, missingQuestion: '当时要完成什么任务？' },
      { slotId: 'action', label: '行动', description: '采取的关键行动。', required: true, missingQuestion: '采取了哪些关键行动？' },
      { slotId: 'result', label: '结果', description: '产生的结果、数据和影响。', required: true, missingQuestion: '结果是什么，有哪些数据或影响？' },
    ],
  },
]
```

- [ ] **Step 8: Run catalog tests**

Run:

```bash
cd backend && npm run test:document-workbench
```

Expected: `document-workbench tests: OK`.

- [ ] **Step 9: Run backend type-check**

Run:

```bash
cd backend && npm run type-check
```

Expected: no TypeScript errors.

- [ ] **Step 10: Commit backend contracts and catalogs**

Run:

```bash
git add backend/package.json backend/src/modules/documentworkbench
git commit -m "feat: add document workbench contracts"
```

Expected: commit created.

---

### Task 3: Normalization, migrations, and repository

**Files:**
- Create: `backend/src/modules/documentworkbench/normalizer.ts`
- Modify: `backend/src/modules/documentworkbench/documentworkbench.repository.ts`
- Create: `backend/src/modules/documentworkbench/migrations/sqlite/0002_create_document_workbench.sql`
- Create: `backend/src/modules/documentworkbench/migrations/pg/0002_create_document_workbench.sql`
- Modify: `backend/src/modules/documentworkbench/documentworkbench.test.ts`

- [ ] **Step 1: Add failing normalization tests**

Append to `document-workbench.test.ts`:

```ts
import { normalizeDraft } from './normalizer'

function testNormalizeDraft() {
  const result = normalizeDraft({
    title: '原始标题',
    markdown: '# 原始标题\n\n第一段内容。\n\n- 列表内容\n\n第二段内容。',
  })
  assert.equal(result.title, '原始标题')
  assert.deepEqual(
    result.paragraphs.map((item) => item.id),
    ['p-001', 'p-002', 'p-003'],
  )
  assert.equal(result.paragraphs[1]?.text, '列表内容')
}

testNormalizeDraft()
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && npm run test:document-workbench
```

Expected: FAIL because `normalizer.ts` does not exist.

- [ ] **Step 3: Implement `normalizer.ts`**

Create:

```ts
export interface NormalizeDraftInput {
  title: string
  markdown: string
}

export function normalizeDraft(input: NormalizeDraftInput) {
  const lines = input.markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('# '))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter((line) => line.length > 0)

  return {
    title: input.title.trim() || '未命名文档',
    paragraphs: lines.map((text, index) => ({
      id: `p-${String(index + 1).padStart(3, '0')}`,
      index,
      text,
    })),
  }
}
```

- [ ] **Step 4: Create SQLite migration**

Create `backend/src/modules/documentworkbench/migrations/sqlite/0002_create_document_workbench.sql`:

```sql
CREATE TABLE IF NOT EXISTS document_workbench_sessions (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_type_rules_version TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  original_title TEXT NOT NULL,
  normalized_paragraphs TEXT NOT NULL,
  recommendation TEXT NOT NULL DEFAULT '[]',
  current_framework TEXT,
  preview TEXT,
  quality_checks TEXT NOT NULL DEFAULT '[]',
  supplements TEXT NOT NULL DEFAULT '[]',
  final_document TEXT,
  published_url TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

- [ ] **Step 5: Create Postgres migration**

Create `backend/src/modules/documentworkbench/migrations/pg/0002_create_document_workbench.sql`:

```sql
CREATE TABLE IF NOT EXISTS document_workbench_sessions (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_type_rules_version TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  original_title TEXT NOT NULL,
  normalized_paragraphs TEXT NOT NULL,
  recommendation TEXT NOT NULL DEFAULT '[]',
  current_framework TEXT,
  preview TEXT,
  quality_checks TEXT NOT NULL DEFAULT '[]',
  supplements TEXT NOT NULL DEFAULT '[]',
  final_document TEXT,
  published_url TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

- [ ] **Step 6: Implement repository mapping**

In `documentworkbench.repository.ts`, expose:

```ts
export interface CreateSessionInput {
  id: string
  documentType: DocumentTypeId
  documentTypeRulesVersion: string
  sourceType: 'lark' | 'markdown'
  sourceUrl: string | null
  originalTitle: string
  normalizedParagraphs: NormalizedParagraph[]
  now: string
}
```

Implement methods:

- `create(input: CreateSessionInput): Promise<DocumentWorkbenchSession>`
- `findById(id: string): Promise<DocumentWorkbenchSession | null>`
- `save(session: DocumentWorkbenchSession): Promise<DocumentWorkbenchSession>`

Use `JSON.stringify` for JSON text columns and `JSON.parse` in a `toDomain(row)` helper. Use `db.query` / `db.execute` patterns from the todo repository and never import database drivers.

- [ ] **Step 7: Run tests and type-check**

Run:

```bash
cd backend && npm run test:document-workbench && npm run type-check
```

Expected: tests pass and no TypeScript errors.

- [ ] **Step 8: Commit repository and migrations**

Run:

```bash
git add backend/src/modules/documentworkbench
git commit -m "feat: persist document workbench sessions"
```

Expected: commit created.

---

### Task 4: Backend AI gateway and deterministic fallback behavior

**Files:**
- Modify: `backend/src/config/env.ts`
- Modify: `backend/.env.example`
- Create: `backend/src/modules/documentworkbench/ai-gateway.ts`
- Modify: `backend/src/modules/documentworkbench/documentworkbench.test.ts`

- [ ] **Step 1: Add failing AI JSON extraction tests**

Append tests:

```ts
import { extractJsonObject, createDeterministicAiGateway } from './ai-gateway'

function testExtractJsonObject() {
  assert.deepEqual(extractJsonObject('```json\n{"ok":true}\n```'), { ok: true })
  assert.deepEqual(extractJsonObject('prefix {"ok":true} suffix'), { ok: true })
}

async function testDeterministicGateway() {
  const gateway = createDeterministicAiGateway()
  const recommendation = await gateway.recommend({
    model: 'local',
    documentType: documentTypes[0]!,
    frameworks,
    paragraphs: [{ id: 'p-001', index: 0, text: 'KR 达成 80%，需要复盘原因。' }],
  })
  assert.equal(recommendation[0]?.frameworkId, 'four-f')
}

testExtractJsonObject()
await testDeterministicGateway()
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && npm run test:document-workbench
```

Expected: FAIL because `ai-gateway.ts` does not exist.

- [ ] **Step 3: Add env keys**

Modify `backend/src/config/env.ts` so the env schema accepts:

```ts
AI_GATEWAY_BASE_URL: z.string().url().default('https://ops-ai-gateway.yc345.tv/v1/chat/completions'),
AI_GATEWAY_API_KEY: z.string().optional(),
AI_GATEWAY_MODELS: z.string().default('local'),
AI_GATEWAY_DEFAULT_MODEL: z.string().default('local'),
AI_GATEWAY_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
AI_GATEWAY_REPAIR_ATTEMPTS: z.coerce.number().int().min(0).max(1).default(1),
```

Update `backend/.env.example` with the same keys and comments. Do not put real secrets in the file.

- [ ] **Step 4: Implement `ai-gateway.ts`**

Create:

```ts
export function extractJsonObject(text: string): unknown {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  const first = stripped.indexOf('{')
  const last = stripped.lastIndexOf('}')
  if (first === -1 || last === -1 || last < first) {
    throw new Error('AI response did not contain a JSON object')
  }
  return JSON.parse(stripped.slice(first, last + 1))
}
```

Define an `AiGateway` interface with methods:

- `recommend(input): Promise<FrameworkScore[]>`
- `preview(input): Promise<StructuredPreview>`
- `qualityCheck(input): Promise<QualityCheckItem[]>`
- `finalize(input): Promise<FinalizedDocument>`

Implement:

- `createDeterministicAiGateway()` for tests and missing API key mode.
- `createHttpAiGateway(env)` for real OpenAI-compatible requests with `Authorization: Bearer ${apiKey}`, JSON body `{ model, messages, temperature: 0.2 }`, timeout via `AbortController`, and one schema-repair retry when validation fails.

Deterministic behavior:

- Recommend preferred framework IDs from selected document type first.
- Preview builds sections from selected document type `sectionTemplate` and paragraph snippets.
- Quality check marks missing evidence as `missing_info` if preview content contains no digits for evidence-backed rules.
- Finalize returns the same structure with `deAiNotes` describing removed template tone.

- [ ] **Step 5: Run tests and type-check**

Run:

```bash
cd backend && npm run test:document-workbench && npm run type-check
```

Expected: pass.

- [ ] **Step 6: Commit AI gateway**

Run:

```bash
git add backend/src/config/env.ts backend/.env.example backend/src/modules/documentworkbench
git commit -m "feat: add document workbench ai gateway"
```

Expected: commit created.

---

### Task 5: Lark gateway and backend service orchestration

**Files:**
- Create: `backend/src/modules/documentworkbench/lark-gateway.ts`
- Modify: `backend/src/modules/documentworkbench/documentworkbench.service.ts`
- Modify: `backend/src/modules/documentworkbench/documentworkbench.test.ts`

- [ ] **Step 1: Add failing service flow test**

Append:

```ts
import { createDocumentWorkbenchService } from './documentworkbench.service'

async function testMarkdownServiceFlow() {
  const sessions = new Map<string, DocumentWorkbenchSession>()
  const repository = createInMemoryRepositoryForTest(sessions)
  const service = createDocumentWorkbenchService({
    repository,
    aiGateway: createDeterministicAiGateway(),
    larkGateway: createDisabledLarkGateway(),
    now: () => '2026-06-23T00:00:00.000Z',
    createId: () => `session-${sessions.size + 1}`,
  })

  const imported = await service.importDraft({
    documentType: 'meeting-minutes',
    sourceType: 'markdown',
    markdown: '# 例会\n\n决定上线文档工具。\n\n张三 6 月 30 日前完成 API。',
  })
  assert.equal(imported.documentType, 'meeting-minutes')

  const recommended = await service.recommend(imported.id, { model: 'local' })
  assert.equal(recommended[0]?.frameworkId, 'prep')

  const preview = await service.preview(imported.id, {
    frameworkId: 'prep',
    model: 'local',
    supplements: [],
  })
  assert.ok(preview.markdown.includes('决策内容'))

  const finalDocument = await service.finalize(imported.id, {
    model: 'local',
    acceptedQualityRuleIds: [],
    skipDeAi: false,
  })
  assert.ok(finalDocument.deAiNotes.length > 0)
}

await testMarkdownServiceFlow()
```

Add `createInMemoryRepositoryForTest` inside the test file with the same repository method names as the real repository.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && npm run test:document-workbench
```

Expected: FAIL because service factory and Lark gateway do not exist.

- [ ] **Step 3: Implement `lark-gateway.ts`**

Create:

```ts
export interface LarkImportResult {
  title: string
  markdown: string
}

export interface LarkPublishInput {
  title: string
  markdown: string
}

export interface LarkPublishResult {
  url: string
}

export interface LarkGateway {
  importDocument(url: string): Promise<LarkImportResult>
  publishDocument(input: LarkPublishInput): Promise<LarkPublishResult>
}

export function parseLarkDocumentUrl(url: string) {
  const parsed = new URL(url)
  const isSupported = parsed.pathname.includes('/wiki/') || parsed.pathname.includes('/docx/')
  if (!isSupported) {
    throw new Error('Unsupported Feishu document URL')
  }
  return { host: parsed.host, pathname: parsed.pathname }
}

export function createDisabledLarkGateway(): LarkGateway {
  return {
    async importDocument() {
      throw new Error('Feishu integration is not configured; paste Markdown instead.')
    },
    async publishDocument() {
      throw new Error('Feishu integration is not configured; copy or download Markdown instead.')
    },
  }
}
```

Add `createHttpLarkGateway(env)` only if `LARK_APP_ID`, `LARK_APP_SECRET`, and redirect settings exist. It should:

- Validate URLs with `parseLarkDocumentUrl`.
- Use backend-held tokens only.
- Throw a typed AppError-compatible error when auth is missing.
- Avoid logging full document text or tokens.

- [ ] **Step 4: Implement service factory**

In `documentworkbench.service.ts`, export `createDocumentWorkbenchService(deps)` and a default service using real repository and configured gateways. Implement methods:

- `getConfig()`
- `importDraft(input)`
- `recommend(sessionId, input)`
- `preview(sessionId, input)`
- `qualityCheck(sessionId, input)`
- `saveSupplements(sessionId, input)`
- `finalize(sessionId, input)`
- `publish(sessionId, input)`
- `exportMarkdown(sessionId)`

Rules:

- For `sourceType: 'markdown'`, use `normalizeDraft`.
- For `sourceType: 'lark'`, call `larkGateway.importDocument`.
- `recommend` never changes `documentType`.
- `preview` stores selected framework and quality checks.
- `finalize` preserves section IDs, source paragraph IDs, and quality checks.
- `publish` requires existing final document unless `skipDeAi` was explicitly used.
- Repeat publish returns existing `publishedUrl`.

- [ ] **Step 5: Run tests and type-check**

Run:

```bash
cd backend && npm run test:document-workbench && npm run type-check
```

Expected: pass.

- [ ] **Step 6: Commit service and Lark gateway**

Run:

```bash
git add backend/src/modules/documentworkbench
git commit -m "feat: orchestrate document workbench service"
```

Expected: commit created.

---

### Task 6: Backend controllers, routes, and registration

**Files:**
- Modify: `backend/src/modules/documentworkbench/documentworkbench.controller.ts`
- Modify: `backend/src/modules/documentworkbench/documentworkbench.routes.ts`
- Modify: `backend/src/modules/documentworkbench/index.ts`
- Modify: `backend/src/routes.ts`

- [ ] **Step 1: Implement controller methods**

Each controller method parses request data with schemas and returns `success(data)`. Implement:

- `getConfig`
- `importDraft`
- `recommend`
- `preview`
- `qualityCheck`
- `saveSupplements`
- `finalize`
- `publish`
- `exportMarkdown`

Use `SessionIdParamSchema.parse(request.params)` for session routes.

- [ ] **Step 2: Implement routes**

Register:

```ts
fastify.get('/config', controller.getConfig)
fastify.post('/import', controller.importDraft)
fastify.post('/:sessionId/recommend', controller.recommend)
fastify.post('/:sessionId/preview', controller.preview)
fastify.post('/:sessionId/quality-check', controller.qualityCheck)
fastify.patch('/:sessionId/supplements', controller.saveSupplements)
fastify.post('/:sessionId/finalize', controller.finalize)
fastify.post('/:sessionId/publish', controller.publish)
fastify.get('/:sessionId/export.md', controller.exportMarkdown)
```

- [ ] **Step 3: Implement module index**

Use Fastify plugin and prefix `/api/documentworkbench`, mirroring todo module style.

- [ ] **Step 4: Register in root routes**

Modify `backend/src/routes.ts` to import the module public export and register it exactly once.

- [ ] **Step 5: Run backend checks**

Run:

```bash
cd backend && npm run test:document-workbench && npm run type-check && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit backend API**

Run:

```bash
git add backend/src/routes.ts backend/src/modules/documentworkbench
git commit -m "feat: expose document workbench api"
```

Expected: commit created.

---

### Task 7: Frontend contracts, API client, and store

**Files:**
- Modify/Create: `frontend/src/modules/documentworkbench/types/index.ts`
- Modify/Create: `frontend/src/modules/documentworkbench/api/index.ts`
- Modify/Create: `frontend/src/modules/documentworkbench/store/index.ts`
- Create: `frontend/src/modules/documentworkbench/type-contracts.ts`

- [ ] **Step 1: Write failing frontend contract file**

Create `frontend/src/modules/documentworkbench/type-contracts.ts`:

```ts
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
```

- [ ] **Step 2: Run type-check to verify it fails**

Run:

```bash
cd frontend && npm run type-check
```

Expected: FAIL because exported frontend types do not exist.

- [ ] **Step 3: Implement frontend types**

In `types/index.ts`, define the mirrored DTOs:

```ts
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
```

- [ ] **Step 4: Implement API client**

In `api/index.ts`, use `http`:

```ts
import { http } from '@/utils/request'
import type { DocumentType, FinalizedDocument, FrameworkScore, FrameworkId, StructuredPreview } from '../types'

export interface WorkbenchConfig {
  models: string[]
  defaultModel: string
  documentTypes: DocumentType[]
  frameworks: Array<{ frameworkId: FrameworkId; label: string; description: string }>
  larkConnected: boolean
}

export interface ImportResponse {
  id: string
  documentType: string
  originalTitle: string
  normalizedParagraphs: Array<{ id: string; index: number; text: string }>
}

export const documentWorkbenchApi = {
  config: () => http.get<WorkbenchConfig>('/documentworkbench/config'),
  importDraft: (input: { documentType: string; sourceType: 'lark' | 'markdown'; larkUrl?: string; markdown?: string }) =>
    http.post<ImportResponse>('/documentworkbench/import', input),
  recommend: (sessionId: string, model: string) =>
    http.post<FrameworkScore[]>(`/documentworkbench/${sessionId}/recommend`, { model }),
  preview: (sessionId: string, input: { frameworkId: FrameworkId; model: string; supplements: unknown[] }) =>
    http.post<StructuredPreview>(`/documentworkbench/${sessionId}/preview`, input),
  qualityCheck: (sessionId: string, model: string) =>
    http.post<StructuredPreview['qualityChecks']>(`/documentworkbench/${sessionId}/quality-check`, { model }),
  finalize: (sessionId: string, input: { model: string; acceptedQualityRuleIds: string[]; skipDeAi: boolean }) =>
    http.post<FinalizedDocument>(`/documentworkbench/${sessionId}/finalize`, input),
  publish: (sessionId: string, input: { title: string; confirmed: true }) =>
    http.post<{ url: string }>(`/documentworkbench/${sessionId}/publish`, input),
}
```

- [ ] **Step 5: Implement Pinia store**

In `store/index.ts`, expose state and actions:

- `loadConfig`
- `setDocumentType`
- `importDraft`
- `recommend`
- `preview`
- `qualityCheck`
- `finalize`
- `publish`
- `resetError`

State includes:

```ts
status: WorkbenchStatus
models: string[]
defaultModel: string
selectedModel: string
documentTypes: DocumentType[]
selectedDocumentType: DocumentTypeId | ''
sessionId: string
frameworkScores: FrameworkScore[]
selectedFramework: FrameworkId | ''
preview: StructuredPreview | null
finalDocument: FinalizedDocument | null
publishedUrl: string
errorMessage: string
```

- [ ] **Step 6: Run frontend type-check**

Run:

```bash
cd frontend && npm run type-check
```

Expected: pass.

- [ ] **Step 7: Commit frontend contracts**

Run:

```bash
git add frontend/src/modules/documentworkbench
git commit -m "feat: add document workbench frontend contracts"
```

Expected: commit created.

---

### Task 8: Frontend workbench UI and routing

**Files:**
- Create/Modify: `frontend/src/modules/documentworkbench/components/*.vue`
- Modify: `frontend/src/modules/documentworkbench/views/DocumentWorkbenchView.vue`
- Modify: `frontend/src/modules/documentworkbench/routes.ts`
- Modify: `frontend/src/modules/documentworkbench/index.ts`
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: Implement `DocumentTypePicker.vue`**

Props:

- `documentTypes: DocumentType[]`
- `modelValue: DocumentTypeId | ''`

Emits:

- `update:modelValue`

Render four cards with label, description, and rules version. Disable analysis in parent while empty.

- [ ] **Step 2: Implement `SourceInputPanel.vue`**

Props:

- `models: string[]`
- `selectedModel: string`
- `disabled: boolean`

Emits:

- `update:selectedModel`
- `submit` with `{ sourceType, larkUrl, markdown }`

Render tabs or radio buttons for Feishu link and Markdown. Markdown textarea is the reliable fallback.

- [ ] **Step 3: Implement `FrameworkSelector.vue`**

Props:

- `scores: FrameworkScore[]`
- `selected: FrameworkId | ''`

Emits:

- `select`

Render score, rank, and reason. Allow manual switching.

- [ ] **Step 4: Implement `StructuredPreview.vue`**

Props:

- `preview: StructuredPreview | null`

Render title, summary, sections, source paragraph IDs, rewrite notes, and missing questions.

- [ ] **Step 5: Implement `QualityCheckPanel.vue`**

Props:

- `checks: QualityCheckItem[]`

Render status badges:

- `passed` = 通过
- `needs_revision` = 建议修改
- `missing_info` = 需补充

Show reason and suggested revision.

- [ ] **Step 6: Implement `FinalizePanel.vue`**

Props:

- `finalDocument: FinalizedDocument | null`
- `publishing: boolean`
- `publishedUrl: string`

Emits:

- `finalize`
- `publish`

Render de-AI notes, final Markdown preview, publish button, copy Markdown button, and published link.

- [ ] **Step 7: Compose `DocumentWorkbenchView.vue`**

Use store actions in this order:

1. `loadConfig` on mount.
2. User selects document type.
3. User imports draft.
4. Automatically call `recommend`.
5. User selects framework and calls `preview`.
6. User reviews quality checks and calls `finalize`.
7. User publishes or copies Markdown.

Show status and error messages from the store.

- [ ] **Step 8: Register routes**

In module `routes.ts`, export:

```ts
export const documentWorkbenchRoutes = [
  {
    path: '/documentworkbench',
    name: 'DocumentWorkbench',
    component: () => import('./views/DocumentWorkbenchView.vue'),
    meta: { title: '结构化文档工作台' },
  },
]
```

In module `index.ts`, export `documentWorkbenchRoutes`.

In `frontend/src/router/index.ts`, import and spread the routes into layout children. If root currently redirects to todo, change root redirect to `/documentworkbench`.

- [ ] **Step 9: Run frontend checks**

Run:

```bash
cd frontend && npm run type-check && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 10: Commit frontend UI**

Run:

```bash
git add frontend/src/modules/documentworkbench frontend/src/router/index.ts
git commit -m "feat: build document workbench ui"
```

Expected: commit created.

---

### Task 9: End-to-end local smoke check

**Files:**
- Modify only if smoke check reveals a bug.

- [ ] **Step 1: Start backend**

Run:

```bash
cd backend && npm run dev
```

Expected: backend starts on local port and migrations run for SQLite.

- [ ] **Step 2: Start frontend**

In another terminal:

```bash
cd frontend && npm run dev
```

Expected: frontend starts and serves the route containing `/documentworkbench`.

- [ ] **Step 3: Exercise Markdown flow**

In browser:

1. Open `/documentworkbench`.
2. Choose `会议纪要`.
3. Choose Markdown.
4. Paste:

```markdown
# 项目例会

决定先上线结构化文档工作台 MVP。

张三负责后端 API，6 月 30 日前完成。

李四负责前端页面，7 月 2 日前完成。
```

5. Start analysis.
6. Confirm recommendation appears.
7. Generate preview.
8. Confirm quality checks appear.
9. Finalize.
10. Copy Markdown if Feishu is not configured.

Expected: no console error, no backend 500, final document contains 决策内容 and 下一步 Todo.

- [ ] **Step 4: Exercise Feishu disabled behavior**

With Feishu env missing:

1. Choose Feishu link import.
2. Paste a Feishu wiki/docx URL.
3. Start analysis.

Expected: UI shows a clear message to use Markdown or configure Feishu; no blank document is produced.

- [ ] **Step 5: Commit smoke fixes**

If code changed:

```bash
git add backend frontend
git commit -m "fix: polish document workbench smoke flow"
```

If no code changed, do not commit.

---

### Task 10: Final verification and handoff

**Files:**
- No planned code changes.

- [ ] **Step 1: Run backend verification**

Run:

```bash
cd backend && npm run test:document-workbench && npm run type-check && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 2: Run frontend verification**

Run:

```bash
cd frontend && npm run type-check && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 3: Run repo architecture verification**

Run:

```bash
bash .agents/skills/vibecoding-verify/scripts/verify.sh
```

Expected: `verify: ALL PASSED`.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git log --oneline -n 8
```

Expected: worktree clean and recent commits show scaffold, backend contracts, persistence, gateways, API, frontend contracts, UI, and any smoke fixes.

- [ ] **Step 5: Final user handoff**

Report:

- Local route to open.
- What works with Markdown.
- What Feishu env keys are needed for real Feishu import/publish.
- Verification commands and results.
- Known intentional limitation: if Feishu credentials are absent, Markdown export remains available.
