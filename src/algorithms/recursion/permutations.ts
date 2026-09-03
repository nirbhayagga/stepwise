import type { TreeAction, TreeAlgorithm, TreeNode } from '../tree/types';
import { makeNode, snapshot } from '../tree/types';

export const permutations: TreeAlgorithm = {
  id: 'permutations',
  name: 'Permutations',
  summary: 'Pick any unused element at each level: the branching factor shrinks n, n−1, …, 1, so the tree bottoms out in exactly n! leaves — one per ordering.',
  complexity: { time: { worst: 'O(n · n!)' }, space: 'O(n) stack', recurrence: 'T(n) = n · T(n−1) + Θ(1) ⇒ Θ(n · n!)', tags: ['Factorial growth', 'Backtracking'] },
  inputs: [{ key: 'values', label: 'Elements', kind: 'ints', default: '1, 2, 3', min: 0, max: 9, maxLength: 4 }],
  pseudocode: [
    'procedure Permute(prefix, remaining)',              // 1
    '  if remaining = ∅ then output prefix    ▷ leaf',   // 2
    '  for each x in remaining',                         // 3
    '    Permute(prefix + x, remaining − {x})',          // 4
  ],
  setup(d) {
    const a = d.values as number[];
    if (!a.length) return { error: 'Enter at least one element' };
    if (new Set(a).size !== a.length) return { error: 'Elements must be distinct' };
    return {
      *run(): Generator<TreeAction, void, unknown> {
        let root: TreeNode | null = null;
        const found: string[] = [];
        function* go(prefix: number[], remaining: number[], parent: TreeNode | null): Generator<TreeAction, void, unknown> {
          const node = makeNode(0, { text: prefix.length ? prefix.join('') : 'ε', children: [], state: 'visiting' });
          if (parent) parent.children!.push(node); else root = node;
          if (!remaining.length) {
            found.push(prefix.join(''));
            node.state = 'output';
            yield { root: snapshot(root), line: 2, variables: { leaf: prefix.join(''), permutations: found.join(' ') } };
            return;
          }
          yield { root: snapshot(root), line: 3, variables: { prefix: prefix.join('') || 'ε', remaining: remaining.join(',') } };
          node.state = 'default';
          for (const x of remaining) {
            yield { root: snapshot(root), line: 4, variables: { choose: x, prefix: prefix.join('') || 'ε' } };
            yield* go([...prefix, x], remaining.filter(v => v !== x), node);
          }
        }
        yield* go([], a, null);
        const factorial = a.reduce((f, _, i) => f * (i + 1), 1);
        yield { root: snapshot(root), line: 2, variables: { 'permutations found': found.length, 'expected n!': factorial } };
      },
    };
  },
};
