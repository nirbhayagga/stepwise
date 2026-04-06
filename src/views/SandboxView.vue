<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import CodeEditor from '../components/sandbox/CodeEditor.vue';
import SortingCanvas from '../components/sorting/SortingCanvas.vue';
import GridDisplay from '../components/pathfinding/GridDisplay.vue';
import type { ArrayBar } from '../composables/useSorting';
import type { GridNode } from '../composables/usePathfinding';

const defaultSortingCode = `// Write custom iterative logic using visualizer API
// visualizer.compare(i, j) => highlight comparison
// visualizer.swap(i, j) => swap array values
// 'visualizer.array' contains the initial numerical values

const n = visualizer.array.length;
for(let i = 0; i < n; i++) {
  for(let j = i + 1; j < n; j++) {
    await visualizer.compare(i, j);
    // Reverse sort simple implementation
    if (visualizer.array[j] > visualizer.array[i]) {
       await visualizer.swap(i, j);
       // swap the actual values locally too
       const temp = visualizer.array[i];
       visualizer.array[i] = visualizer.array[j];
       visualizer.array[j] = temp;
    }
  }
}`;

const defaultPathCode = `// visualizer.visit(r, c) => highlight visiting grid node
for(let r = 0; r < visualizer.rows; r++) {
  for(let c = 0; c < visualizer.cols; c++) {
    await visualizer.visit(r, c);
  }
}`;

const mode = ref<'sort' | 'path'>('sort');
const code = ref(defaultSortingCode);
const isRunning = ref(false);
const array = ref<ArrayBar[]>([]);
const grid = ref<GridNode[][]>([]);
let worker: Worker | null = null;
const errorMsg = ref('');

const initArray = () => {
  array.value = Array.from({ length: 50 }, () => ({
    value: Math.floor(Math.random() * 95) + 5,
    state: 'default',
    id: crypto.randomUUID()
  }));
};

const initGrid = () => {
  const newGrid: GridNode[][] = [];
  for (let r = 0; r < 20; r++) {
    const currentRow: GridNode[] = [];
    for (let c = 0; c < 45; c++) {
      currentRow.push({ row: r, col: c, type: 'empty', state: 'unvisited', id: `${r}-${c}` });
    }
    newGrid.push(currentRow);
  }
  grid.value = newGrid;
};

watch(mode, (newMode) => {
  if (newMode === 'sort') {
    code.value = defaultSortingCode;
    initArray();
  } else {
    code.value = defaultPathCode;
    initGrid();
  }
});

const setupWorker = () => {
  worker = new Worker(new URL('../workers/sandboxWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const { action, i, j, r, c, message } = e.data;
    
    if (mode.value === 'sort') {
      if (action !== 'visit') {
        array.value.forEach(b => b.state = 'default');
      }

      if (action === 'compare') {
        if(array.value[i]) array.value[i].state = 'comparing';
        if(array.value[j]) array.value[j].state = 'comparing';
      } else if (action === 'swap') {
        if(array.value[i]) array.value[i].state = 'swapping';
        if(array.value[j]) array.value[j].state = 'swapping';
        
        const temp = array.value[i].value;
        array.value[i].value = array.value[j].value;
        array.value[j].value = temp;
      }
    } else {
      if (action === 'visit') {
        if (grid.value[r] && grid.value[r][c]) {
          grid.value[r][c].state = 'visited';
        }
      }
    }

    if (action === 'error') {
      errorMsg.value = message;
      isRunning.value = false;
    } else if (action === 'finish') {
      isRunning.value = false;
      if (mode.value === 'sort') {
        array.value.forEach(b => b.state = 'sorted');
      }
    } // else ignore finish for pathfinding default
  };
};

onMounted(() => {
  initArray();
  setupWorker();
});

onUnmounted(() => {
  worker?.terminate();
});

const onRun = () => {
  if (isRunning.value) return;
  isRunning.value = true;
  errorMsg.value = '';
  
  let executableCode = code.value;

  if (mode.value === 'sort') {
    initArray();
    const serializedArray = JSON.stringify(array.value.map(b => b.value));
    executableCode = `visualizer.array = ${serializedArray};\n${executableCode}`;
  } else {
    initGrid();
    executableCode = `visualizer.rows = 20; visualizer.cols = 45;\n${executableCode}`;
  }

  worker?.postMessage({ type: 'execute', code: executableCode, speed: 50 });
};

const onStop = () => {
  isRunning.value = false;
  worker?.terminate();
  setupWorker();
};

const updateSpeed = (val: number) => {
  worker?.postMessage({ type: 'update-speed', speed: val });
};

</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Custom Sandbox Environment</h1>
      <p class="description">Write arbitrary logic safely using Javascript and interact directly with the visualizer API.</p>
    </div>

    <div class="top-controls">
      <label class="mode-select">
        Sandbox Mode
        <select v-model="mode" :disabled="isRunning">
          <option value="sort">Sorting Algorithms</option>
          <option value="path">Pathfinding Traversal</option>
        </select>
      </label>
    </div>

    <div class="sandbox-layout">
      <div class="editor-section">
        <CodeEditor v-model:code="code" />
        <div class="controls">
          <button @click="onRun" :disabled="isRunning" class="btn-success">Run Custom Code</button>
          <button @click="onStop" :disabled="!isRunning" class="btn-danger">Stop Execution</button>
          <label class="speed-label">
            Pacing Speed
            <input type="range" min="1" max="100" value="50" @input="(e) => updateSpeed(Number((e.target as HTMLInputElement).value))" />
          </label>
        </div>
        <div v-if="errorMsg" class="error-banner">
          {{ errorMsg }}
        </div>
      </div>
      
      <div class="visualizer-section">
        <SortingCanvas v-if="mode === 'sort'" :bars="array" />
        <GridDisplay v-else :grid="grid" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { max-width: 1300px; margin: 0 auto; display: flex; flex-direction: column; }
.top-controls { margin-bottom: 20px; }
.mode-select {
  display: flex; flex-direction: column; width: 250px;
  font-weight: bold; color: #c9d1d9; font-size: 14px;
}
.mode-select select {
  margin-top: 8px; padding: 10px; background-color: #21262d; border: 1px solid #30363d;
  color: #c9d1d9; border-radius: 6px; font-weight: bold;
}
.sandbox-layout { display: flex; gap: 30px; align-items: flex-start; }
.editor-section { flex: 1; display: flex; flex-direction: column; gap: 15px; }
.visualizer-section { flex: 1; min-width: 500px; }
.controls {
  display: flex; gap: 15px; background-color: #161b22; padding: 15px;
  border-radius: 8px; border: 1px solid #30363d; align-items: center;
}
button {
  padding: 10px 16px; border-radius: 6px; font-weight: bold;
  cursor: pointer; border: 1px solid transparent;
}
button:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-success { background-color: #238636; border-color: #2ea043; color: white; }
.btn-danger { background-color: #da3633; border-color: #f85149; color: white; }
.speed-label { color: #c9d1d9; font-weight: bold; font-size: 13px; display: flex; flex-direction: column; }
.error-banner {
  background-color: #f8514933; border: 1px solid #f85149; color: #ff7b72;
  padding: 12px; border-radius: 6px; font-family: monospace;
}
.header { margin-bottom: 15px; }
h1 { margin-top: 0; margin-bottom: 8px; color: #c9d1d9; font-size: 32px; }
.description { color: #8b949e; margin: 0; font-size: 16px; }
</style>
