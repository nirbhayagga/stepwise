import { ref, computed } from 'vue';
import { treeAlgorithms, TreeAction, TreeNode } from '../utils/treeAlgorithms';

export interface TreeVisualizationFrame {
  root: TreeNode | null;
  variables: Record<string, any>;
  activeLine?: number;
}

export function useTree() {
  const root = ref<TreeNode | null>(null);
  const timeline = ref<TreeVisualizationFrame[]>([]);
  const currentFrameIndex = ref(0);
  
  const isPlaying = ref(false);
  let playInterval: number | null = null;
  const executionTime = ref(0);
  let cachedAlgo = '';

  const currentVariables = computed(() => timeline.value[currentFrameIndex.value]?.variables || {});
  const activeLine = computed(() => timeline.value[currentFrameIndex.value]?.activeLine || null);

  const applyFrame = (frame: TreeVisualizationFrame) => {
    if (!frame) return;
    root.value = frame.root;
  };

  const registerBaseFrame = () => {
    timeline.value = [{ root: null, variables: {} }];
    currentFrameIndex.value = 0;
    executionTime.value = 0;
  };

  const prepareAlgorithm = (algo: string, args: any[]) => {
    const algoFn = treeAlgorithms[algo as keyof typeof treeAlgorithms];
    if (!algoFn) return false;

    const startTime = performance.now();
    const frames: TreeVisualizationFrame[] = [];
    frames.push({ root: null, variables: {} });
    
    // @ts-ignore
    const generator = algoFn(...args);
    let lastLine = 0;

    let iter = generator.next();
    while(!iter.done) {
      const action = iter.value as TreeAction;
      if (action.highlightLine) lastLine = action.highlightLine;
      frames.push({
        root: action.root,
        variables: action.variables || {},
        activeLine: lastLine
      });
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
    }, 450) as unknown as number; // Tree nodes should animate slowly to see traversal
  };

  const pause = () => {
    isPlaying.value = false;
    if (playInterval !== null) {
        clearInterval(playInterval);
        playInterval = null;
    }
  };
  
  const resetTree = () => {
    pause();
    root.value = null;
    registerBaseFrame();
  };

  return {
    root, executionTime, isPlaying, currentVariables, activeLine,
    resetTree, step, stepBack, play, pause, prepareAlgorithm
  };
}
