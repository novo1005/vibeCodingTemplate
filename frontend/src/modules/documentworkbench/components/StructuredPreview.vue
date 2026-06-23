<script setup lang="ts">
import BaseEmpty from '@/components/BaseEmpty/index.vue'
import type { StructuredPreview } from '../types'

defineProps<{
  preview: StructuredPreview | null
}>()
</script>

<template>
  <section class="structured-preview">
    <h2>4. 结构化预览</h2>
    <BaseEmpty v-if="!preview" description="选择框架后生成结构化预览" />
    <article v-else>
      <h3>{{ preview.title }}</h3>
      <blockquote>{{ preview.summary }}</blockquote>
      <section v-for="section in preview.sections" :key="section.slotId" class="structured-preview__section">
        <h4>{{ section.heading }}</h4>
        <p>{{ section.content }}</p>
        <small>来源：{{ section.sourceParagraphIds.join(', ') || '待补充' }}</small>
        <small>{{ section.rewriteNote }}</small>
      </section>
    </article>
  </section>
</template>

<style scoped lang="less">
.structured-preview {
  blockquote {
    margin: 0 0 @space-lg;
    padding: @space-md @space-lg;
    background: @color-bg-muted;
    border-left: 4px solid @color-primary;
    border-radius: @radius-md;
  }

  &__section {
    padding: @space-lg 0;
    border-top: 1px solid @color-border;

    small {
      display: block;
      color: @color-text-secondary;
    }
  }
}
</style>
