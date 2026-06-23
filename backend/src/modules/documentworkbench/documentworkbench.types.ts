import { z } from 'zod'
import type { DocumentWorkbenchSchema } from './documentworkbench.schema'

export type DocumentWorkbench = z.infer<typeof DocumentWorkbenchSchema>

export interface DocumentWorkbenchRow {
  id: string
  title: string
  done: number | boolean
  created_at: string | Date
}
