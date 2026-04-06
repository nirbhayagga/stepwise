import { ref, computed } from 'vue';
import { pathAlgorithms } from '../utils/pathfindingAlgorithms';

export type NodeType = 'empty' | 'wall' | 'weight' | 'start' | 'target';
export type NodeState = 'unvisited' | 'visiting' | 'visited' | 'path';

export interface GridNode {
  row: number;
  col: number;
  type: NodeType;
  state: NodeState;
  id: string;
}

export interface PathVisualizationFrame {
  grid: GridNode[][];
  nodesExplored: number;
  pathLength: number;
  variables: Record<string, any>;
  activeLine?: number;
}

export function usePathfinding() {
  const rows = ref(21);
  const cols = ref(55);
  const grid = ref<GridNode[][]>([]);
  const timeline = ref<PathVisualizationFrame[]>([]);
  const currentFrameIndex = ref(0);
  
  const isPlaying = ref(false);
  let playInterval: number | null = null;
  const executionTime = ref(0);
  let cachedAlgo = '';

  const drawMode = ref<NodeType>('wall');
  const isMousePressed = ref(false);
  const dragType = ref<NodeType | 'erase' | null>(null);

  const nodesExplored = computed(() => timeline.value[currentFrameIndex.value]?.nodesExplored || 0);
  const pathLength = computed(() => timeline.value[currentFrameIndex.value]?.pathLength || 0);
  const currentVariables = computed(() => timeline.value[currentFrameIndex.value]?.variables || {});
  const activeLine = computed(() => timeline.value[currentFrameIndex.value]?.activeLine || null);

  const applyFrame = (frame: PathVisualizationFrame) => {
    if (!frame) return;
    grid.value = frame.grid;
  };

  const registerBaseFrame = () => {
    timeline.value = [{ grid: grid.value.map(r => r.map(n => ({...n}))), nodesExplored: 0, pathLength: 0, variables: {} }];
    currentFrameIndex.value = 0;
    executionTime.value = 0;
  };

  const initGrid = () => {
    pause();
    const newGrid: GridNode[][] = [];
    for (let r = 0; r < rows.value; r++) {
      const currentRow: GridNode[] = [];
      for (let c = 0; c < cols.value; c++) {
        let type: NodeType = 'empty';
        if (r === Math.floor(rows.value / 2) && c === Math.floor(cols.value / 4)) type = 'start';
        if (r === Math.floor(rows.value / 2) && c === cols.value - Math.floor(cols.value / 4)) type = 'target';
        currentRow.push({ row: r, col: c, type, state: 'unvisited', id: `${r}-${c}` });
      }
      newGrid.push(currentRow);
    }
    grid.value = newGrid;
    registerBaseFrame();
  };

  const randomizeStartTarget = () => {
    const newGrid = grid.value.map(r => r.map(n => ({...n})));
    newGrid.forEach(row => row.forEach(node => {
      if (node.type === 'start' || node.type === 'target') node.type = 'empty';
    }));
    const empties: GridNode[] = [];
    newGrid.forEach(row => row.forEach(node => { if (node.type === 'empty') empties.push(node); }));
    if (empties.length >= 2) {
      const idx1 = Math.floor(Math.random() * empties.length);
      let idx2 = Math.floor(Math.random() * empties.length);
      while(idx1 === idx2) idx2 = Math.floor(Math.random() * empties.length);
      empties[idx1].type = 'start';
      empties[idx2].type = 'target';
    } else {
      newGrid[0][0].type = 'start';
      newGrid[0][1].type = 'target';
    }
    grid.value = newGrid;
  };

  const clearTerrain = () => {
    pause();
    const newGrid = grid.value.map(r => r.map(n => ({...n})));
    newGrid.forEach(row => row.forEach(node => {
      if (node.type === 'wall' || node.type === 'weight') node.type = 'empty';
    }));
    grid.value = newGrid;
    clearPath();
  };

  const clearPath = () => {
    pause();
    const newGrid = grid.value.map(r => r.map(n => ({...n})));
    newGrid.forEach(row => row.forEach(node => {
      node.state = 'unvisited';
    }));
    grid.value = newGrid;
    registerBaseFrame();
  };

  const generateRandomWalls = () => {
    clearTerrain();
    const newGrid = grid.value.map(r => r.map(n => ({...n})));
    newGrid.forEach(row => row.forEach(node => {
      if (node.type === 'empty' && Math.random() < 0.28) {
        node.type = 'wall';
      }
    }));
    grid.value = newGrid;
    randomizeStartTarget();
    registerBaseFrame(); 
  };

  const generateRecursiveMaze = () => {
    clearTerrain();
    const newGrid = grid.value.map(r => r.map(n => ({...n})));
    // Fill full layout with walls unconditionally (safely erases old nodes)
    for (let r = 0; r < rows.value; r++) {
      for (let c = 0; c < cols.value; c++) {
         newGrid[r][c].type = 'wall';
      }
    }
    
    // Randomized DFS mapping onto grid
    const carve = (r: number, c: number) => {
      newGrid[r][c].type = 'empty';
      const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
      // Correct Fisher-Yates shuffle to safely evade inconsistent comparator TypeErrors
      for (let i = dirs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = dirs[i];
          dirs[i] = dirs[j];
          dirs[j] = tmp;
      }
      for(let [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if(nr > 0 && nr < rows.value - 1 && nc > 0 && nc < cols.value - 1) {
          if (newGrid[nr][nc].type === 'wall') {
            newGrid[r + dr/2][c + dc/2].type = 'empty';
            carve(nr, nc);
          }
        }
      }
    }
    
    // Carve starting from an odd cell offset
    carve(1, 1);
    grid.value = newGrid;
    
    // Force start and target validity 
    randomizeStartTarget();

    registerBaseFrame();
  };

  const clearSpecificType = (type: NodeType) => {
    grid.value.forEach(row => row.forEach(node => {
      if (node.type === type) node.type = 'empty';
    }));
  };

  const handleMouseDown = (node: GridNode) => {
    isMousePressed.value = true;
    
    if (drawMode.value === 'start' || drawMode.value === 'target') {
      dragType.value = drawMode.value;
      clearSpecificType(drawMode.value);
      node.type = drawMode.value;
    } else {
      if (node.type === 'start' || node.type === 'target') {
        dragType.value = node.type;
      } else if (node.type === drawMode.value) { 
        dragType.value = 'erase'; 
        node.type = 'empty'; 
      } else { 
        dragType.value = drawMode.value; 
        node.type = drawMode.value; 
      }
    }
    registerBaseFrame();
  };

  const handleMouseEnter = (node: GridNode) => {
    if (!isMousePressed.value) return;
    if (dragType.value === 'start' || dragType.value === 'target') {
      if (node.type !== 'start' && node.type !== 'target') {
        clearSpecificType(dragType.value);
        node.type = dragType.value;
      }
    } else if (dragType.value === 'wall' || dragType.value === 'weight') {
      if (node.type !== 'start' && node.type !== 'target') node.type = dragType.value;
    } else if (dragType.value === 'erase') {
      if (node.type === 'wall' || node.type === 'weight') node.type = 'empty';
    }
    registerBaseFrame();
  };

  const handleMouseUp = () => {
    isMousePressed.value = false;
    dragType.value = null;
  };

  const getStartAndTarget = (): { start: GridNode | null, target: GridNode | null } => {
    let start: GridNode | null = null;
    let target: GridNode | null = null;
    for (const row of grid.value) {
      for (const node of row) {
        if (node.type === 'start') start = node;
        if (node.type === 'target') target = node;
      }
    }
    return { start, target };
  };

  const prepareAlgorithm = (algo: string) => {
    clearPathForRun();
    const { start, target } = getStartAndTarget();
    if (!start || !target) return false;
    
    const algoFn = pathAlgorithms[algo];
    if (!algoFn) return false;

    const startTime = performance.now();
    const frames: PathVisualizationFrame[] = [];
    
    let currentGrid = timeline.value[0].grid.map(row => row.map(node => ({...node})));
    let explores = 0;
    let paths = 0;
    let lastLine = 0;
    frames.push({ grid: currentGrid, nodesExplored: 0, pathLength: 0, variables: {} });
    
    const algoGrid = currentGrid.map(row => row.map(node => ({...node})));
    const gridStart = algoGrid[start.row][start.col];
    const gridTarget = algoGrid[target.row][target.col];
    const generator = algoFn(algoGrid, gridStart, gridTarget);

    let iter = generator.next();
    while(!iter.done) {
      const action = iter.value;
      if (action.highlightLine) lastLine = action.highlightLine;
      const nextGrid = currentGrid.map(row => row.map(node => ({...node})));
      
      action.nodes.forEach(rn => {
        const targetNode = nextGrid[rn.row][rn.col];
        if (targetNode) targetNode.state = action.type;
      });

      if (action.type === 'visited') explores++;
      if (action.type === 'path') paths++;

      frames.push({
        grid: nextGrid,
        nodesExplored: explores,
        pathLength: paths,
        variables: action.variables || {},
        activeLine: lastLine
      });

      currentGrid = nextGrid;
      iter = generator.next();
    }

    executionTime.value = Math.floor(performance.now() - startTime);
    timeline.value = frames;
    cachedAlgo = algo;
    currentFrameIndex.value = 0;
    applyFrame(frames[0]);
    return true;
  };

  const clearPathForRun = () => {
    for (let r = 0; r < rows.value; r++) {
      for (let c = 0; c < cols.value; c++) {
        grid.value[r][c].state = 'unvisited';
      }
    }
  };

  const step = (algo: string) => {
    if (timeline.value.length <= 1 || cachedAlgo !== algo) {
      if (!prepareAlgorithm(algo)) return;
    }
    if (currentFrameIndex.value < timeline.value.length - 1) {
      currentFrameIndex.value++;
      applyFrame(timeline.value[currentFrameIndex.value]);
    } else pause();
  };

  const stepBack = () => {
    pause();
    if (currentFrameIndex.value > 0) {
      currentFrameIndex.value--;
      applyFrame(timeline.value[currentFrameIndex.value]);
    }
  };

  const play = (algo: string) => {
    if (timeline.value.length <= 1 || cachedAlgo !== algo) {
      if (!prepareAlgorithm(algo)) return;
    }
    isPlaying.value = true;
    
    playInterval = window.setInterval(() => {
      if (!isPlaying.value || currentFrameIndex.value >= timeline.value.length - 1) {
        clearInterval(playInterval!);
        isPlaying.value = false;
        return;
      }
      currentFrameIndex.value++;
      applyFrame(timeline.value[currentFrameIndex.value]);
    }, 15) as unknown as number;
  };

  const pause = () => {
    isPlaying.value = false;
    if (playInterval !== null) {
        clearInterval(playInterval);
        playInterval = null;
    }
  };

  return {
    grid, rows, cols, nodesExplored, pathLength, executionTime, isPlaying, currentVariables, activeLine, drawMode,
    initGrid, clearTerrain, clearPath, generateRandomWalls, generateRecursiveMaze, handleMouseDown, handleMouseEnter, handleMouseUp,
    step, stepBack, play, pause
  };
}
