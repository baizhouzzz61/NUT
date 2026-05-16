import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'library',
    component: () => import('../views/LibraryView.vue'),
  },
  {
    path: '/generate',
    name: 'generate',
    component: () => import('../views/GenerateView.vue'),
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
