export interface Documentworkbench {
  id: string
  title: string
  done: boolean
  createdAt: string
}

export type DocumentWorkbench = Documentworkbench

export interface DocumentWorkbenchCreateInput {
  title: string
  done?: boolean
}

export interface DocumentWorkbenchUpdateInput {
  title?: string
  done?: boolean
}
