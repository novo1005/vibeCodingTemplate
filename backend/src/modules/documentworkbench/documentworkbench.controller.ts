import type { FastifyReply, FastifyRequest } from 'fastify'
import { success } from '@/utils/response'
import { documentWorkbenchService } from './documentworkbench.service'
import {
  DocumentWorkbenchFinalizeBodySchema,
  DocumentWorkbenchImportBodySchema,
  DocumentWorkbenchPreviewBodySchema,
  DocumentWorkbenchPublishBodySchema,
  DocumentWorkbenchQualityCheckBodySchema,
  DocumentWorkbenchRecommendBodySchema,
  SessionIdParamSchema,
  SupplementSchema,
} from './documentworkbench.schema'

export const documentWorkbenchController = {
  async getConfig(_req: FastifyRequest, reply: FastifyReply) {
    return reply.send(success(documentWorkbenchService.getConfig()))
  },

  async pingAiGateway(_req: FastifyRequest, reply: FastifyReply) {
    return reply.send(success(await documentWorkbenchService.pingAiGateway()))
  },

  async importDraft(req: FastifyRequest, reply: FastifyReply) {
    const input = DocumentWorkbenchImportBodySchema.parse(req.body)
    const data = await documentWorkbenchService.importDraft(input)
    return reply.code(201).send(success(data))
  },

  async recommend(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const input = DocumentWorkbenchRecommendBodySchema.parse(req.body)
    const data = await documentWorkbenchService.recommend(sessionId, input)
    return reply.send(success(data))
  },

  async preview(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const input = DocumentWorkbenchPreviewBodySchema.parse(req.body)
    const data = await documentWorkbenchService.preview(sessionId, input)
    return reply.send(success(data))
  },

  async qualityCheck(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const input = DocumentWorkbenchQualityCheckBodySchema.parse(req.body)
    const data = await documentWorkbenchService.qualityCheck(sessionId, input)
    return reply.send(success(data))
  },

  async saveSupplements(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const input = SupplementSchema.array().parse(req.body)
    const data = await documentWorkbenchService.saveSupplements(sessionId, input)
    return reply.send(success(data))
  },

  async finalize(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const input = DocumentWorkbenchFinalizeBodySchema.parse(req.body)
    const data = await documentWorkbenchService.finalize(sessionId, input)
    return reply.send(success(data))
  },

  async publish(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const input = DocumentWorkbenchPublishBodySchema.parse(req.body)
    const data = await documentWorkbenchService.publish(sessionId, input)
    return reply.send(success(data))
  },

  async exportMarkdown(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = SessionIdParamSchema.parse(req.params)
    const markdown = await documentWorkbenchService.exportMarkdown(sessionId)
    return reply.type('text/markdown; charset=utf-8').send(markdown)
  },
}
