import fp from 'fastify-plugin'
import { documentWorkbenchRoutes } from './documentworkbench.routes'

/**
 * The module's only public surface. Mounts the module's routes under a
 * stable URL prefix. Register from `src/routes.ts`.
 */
export default fp(
  async (app) => {
    await app.register(documentWorkbenchRoutes, { prefix: '/api/documentworkbench' })
  },
  { name: 'module-document-workbench' },
)

export type { DocumentWorkbench } from './documentworkbench.types'
export {
  DocumentWorkbenchCreateSchema,
  DocumentWorkbenchUpdateSchema,
  DocumentWorkbenchSchema,
} from './documentworkbench.schema'
