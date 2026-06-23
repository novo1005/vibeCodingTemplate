import type { RouteRecordRaw } from 'vue-router'

export const documentWorkbenchRoutes: RouteRecordRaw[] = [
  {
    path: 'document-workbench',
    name: 'document-workbench',
    component: () => import('./views/DocumentWorkbenchView.vue'),
    meta: { title: '结构化文档工作台' },
  },
]
