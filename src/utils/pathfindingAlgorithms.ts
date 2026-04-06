import type { GridNode } from '../composables/usePathfinding';

export type PathActionType = 'visiting' | 'visited' | 'path';

export interface PathAction {
  type: PathActionType;
  nodes: GridNode[];
  variables?: Record<string, any>;
  highlightLine?: number;
}

function getNeighbors(node: GridNode, grid: GridNode[][]): GridNode[] {
  const neighbors: GridNode[] = [];
  const { row, col } = node;
  const rows = grid.length;
  const cols = grid[0].length;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (col < cols - 1) neighbors.push(grid[row][col + 1]);
  if (row < rows - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  return neighbors.filter(n => n.type !== 'wall');
}

function getCost(node: GridNode): number {
  return node.type === 'weight' ? 10 : 1;
}

function* yieldShortestPath(target: GridNode, parentMap: Map<GridNode, GridNode>): Generator<PathAction, void, unknown> {
  const path: GridNode[] = [];
  let curr: GridNode | undefined = target;
  while (curr) {
    path.unshift(curr);
    curr = parentMap.get(curr);
  }
  for (const p of path) {
    yield { type: 'path', nodes: [p] };
  }
}

export function* dijkstraGenerator(grid: GridNode[][], start: GridNode, target: GridNode): Generator<PathAction, void, unknown> {
  const unvisited: GridNode[] = [];
  const distances = new Map<GridNode, number>();
  const parentMap = new Map<GridNode, GridNode>();

  for (const row of grid) {
    for (const node of row) {
      if (node.type !== 'wall') {
        distances.set(node, Infinity);
        unvisited.push(node);
      }
    }
  }
  distances.set(start, 0);

  while (unvisited.length > 0) {
    unvisited.sort((a, b) => distances.get(a)! - distances.get(b)!);
    const closest = unvisited.shift();
    if (!closest || distances.get(closest) === Infinity) break;

    if (closest !== start && closest !== target) {
      yield { type: 'visiting', nodes: [closest], highlightLine: 4 };
      yield { type: 'visited', nodes: [closest], highlightLine: 5 };
    }

    if (closest === target) {
      yield { type: 'visited', nodes: [], highlightLine: 6 };
      yield* yieldShortestPath(target, parentMap);
      return;
    }

    const neighbors = getNeighbors(closest, grid);
    for (const neighbor of neighbors) {
      const alt = distances.get(closest)! + getCost(neighbor);
      if (alt < distances.get(neighbor)!) {
        distances.set(neighbor, alt);
        parentMap.set(neighbor, closest);
        yield { type: 'visiting', nodes: [], highlightLine: 10, variables: { alt, shortestDistance: alt } };
      }
    }
  }
}

export function* astarGenerator(grid: GridNode[][], start: GridNode, target: GridNode): Generator<PathAction, void, unknown> {
  const openSet = [start];
  const gScore = new Map<GridNode, number>();
  const fScore = new Map<GridNode, number>();
  const parentMap = new Map<GridNode, GridNode>();

  for (const row of grid) {
    for (const node of row) {
      gScore.set(node, Infinity);
      fScore.set(node, Infinity);
    }
  }
  gScore.set(start, 0);
  fScore.set(start, Math.abs(start.row - target.row) + Math.abs(start.col - target.col));

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore.get(a)! - fScore.get(b)!);
    const curr = openSet.shift()!;

    if (curr !== start && curr !== target) {
      yield { type: 'visiting', nodes: [curr], highlightLine: 5 };
      yield { type: 'visited', nodes: [curr] };
    }

    if (curr === target) {
      yield { type: 'visited', nodes: [], highlightLine: 6 };
      yield* yieldShortestPath(target, parentMap);
      return;
    }

    const neighbors = getNeighbors(curr, grid);
    for (const neighbor of neighbors) {
      const tentativeG = gScore.get(curr)! + getCost(neighbor);
      if (tentativeG < gScore.get(neighbor)!) {
        parentMap.set(neighbor, curr);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + Math.abs(neighbor.row - target.row) + Math.abs(neighbor.col - target.col));
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
        yield { type: 'visiting', nodes: [], highlightLine: 11, variables: { tentative_gScore: tentativeG } };
      }
    }
  }
}

export function* bfsGenerator(grid: GridNode[][], start: GridNode, target: GridNode): Generator<PathAction, void, unknown> {
  const queue = [start];
  const visited = new Set<GridNode>([start]);
  const parentMap = new Map<GridNode, GridNode>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr !== start && curr !== target) {
      yield { type: 'visiting', nodes: [curr], highlightLine: 4 };
      yield { type: 'visited', nodes: [curr] };
    }

    if (curr === target) {
      yield { type: 'visited', nodes: [], highlightLine: 5 };
      yield* yieldShortestPath(target, parentMap);
      return;
    }

    const neighbors = getNeighbors(curr, grid);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, curr);
        queue.push(neighbor);
        yield { type: 'visiting', nodes: [], highlightLine: 10 };
      }
    }
  }
}

