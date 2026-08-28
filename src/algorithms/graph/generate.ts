import type { Graph, GraphEdge, GraphNode } from './types';
import { mulberry32 } from '../../engine/random';

function cross(a: GraphNode, b: GraphNode, c: GraphNode, d: GraphNode): boolean {
  const o = (p: GraphNode, q: GraphNode, r: GraphNode) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  if (a === c || a === d || b === c || b === d) return false;
  const s1 = o(a, b, c), s2 = o(a, b, d), s3 = o(c, d, a), s4 = o(c, d, b);
  return s1 * s2 < 0 && s3 * s4 < 0;
}

/**
 * Random planar-looking graph: blue-noise node placement, a minimum spanning
 * tree for connectivity, then short non-crossing extra edges. Weights are
 * proportional to Euclidean length so shortest paths look right.
 * `kind === 'dag'` orients every edge left → right, which is trivially acyclic.
 */
export function generateGraph(n: number, density: number, seed: number, kind: 'undirected' | 'dag'): Graph {
  const rnd = mulberry32(seed);
  const nodes: GraphNode[] = [];
  const minDist = Math.max(0.09, 0.42 / Math.sqrt(n));
  let tries = 0;
  while (nodes.length < n && tries < 4000) {
    tries++;
    const p = { id: nodes.length, x: 0.06 + rnd() * 0.88, y: 0.1 + rnd() * 0.8 };
    if (nodes.every(q => Math.hypot(p.x - q.x, (p.y - q.y) * 0.6) >= minDist)) nodes.push(p);
  }
  if (kind === 'dag') {
    nodes.sort((a, b) => a.x - b.x);
    nodes.forEach((p, i) => { p.id = i; });
  }

  const dist = (a: GraphNode, b: GraphNode) => Math.hypot(a.x - b.x, (a.y - b.y) * 0.6);
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) pairs.push([dist(nodes[i], nodes[j]), i, j]);
  pairs.sort((a, b) => a[0] - b[0]);

  const parent = nodes.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const edges: GraphEdge[] = [];
  const has = new Set<string>();
  const addEdge = (i: number, j: number, d: number) => {
    const [u, v] = i < j ? [i, j] : [j, i];
    edges.push({ id: edges.length, u, v, w: Math.round(d * 28) + 1 });
    has.add(`${u}-${v}`);
  };
  const crossesExisting = (i: number, j: number) => edges.some(e => cross(nodes[i], nodes[j], nodes[e.u], nodes[e.v]));

  for (const [d, i, j] of pairs) {
    if (find(i) !== find(j) && !crossesExisting(i, j)) { parent[find(i)] = find(j); addEdge(i, j, d); }
  }
  const target = Math.min(pairs.length, Math.round(nodes.length * (1 + density * 1.2)));
  for (const [d, i, j] of pairs) {
    if (edges.length >= target) break;
    if (has.has(`${i}-${j}`) || d > 0.42 || crossesExisting(i, j)) continue;
    addEdge(i, j, d);
  }
  return { nodes, edges, directed: kind === 'dag' };
}
