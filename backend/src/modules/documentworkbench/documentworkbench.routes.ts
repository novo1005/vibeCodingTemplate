import type { FastifyInstance } from 'fastify'
import { documentWorkbenchController } from './documentworkbench.controller'

export async function documentWorkbenchRoutes(app: FastifyInstance) {
  app.get('/config', documentWorkbenchController.getConfig)
  app.post('/ai-ping', documentWorkbenchController.pingAiGateway)
  app.post('/import', documentWorkbenchController.importDraft)
  app.post('/:sessionId/recommend', documentWorkbenchController.recommend)
  app.post('/:sessionId/preview', documentWorkbenchController.preview)
  app.post('/:sessionId/quality-check', documentWorkbenchController.qualityCheck)
  app.patch('/:sessionId/supplements', documentWorkbenchController.saveSupplements)
  app.post('/:sessionId/finalize', documentWorkbenchController.finalize)
  app.post('/:sessionId/publish', documentWorkbenchController.publish)
  app.get('/:sessionId/export.md', documentWorkbenchController.exportMarkdown)
}
