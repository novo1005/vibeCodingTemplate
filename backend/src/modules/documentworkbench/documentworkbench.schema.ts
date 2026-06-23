import { z } from 'zod'

/**
 * Temporary scaffold contract. Task 2 replaces this with the real document
 * workbench schemas using test-first changes.
 */

export const DocumentWorkbenchCreateSchema = z.object({
  title: z.string().min(1).max(120),
  done: z.boolean().optional().default(false),
})

export const DocumentWorkbenchUpdateSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    done: z.boolean().optional(),
  })
  .refine((v) => v.title !== undefined || v.done !== undefined, {
    message: 'At least one of `title` or `done` is required',
  })

export const DocumentWorkbenchIdSchema = z.object({
  id: z.string().min(1),
})

export const DocumentWorkbenchSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(),
})

export type DocumentWorkbenchCreateInput = z.infer<typeof DocumentWorkbenchCreateSchema>
export type DocumentWorkbenchUpdateInput = z.infer<typeof DocumentWorkbenchUpdateSchema>
export type DocumentWorkbenchIdParam = z.infer<typeof DocumentWorkbenchIdSchema>
