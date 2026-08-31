import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { makeNode, snapshot } from './types';

export const huffman: TreeAlgorithm = {
  id: 'huffman',
  name: 'Huffman Coding',
  summary: 'Optimal prefix-free code: repeatedly merge the two least frequent subtrees; each character\'s code is its root-to-leaf path (left = 0, right = 1), so frequent characters get short codes.',
  complexity: { time: { worst: 'O(k log k)' }, space: 'O(k)', tags: ['Greedy', 'Compression', 'Prefix-free', 'Optimal'] },
  inputs: [
    { key: 'text', label: 'Text', kind: 'text', default: 'abracadabra alakazam', maxLength: 60 },
  ],
  pseudocode: [
    'procedure Huffman(text)',                                        // 1
    '  count character frequencies',                                  // 2
    '  Q ← min-priority queue of leaf nodes keyed by frequency',      // 3
    '  while |Q| > 1',                                                // 4
    '    x ← Q.pop-min(); y ← Q.pop-min()',                           // 5
    '    Q.push(Node(freq: x.freq + y.freq, left: x, right: y))',     // 6
    '  root ← Q.pop()',                                               // 7
    '  code(leaf) ← path from root (left = 0, right = 1)',            // 8
  ],
  setup(d) {
    const text = d.text as string;
    if (text.length < 2) return { error: 'Enter at least two characters' };
    return {
      *run(): Generator<TreeAction, void, unknown> {
        const freq = new Map<string, number>();
        for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
        const show = (ch: string) => (ch === ' ' ? '␣' : ch);
        const queue: TreeNode[] = [...freq.entries()]
          .sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1))
          .map(([ch, f]) => makeNode(f, { text: show(ch), label: `f=${f}`, state: 'default', children: undefined }));
        const forest = () => queue.map(x => snapshot(x)!);
        yield { root: null, forest: forest(), line: 3, variables: { characters: freq.size, 'text length': text.length } };

        while (queue.length > 1) {
          queue.sort((a, b) => a.key - b.key || a.id - b.id);
          const x = queue.shift()!;
          const y = queue.shift()!;
          x.state = 'visiting'; y.state = 'visiting';
          queue.unshift(y); queue.unshift(x);
          yield { root: null, forest: forest(), line: 5, variables: { x: x.key, y: y.key } };
          queue.shift(); queue.shift();
          x.state = 'default'; y.state = 'default';
          const parent = makeNode(x.key + y.key, { left: x, right: y, state: 'inserted' });
          queue.push(parent);
          yield { root: null, forest: forest(), line: 6, variables: { merged: `${x.key} + ${y.key} → ${parent.key}` } };
          parent.state = 'default';
        }
        const root = queue[0];
        yield { root: snapshot(root), line: 7, variables: { 'root frequency': root.key } };

        // Assign codes by walking to each leaf.
        const codes: Record<string, string> = {};
        let totalBits = 0;
        function* walk(node: TreeNode, code: string): Generator<TreeAction, void, unknown> {
          if (!node.left && !node.right) {
            const finalCode = code || '0';
            codes[node.text!] = finalCode;
            totalBits += finalCode.length * node.key;
            node.label = finalCode;
            node.state = 'output';
            yield { root: snapshot(root), line: 8, variables: { ...codes, 'bits so far': totalBits } };
            node.state = 'default';
            return;
          }
          node.state = 'visiting';
          yield { root: snapshot(root), line: 8, variables: { prefix: code || 'ε' } };
          node.state = 'default';
          if (node.left) yield* walk(node.left, code + '0');
          if (node.right) yield* walk(node.right, code + '1');
        }
        yield* walk(root, '');
        const fixed = text.length * Math.ceil(Math.log2(Math.max(2, freq.size)));
        yield { root: snapshot(root), line: 8, variables: { 'huffman bits': totalBits, 'fixed-length bits': fixed, saving: `${Math.round((1 - totalBits / fixed) * 100)}%` } };
      },
    };
  },
};
