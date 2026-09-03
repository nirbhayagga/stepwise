import { createRouter, createWebHashHistory } from 'vue-router'

export interface NavEntry { path: string; name: string; label: string; group: string; title: string }

/** Single source of truth for routes and the sidebar. */
export const NAV: NavEntry[] = [
  { path: '/sort', name: 'sort', label: 'Visualizer', title: 'Sorting', group: 'Sorting' },
  { path: '/compare', name: 'compare', label: 'Compare', title: 'Sorting Compare', group: 'Sorting' },
  { path: '/path', name: 'pathfinding', label: 'Visualizer', title: 'Pathfinding', group: 'Pathfinding' },
  { path: '/path-compare', name: 'path-compare', label: 'Compare', title: 'Pathfinding Compare', group: 'Pathfinding' },
  { path: '/dp', name: 'dp', label: 'Tables', title: 'Dynamic Programming', group: 'Dynamic Programming' },
  { path: '/tree', name: 'tree', label: 'Binary Trees', title: 'Binary Trees', group: 'Trees & Graphs' },
  { path: '/graph', name: 'graph', label: 'Graphs', title: 'Graphs', group: 'Trees & Graphs' },
  { path: '/strings', name: 'strings', label: 'Pattern Matching', title: 'Pattern Matching', group: 'Strings' },
  { path: '/hash', name: 'hash', label: 'Hash Tables', title: 'Hash Tables', group: 'Data Structures' },
  { path: '/geometry', name: 'geometry', label: 'Hulls & Pairs', title: 'Geometry', group: 'Geometry' },
  { path: '/backtracking', name: 'backtracking', label: 'N-Queens · Sudoku', title: 'Backtracking', group: 'Backtracking' },
  { path: '/recursion', name: 'recursion', label: 'Call Trees', title: 'Recursion', group: 'Recursion' },
  { path: '/numbers', name: 'numbers', label: 'Sieve', title: 'Number Theory', group: 'Numbers' },
  { path: '/scheduling', name: 'scheduling', label: 'CPU Scheduling', title: 'CPU Scheduling', group: 'Systems' },
  { path: '/growth', name: 'growth', label: 'Growth Curves', title: 'Growth Analysis', group: 'Analysis' },
  { path: '/sandbox', name: 'sandbox', label: 'Sandbox', title: 'Sandbox', group: 'Custom' },
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
  recursion: () => import('../views/RecursionView.vue'),
  numbers: () => import('../views/NumbersView.vue'),
  scheduling: () => import('../views/SchedulingView.vue'),
  growth: () => import('../views/GrowthView.vue'),
  sandbox: () => import('../views/SandboxView.vue'),
}

const router = createRouter({
  // Hash history needs no server-side fallback, so `dist/` is host-agnostic.
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/sort' },
    ...NAV.map(n => ({ path: n.path, name: n.name, component: views[n.name] })),
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
})

router.afterEach(to => {
  const nav = NAV.find(n => n.name === to.name)
  document.title = nav ? `${nav.title} · Stepwise`
    : to.name === 'not-found' ? 'Not found · Stepwise'
    : 'Stepwise — Algorithm Visualizer'
})

export default router
