import type { TreeAction, TreeAlgorithm, TreeNode } from '../tree/types';
import { makeNode, snapshot } from '../tree/types';

export const subsets: TreeAlgorithm = {
  id: 'subsets',
  name: 'Subsets (include / exclude)',
  summary: 'Every element is either in or out: each level of the call tree decides one element, so n decisions branch into exactly 2ⁿ leaves — one per subset.',
  complexity: { time: { worst: 'O(2ⁿ)' }, space: 'O(n) stack', tags: ['Binary choice tree', 'Power set'] },
  inputs: [{ key: 'values', label: 'Set', kind: 'ints', default: '1, 2, 3', min: 0, max: 9, maxLength: 5 }],
  pseudocode: [
    'procedure Subsets(i, chosen)',                        // 1
    '  if i = n then output chosen        ▷ leaf',         // 2
    '  Subsets(i + 1, chosen ∪ {a[i]})    ▷ include a[i]', // 3
    '  Subsets(i + 1, chosen)             ▷ exclude a[i]', // 4
  ],
  setup(d) {
    const a = d.values as number[];
    if (!a.length) return { error: 'Enter at least one element' };
    if (new Set(a).size !== a.length) return { error: 'Elements must be distinct' };
    return {
      *run(): Generator<TreeAction, void, unknown> {
        let root: TreeNode | null = null;
        const found: string[] = [];
        function* go(i: number, chosen: number[], parent: TreeNode | null, decided: string): Generator<TreeAction, void, unknown> {
          const node = makeNode(0, { text: `{${chosen.join('')}}`, label: decided, children: [], state: 'visiting' });
          if (parent) parent.children!.push(node); else root = node;
          if (i === a.length) {
            found.push(`{${chosen.join(',')}}`);
            node.state = 'output';
            yield { root: snapshot(root), line: 2, variables: { leaf: `{${chosen.join(',')}}`, subsets: found.join(' ') } };
            return;
          }
          yield { root: snapshot(root), line: 1, variables: { deciding: a[i], chosen: `{${chosen.join(',')}}` } };
          node.state = 'default';
          yield { root: snapshot(root), line: 3, variables: { include: a[i] } };
          yield* go(i + 1, [...chosen, a[i]], node, `+${a[i]}`);
          yield { root: snapshot(root), line: 4, variables: { exclude: a[i] } };
          yield* go(i + 1, chosen, node, `−${a[i]}`);
        }
        yield* go(0, [], null, '');
        yield { root: snapshot(root), line: 2, variables: { 'subsets found': found.length, 'expected 2ⁿ': 2 ** a.length, all: found.join(' ') } };
      },
    };
  },
};
