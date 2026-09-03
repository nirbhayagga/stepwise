import type { TreeAction, TreeAlgorithm, TreeNode } from '../tree/types';
import { makeNode, snapshot } from '../tree/types';

const N_INPUT = { key: 'n', label: 'n', kind: 'int' as const, default: '8', min: 1, max: 12 };

export const fibNaive: TreeAlgorithm = {
  id: 'fib-naive',
  name: 'Fibonacci · Naive Recursion',
  summary: 'fib(n) = fib(n−1) + fib(n−2) computed literally: the call tree has ~1.6ⁿ nodes because identical subproblems are recomputed over and over. Run the memoized version on the same n and compare call counts.',
  complexity: { time: { worst: 'O(φⁿ)' }, space: 'O(n) stack', recurrence: 'T(n) = T(n−1) + T(n−2) + Θ(1) ⇒ Θ(φⁿ), φ ≈ 1.618', tags: ['Exponential blow-up', 'Overlapping subproblems'] },
  inputs: [N_INPUT],
  pseudocode: [
    'procedure Fib(n)',                       // 1
    '  if n ≤ 1 then return n',               // 2
    '  a ← Fib(n − 1)',                       // 3
    '  b ← Fib(n − 2)',                       // 4
    '  return a + b',                         // 5
  ],
  setup(d) {
    const n = d.n as number;
    return {
      *run(): Generator<TreeAction, void, unknown> {
        let root: TreeNode | null = null;
        let calls = 0;
        function* call(k: number, parent: TreeNode | null, depth: number): Generator<TreeAction, number, unknown> {
          calls++;
          const node = makeNode(k, { text: `f(${k})`, children: [], state: 'visiting' });
          if (parent) parent.children!.push(node); else root = node;
          yield { root: snapshot(root), line: k <= 1 ? 2 : 3, variables: { call: `fib(${k})`, depth, calls } };
          if (k <= 1) {
            node.label = String(k);
            node.state = 'inserted';
            yield { root: snapshot(root), line: 2, variables: { 'base case': `fib(${k}) = ${k}`, calls } };
            node.state = 'default';
            return k;
          }
          node.state = 'default';
          const a = yield* call(k - 1, node, depth + 1);
          yield { root: snapshot(root), line: 4, variables: { at: `fib(${k})`, a, calls } };
          const b = yield* call(k - 2, node, depth + 1);
          node.label = String(a + b);
          node.state = 'inserted';
          yield { root: snapshot(root), line: 5, variables: { 'return': `fib(${k}) = ${a + b}`, calls } };
          node.state = 'default';
          return a + b;
        }
        const v = yield* call(n, null, 0);
        yield { root: snapshot(root), line: 5, variables: { result: v, 'total calls': calls } };
      },
    };
  },
};

export const fibMemo: TreeAlgorithm = {
  id: 'fib-memo',
  name: 'Fibonacci · Memoized',
  summary: 'The same recursion with a cache: each fib(k) is computed once, and repeat calls return instantly as highlighted memo hits — whole subtrees of the naive version simply never exist. This collapse is dynamic programming.',
  complexity: { time: { worst: 'O(n)' }, space: 'O(n)', tags: ['Memoization', 'Top-down DP', 'Linear calls'] },
  inputs: [N_INPUT],
  pseudocode: [
    'procedure Fib(n)',                                  // 1
    '  if memo[n] exists then return memo[n]   ▷ hit',   // 2
    '  if n ≤ 1 then return n',                          // 3
    '  memo[n] ← Fib(n − 1) + Fib(n − 2)',               // 4
    '  return memo[n]',                                  // 5
  ],
  setup(d) {
    const n = d.n as number;
    return {
      *run(): Generator<TreeAction, void, unknown> {
        let root: TreeNode | null = null;
        let calls = 0, hits = 0;
        const memo = new Map<number, number>();
        function* call(k: number, parent: TreeNode | null, depth: number): Generator<TreeAction, number, unknown> {
          calls++;
          const node = makeNode(k, { text: `f(${k})`, children: [], state: 'visiting' });
          if (parent) parent.children!.push(node); else root = node;
          yield { root: snapshot(root), line: 2, variables: { call: `fib(${k})`, depth, calls, 'memo hits': hits } };
          if (memo.has(k)) {
            hits++;
            const v = memo.get(k)!;
            node.label = `${v} ✓`;
            node.state = 'output';
            yield { root: snapshot(root), line: 2, variables: { 'memo hit': `fib(${k}) = ${v}`, calls, 'memo hits': hits } };
            return v;
          }
          if (k <= 1) {
            node.label = String(k);
            node.state = 'inserted';
            yield { root: snapshot(root), line: 3, variables: { 'base case': `fib(${k}) = ${k}`, calls } };
            node.state = 'default';
            memo.set(k, k);
            return k;
          }
          node.state = 'default';
          const a = yield* call(k - 1, node, depth + 1);
          const b = yield* call(k - 2, node, depth + 1);
          memo.set(k, a + b);
          node.label = String(a + b);
          node.state = 'inserted';
          yield { root: snapshot(root), line: 4, variables: { 'stored': `memo[${k}] = ${a + b}`, calls, 'memo hits': hits } };
          node.state = 'default';
          return a + b;
        }
        const v = yield* call(n, null, 0);
        yield { root: snapshot(root), line: 5, variables: { result: v, 'total calls': calls, 'memo hits': hits, 'naive would need': 2 * fibRef(n + 1) - 1 } };
        function fibRef(k: number): number { let a = 0, b = 1; for (let i = 0; i < k; i++) [a, b] = [b, a + b]; return a; }
      },
    };
  },
};
