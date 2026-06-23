import type { FastifyInstance } from 'fastify'
import { documentWorkbenchController } from './documentworkbench.controller'

export async function documentWorkbenchRoutes(app: FastifyInstance) {
  app.get('/', documentWorkbenchController.list)
  app.get('/:id', documentWorkbenchController.get)
  app.post('/', documentWorkbenchController.create)
  app.patch('/:id', documentWorkbenchController.update)
  app.delete('/:id', documentWorkbenchController.remove)
}
