import { createRouter, createWebHashHistory } from 'vue-router'

export interface NavEntry { path: string; name: string; label: string; group: string }

/** Single source of truth for routes and the sidebar. */
export const NAV: NavEntry[] = [
  { path: '/sort', name: 'sort', label: 'Visualizer', group: 'Sorting' },
  { path: '/compare', name: 'compare', label: 'Compare', group: 'Sorting' },
  { path: '/path', name: 'pathfinding', label: 'Visualizer', group: 'Pathfinding' },
  { path: '/path-compare', name: 'path-compare', label: 'Compare', group: 'Pathfinding' },
  { path: '/dp', name: 'dp', label: 'Tables', group: 'Dynamic Programming' },
  { path: '/tree', name: 'tree', label: 'Binary Trees', group: 'Trees & Graphs' },
  { path: '/graph', name: 'graph', label: 'Graphs', group: 'Trees & Graphs' },
  { path: '/strings', name: 'strings', label: 'Pattern Matching', group: 'Strings' },
  { path: '/hash', name: 'hash', label: 'Hash Tables', group: 'Data Structures' },
  { path: '/geometry', name: 'geometry', label: 'Hulls & Pairs', group: 'Geometry' },
  { path: '/backtracking', name: 'backtracking', label: 'N-Queens · Sudoku', group: 'Backtracking' },
  { path: '/numbers', name: 'numbers', label: 'Sieve', group: 'Numbers' },
  { path: '/sandbox', name: 'sandbox', label: 'Sandbox', group: 'Custom' },
]

const views: Record<string, () => Promise<unknown>> = {
  sort: () => import('../views/SortingView.vue'),
  compare: () => import('../views/ComparisonView.vue'),
  pathfinding: () => import('../views/PathfindingView.vue'),
  'path-compare': () => import('../views/PathfindingCompareView.vue'),
  dp: () => import('../views/DPView.vue'),
  tree: () => import('../views/TreeView.vue'),
  graph: () => import('../views/GraphView.vue'),
  strings: () => import('../views/StringsView.vue'),
  hash: () => import('../views/HashingView.vue'),
  geometry: () => import('../views/GeometryView.vue'),
  backtracking: () => import('../views/BacktrackingView.vue'),
  numbers: () => import('../views/NumbersView.vue'),
  sandbox: () => import('../views/SandboxView.vue'),
}

const router = createRouter({
  // Hash history needs no server-side fallback, so `dist/` is host-agnostic.
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/sort' },
    ...NAV.map(n => ({ path: n.path, name: n.name, component: views[n.name] })),
  ],
})

export default router
