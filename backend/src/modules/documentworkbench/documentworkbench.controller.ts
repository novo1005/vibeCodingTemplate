import type { FastifyReply, FastifyRequest } from 'fastify'
import { success } from '@/utils/response'
import { documentWorkbenchService } from './documentworkbench.service'
import {
  DocumentWorkbenchCreateSchema,
  DocumentWorkbenchIdSchema,
  DocumentWorkbenchUpdateSchema,
} from './documentworkbench.schema'

export const documentWorkbenchController = {
  async list(_req: FastifyRequest, reply: FastifyReply) {
    const data = await documentWorkbenchService.list()
    return reply.send(success(data))
  },

  async get(req: FastifyRequest, reply: FastifyReply) {
    const { id } = DocumentWorkbenchIdSchema.parse(req.params)
    const data = await documentWorkbenchService.get(id)
    return reply.send(success(data))
  },

  async create(req: FastifyRequest, reply: FastifyReply) {
    const input = DocumentWorkbenchCreateSchema.parse(req.body)
    const data = await documentWorkbenchService.create(input)
    return reply.code(201).send(success(data))
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = DocumentWorkbenchIdSchema.parse(req.params)
    const input = DocumentWorkbenchUpdateSchema.parse(req.body)
    const data = await documentWorkbenchService.update(id, input)
    return reply.send(success(data))
  },

  async remove(req: FastifyRequest, reply: FastifyReply) {
    const { id } = DocumentWorkbenchIdSchema.parse(req.params)
    const data = await documentWorkbenchService.remove(id)
    return reply.send(success(data))
  },
}
