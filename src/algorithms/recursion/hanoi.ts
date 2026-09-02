import type { TreeAction, TreeAlgorithm, TreeNode } from '../tree/types';
import { makeNode, snapshot } from '../tree/types';

export const hanoi: TreeAlgorithm = {
  id: 'hanoi',
  name: 'Tower of Hanoi',
  summary: 'Move n−1 discs out of the way, move the big disc, move them back on top: three lines of recursion that provably need 2ⁿ − 1 moves. The variables panel tracks the pegs after every move.',
  complexity: { time: { worst: 'O(2ⁿ)' }, space: 'O(n) stack', tags: ['Divide & conquer', '2ⁿ − 1 moves optimal'] },
  inputs: [{ key: 'n', label: 'Discs', kind: 'int', default: '4', min: 1, max: 6 }],
  pseudocode: [
    'procedure Hanoi(k, from, to, via)',            // 1
    '  if k = 0 then return',                       // 2
    '  Hanoi(k − 1, from, via, to)',                // 3
    '  move disc k: from → to',                     // 4
    '  Hanoi(k − 1, via, to, from)',                // 5
  ],
  setup(d) {
    const n = d.n as number;
    return {
      *run(): Generator<TreeAction, void, unknown> {
        let root: TreeNode | null = null;
        const pegs: Record<string, number[]> = { A: Array.from({ length: n }, (_, i) => n - i), B: [], C: [] };
        const moves: string[] = [];
        const pegVars = () => ({ A: pegs.A.join(' ') || '—', B: pegs.B.join(' ') || '—', C: pegs.C.join(' ') || '—', moves: moves.length });
        function* go(k: number, from: string, to: string, via: string, parent: TreeNode | null): Generator<TreeAction, void, unknown> {
          const node = makeNode(k, { text: `${k}:${from}→${to}`, children: [], state: 'visiting' });
          if (parent) parent.children!.push(node); else root = node;
          yield { root: snapshot(root), line: 1, variables: { call: `hanoi(${k}, ${from}→${to})`, ...pegVars() } };
          node.state = 'default';
          if (k > 1) yield* go(k - 1, from, via, to, node);
          pegs[to].push(pegs[from].pop()!);
          moves.push(`${from}→${to}`);
          node.label = `#${moves.length}`;
          node.state = 'inserted';
          yield { root: snapshot(root), line: 4, variables: { move: `disc ${k}: ${from} → ${to}`, ...pegVars() } };
          node.state = 'default';
          if (k > 1) yield* go(k - 1, via, to, from, node);
        }
        yield* go(n, 'A', 'C', 'B', null);
        yield { root: snapshot(root), line: 5, variables: { 'total moves': moves.length, 'optimal 2ⁿ−1': 2 ** n - 1, sequence: moves.join(' ') } };
      },
    };
  },
};
