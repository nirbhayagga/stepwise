import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/sort'
    },
    {
      path: '/sort',
      name: 'sort',
      component: () => import('../views/SortingView.vue')
    },
    {
      path: '/path',
      name: 'pathfinding',
      component: () => import('../views/PathfindingView.vue')
    },
    {
      path: '/path-compare',
      name: 'path-compare',
      component: () => import('../views/PathfindingCompareView.vue')
    },
    {
      path: '/sandbox',
      name: 'sandbox',
      component: () => import('../views/SandboxView.vue')
    },
    {
      path: '/compare',
      name: 'compare',
      component: () => import('../views/ComparisonView.vue')
    },
    {
      path: '/dp',
      name: 'dp',
      component: () => import('../views/DPView.vue')
    },
    {
      path: '/tree',
      name: 'tree',
      component: () => import('../views/TreeView.vue')
    }
  ]
})

export default router
