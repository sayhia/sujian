import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/notes/new',
    name: 'newQuick',
    component: () => import('../views/EditorView.vue'),
    meta: { mode: 'create' },
  },
  {
    path: '/notes/new/article',
    name: 'newArticle',
    component: () => import('../views/EditorView.vue'),
    meta: { mode: 'create', type: 'article' },
  },
  {
    path: '/notes/:id/edit',
    name: 'editNote',
    component: () => import('../views/EditorView.vue'),
    meta: { mode: 'edit' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
