import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/demo/editorial/EditorialHomeDemo.vue'),
    meta: { appStyle: 'editorial' },
  },
  {
    path: '/notes/new',
    name: 'newNote',
    component: () => import('../views/demo/editorial/EditorialEditorDemo.vue'),
    meta: { mode: 'create', appStyle: 'editorial' },
  },
  {
    path: '/notes/new/article',
    name: 'newArticle',
    component: () => import('../views/demo/editorial/EditorialEditorDemo.vue'),
    meta: { mode: 'create', type: 'article', appStyle: 'editorial' },
  },
  {
    path: '/notes/:id/edit',
    name: 'editNote',
    component: () => import('../views/demo/editorial/EditorialEditorDemo.vue'),
    meta: { mode: 'edit', appStyle: 'editorial' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/demo/editorial/EditorialSettingsDemo.vue'),
    meta: { appStyle: 'editorial' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
