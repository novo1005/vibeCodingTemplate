<script setup lang="ts">
import type { DocumentType, DocumentTypeId } from '../types'

defineProps<{
  documentTypes: DocumentType[]
  modelValue: DocumentTypeId | ''
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: DocumentTypeId): void
}>()
</script>

<template>
  <section class="document-type-picker">
    <h2>1. 选择文档类型</h2>
    <div class="document-type-picker__grid">
      <button
        v-for="item in documentTypes"
        :key="item.typeId"
        type="button"
        :class="['document-type-picker__card', { active: modelValue === item.typeId }]"
        @click="emit('update:modelValue', item.typeId)"
      >
        <span class="document-type-picker__label">{{ item.label }}</span>
        <span>{{ item.description }}</span>
        <small>规则版本：{{ item.rulesVersion }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped lang="less">
.document-type-picker {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: @space-lg;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: @space-sm;
    min-height: 136px;
    padding: @space-lg;
    color: @color-text;
    text-align: left;
    background: @color-bg;
    border: 1px solid @color-border;
    border-radius: @radius-lg;
    cursor: pointer;
    transition: @transition-base;

    &.active {
      border-color: @color-primary;
      box-shadow: 0 0 0 3px fade(@color-primary, 12%);
    }
  }

  &__label {
    font-size: @font-size-lg;
    font-weight: 700;
  }
}
</style>
