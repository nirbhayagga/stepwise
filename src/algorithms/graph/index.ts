import { toRegistry } from '../../engine/types';
import type { GraphAlgorithm } from './types';
import { graphBfs } from './bfs';
import { graphDfs } from './dfs';
import { graphDijkstra } from './dijkstra';
import { prim } from './prim';
import { kruskal } from './kruskal';
import { topological } from './topological';

export * from './types';
export { generateGraph } from './generate';

/** Display order. Adding an algorithm = one file + one entry here. */
export const GRAPH_LIST: GraphAlgorithm[] = [graphBfs, graphDfs, graphDijkstra, prim, kruskal, topological];
export const GRAPH = toRegistry(GRAPH_LIST);
export const DEFAULT_GRAPH = graphBfs.id;
