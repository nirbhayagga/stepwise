import type { TreeAction, TreeAlgorithm, TreeNode } from '../tree/types';
import { makeNode, snapshot } from '../tree/types';

const MAX_CALLS = 700;

function countCalls(m: number, n: number, budget: { left: number }): number {
  if (budget.left-- <= 0) return -1;
  if (m === 0) return n + 1;
  if (n === 0) return countCalls(m - 1, 1, budget);
  const inner = countCalls(m, n - 1, budget);
  if (inner < 0) return -1;
  return countCalls(m - 1, inner, budget);
}

export const ackermann: TreeAlgorithm = {
  id: 'ackermann',
  name: 'Ackermann Function',
  summary: 'The classic example of recursion that outgrows every primitive-recursive bound: the second argument of the outer call is itself a full recursive computation. Inputs are capped hard — A(4, 2) already has 19,729 digits.',
  complexity: { time: { worst: 'not primitive recursive' }, space: 'O(depth)', tags: ['Nested recursion', 'Pathological growth'] },
  inputs: [
    { key: 'm', label: 'm', kind: 'int', default: '2', min: 0, max: 3 },
    { key: 'n', label: 'n', kind: 'int', default: '2', min: 0, max: 3 },
  ],
  pseudocode: [
    'procedure A(m, n)',                                     // 1
    '  if m = 0 then return n + 1',                          // 2
    '  if n = 0 then return A(m − 1, 1)',                    // 3
    '  return A(m − 1, A(m, n − 1))   ▷ nested recursion',   // 4
  ],
  setup(d) {
    const m = d.m as number, n = d.n as number;
    const budget = { left: MAX_CALLS + 1 };
    if (countCalls(m, n, budget) < 0) {
      return { error: `A(${m}, ${n}) makes more than ${MAX_CALLS} calls — too many nodes to draw. Try smaller m or n.` };
    }
    return {
      *run(): Generator<TreeAction, void, unknown> {
        let root: TreeNode | null = null;
        let calls = 0, maxDepth = 0;
        function* call(mm: number, nn: number, parent: TreeNode | null, depth: number): Generator<TreeAction, number, unknown> {
          calls++;
          maxDepth = Math.max(maxDepth, depth);
          const node = makeNode(0, { text: `A(${mm},${nn})`, children: [], state: 'visiting' });
          if (parent) parent.children!.push(node); else root = node;
          yield { root: snapshot(root), line: mm === 0 ? 2 : nn === 0 ? 3 : 4, variables: { call: `A(${mm}, ${nn})`, depth, calls } };
          node.state = 'default';
          let v: number;
          if (mm === 0) {
            v = nn + 1;
          } else if (nn === 0) {
            v = yield* call(mm - 1, 1, node, depth + 1);
          } else {
            const inner = yield* call(mm, nn - 1, node, depth + 1);
            yield { root: snapshot(root), line: 4, variables: { at: `A(${mm}, ${nn})`, 'inner result becomes n': inner, calls } };
            v = yield* call(mm - 1, inner, node, depth + 1);
          }
          node.label = String(v);
          node.state = 'inserted';
          yield { root: snapshot(root), line: mm === 0 ? 2 : 4, variables: { 'return': `A(${mm}, ${nn}) = ${v}`, calls } };
          node.state = 'default';
          return v;
        }
        const v = yield* call(m, n, null, 0);
        yield { root: snapshot(root), line: 4, variables: { result: v, 'total calls': calls, 'max depth': maxDepth } };
      },
    };
  },
};
