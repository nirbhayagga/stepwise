<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue';
import PageHeader from '../components/common/PageHeader.vue';
import CodeEditor from '../components/sandbox/CodeEditor.vue';
import SortingCanvas from '../components/sorting/SortingCanvas.vue';
import SortingLegend from '../components/sorting/SortingLegend.vue';
import GridDisplay from '../components/pathfinding/GridDisplay.vue';
import PathfindingLegend from '../components/pathfinding/PathfindingLegend.vue';
import { SORT_STATE, randomValues } from '../algorithms/sorting';
import { NODE_STATE } from '../algorithms/pathfinding';

const SORT_EXAMPLE = `// visualizer.array          the values (mutable)
// await visualizer.compare(i, j)   highlight two indices
// await visualizer.swap(i, j)      swap and highlight
// await visualizer.write(i, v)     set array[i] = v
// await visualizer.sorted(i)       mark index i final
// visualizer.log(...)              print to the log

const a = visualizer.array;
const n = a.length;
for (let i = 0; i < n - 1; i++) {
  let min = i;
  for (let j = i + 1; j < n; j++) {
    await visualizer.compare(j, min);
    if (a[j] < a[min]) min = j;
  }
  if (min !== i) await visualizer.swap(i, min);
  await visualizer.sorted(i);
}
await visualizer.sorted(n - 1);
visualizer.log('done', a.join(' '));`;

const PATH_EXAMPLE = `// visualizer.rows, visualizer.cols
// await visualizer.frontier(r, c)  mark a cell as queued
// await visualizer.visit(r, c)     mark a cell as expanded
// await visualizer.path(r, c)      mark a cell on the final path

const { rows, cols } = visualizer;
const start = [Math.floor(rows / 2), 2];
const goal = [Math.floor(rows / 2) - 4, cols - 4];
const key = (r, c) => r + ',' + c;
const seen = new Set([key(...start)]);
const parent = new Map();
const queue = [start];
while (queue.length) {
  const [r, c] = queue.shift();
  await visualizer.visit(r, c);
  if (r === goal[0] && c === goal[1]) break;
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen.has(key(nr, nc))) continue;
    seen.add(key(nr, nc));
    parent.set(key(nr, nc), key(r, c));
    await visualizer.frontier(nr, nc);
    queue.push([nr, nc]);
  }
}
for (let k = key(...goal); k; k = parent.get(k)) {
  const [r, c] = k.split(',').map(Number);
  await visualizer.path(r, c);
}`;

type Mode = 'sort' | 'path';
const ROWS = 19, COLS = 41, N = 40;

const mode = ref<Mode>('sort');
const code = ref(SORT_EXAMPLE);
const speed = ref(50);
const running = ref(false);
const error = ref('');
const log = ref<string[]>([]);

const values = shallowRef(new Uint16Array(N));
const sortStates = shallowRef(new Uint8Array(N));
const cells = new Uint8Array(ROWS * COLS);
const gridStates = shallowRef(new Uint8Array(ROWS * COLS));
let worker: Worker | null = null;

const resetCanvas = () => {
  values.value = Uint16Array.from(randomValues(N));
  sortStates.value = new Uint8Array(N);
  gridStates.value = new Uint8Array(ROWS * COLS);
};

const setSortState = (indices: number[], s: number, clear = true) => {
  const next = clear ? Uint8Array.from(sortStates.value, v => (v === SORT_STATE.sorted ? v : 0)) : Uint8Array.from(sortStates.value);
  for (const i of indices) if (i >= 0 && i < N) next[i] = s;
  sortStates.value = next;
};
const setGridState = (r: number, c: number, s: number) => {
  if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return;
  const next = Uint8Array.from(gridStates.value);
  next[r * COLS + c] = s;
  gridStates.value = next;
};

