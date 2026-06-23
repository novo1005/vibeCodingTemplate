import { NotFoundError } from '@/utils/http-error'
import { documentWorkbenchRepository } from './documentworkbench.repository'
import type { DocumentWorkbench } from './documentworkbench.types'
import type {
  DocumentWorkbenchCreateInput,
  DocumentWorkbenchUpdateInput,
} from './documentworkbench.schema'

export const documentWorkbenchService = {
  list(): Promise<DocumentWorkbench[]> {
    return documentWorkbenchRepository.list()
  },

  async get(id: string): Promise<DocumentWorkbench> {
    const item = await documentWorkbenchRepository.findById(id)
    if (!item) throw NotFoundError('document workbench item')
    return item
  },

  create(input: DocumentWorkbenchCreateInput): Promise<DocumentWorkbench> {
    return documentWorkbenchRepository.create(input)
  },

  async update(id: string, input: DocumentWorkbenchUpdateInput): Promise<DocumentWorkbench> {
    const exists = await documentWorkbenchRepository.findById(id)
    if (!exists) throw NotFoundError('document workbench item')

    const updated = await documentWorkbenchRepository.update(id, input)
    if (!updated) throw NotFoundError('document workbench item')
    return updated
  },

  async remove(id: string): Promise<{ id: string }> {
    const ok = await documentWorkbenchRepository.remove(id)
    if (!ok) throw NotFoundError('document workbench item')
    return { id }
  },
}
