<script setup lang="ts">
import type { DocumentWorkbench } from '../types'

defineProps<{ item: DocumentWorkbench }>()

const emit = defineEmits<{
  (e: 'toggle', item: DocumentWorkbench): void
  (e: 'remove', item: DocumentWorkbench): void
}>()
</script>

<template>
  <li class="document-workbench-item">
    <label>
      <input type="checkbox" :checked="item.done" @change="emit('toggle', item)" />
      <span :class="{ done: item.done }">{{ item.title }}</span>
    </label>
    <button type="button" @click="emit('remove', item)">Remove</button>
  </li>
</template>

<style scoped lang="less">
.document-workbench-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .done {
    color: @text-color-secondary;
    text-decoration: line-through;
  }
}
</style>
