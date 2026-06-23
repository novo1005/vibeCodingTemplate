import { http } from '@/utils/request'
import type {
  DocumentWorkbench,
  DocumentWorkbenchCreateInput,
  DocumentWorkbenchUpdateInput,
} from '../types'

export const documentWorkbenchApi = {
  list: (signal?: AbortSignal) => http.get<DocumentWorkbench[]>('/documentworkbench', { signal }),
  get: (id: string, signal?: AbortSignal) =>
    http.get<DocumentWorkbench>(`/documentworkbench/${id}`, { signal }),
  create: (input: DocumentWorkbenchCreateInput) =>
    http.post<DocumentWorkbench>('/documentworkbench', input),
  update: (id: string, input: DocumentWorkbenchUpdateInput) =>
    http.patch<DocumentWorkbench>(`/documentworkbench/${id}`, input),
  remove: (id: string) => http.delete<{ id: string }>(`/documentworkbench/${id}`),
}
