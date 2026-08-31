import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { makeNode, snapshot } from './types';

export const segmentTree: TreeAlgorithm = {
  id: 'segment-tree',
  name: 'Segment Tree (range sum)',
  summary: 'Balanced binary tree where each node stores the sum of an array range; built bottom-up, then a range query visits O(log n) covering nodes and a point update recomputes one root-to-leaf path.',
  complexity: { time: { worst: 'O(log n) query / update, O(n) build' }, space: 'O(n)', tags: ['Range queries', 'Divide & conquer'] },
  inputs: [
    { key: 'values', label: 'Array', kind: 'ints', default: '5, 8, 6, 3, 2, 7, 4, 6', maxLength: 16 },
    { key: 'ql', label: 'Query l', kind: 'int', default: '2', min: 0 },
    { key: 'qr', label: 'Query r', kind: 'int', default: '5', min: 0 },
    { key: 'ui', label: 'Update i', kind: 'int', default: '3', min: 0 },
    { key: 'uv', label: 'New value', kind: 'int', default: '9' },
  ],
  pseudocode: [
    'procedure Build(l, r)                       ▷ post-order',        // 1
    '  if l = r then return Leaf(A[l])',                               // 2
    '  m ← ⌊(l+r)/2⌋; node ← Build(l,m) + Build(m+1,r)',               // 3
    'procedure Query(node[l..r], ql, qr)',                             // 4
    '  if [l..r] ⊆ [ql..qr] then return node.sum   ▷ full cover',      // 5
    '  if [l..r] ∩ [ql..qr] = ∅ then return 0      ▷ disjoint',        // 6
    '  return Query(left, ql, qr) + Query(right, ql, qr)',             // 7
    'procedure Update(i, v)',                                          // 8
    '  descend to leaf i; set it to v',                                // 9
    '  recompute sums on the path back to the root',                   // 10
  ],
  setup(d) {
    const a = d.values as number[];
    const n = a.length;
    if (!n) return { error: 'Enter at least one value' };
    const ql = Math.min(d.ql as number, n - 1), qr = Math.min(d.qr as number, n - 1), ui = Math.min(d.ui as number, n - 1), uv = d.uv as number;
    if (ql > qr) return { error: 'Query l must be ≤ query r' };
    return {
      *run(): Generator<TreeAction, void, unknown> {
        const display: TreeNode[] = [];
        const forest = () => display.map(x => snapshot(x)!);
        function* build(l: number, r: number): Generator<TreeAction, TreeNode, unknown> {
          if (l === r) {
            const leaf = makeNode(a[l], { label: `[${l}]`, state: 'inserted' });
            display.push(leaf);
            yield { root: null, forest: forest(), line: 2, variables: { l, r, leaf: a[l] } };
            leaf.state = 'default';
            return leaf;
          }
          const m = (l + r) >> 1;
          const L = yield* build(l, m);
          const R = yield* build(m + 1, r);
          display.splice(display.indexOf(L), 1);
          display.splice(display.indexOf(R), 1);
          const node = makeNode(L.key + R.key, { left: L, right: R, label: `[${l}..${r}]`, state: 'visiting' });
          display.push(node);
          yield { root: null, forest: forest(), line: 3, variables: { l, r, sum: node.key } };
          node.state = 'default';
          return node;
        }
        const root = yield* build(0, n - 1);
        yield { root: snapshot(root), line: 3, variables: { built: n } };

        // Range-sum query. Covering nodes stay highlighted until the answer.
        const covered: TreeNode[] = [];
        function* query(node: TreeNode, l: number, r: number): Generator<TreeAction, number, unknown> {
          if (ql <= l && r <= qr) {
            node.state = 'output';
            covered.push(node);
            yield { root: snapshot(root), line: 5, variables: { query: `[${ql}..${qr}]`, node: `[${l}..${r}]`, cover: 'full', adds: node.key } };
            return node.key;
          }
          if (r < ql || qr < l) {
            yield { root: snapshot(root), line: 6, variables: { query: `[${ql}..${qr}]`, node: `[${l}..${r}]`, cover: 'disjoint' } };
            return 0;
          }
          node.state = 'visiting';
          yield { root: snapshot(root), line: 7, variables: { query: `[${ql}..${qr}]`, node: `[${l}..${r}]`, cover: 'partial' } };
          node.state = 'default';
          const m = (l + r) >> 1;
          const s = (yield* query(node.left!, l, m)) + (yield* query(node.right!, m + 1, r));
          return s;
        }
        const sum = yield* query(root, 0, n - 1);
        yield { root: snapshot(root), line: 7, variables: { query: `[${ql}..${qr}]`, sum } };
        covered.forEach(c => { c.state = 'default'; });

        // Point update along one path.
        function* update(node: TreeNode, l: number, r: number): Generator<TreeAction, void, unknown> {
          if (l === r) {
            node.key = uv;
            node.state = 'inserted';
            yield { root: snapshot(root), line: 9, variables: { i: ui, 'new value': uv } };
            node.state = 'default';
            return;
          }
          node.state = 'visiting';
          yield { root: snapshot(root), line: 9, variables: { i: ui, node: `[${l}..${r}]` } };
          node.state = 'default';
          const m = (l + r) >> 1;
          if (ui <= m) yield* update(node.left!, l, m);
          else yield* update(node.right!, m + 1, r);
          node.key = node.left!.key + node.right!.key;
          node.state = 'rotating';
          yield { root: snapshot(root), line: 10, variables: { node: `[${l}..${r}]`, 'recomputed sum': node.key } };
          node.state = 'default';
        }
        yield* update(root, 0, n - 1);
        yield { root: snapshot(root), line: 10, variables: { 'query sum': sum, updated: `A[${ui}] = ${uv}`, 'root sum': root.key } };
      },
    };
  },
};
