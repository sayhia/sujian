import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
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
