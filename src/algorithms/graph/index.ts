import { toRegistry } from '../../engine/types';
import type { GraphAlgorithm } from './types';
import { graphBfs } from './bfs';
import { graphDfs } from './dfs';
import { graphDijkstra } from './dijkstra';
import { prim } from './prim';
import { kruskal } from './kruskal';
import { topological } from './topological';
import { bellmanFord } from './bellmanFord';
import { tarjan } from './tarjan';
import { edmondsKarp } from './edmondsKarp';

export * from './types';
export { generateGraph } from './generate';

/** Display order. Adding an algorithm = one file + one entry here. */
export const GRAPH_LIST: GraphAlgorithm[] = [graphBfs, graphDfs, graphDijkstra, bellmanFord, prim, kruskal, topological, tarjan, edmondsKarp];
export const GRAPH = toRegistry(GRAPH_LIST);
export const DEFAULT_GRAPH = graphBfs.id;
