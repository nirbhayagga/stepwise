import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { KEYS_INPUT, makeNode, snapshot, clearStates, uniqueKeys } from './types';

type Ctx = { root: TreeNode | null };

function rotateLeft(ctx: Ctx, x: TreeNode) {
  const y = x.right!;
  x.right = y.left;
  if (y.left) y.left.parent = x;
  y.parent = x.parent;
  if (!x.parent) ctx.root = y;
  else if (x === x.parent.left) x.parent.left = y;
  else x.parent.right = y;
  y.left = x;
  x.parent = y;
}
function rotateRight(ctx: Ctx, y: TreeNode) {
  const x = y.left!;
  y.left = x.right;
  if (x.right) x.right.parent = y;
  x.parent = y.parent;
  if (!y.parent) ctx.root = x;
  else if (y === y.parent.left) y.parent.left = x;
  else y.parent.right = x;
  x.right = y;
  y.parent = x;
}

function* insert(ctx: Ctx, key: number): Generator<TreeAction, void, unknown> {
  const z = makeNode(key, { color: 'red', parent: null });
  let y: TreeNode | null = null;
  let x = ctx.root;
  while (x) {
    y = x;
    x.state = 'visiting';
    yield { root: snapshot(ctx.root), line: 2, variables: { key, 'x.key': x.key, go: key < x.key ? 'left' : 'right' } };
    x.state = 'default';
    x = key < x.key ? x.left : x.right;
  }
  z.parent = y;
  if (!y) ctx.root = z;
  else if (key < y.key) y.left = z;
  else y.right = z;
  yield { root: snapshot(ctx.root), line: 2, variables: { key, inserted: 'red leaf' } };
  z.state = 'default';

  let cur = z;
  while (cur.parent && cur.parent.color === 'red') {
    const p = cur.parent;
    const g = p.parent!; // parent is red so it cannot be the root
    const side = p === g.left ? 'left' : 'right';
    const uncle = side === 'left' ? g.right : g.left;
    cur.state = 'visiting';
    yield { root: snapshot(ctx.root), line: side === 'left' ? 4 : 11, variables: { z: cur.key, parent: p.key, grandparent: g.key, uncle: uncle?.key ?? 'nil (black)', 'uncle colour': uncle?.color ?? 'black' } };
    cur.state = 'default';
    if (uncle && uncle.color === 'red') {
      p.color = 'black'; uncle.color = 'black'; g.color = 'red';
      yield { root: snapshot(ctx.root), line: 7, variables: { case: 1, recoloured: [p.key, uncle.key, g.key], z: g.key } };
      cur = g;
      continue;
    }
    const inner = side === 'left' ? cur === p.right : cur === p.left;
    if (inner) {
      cur = p;
      cur.state = 'rotating';
      yield { root: snapshot(ctx.root), line: 9, variables: { case: 2, rotate: side === 'left' ? 'left' : 'right', at: cur.key } };
      cur.state = 'default';
      if (side === 'left') rotateLeft(ctx, cur); else rotateRight(ctx, cur);
      yield { root: snapshot(ctx.root), line: 9, variables: { case: 2, done: true } };
    }
    const p2 = cur.parent!, g2 = p2.parent!;
    p2.color = 'black'; g2.color = 'red';
    g2.state = 'rotating';
    yield { root: snapshot(ctx.root), line: 10, variables: { case: 3, recoloured: [p2.key, g2.key], rotate: side === 'left' ? 'right' : 'left', at: g2.key } };
    g2.state = 'default';
    if (side === 'left') rotateRight(ctx, g2); else rotateLeft(ctx, g2);
    yield { root: snapshot(ctx.root), line: 10, variables: { case: 3, done: true } };
  }
  if (ctx.root && ctx.root.color !== 'black') {
    ctx.root.color = 'black';
    yield { root: snapshot(ctx.root), line: 12, variables: { root: ctx.root.key, colour: 'black' } };
  }
}

export const redBlack: TreeAlgorithm = {
  id: 'red-black',
  name: 'Red–Black Tree Insertion',
  summary: 'Balanced BST with coloured nodes: no red node has a red child and every root-to-leaf path has the same number of black nodes. Fix-up uses recolouring (case 1) and at most two rotations (cases 2–3).',
  complexity: { time: { worst: 'O(log n) per insert' }, space: 'O(n)', tags: ['Self-balancing', 'Height ≤ 2 log n', 'CLRS'] },
  inputs: [KEYS_INPUT],
  pseudocode: [
    'procedure RBInsert(T, k)',                                                             // 1
    '  z ← Node(k, RED); ordinary BST insert of z',                                         // 2
    '  while z.parent is RED',                                                              // 3
    '    if z.parent = z.parent.parent.left then',                                          // 4
    '      y ← z.parent.parent.right                                        ▷ uncle',       // 5
    '      if y is RED then                                                 ▷ case 1',      // 6
    '        z.parent ← BLACK; y ← BLACK; z.parent.parent ← RED; z ← z.parent.parent',      // 7
    '      else',                                                                           // 8
    '        if z = z.parent.right then z ← z.parent; RotateLeft(z)         ▷ case 2',      // 9
    '        z.parent ← BLACK; z.parent.parent ← RED; RotateRight(z.parent.parent) ▷ case 3', // 10
    '    else (same with "left" and "right" exchanged)',                                    // 11
    '  T.root ← BLACK',                                                                     // 12
  ],
  setup(d) {
    const keys = uniqueKeys(d.keys as number[]);
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      *run() {
        const ctx: Ctx = { root: null };
        for (const key of keys) {
          yield* insert(ctx, key);
          clearStates(ctx.root);
          yield { root: snapshot(ctx.root), line: 12, variables: { key, inserted: true } };
        }
      },
    };
  },
};
