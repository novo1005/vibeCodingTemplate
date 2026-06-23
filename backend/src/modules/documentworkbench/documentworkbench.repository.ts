import { db } from '@/db'
import { nanoid } from '@/utils/id'
import type { DocumentWorkbench, DocumentWorkbenchRow } from './documentworkbench.types'
import type {
  DocumentWorkbenchCreateInput,
  DocumentWorkbenchUpdateInput,
} from './documentworkbench.schema'

function toDomain(row: DocumentWorkbenchRow): DocumentWorkbench {
  const created = row.created_at
  return {
    id: row.id,
    title: row.title,
    done: typeof row.done === 'number' ? row.done !== 0 : Boolean(row.done),
    createdAt: created instanceof Date ? created.toISOString() : created,
  }
}

export const documentWorkbenchRepository = {
  async list(): Promise<DocumentWorkbench[]> {
    const rows = await db.query<DocumentWorkbenchRow>(
      'SELECT * FROM document_workbench ORDER BY created_at DESC',
    )
    return rows.map(toDomain)
  },

  async findById(id: string): Promise<DocumentWorkbench | null> {
    const row = await db.queryOne<DocumentWorkbenchRow>(
      'SELECT * FROM document_workbench WHERE id = ?',
      [id],
    )
    return row ? toDomain(row) : null
  },

  async create(input: DocumentWorkbenchCreateInput): Promise<DocumentWorkbench> {
    const now = new Date().toISOString()
    const item = {
      id: nanoid(),
      title: input.title,
      done: input.done ?? false,
      createdAt: now,
    }

    await db.execute(
      'INSERT INTO document_workbench (id, title, done, created_at) VALUES (?, ?, ?, ?)',
      [item.id, item.title, item.done ? 1 : 0, item.createdAt],
    )

    return item
  },

  async update(id: string, input: DocumentWorkbenchUpdateInput): Promise<DocumentWorkbench | null> {
    const current = await this.findById(id)
    if (!current) return null

    const next = {
      ...current,
      title: input.title ?? current.title,
      done: input.done ?? current.done,
    }

    await db.execute('UPDATE document_workbench SET title = ?, done = ? WHERE id = ?', [
      next.title,
      next.done ? 1 : 0,
      id,
    ])

    return next
  },

  async remove(id: string): Promise<boolean> {
    const result = await db.execute('DELETE FROM document_workbench WHERE id = ?', [id])
    return result.rowsAffected > 0
  },
}
