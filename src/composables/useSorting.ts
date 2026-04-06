import { ref, computed } from 'vue';
import { algorithms } from '../utils/sortingAlgorithms';

export type BarState = 'default' | 'comparing' | 'swapping' | 'sorted';

export interface ArrayBar {
  value: number;
  state: BarState;
  id: string;
}

export interface VisualizationFrame {
  bars: ArrayBar[];
  comparisons: number;
  swaps: number;
  variables: Record<string, any>;
  activeLine?: number;
}

export function useSorting() {
  const array = ref<ArrayBar[]>([]);
  const timeline = ref<VisualizationFrame[]>([]);
  const currentFrameIndex = ref(0);

  const isPlaying = ref(false);
  let playInterval: number | null = null;
  const executionTime = ref(0);
  let cachedAlgo = '';

  const comparisons = computed(() => timeline.value[currentFrameIndex.value]?.comparisons || 0);
  const swaps = computed(() => timeline.value[currentFrameIndex.value]?.swaps || 0);
  const currentVariables = computed(() => timeline.value[currentFrameIndex.value]?.variables || {});
  const activeLine = computed(() => timeline.value[currentFrameIndex.value]?.activeLine || null);

  const generateArray = (size: number) => {
    pause();
    const initBars = Array.from({ length: size }, () => ({
      value: Math.floor(Math.random() * 95) + 5,
      state: 'default' as BarState,
      id: crypto.randomUUID()
    }));
    array.value = initBars;
    timeline.value = [{ bars: initBars, comparisons: 0, swaps: 0, variables: {} }];
    currentFrameIndex.value = 0;
    executionTime.value = 0;
  };

  const setArray = (values: number[]) => {
    pause();
    const initBars = values.map(v => ({
      value: v, state: 'default' as BarState, id: crypto.randomUUID()
    }));
    array.value = initBars;
    timeline.value = [{ bars: initBars, comparisons: 0, swaps: 0, variables: {} }];
    currentFrameIndex.value = 0;
    executionTime.value = 0;
  };

  const applyFrame = (frame: VisualizationFrame) => {
    array.value = frame.bars;
  };

  const prepareAlgorithm = (algo: string) => {
    pause();
    const algoFn = algorithms[algo];
    if (!algoFn) return;
    
    const startTime = performance.now();
    const frames: VisualizationFrame[] = [];
    
    let currentBars = timeline.value[0].bars.map(b => ({...b, state: 'default' as BarState}));
    let compCount = 0;
    let swpCount = 0;
    let lastLine = 0;
    
    frames.push({ bars: currentBars, comparisons: compCount, swaps: swpCount, variables: {} });
    
    const algoArray = currentBars.map(b => ({...b}));
    const generator = algoFn(algoArray); 
    
    let iter = generator.next();
    while(!iter.done) {
       const action = iter.value;
       if (action.highlightLine) lastLine = action.highlightLine;
       
       const nextBars = currentBars.map((b, idx) => ({
         ...b, 
         value: algoArray[idx].value, 
         state: (b.state === 'sorted' ? 'sorted' : 'default') as BarState
       }));
       
       if (action.type === 'compare') {
         compCount++;
         action.indices.forEach(i => { if (nextBars[i]) nextBars[i].state = 'comparing'; });
       } else if (action.type === 'swap') {
         swpCount++;
         action.indices.forEach(i => { if (nextBars[i]) nextBars[i].state = 'swapping'; });
       } else if (action.type === 'sorted') {
         action.indices.forEach(i => { if (nextBars[i]) nextBars[i].state = 'sorted'; });
       }

       frames.push({
         bars: nextBars,
         comparisons: compCount,
         swaps: swpCount,
         variables: action.variables || {},
         activeLine: lastLine
       });
       
       currentBars = nextBars;
       iter = generator.next(); 
    }
    executionTime.value = Math.floor(performance.now() - startTime);
    timeline.value = frames;
    cachedAlgo = algo;
    currentFrameIndex.value = 0;
    applyFrame(frames[0]);
  };

  const step = (algo: string) => {
    if (timeline.value.length <= 1 || cachedAlgo !== algo) prepareAlgorithm(algo);
    if (currentFrameIndex.value < timeline.value.length - 1) {
      currentFrameIndex.value++;
      applyFrame(timeline.value[currentFrameIndex.value]);
    } else {
      pause();
    }
  };

  const stepBack = () => {
    pause();
    if (currentFrameIndex.value > 0) {
      currentFrameIndex.value--;
      applyFrame(timeline.value[currentFrameIndex.value]);
    }
  };

  const play = (algo: string, speed: number) => {
    if (timeline.value.length <= 1 || cachedAlgo !== algo) prepareAlgorithm(algo);
    isPlaying.value = true;
    
    // speed multiplier mapping
    const delayMs = Math.max(10, 1000 - (speed * 9.9));
    
    playInterval = window.setInterval(() => {
      if (!isPlaying.value || currentFrameIndex.value >= timeline.value.length - 1) {
        clearInterval(playInterval!);
        isPlaying.value = false;
        return;
      }
      currentFrameIndex.value++;
      applyFrame(timeline.value[currentFrameIndex.value]);
    }, delayMs) as unknown as number;
  };

  const pause = () => {
    isPlaying.value = false;
    if (playInterval !== null) {
        clearInterval(playInterval);
        playInterval = null;
    }
  };

  const resetGenerator = () => {
    pause();
    currentFrameIndex.value = 0;
    applyFrame(timeline.value[0]);
  };

  return { 
    array, comparisons, swaps, executionTime, isPlaying, currentVariables, activeLine,
    generateArray, setArray, step, stepBack, play, pause, resetGenerator
  };
}
