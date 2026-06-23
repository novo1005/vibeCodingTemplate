<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton/index.vue'
import BaseInput from '@/components/BaseInput/index.vue'

defineProps<{
  models: string[]
  selectedModel: string
  disabled: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedModel', value: string): void
  (e: 'submit', value: { sourceType: 'lark' | 'markdown'; larkUrl?: string; markdown?: string }): void
}>()

const sourceType = ref<'lark' | 'markdown'>('markdown')
const larkUrl = ref('')
const markdown = ref('')

function onModelChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (target) emit('update:selectedModel', target.value)
}

function submitDraft() {
  if (sourceType.value === 'markdown') {
    emit('submit', {
      sourceType: 'markdown',
      markdown: markdown.value.trim(),
    })
    return
  }

  emit('submit', {
    sourceType: 'lark',
    larkUrl: larkUrl.value.trim(),
  })
}
</script>

<template>
  <section class="source-input-panel">
    <h2>2. 导入初稿</h2>

    <label class="source-input-panel__model">
      <span>模型</span>
      <select
        :value="selectedModel"
        :disabled="disabled"
        @change="onModelChange"
      >
        <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
      </select>
    </label>

    <div class="source-input-panel__tabs">
      <button type="button" :class="{ active: sourceType === 'markdown' }" @click="sourceType = 'markdown'">
        Markdown
      </button>
      <button type="button" :class="{ active: sourceType === 'lark' }" @click="sourceType = 'lark'">
        飞书链接
      </button>
    </div>

    <textarea
      v-if="sourceType === 'markdown'"
      v-model="markdown"
      :disabled="disabled"
      placeholder="粘贴你的初版文档 Markdown 或纯文本"
    />
    <BaseInput
      v-else
      v-model="larkUrl"
      :disabled="disabled"
      placeholder="https://xxx.feishu.cn/wiki/..."
    />

    <BaseButton
      :disabled="disabled || (sourceType === 'markdown' ? !markdown.trim() : !larkUrl.trim())"
      :loading="loading"
      @click="submitDraft"
    >
      开始分析
    </BaseButton>
  </section>
</template>

<style scoped lang="less">
.source-input-panel {
  display: grid;
  gap: @space-lg;

  &__model {
    display: flex;
    align-items: center;
    gap: @space-md;

    select {
      min-width: 180px;
      padding: @space-sm @space-md;
      border: 1px solid @color-border;
      border-radius: @radius-md;
    }
  }

  &__tabs {
    display: flex;
    gap: @space-sm;

    button {
      padding: @space-sm @space-lg;
      background: @color-bg-muted;
      border: 1px solid @color-border;
      border-radius: 999px;
      cursor: pointer;

      &.active {
        color: @color-text-inverse;
        background: @color-primary;
        border-color: @color-primary;
      }
    }
  }

  textarea {
    min-height: 180px;
    padding: @space-md;
    font: inherit;
    border: 1px solid @color-border;
    border-radius: @radius-lg;
    resize: vertical;
  }
}
</style>
