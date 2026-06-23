<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton/index.vue'
import BaseEmpty from '@/components/BaseEmpty/index.vue'
import type { FinalizedDocument } from '../types'

defineProps<{
  finalDocument: FinalizedDocument | null
  disabled: boolean
  finalizing: boolean
  publishing: boolean
  publishedUrl: string
}>()

const emit = defineEmits<{
  (e: 'finalize'): void
  (e: 'publish'): void
}>()

const copyState = ref('')

async function copyMarkdown(markdown: string) {
  try {
    await navigator.clipboard.writeText(markdown)
    copyState.value = '已复制 Markdown'
  } catch {
    copyState.value = '复制失败，请手动选中文本复制'
  }
}
</script>

<template>
  <section class="finalize-panel">
    <h2>6. 终稿与发布</h2>
    <div class="finalize-panel__actions">
      <BaseButton :disabled="disabled" :loading="finalizing" @click="emit('finalize')">
        生成去 AI 味终稿
      </BaseButton>
      <BaseButton
        variant="ghost"
        :disabled="!finalDocument"
        @click="finalDocument && copyMarkdown(finalDocument.markdown)"
      >
        复制 Markdown
      </BaseButton>
      <BaseButton
        variant="secondary"
        :disabled="!finalDocument"
        :loading="publishing"
        @click="emit('publish')"
      >
        生成新飞书文档
      </BaseButton>
    </div>

    <BaseEmpty v-if="!finalDocument" description="确认结构化版本后生成终稿" />
    <article v-else>
      <h3>{{ finalDocument.title }}</h3>
      <ul>
        <li v-for="note in finalDocument.deAiNotes" :key="note">{{ note }}</li>
      </ul>
      <p v-if="copyState" class="finalize-panel__copy-state">{{ copyState }}</p>
      <pre>{{ finalDocument.markdown }}</pre>
    </article>

    <p v-if="publishedUrl">
      已生成：
      <a :href="publishedUrl" target="_blank" rel="noreferrer">{{ publishedUrl }}</a>
    </p>
  </section>
</template>

<style scoped lang="less">
.finalize-panel {
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: @space-md;
    margin-bottom: @space-lg;
  }

  pre {
    max-height: 420px;
    padding: @space-lg;
    overflow: auto;
    white-space: pre-wrap;
    background: @color-bg-muted;
    border: 1px solid @color-border;
    border-radius: @radius-lg;
  }

  &__copy-state {
    color: @color-success;
  }
}
</style>
