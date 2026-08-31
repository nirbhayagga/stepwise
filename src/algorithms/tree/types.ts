import type { AlgorithmMeta, BaseAction, BaseFrame, InputSpec, ParsedInputs } from '../../engine/types';
import { checkLine } from '../../engine/types';

export type TreeState = 'default' | 'visiting' | 'inserted' | 'rotating' | 'found' | 'removed' | 'output';

export interface TreeNode {
  id: number;
  key: number;
  left: TreeNode | null;
  right: TreeNode | null;
  /** Transient highlight. */
  state: TreeState;
  /** AVL only. */
  height?: number;
  /** Red-black only. */
  color?: 'red' | 'black';
  /** N-ary children (tries); when set, left/right are ignored by the canvas. */
  children?: TreeNode[];
  /** Text drawn inside the node instead of `key` (e.g. a trie character). */
  text?: string;
  /** Small caption under the node (range, frequency, code, …). */
  label?: string;
  /** Internal use by algorithms that need upward links; stripped from snapshots. */
  parent?: TreeNode | null;
}

export interface TreeAction extends BaseAction {
  /** Snapshot (deep copy) of the tree after this step. */
  root: TreeNode | null;
  /** Several roots side by side (Huffman construction, segment-tree build). */
  forest?: TreeNode[];
  /** Sequence produced so far (traversals, extractions). */
  output?: number[];
}

export interface TreeRun {
  run: () => Generator<TreeAction, void, unknown>;
}

export interface TreeAlgorithm extends AlgorithmMeta {
  inputs: InputSpec[];
  setup(data: ParsedInputs): TreeRun | { error: string };
}

export interface TreeFrame extends BaseFrame {
  root: TreeNode | null;
  forest: TreeNode[] | null;
  output: number[];
}

let nextId = 1;
export function makeNode(key: number, extra: Partial<TreeNode> = {}): TreeNode {
  return { id: nextId++, key, left: null, right: null, state: 'inserted', ...extra };
}

/** Deep copy without parent links (safe to store and render). */
export function snapshot(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  const { parent: _p, ...rest } = node;
  void _p;
  return {
    ...rest,
    left: snapshot(node.left),
    right: snapshot(node.right),
    ...(node.children ? { children: node.children.map(c => snapshot(c)!) } : {}),
  };
}

export function clearStates(node: TreeNode | null): void {
  if (!node) return;
  node.state = 'default';
  clearStates(node.left);
  clearStates(node.right);
  node.children?.forEach(c => clearStates(c));
}

export function buildTreeFrames(meta: TreeAlgorithm, run: TreeRun): TreeFrame[] {
  const frames: TreeFrame[] = [{ root: null, forest: null, output: [], variables: {}, line: 0 }];
  let line = 0;
  let output: number[] = [];
  for (const action of run.run()) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.output) output = action.output.slice();
    frames.push({ root: action.root, forest: action.forest ?? null, output, variables: action.variables ?? {}, line });
  }
  return frames;
}

export const KEYS_INPUT: InputSpec = { key: 'keys', label: 'Insert sequence', kind: 'ints', default: '50, 30, 70, 20, 40, 60, 80, 35, 45, 65', maxLength: 31 };

export function uniqueKeys(keys: number[]): number[] {
  return Array.from(new Set(keys));
}
