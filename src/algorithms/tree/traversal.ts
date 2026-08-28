import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { KEYS_INPUT, snapshot, uniqueKeys } from './types';
import { buildBST } from './bst';

type Order = 'inorder' | 'preorder' | 'postorder';

const RECURSIVE_CODE: Record<Order, string[]> = {
  inorder: [
    'procedure InOrder(node)',            // 1
    '  if node = null then return',       // 2
    '  InOrder(node.left)',               // 3
    '  visit(node)',                      // 4
    '  InOrder(node.right)',              // 5
  ],
  preorder: [
    'procedure PreOrder(node)',           // 1
    '  if node = null then return',       // 2
    '  visit(node)',                      // 3
    '  PreOrder(node.left)',              // 4
    '  PreOrder(node.right)',             // 5
  ],
  postorder: [
    'procedure PostOrder(node)',          // 1
    '  if node = null then return',       // 2
    '  PostOrder(node.left)',             // 3
    '  PostOrder(node.right)',            // 4
    '  visit(node)',                      // 5
  ],
};

function recursive(order: Order, name: string, summary: string): TreeAlgorithm {
  const VISIT_LINE = order === 'inorder' ? 4 : order === 'preorder' ? 3 : 5;
  const LEFT_LINE = order === 'inorder' ? 3 : order === 'preorder' ? 4 : 3;
  const RIGHT_LINE = order === 'inorder' ? 5 : order === 'preorder' ? 5 : 4;
  return {
    id: order,
    name,
    summary,
    complexity: { time: { worst: 'O(n)' }, space: 'O(h) stack', tags: ['Depth-first', 'Recursive'] },
    inputs: [KEYS_INPUT],
    pseudocode: RECURSIVE_CODE[order],
    setup(d) {
      const keys = uniqueKeys(d.keys as number[]);
      if (!keys.length) return { error: 'Enter at least one key' };
      return {
        *run() {
          const root = buildBST(keys);
          const output: number[] = [];
          yield { root: snapshot(root), output: [], line: 1, variables: { built: keys.length } };
          function* walk(node: TreeNode | null, depth: number): Generator<TreeAction, void, unknown> {
            if (!node) return;
            const visit = function* () {
              node.state = 'visiting';
              yield { root: snapshot(root), output: output.slice(), line: VISIT_LINE, variables: { node: node.key, depth } };
              output.push(node.key);
              node.state = 'output';
              yield { root: snapshot(root), output: output.slice(), line: VISIT_LINE, variables: { node: node.key, depth, output: output.slice() } };
            };
            if (order === 'preorder') yield* visit();
            yield { root: snapshot(root), output: output.slice(), line: LEFT_LINE, variables: { node: node.key, depth, go: 'left' } };
            yield* walk(node.left, depth + 1);
            if (order === 'inorder') yield* visit();
            yield { root: snapshot(root), output: output.slice(), line: RIGHT_LINE, variables: { node: node.key, depth, go: 'right' } };
            yield* walk(node.right, depth + 1);
            if (order === 'postorder') yield* visit();
          }
          yield* walk(root, 0);
          yield { root: snapshot(root), output: output.slice(), line: 1, variables: { output: output.slice() } };
        },
      };
    },
  };
}

export const inorder = recursive('inorder', 'In-order Traversal', 'Left subtree, node, right subtree — yields the keys of a BST in sorted order.');
export const preorder = recursive('preorder', 'Pre-order Traversal', 'Node before its subtrees — the order used to serialise or copy a tree.');
export const postorder = recursive('postorder', 'Post-order Traversal', 'Subtrees before the node — the order used to delete a tree or evaluate an expression tree.');

export const levelOrder: TreeAlgorithm = {
  id: 'levelorder',
  name: 'Level-order Traversal (BFS)',
  summary: 'Visits nodes depth by depth using a FIFO queue; the queue holds at most one level at a time.',
  complexity: { time: { worst: 'O(n)' }, space: 'O(w) queue', tags: ['Breadth-first', 'Iterative'] },
  inputs: [KEYS_INPUT],
  pseudocode: [
    'procedure LevelOrder(root)',                               // 1
    '  Q ← queue; Q.enqueue(root)',                             // 2
    '  while Q not empty',                                      // 3
    '    node ← Q.dequeue()',                                   // 4
    '    visit(node)',                                          // 5
    '    if node.left ≠ null then Q.enqueue(node.left)',        // 6
    '    if node.right ≠ null then Q.enqueue(node.right)',      // 7
  ],
  setup(d) {
    const keys = uniqueKeys(d.keys as number[]);
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const root = buildBST(keys);
        const output: number[] = [];
        const q: TreeNode[] = root ? [root] : [];
        yield { root: snapshot(root), output: [], line: 2, variables: { queue: q.map(n => n.key) } };
        while (q.length) {
          const node = q.shift()!;
          node.state = 'visiting';
          yield { root: snapshot(root), output: output.slice(), line: 4, variables: { node: node.key, queue: q.map(n => n.key) } };
          output.push(node.key);
          node.state = 'output';
          if (node.left) q.push(node.left);
          if (node.right) q.push(node.right);
          yield { root: snapshot(root), output: output.slice(), line: 7, variables: { node: node.key, queue: q.map(n => n.key), output: output.slice() } };
        }
        yield { root: snapshot(root), output: output.slice(), line: 3, variables: { output: output.slice() } };
      },
    };
  },
};
