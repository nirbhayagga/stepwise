import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { KEYS_INPUT, makeNode, snapshot, clearStates, uniqueKeys } from './types';

/** Plain BST insertion with step-by-step yields. Exported for reuse by traversals/deletion. */
export function* bstInsert(ctx: { root: TreeNode | null }, node: TreeNode | null, key: number): Generator<TreeAction, TreeNode, unknown> {
  if (!node) {
    const n = makeNode(key);
    yield { root: snapshot(ctx.root), line: 2, variables: { key, action: 'create leaf' } };
    return n;
  }
  node.state = 'visiting';
  yield { root: snapshot(ctx.root), line: 3, variables: { key, 'node.key': node.key, go: key < node.key ? 'left' : 'right' } };
  node.state = 'default';
  if (key < node.key) {
    node.left = yield* bstInsert(ctx, node.left, key);
    yield { root: snapshot(ctx.root), line: 4, variables: { key, parent: node.key } };
  } else {
    node.right = yield* bstInsert(ctx, node.right, key);
    yield { root: snapshot(ctx.root), line: 6, variables: { key, parent: node.key } };
  }
  return node;
}

/** Build a BST silently (no frames). */
export function buildBST(keys: number[]): TreeNode | null {
  let root: TreeNode | null = null;
  const insert = (node: TreeNode | null, key: number): TreeNode => {
    if (!node) return makeNode(key, { state: 'default' });
    if (key < node.key) node.left = insert(node.left, key);
    else node.right = insert(node.right, key);
    return node;
  };
  for (const k of keys) root = insert(root, k);
  return root;
}

export const bst: TreeAlgorithm = {
  id: 'bst',
  name: 'BST Insertion',
  summary: 'Unbalanced binary search tree: each key descends left or right until it finds an empty slot; height depends entirely on insertion order.',
  complexity: { time: { average: 'Θ(log n) per insert', worst: 'O(n) per insert' }, space: 'O(n)', tags: ['Unbalanced'] },
  inputs: [KEYS_INPUT],
  pseudocode: [
    'procedure Insert(root, k)',                        // 1
    '  if root = null then return Node(k)',             // 2
    '  if k < root.key then',                           // 3
    '    root.left ← Insert(root.left, k)',             // 4
    '  else',                                           // 5
    '    root.right ← Insert(root.right, k)',           // 6
    '  return root',                                    // 7
  ],
  setup(d) {
    const keys = uniqueKeys(d.keys as number[]);
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const ctx: { root: TreeNode | null } = { root: null };
        for (const key of keys) {
          ctx.root = yield* bstInsert(ctx, ctx.root, key);
          yield { root: snapshot(ctx.root), line: 7, variables: { key, inserted: true } };
          clearStates(ctx.root);
        }
        yield { root: snapshot(ctx.root), line: 7, variables: { size: keys.length } };
      },
    };
  },
};