const spawn = () => {
  worker?.terminate();
  worker = new Worker(new URL('../workers/sandboxWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data;
    switch (m.action) {
      case 'compare': setSortState([m.i, m.j], SORT_STATE.compare); break;
      case 'swap': {
        const v = Uint16Array.from(values.value);
        [v[m.i], v[m.j]] = [v[m.j], v[m.i]];
        values.value = v;
        setSortState([m.i, m.j], SORT_STATE.write);
        break;
      }
      case 'write': {
        const v = Uint16Array.from(values.value);
        v[m.i] = m.value;
        values.value = v;
        setSortState([m.i], SORT_STATE.write);
        break;
      }
      case 'mark': setSortState([m.i], SORT_STATE.mark); break;
      case 'sorted': setSortState([m.i], SORT_STATE.sorted, false); break;
      case 'visit': setGridState(m.r, m.c, NODE_STATE.visited); break;
      case 'frontier': setGridState(m.r, m.c, NODE_STATE.frontier); break;
      case 'path': setGridState(m.r, m.c, NODE_STATE.path); break;
      case 'log': log.value = [...log.value, m.text]; break;
      case 'error': error.value = m.message; running.value = false; break;
      case 'finish':
        running.value = false;
        if (mode.value === 'sort') sortStates.value = new Uint8Array(N).fill(SORT_STATE.sorted);
        break;
    }
  };
};

const run = () => {
  if (running.value) return;
  resetCanvas();
  error.value = '';
  log.value = [];
  running.value = true;
  worker?.postMessage({
    type: 'execute', code: code.value, speed: speed.value,
    array: Array.from(values.value), rows: ROWS, cols: COLS,
  });
};
const stop = () => { running.value = false; spawn(); };

watch(mode, m => { stop(); code.value = m === 'sort' ? SORT_EXAMPLE : PATH_EXAMPLE; resetCanvas(); error.value = ''; log.value = []; });
watch(speed, s => worker?.postMessage({ type: 'update-speed', speed: s }));

const gridStart = computed(() => Math.floor(ROWS / 2) * COLS + 2);
const gridGoal = computed(() => (Math.floor(ROWS / 2) - 4) * COLS + (COLS - 4));

onMounted(() => { resetCanvas(); spawn(); });
onUnmounted(() => worker?.terminate());
</script>

<template>
  <div class="view">
    <PageHeader title="Sandbox" subtitle="Write your own algorithm against the visualizer API. Code runs in a Web Worker, so an infinite loop cannot freeze the page; Stop terminates the worker." />

    <div class="panel toolbar">
      <label class="field">
        <span>Canvas</span>
        <select class="select" v-model="mode" :disabled="running">
          <option value="sort">Array (sorting)</option>
          <option value="path">Grid (pathfinding)</option>
        </select>
      </label>
      <button class="btn btn-primary" :disabled="running" @click="run">Run</button>
      <button class="btn btn-danger" :disabled="!running" @click="stop">Stop</button>
      <label class="field">
        <span>Speed</span>
        <input type="range" class="range" min="1" max="100" v-model.number="speed" />
      </label>
      <span v-if="running" class="muted status">running…</span>
    </div>

    <div class="split">
      <div class="split-pane">
        <CodeEditor v-model:code="code" :disabled="running" />
        <div v-if="error" class="panel panel-body error-text mono">{{ error }}</div>
        <div v-if="log.length" class="panel logs mono">
          <div class="panel-title">Log</div>
          <div class="panel-body"><div v-for="(l, i) in log" :key="i">{{ l }}</div></div>
        </div>
      </div>
      <div class="split-pane">
        <template v-if="mode === 'sort'">
          <SortingCanvas :values="values" :states="sortStates" :height="360" />
          <SortingLegend />
        </template>
        <template v-else>
          <GridDisplay :rows="ROWS" :cols="COLS" :cells="cells" :states="gridStates" :start="gridStart" :target="gridGoal" />
          <PathfindingLegend />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status { align-self: center; padding-bottom: 6px; font-size: 12px; }
.logs .panel-body { max-height: 160px; overflow: auto; font-size: 12px; white-space: pre-wrap; }
</style>