export function* dfsGenerator(grid: GridNode[][], start: GridNode, target: GridNode): Generator<PathAction, void, unknown> {
  const stack = [start];
  const visited = new Set<GridNode>();
  const parentMap = new Map<GridNode, GridNode>();

  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    if (curr !== start && curr !== target) {
      yield { type: 'visiting', nodes: [curr], highlightLine: 4 };
      yield { type: 'visited', nodes: [curr] };
    }

    if (curr === target) {
      yield { type: 'visited', nodes: [], highlightLine: 5 };
      yield* yieldShortestPath(target, parentMap);
      return;
    }

    const neighbors = getNeighbors(curr, grid).reverse();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        parentMap.set(neighbor, curr);
        stack.push(neighbor);
        yield { type: 'visiting', nodes: [], highlightLine: 10 };
      }
    }
  }
}

export function* greedyBfsGenerator(grid: GridNode[][], start: GridNode, target: GridNode): Generator<PathAction, void, unknown> {
  const openSet = [start];
  const visited = new Set<GridNode>([start]);
  const parentMap = new Map<GridNode, GridNode>();

  const getH = (node: GridNode) => Math.abs(node.row - target.row) + Math.abs(node.col - target.col);

  while (openSet.length > 0) {
    openSet.sort((a, b) => getH(a) - getH(b));
    const curr = openSet.shift()!;

    if (curr !== start && curr !== target) {
      yield { type: 'visiting', nodes: [curr], highlightLine: 5 };
      yield { type: 'visited', nodes: [curr] };
    }

    if (curr === target) {
      yield { type: 'visited', nodes: [], highlightLine: 6 };
      yield* yieldShortestPath(target, parentMap);
      return;
    }

    const neighbors = getNeighbors(curr, grid);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, curr);
        openSet.push(neighbor);
        yield { type: 'visiting', nodes: [], highlightLine: 11, variables: { heuristic: getH(neighbor) } };
      }
    }
  }
}

export function* bidirBfsGenerator(grid: GridNode[][], start: GridNode, target: GridNode): Generator<PathAction, void, unknown> {
  const queueA = [start];
  const queueB = [target];
  const visitedA = new Map<GridNode, GridNode | null>([[start, null]]);
  const visitedB = new Map<GridNode, GridNode | null>([[target, null]]);

  let intersectNode: GridNode | null = null;

  while (queueA.length > 0 && queueB.length > 0) {
      const currA = queueA.shift()!;
      if (currA !== start && currA !== target) {
        yield { type: 'visiting', nodes: [currA], highlightLine: 5 };
        yield { type: 'visited', nodes: [currA] };
      }
      
      for (const neighbor of getNeighbors(currA, grid)) {
          if (visitedB.has(neighbor)) {
              visitedA.set(neighbor, currA);
              intersectNode = neighbor;
              break;
          }
          if (!visitedA.has(neighbor)) {
              visitedA.set(neighbor, currA);
              queueA.push(neighbor);
              yield { type: 'visiting', nodes: [], highlightLine: 8 };
          }
      }
      if (intersectNode) break;

      const currB = queueB.shift()!;
      if (currB !== start && currB !== target) {
        yield { type: 'visiting', nodes: [currB], highlightLine: 12 };
        yield { type: 'visited', nodes: [currB] };
      }
      
      for (const neighbor of getNeighbors(currB, grid)) {
          if (visitedA.has(neighbor)) {
              visitedB.set(neighbor, currB);
              intersectNode = neighbor;
              break;
          }
          if (!visitedB.has(neighbor)) {
              visitedB.set(neighbor, currB);
              queueB.push(neighbor);
              yield { type: 'visiting', nodes: [], highlightLine: 14 };
          }
      }
      if (intersectNode) break;
  }

  if (intersectNode) {
     yield { type: 'visited', nodes: [], highlightLine: 16 };
     const path: GridNode[] = [];
     let curr: GridNode | null = intersectNode;
     while (curr) { path.unshift(curr); curr = visitedA.get(curr) || null; }
     
     curr = visitedB.get(intersectNode) || null;
     while (curr) { path.push(curr); curr = visitedB.get(curr) || null; }
     
     for (const p of path) {
       yield { type: 'path', nodes: [p] };
     }
  }
}

export const pathAlgorithms: Record<string, (grid: GridNode[][], start: GridNode, target: GridNode) => Generator<PathAction, void, unknown>> = {
  dijkstra: dijkstraGenerator,
  astar: astarGenerator,
  greedy: greedyBfsGenerator,
  bidir: bidirBfsGenerator,
  bfs: bfsGenerator,
  dfs: dfsGenerator
};
