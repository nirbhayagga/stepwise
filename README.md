# Stepwise

**Live:** https://stepwise.nirbhay.dev

An interactive algorithm visualizer for teaching and self-study. Every run is recorded as a sequence of immutable frames, so any algorithm can be played, paused, stepped forwards or backwards, and scrubbed with a timeline — with the pseudocode line, live variables, and step counters shown for each frame.

Built with Vue 3, TypeScript and Vite. Runs entirely in the browser; no backend.

## Modules

| Module | Algorithms |
| --- | --- |
| **Sorting** | Bubble, Cocktail shaker, Selection, Insertion, Shell, Merge, Quick (Lomuto), Heap, Counting, Radix (LSD) |
| **Sorting · Compare** | Any two sorts on identical input, advanced in lockstep |
| **Pathfinding** | Dijkstra, A*, Jump Point Search, Greedy best-first, BFS, Bidirectional BFS, DFS — 4- or 8-connected grid, walls and weighted cells, five maze generators (recursive backtracker, randomised Prim, randomised Kruskal, recursive division, random walls/weights) |
| **Pathfinding · Compare** | Two searches on the same terrain, side by side |
| **Dynamic programming** | 0/1 Knapsack, LCS, Edit distance, Coin change, LIS, Matrix-chain multiplication — editable inputs, labelled tables, dependency highlighting |
| **Binary trees** | BST insertion and deletion, AVL, Red–black, Binary heap (insert / extract-max), In-, pre-, post- and level-order traversals |
| **Graphs** | BFS, DFS with discovery/finish times, Dijkstra, Prim, Kruskal (union–find), Kahn's topological sort on generated planar-looking graphs |
| **Sandbox** | Write your own algorithm in JavaScript against a small drawing API; runs in a Web Worker so it can be stopped at any time |

Each algorithm page shows its time/space complexity and properties (stable, in-place, optimal, …), the pseudocode with the active line highlighted, the variables at the current step, a legend, and step counters (comparisons, swaps, writes, nodes visited, path cost, …). Wall-clock time is deliberately not reported: it would measure the recorder, not the algorithm.

Keyboard: `Space` play/pause, `←`/`→` step, `Home`/`End` jump, `R` reset.

## Development

```bash
npm install
npm run dev        # dev server with hot reload
npm run build      # type-check (vue-tsc) + production build into dist/
npm run preview    # serve dist/ locally
```

`dist/` is fully static and uses hash routing with a relative base, so it can be hosted from any static host or sub-path without rewrite rules. Production is Cloudflare Pages (build command `npm run build`, output `dist`, `NODE_VERSION=22`); `public/_headers` sets cache and security headers there. A container image (`Dockerfile`, `compose.yaml`) is published to GHCR by CI for self-hosting.

## Adding an algorithm

Each algorithm is one file under `src/algorithms/<domain>/` exporting an object with its metadata (name, one-line summary, complexity, pseudocode) and a generator that yields one action per visual step. Add it to the domain's `index.ts` list and it appears in the UI with its complexity card, pseudocode and legend — no view changes required.

```ts
export const bubbleSort: SortingAlgorithm = {
  id: 'bubble',
  name: 'Bubble Sort',
  summary: '…',
  complexity: { time: { best: 'Ω(n)', average: 'Θ(n²)', worst: 'O(n²)' }, space: 'O(1)', tags: ['Stable', 'In-place'] },
  pseudocode: [
    'procedure BubbleSort(A[0..n−1])',  // 1
    '  for i ← 0 to n−2',                // 2
    // …
  ],
  *run(a) {
    // mutate `a` in place; yield { type, indices, line, variables } per step
  },
};
```

`line` values are 1-based indices into `pseudocode`; a development-mode check warns when a yielded line is out of range.
