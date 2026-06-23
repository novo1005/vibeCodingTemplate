<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { documentWorkbenchApi } from '../api'
import type { DocumentWorkbench } from '../types'

const route = useRoute()
const item = ref<DocumentWorkbench | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  const id = String(route.params.id ?? '')
  if (!id) return

  loading.value = true
  try {
    item.value = await documentWorkbenchApi.get(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load scaffold item'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="document-workbench-detail">
    <p v-if="loading">Loading...</p>
    <p v-else-if="error" class="document-workbench-detail__error">{{ error }}</p>
    <article v-else-if="item">
      <h2>{{ item.title }}</h2>
      <p>Status: {{ item.done ? 'Done' : 'Open' }}</p>
      <p>Created: {{ item.createdAt }}</p>
    </article>
  </section>
</template>

<style scoped lang="less">
.document-workbench-detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;

  &__error {
    color: @color-danger;
  }
}
</style>
