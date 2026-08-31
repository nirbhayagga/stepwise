import { toRegistry } from '../../engine/types';
import type { PathfindingAlgorithm } from './types';
import { dijkstra } from './dijkstra';
import { astar } from './astar';
import { thetaStar } from './thetaStar';
import { bidirectionalDijkstra } from './bidirectionalDijkstra';
import { jps } from './jps';
import { greedyBestFirst } from './greedy';
import { bfs } from './bfs';
import { bidirectional } from './bidirectional';
import { dfs } from './dfs';

export * from './types';
export * from './mazes';
export { WEIGHT_COST, idx, rowOf, colOf } from './grid';

/** Display order. Adding an algorithm = one file + one entry here. */
export const PATHFINDING_LIST: PathfindingAlgorithm[] = [dijkstra, bidirectionalDijkstra, astar, thetaStar, jps, greedyBestFirst, bfs, bidirectional, dfs];
export const PATHFINDING = toRegistry(PATHFINDING_LIST);
export const DEFAULT_PATHFINDING = dijkstra.id;
