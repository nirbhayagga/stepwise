import { ref, computed } from 'vue';
import { dpAlgorithms, DPAction } from '../utils/dpAlgorithms';

export type CellState = 'default' | 'eval' | 'set' | 'source';

export interface DPCell {
  row: number;
  col: number;
  value: string;
  state: CellState;
  id: string;
}

export interface DPVisualizationFrame {
  matrix: DPCell[][];
  variables: Record<string, any>;
  activeLine?: number;
}

export function useDP() {
  const matrix = ref<DPCell[][]>([]);
  const timeline = ref<DPVisualizationFrame[]>([]);
  const currentFrameIndex = ref(0);
  
  const isPlaying = ref(false);
  let playInterval: number | null = null;
  const executionTime = ref(0);
  let cachedAlgo = '';

  const currentVariables = computed(() => timeline.value[currentFrameIndex.value]?.variables || {});
  const activeLine = computed(() => timeline.value[currentFrameIndex.value]?.activeLine || null);

  const applyFrame = (frame: DPVisualizationFrame) => {
    if (!frame) return;
    matrix.value = frame.matrix;
  };

  const registerBaseFrame = () => {
    timeline.value = [{ matrix: matrix.value.map(r => r.map(c => ({...c}))), variables: {} }];
    currentFrameIndex.value = 0;
    executionTime.value = 0;
  };

  const initMatrix = (rows: number, cols: number) => {
    pause();
    const newMatrix: DPCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const currentRow: DPCell[] = [];
      for (let c = 0; c < cols; c++) {
        currentRow.push({ row: r, col: c, value: '', state: 'default', id: `${r}-${c}` });
      }
      newMatrix.push(currentRow);
    }
    matrix.value = newMatrix;
    registerBaseFrame();
  };

  const prepareAlgorithm = (algo: string, args: any[]) => {
    const algoFn = dpAlgorithms[algo as keyof typeof dpAlgorithms];
    if (!algoFn) return false;

    const startTime = performance.now();
    const frames: DPVisualizationFrame[] = [];
    
    let currentMatrix = timeline.value[0].matrix.map(row => row.map(cell => ({...cell})));
    frames.push({ matrix: currentMatrix, variables: {} });
    
    // @ts-ignore
    const generator = algoFn(...args);
    let lastLine = 0;

    let iter = generator.next();
    while(!iter.done) {
      const action = iter.value as DPAction;
      if (action.highlightLine) lastLine = action.highlightLine;
      const nextMatrix = currentMatrix.map(row => row.map(cell => ({...cell, state: 'default' as CellState})));
      
      const targetCell = nextMatrix[action.row - 1][action.col - 1]; // Offset index if 1-based logic
      
      if (action.compareSource) {
        action.compareSource.forEach(src => {
          if (nextMatrix[src.r - 1] && nextMatrix[src.r - 1][src.c - 1]) {
             nextMatrix[src.r - 1][src.c - 1].state = 'source';
          }
        });
      }

      if (targetCell) {
        targetCell.value = String(action.value);
        targetCell.state = 'set';
      }

      frames.push({
        matrix: nextMatrix,
        variables: action.variables || {},
        activeLine: lastLine
      });

      currentMatrix = nextMatrix;
      iter = generator.next();
    }

    executionTime.value = Math.floor(performance.now() - startTime);
    timeline.value = frames;
    cachedAlgo = algo;
    currentFrameIndex.value = 0;
    applyFrame(frames[0]);
    return true;
  };

  const step = (algo: string, args: any[]) => {
    if (timeline.value.length <= 1 || cachedAlgo !== algo) {
      if (!prepareAlgorithm(algo, args)) return;
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

  const play = (algo: string, args: any[]) => {
    if (timeline.value.length <= 1 || cachedAlgo !== algo) {
      if (!prepareAlgorithm(algo, args)) return;
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
    }, 100) as unknown as number;
  };

  const pause = () => {
    isPlaying.value = false;
    if (playInterval !== null) {
        clearInterval(playInterval);
        playInterval = null;
    }
  };

  return {
    matrix, executionTime, isPlaying, currentVariables, activeLine,
    initMatrix, step, stepBack, play, pause, prepareAlgorithm
  };
}
