import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { KEYS_INPUT, snapshot, clearStates, uniqueKeys } from './types';
import { buildBST } from './bst';

function* del(ctx: { root: TreeNode | null }, node: TreeNode | null, key: number): Generator<TreeAction, TreeNode | null, unknown> {
  if (!node) {
    yield { root: snapshot(ctx.root), line: 2, variables: { key, result: 'not found' } };
    return null;
  }
  node.state = 'visiting';
  yield { root: snapshot(ctx.root), line: key < node.key ? 3 : key > node.key ? 4 : 5, variables: { key, 'node.key': node.key } };
  node.state = 'default';
  if (key < node.key) { node.left = yield* del(ctx, node.left, key); return node; }
  if (key > node.key) { node.right = yield* del(ctx, node.right, key); return node; }

  node.state = 'found';
  yield { root: snapshot(ctx.root), line: 5, variables: { key, found: true, children: (node.left ? 1 : 0) + (node.right ? 1 : 0) } };
  if (!node.left) {
    node.state = 'removed';
    yield { root: snapshot(ctx.root), line: 6, variables: { key, case: 'no left child → splice right' } };
    return node.right;
  }
  if (!node.right) {
    node.state = 'removed';
    yield { root: snapshot(ctx.root), line: 7, variables: { key, case: 'no right child → splice left' } };
    return node.left;
  }
  let s = node.right;
  while (s.left) s = s.left;
  s.state = 'visiting';
  yield { root: snapshot(ctx.root), line: 8, variables: { key, successor: s.key } };
  s.state = 'default';
  node.key = s.key;
  yield { root: snapshot(ctx.root), line: 9, variables: { key, 'node.key ←': s.key } };
  node.state = 'default';
  node.right = yield* del(ctx, node.right, s.key);
  yield { root: snapshot(ctx.root), line: 10, variables: { removedSuccessor: s.key } };
  return node;
}

export const bstDelete: TreeAlgorithm = {
  id: 'bst-delete',
  name: 'BST Deletion',
  summary: 'Builds the tree, then deletes keys: a node with two children is replaced by its in-order successor, which is then removed from the right subtree.',
  complexity: { time: { average: 'Θ(log n) per delete', worst: 'O(n) per delete' }, space: 'O(h)', tags: ['Unbalanced'] },
  inputs: [
    KEYS_INPUT,
    { key: 'remove', label: 'Delete sequence', kind: 'ints', default: '20, 30, 50', maxLength: 16 },
  ],
  pseudocode: [
    'procedure Delete(root, k)',                                     // 1
    '  if root = null then return null',                             // 2
    '  if k < root.key then root.left ← Delete(root.left, k)',       // 3
    '  else if k > root.key then root.right ← Delete(root.right, k)',// 4
    '  else                                       ▷ found k',        // 5
    '    if root.left = null then return root.right',                // 6
    '    if root.right = null then return root.left',                // 7
    '    s ← Min(root.right)                      ▷ in-order successor', // 8
    '    root.key ← s.key',                                          // 9
    '    root.right ← Delete(root.right, s.key)',                    // 10
    '  return root',                                                 // 11
  ],
  setup(d) {
    const keys = uniqueKeys(d.keys as number[]);
    const remove = d.remove as number[];
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const ctx = { root: buildBST(keys) };
        yield { root: snapshot(ctx.root), line: 1, variables: { built: keys.length, toDelete: remove } };
        for (const key of remove) {
          ctx.root = yield* del(ctx, ctx.root, key);
          clearStates(ctx.root);
          yield { root: snapshot(ctx.root), line: 11, variables: { deleted: key } };
        }
      },
    };
  },
};
