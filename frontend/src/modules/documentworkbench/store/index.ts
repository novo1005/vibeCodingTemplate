import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { documentWorkbenchApi } from '../api'
import type {
  DocumentWorkbench,
  DocumentWorkbenchCreateInput,
  DocumentWorkbenchUpdateInput,
} from '../types'

export const useDocumentWorkbenchStore = defineStore('document-workbench', () => {
  const items = ref<DocumentWorkbench[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const remaining = computed(() => items.value.filter((item) => !item.done).length)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      items.value = await documentWorkbenchApi.list()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load document workbench items'
    } finally {
      loading.value = false
    }
  }

  async function create(input: DocumentWorkbenchCreateInput) {
    const item = await documentWorkbenchApi.create(input)
    items.value = [item, ...items.value]
    return item
  }

  async function update(id: string, input: DocumentWorkbenchUpdateInput) {
    const next = await documentWorkbenchApi.update(id, input)
    items.value = items.value.map((item) => (item.id === id ? next : item))
    return next
  }

  async function remove(id: string) {
    await documentWorkbenchApi.remove(id)
    items.value = items.value.filter((item) => item.id !== id)
  }

  return { items, loading, error, remaining, fetchAll, create, update, remove }
})
