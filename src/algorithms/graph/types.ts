import type { AlgorithmMeta, BaseAction, BaseFrame } from '../../engine/types';
import { checkLine } from '../../engine/types';

export interface GraphNode { id: number; x: number; y: number }
export interface GraphEdge { id: number; u: number; v: number; w: number }
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
}

export const GNODE = { default: 0, frontier: 1, current: 2, visited: 3, result: 4 } as const;
export const GEDGE = { default: 0, active: 1, tree: 2, rejected: 3 } as const;

export interface GraphAction extends BaseAction {
  nodes?: [id: number, state: number][];
  edges?: [id: number, state: number][];
  /** Text drawn under a node (distance, key, component …). */
  labels?: Record<number, string>;
  output?: number[];
}

export interface GraphAlgorithm extends AlgorithmMeta {
  /** Graph family the algorithm needs; the view regenerates accordingly. */
  kind: 'undirected' | 'dag';
  weighted: boolean;
  usesSource: boolean;
  run(g: Graph, source: number): Generator<GraphAction, void, unknown>;
}

export interface GraphFrame extends BaseFrame {
  nodeStates: Uint8Array;
  edgeStates: Uint8Array;
  labels: string[];
  output: number[];
}

export interface Adj { to: number; edge: GraphEdge }

export function adjacency(g: Graph): Adj[][] {
  const adj: Adj[][] = g.nodes.map(() => []);
  for (const e of g.edges) {
    adj[e.u].push({ to: e.v, edge: e });
    if (!g.directed) adj[e.v].push({ to: e.u, edge: e });
  }
  for (const list of adj) list.sort((a, b) => a.to - b.to);
  return adj;
}

export function buildGraphFrames(meta: GraphAlgorithm, g: Graph, source: number): GraphFrame[] {
  const nodeStates = new Uint8Array(g.nodes.length);
  const edgeStates = new Uint8Array(g.edges.length);
  const labels = new Array<string>(g.nodes.length).fill('');
  let output: number[] = [];
  let line = 0;
  const frames: GraphFrame[] = [];
  const push = (variables: Record<string, unknown>) => frames.push({
    nodeStates: Uint8Array.from(nodeStates), edgeStates: Uint8Array.from(edgeStates), labels: labels.slice(), output, variables, line,
  });
  push({});
  for (const a of meta.run(g, source)) {
    if (a.line !== undefined) { checkLine(meta, a.line); line = a.line; }
    if (a.nodes) for (const [id, s] of a.nodes) nodeStates[id] = s;
    if (a.edges) for (const [id, s] of a.edges) edgeStates[id] = s;
    if (a.labels) for (const k in a.labels) labels[Number(k)] = a.labels[k];
    if (a.output) output = a.output.slice();
    push(a.variables ?? {});
  }
  return frames;
}
