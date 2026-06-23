<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DocumentTypePicker from '../components/DocumentTypePicker.vue'
import FinalizePanel from '../components/FinalizePanel.vue'
import FrameworkSelector from '../components/FrameworkSelector.vue'
import QualityCheckPanel from '../components/QualityCheckPanel.vue'
import SourceInputPanel from '../components/SourceInputPanel.vue'
import StructuredPreview from '../components/StructuredPreview.vue'
import { useDocumentWorkbenchStore } from '../store'
import type { DocumentTypeId, FrameworkId, ImportDraftInput } from '../types'

const store = useDocumentWorkbenchStore()
const {
  documentTypes,
  selectedDocumentType,
  selectedDocumentTypeDetail,
  models,
  selectedModel,
  aiConnected,
  aiStatus,
  status,
  errorMessage,
  originalTitle,
  normalizedParagraphs,
  frameworkScores,
  selectedFramework,
  preview,
  finalDocument,
  publishedUrl,
} = storeToRefs(store)

const qualityChecks = computed(() => preview.value?.qualityChecks ?? [])
const isBusy = computed(() =>
  ['importing', 'recommending', 'previewing', 'quality-checking', 'finalizing', 'publishing'].includes(
    status.value,
  ),
)
const importLoading = computed(() => ['importing', 'recommending'].includes(status.value))
const previewLoading = computed(() => ['previewing', 'quality-checking'].includes(status.value))
const finalizing = computed(() => status.value === 'finalizing')
const publishing = computed(() => status.value === 'publishing')

const statusText = computed(() => {
  const labels = {
    idle: '待开始',
    importing: '正在导入初稿',
    recommending: '正在推荐结构框架',
    previewing: '正在生成结构化预览',
    'quality-checking': '正在检查规范',
    ready: '可继续确认',
    finalizing: '正在生成终稿',
    finalized: '终稿已生成',
    publishing: '正在生成飞书文档',
    published: '飞书文档已生成',
    failed: '操作失败',
  } as const
  return labels[status.value]
})

onMounted(() => {
  void store.loadConfig()
})

function selectDocumentType(typeId: DocumentTypeId) {
  store.setDocumentType(typeId)
  store.resetError()
}

function submitDraft(input: Omit<ImportDraftInput, 'documentType'>) {
  void store.importDraft(input)
}

function selectFramework(frameworkId: FrameworkId) {
  void store.generatePreview(frameworkId)
}

function finalizeDocument() {
  void store.finalize(false)
}

function publishDocument() {
  void store.publish(finalDocument.value?.title || originalTitle.value || '结构化文档')
}
</script>

<template>
  <section class="document-workbench">
    <header class="document-workbench__hero">
      <p class="document-workbench__eyebrow">Document Workbench</p>
      <h1>结构化文档工作台</h1>
      <p>
        先选择文档类型，再导入飞书链接或 Markdown 初稿；系统会推荐结构框架，你也可以手动切换。
      </p>
      <div class="document-workbench__status">
        <span>当前状态：{{ statusText }}</span>
        <span v-if="selectedDocumentTypeDetail">已选：{{ selectedDocumentTypeDetail.label }}</span>
      </div>
    </header>

    <p v-if="!aiConnected" class="document-workbench__warning">
      {{ aiStatus.message }}
      请在后端 <code>.env</code> 配置 <code>AI_GATEWAY_API_KEY</code>、
      <code>AI_GATEWAY_DEFAULT_MODEL</code> 后重启服务。
    </p>

    <p v-if="errorMessage" class="document-workbench__error">{{ errorMessage }}</p>

    <div class="document-workbench__layout">
      <div class="document-workbench__main">
        <DocumentTypePicker
          class="document-workbench__card"
          :document-types="documentTypes"
          :model-value="selectedDocumentType"
          @update:model-value="selectDocumentType"
        />

        <SourceInputPanel
          class="document-workbench__card"
          :models="models"
          :selected-model="selectedModel"
          :disabled="!selectedDocumentType || isBusy"
          :loading="importLoading"
          @update:selected-model="selectedModel = $event"
          @submit="submitDraft"
        />

        <FrameworkSelector
          class="document-workbench__card"
          :scores="frameworkScores"
          :selected="selectedFramework"
          @select="selectFramework"
        />

        <StructuredPreview class="document-workbench__card" :preview="preview" />

        <QualityCheckPanel class="document-workbench__card" :checks="qualityChecks" />

        <FinalizePanel
          class="document-workbench__card"
          :final-document="finalDocument"
          :disabled="!preview || previewLoading"
          :finalizing="finalizing"
          :publishing="publishing"
          :published-url="publishedUrl"
          @finalize="finalizeDocument"
          @publish="publishDocument"
        />
      </div>

      <aside class="document-workbench__aside">
        <h2>原稿概览</h2>
        <p v-if="!originalTitle">导入后这里会显示标题、段落拆解和可追溯来源。</p>
        <template v-else>
          <h3>{{ originalTitle }}</h3>
          <ol>
            <li v-for="paragraph in normalizedParagraphs" :key="paragraph.id">
              {{ paragraph.text }}
            </li>
          </ol>
        </template>
      </aside>
    </div>
  </section>
</template>

<style scoped lang="less">
.document-workbench {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px;

  &__hero {
    padding: @space-xl;
    margin-bottom: @space-xl;
    background: linear-gradient(135deg, fade(@color-primary, 12%), @color-bg);
    border: 1px solid fade(@color-primary, 18%);
    border-radius: @radius-lg;
  }

  &__eyebrow {
    color: @color-primary;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: @space-md;
    margin-top: @space-lg;
    color: @color-text-secondary;
  }

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: @space-xl;
    align-items: start;
  }

  &__main {
    display: grid;
    gap: @space-xl;
  }

  &__card,
  &__aside {
    padding: @space-xl;
    background: @color-bg;
    border: 1px solid @color-border;
    border-radius: @radius-lg;
    box-shadow: @shadow-sm;
  }

  &__aside {
    position: sticky;
    top: @space-lg;

    ol {
      display: grid;
      gap: @space-sm;
      max-height: 680px;
      padding-left: @space-lg;
      overflow: auto;
      color: @color-text-secondary;
    }
  }

  &__error {
    padding: @space-md @space-lg;
    margin-bottom: @space-lg;
    color: @color-danger;
    background: fade(@color-danger, 8%);
    border: 1px solid fade(@color-danger, 25%);
    border-radius: @radius-md;
  }

  &__warning {
    padding: @space-md @space-lg;
    margin-bottom: @space-lg;
    color: @color-warning;
    background: fade(@color-warning, 10%);
    border: 1px solid fade(@color-warning, 30%);
    border-radius: @radius-md;

    code {
      padding: 0 4px;
      color: @color-text;
      background: @color-bg-muted;
      border-radius: @radius-sm;
    }
  }
}

@media (max-width: 960px) {
  .document-workbench {
    &__layout {
      grid-template-columns: 1fr;
    }

    &__aside {
      position: static;
    }
  }
}
</style>
