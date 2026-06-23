import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { documentWorkbenchApi } from '../api'
import type {
  DocumentType,
  DocumentTypeId,
  FinalizedDocument,
  FrameworkId,
  FrameworkScore,
  ImportDraftInput,
  NormalizedParagraph,
  StructuredPreview,
  WorkbenchStatus,
} from '../types'

export const useDocumentWorkbenchStore = defineStore('document-workbench', () => {
  const status = ref<WorkbenchStatus>('idle')
  const models = ref<string[]>([])
  const defaultModel = ref('local')
  const selectedModel = ref('local')
  const documentTypes = ref<DocumentType[]>([])
  const selectedDocumentType = ref<DocumentTypeId | ''>('')
  const sessionId = ref('')
  const originalTitle = ref('')
  const normalizedParagraphs = ref<NormalizedParagraph[]>([])
  const frameworkScores = ref<FrameworkScore[]>([])
  const selectedFramework = ref<FrameworkId | ''>('')
  const preview = ref<StructuredPreview | null>(null)
  const finalDocument = ref<FinalizedDocument | null>(null)
  const publishedUrl = ref('')
  const errorMessage = ref('')

  const selectedDocumentTypeDetail = computed(
    () => documentTypes.value.find((item) => item.typeId === selectedDocumentType.value) ?? null,
  )

  function setFailure(error: unknown) {
    status.value = 'failed'
    errorMessage.value = error instanceof Error ? error.message : '操作失败，请稍后重试'
  }

  function resetError() {
    errorMessage.value = ''
    if (status.value === 'failed') status.value = 'idle'
  }

  async function loadConfig() {
    try {
      const config = await documentWorkbenchApi.config()
      models.value = config.models
      defaultModel.value = config.defaultModel
      selectedModel.value = config.defaultModel
      documentTypes.value = config.documentTypes
    } catch (error) {
      setFailure(error)
    }
  }

  function setDocumentType(typeId: DocumentTypeId) {
    selectedDocumentType.value = typeId
  }

  async function importDraft(input: Omit<ImportDraftInput, 'documentType'>) {
    if (!selectedDocumentType.value) {
      errorMessage.value = '请先选择文档类型'
      status.value = 'failed'
      return
    }

    status.value = 'importing'
    errorMessage.value = ''
    try {
      const imported = await documentWorkbenchApi.importDraft({
        ...input,
        documentType: selectedDocumentType.value,
      })
      sessionId.value = imported.id
      originalTitle.value = imported.originalTitle
      normalizedParagraphs.value = imported.normalizedParagraphs
      status.value = 'recommending'
      await recommend()
    } catch (error) {
      setFailure(error)
    }
  }

  async function recommend() {
    if (!sessionId.value) return
    status.value = 'recommending'
    errorMessage.value = ''
    try {
      frameworkScores.value = await documentWorkbenchApi.recommend(sessionId.value, selectedModel.value)
      selectedFramework.value = frameworkScores.value[0]?.frameworkId ?? ''
      status.value = 'ready'
    } catch (error) {
      setFailure(error)
    }
  }

  async function generatePreview(frameworkId = selectedFramework.value) {
    if (!sessionId.value || !frameworkId) return
    status.value = 'previewing'
    errorMessage.value = ''
    try {
      selectedFramework.value = frameworkId
      preview.value = await documentWorkbenchApi.preview(sessionId.value, {
        frameworkId,
        model: selectedModel.value,
        supplements: [],
      })
      status.value = 'quality-checking'
      preview.value.qualityChecks = await documentWorkbenchApi.qualityCheck(
        sessionId.value,
        selectedModel.value,
      )
      status.value = 'ready'
    } catch (error) {
      setFailure(error)
    }
  }

  async function finalize(skipDeAi = false) {
    if (!sessionId.value) return
    status.value = 'finalizing'
    errorMessage.value = ''
    try {
      finalDocument.value = await documentWorkbenchApi.finalize(sessionId.value, {
        model: selectedModel.value,
        acceptedQualityRuleIds:
          preview.value?.qualityChecks
            .filter((item) => item.status === 'passed')
            .map((item) => item.ruleId) ?? [],
        skipDeAi,
      })
      status.value = 'finalized'
    } catch (error) {
      setFailure(error)
    }
  }

  async function publish(title: string) {
    if (!sessionId.value) return
    status.value = 'publishing'
    errorMessage.value = ''
    try {
      const result = await documentWorkbenchApi.publish(sessionId.value, { title, confirmed: true })
      publishedUrl.value = result.url
      status.value = 'published'
    } catch (error) {
      setFailure(error)
    }
  }

  return {
    status,
    models,
    defaultModel,
    selectedModel,
    documentTypes,
    selectedDocumentType,
    selectedDocumentTypeDetail,
    sessionId,
    originalTitle,
    normalizedParagraphs,
    frameworkScores,
    selectedFramework,
    preview,
    finalDocument,
    publishedUrl,
    errorMessage,
    loadConfig,
    setDocumentType,
    importDraft,
    recommend,
    generatePreview,
    finalize,
    publish,
    resetError,
  }
})
