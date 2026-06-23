import type { RouteRecordRaw } from 'vue-router'

export const documentWorkbenchRoutes: RouteRecordRaw[] = [
  {
    path: 'document-workbench',
    name: 'document-workbench-list',
    component: () => import('./views/DocumentWorkbenchListView.vue'),
  },
  {
    path: 'document-workbench/:id',
    name: 'document-workbench-detail',
    component: () => import('./views/DocumentWorkbenchDetailView.vue'),
  },
]
