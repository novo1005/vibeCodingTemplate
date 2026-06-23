import assert from 'node:assert/strict'
import { documentTypes } from './document-type-catalog'
import { normalizeDraft } from './normalizer'
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

testDocumentTypes()
testFrameworks()
testImportSchemaRequiresDocumentType()
testPreviewSchemaAcceptsFramework()
testNormalizeDraft()

console.log('document-workbench tests: OK')
