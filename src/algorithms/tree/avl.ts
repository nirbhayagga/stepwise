import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { KEYS_INPUT, makeNode, snapshot, clearStates, uniqueKeys } from './types';

const h = (n: TreeNode | null) => n?.height ?? 0;
const update = (n: TreeNode) => { n.height = 1 + Math.max(h(n.left), h(n.right)); };

function rotateRight(y: TreeNode): TreeNode {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  update(y); update(x);
  return x;
}
function rotateLeft(x: TreeNode): TreeNode {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  update(x); update(y);
  return y;
}

function* insert(ctx: { root: TreeNode | null }, node: TreeNode | null, key: number): Generator<TreeAction, TreeNode, unknown> {
  if (!node) {
    yield { root: snapshot(ctx.root), line: 2, variables: { key, action: 'create leaf' } };
    return makeNode(key, { height: 1 });
  }
  node.state = 'visiting';
  yield { root: snapshot(ctx.root), line: key < node.key ? 3 : 4, variables: { key, 'node.key': node.key } };
  node.state = 'default';
  if (key < node.key) node.left = yield* insert(ctx, node.left, key);
  else node.right = yield* insert(ctx, node.right, key);

  update(node);
  const b = h(node.left) - h(node.right);
  node.state = 'visiting';
  yield { root: snapshot(ctx.root), line: 6, variables: { key, 'node.key': node.key, height: node.height, balance: b } };
  node.state = 'default';

  if (b > 1 && key < node.left!.key) {
    node.state = 'rotating';
    yield { root: snapshot(ctx.root), line: 7, variables: { case: 'LL', pivot: node.key, rotation: 'right' } };
    node.state = 'default';
    return rotateRight(node);
  }
  if (b < -1 && key > node.right!.key) {
    node.state = 'rotating';
    yield { root: snapshot(ctx.root), line: 8, variables: { case: 'RR', pivot: node.key, rotation: 'left' } };
    node.state = 'default';
    return rotateLeft(node);
  }
  if (b > 1 && key > node.left!.key) {
    node.state = 'rotating';
    yield { root: snapshot(ctx.root), line: 9, variables: { case: 'LR', pivot: node.key } };
    node.left = rotateLeft(node.left!);
    yield { root: snapshot(ctx.root), line: 10, variables: { case: 'LR', step: 'left-rotated child', pivot: node.key } };
    node.state = 'default';
    return rotateRight(node);
  }
  if (b < -1 && key < node.right!.key) {
    node.state = 'rotating';
    yield { root: snapshot(ctx.root), line: 11, variables: { case: 'RL', pivot: node.key } };
    node.right = rotateRight(node.right!);
    yield { root: snapshot(ctx.root), line: 12, variables: { case: 'RL', step: 'right-rotated child', pivot: node.key } };
    node.state = 'default';
    return rotateLeft(node);
  }
  return node;
}

export const avl: TreeAlgorithm = {
  id: 'avl',
  name: 'AVL Tree Insertion',
  summary: 'Height-balanced BST: after each insertion the balance factor is checked on the way back up and one of four rotations restores |balance| ≤ 1.',
  complexity: { time: { worst: 'O(log n) per insert' }, space: 'O(n)', tags: ['Self-balancing', 'Height ≤ 1.44 log n'] },
  inputs: [KEYS_INPUT],
  pseudocode: [
    'procedure Insert(node, k)',                                              // 1
    '  if node = null then return Node(k)',                                   // 2
    '  if k < node.key then node.left ← Insert(node.left, k)',                // 3
    '  else node.right ← Insert(node.right, k)',                              // 4
    '  node.height ← 1 + max(h(node.left), h(node.right))',                   // 5
    '  b ← h(node.left) − h(node.right)',                                     // 6
    '  if b > 1 and k < node.left.key then return RotateRight(node)   ▷ LL', // 7
    '  if b < −1 and k > node.right.key then return RotateLeft(node)  ▷ RR', // 8
    '  if b > 1 and k > node.left.key then                            ▷ LR', // 9
    '    node.left ← RotateLeft(node.left); return RotateRight(node)',        // 10
    '  if b < −1 and k < node.right.key then                          ▷ RL', // 11
    '    node.right ← RotateRight(node.right); return RotateLeft(node)',      // 12
    '  return node',                                                          // 13
  ],
  setup(d) {
    const keys = uniqueKeys(d.keys as number[]);
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const ctx: { root: TreeNode | null } = { root: null };
        for (const key of keys) {
          ctx.root = yield* insert(ctx, ctx.root, key);
          clearStates(ctx.root);
          yield { root: snapshot(ctx.root), line: 13, variables: { key, inserted: true, height: ctx.root?.height } };
        }
      },
    };
  },
};
