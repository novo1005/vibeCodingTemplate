import { storeToRefs } from 'pinia'
import { useDocumentWorkbenchStore } from '../store'

export function useDocumentWorkbenchList() {
  const store = useDocumentWorkbenchStore()
  const { items, loading, error, remaining } = storeToRefs(store)

  return {
    items,
    loading,
    error,
    remaining,
    fetchAll: store.fetchAll,
    create: store.create,
    update: store.update,
    remove: store.remove,
  }
}
