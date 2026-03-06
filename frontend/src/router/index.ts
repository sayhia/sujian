import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/demo/styles',
    name: 'demoStyles',
    component: () => import('../views/demo/DemoStyleSelector.vue'),
  },
  {
    path: '/demo/minimal',
    name: 'demoMinimalHome',
    component: () => import('../views/demo/minimal/MinimalHomeDemo.vue'),
  },
  {
    path: '/demo/minimal/editor',
    name: 'demoMinimalEditor',
    component: () => import('../views/demo/minimal/MinimalEditorDemo.vue'),
  },
  {
    path: '/demo/minimal/settings',
    name: 'demoMinimalSettings',
    component: () => import('../views/demo/minimal/MinimalSettingsDemo.vue'),
  },
  {
    path: '/demo/editorial',
    name: 'demoEditorialHome',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/demo/editorial/editor',
    name: 'demoEditorialEditor',
    component: () => import('../views/NoteEditorPage.vue'),
  },
  {
    path: '/demo/editorial/settings',
    name: 'demoEditorialSettings',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/demo/dashboard',
    name: 'demoDashboardHome',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/demo/dashboard/editor',
    name: 'demoDashboardEditor',
    component: () => import('../views/NoteEditorPage.vue'),
  },
  {
    path: '/demo/dashboard/settings',
    name: 'demoDashboardSettings',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/demo/capsule',
    name: 'demoCapsuleHome',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/demo/capsule/editor',
    name: 'demoCapsuleEditor',
    component: () => import('../views/NoteEditorPage.vue'),
  },
  {
    path: '/demo/capsule/settings',
    name: 'demoCapsuleSettings',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/notes/new',
    name: 'newNote',
    component: () => import('../views/NoteEditorPage.vue'),
    meta: { mode: 'create' },
  },
  {
    path: '/notes/new/article',
    name: 'newArticle',
    component: () => import('../views/NoteEditorPage.vue'),
    meta: { mode: 'create', type: 'article' },
  },
  {
    path: '/notes/:id/edit',
    name: 'editNote',
    component: () => import('../views/NoteEditorPage.vue'),
    meta: { mode: 'edit' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
