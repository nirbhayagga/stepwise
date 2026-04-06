<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { usePathfinding } from '../composables/usePathfinding';
import GridDisplay from '../components/pathfinding/GridDisplay.vue';
import MetricsDashboard from '../components/layout/MetricsDashboard.vue';

const algoA = ref('dijkstra');
const algoB = ref('astar');
const rows = ref(21);
const cols = ref(55);

const pathA = usePathfinding();
const pathB = usePathfinding();

const isPlaying = ref(false);
let checkInterval: number | null = null;

const syncBoards = () => {
  pathB.rows.value = pathA.rows.value;
  pathB.cols.value = pathA.cols.value;
  pathB.grid.value = pathA.grid.value.map(r => r.map(n => ({...n})));
  pathA.clearPath();
  pathB.clearPath();
};

const onGenerateWalls = () => {
  onPause();
  pathA.rows.value = rows.value; pathA.cols.value = cols.value;
  pathA.initGrid();
  pathA.generateRandomWalls();
  syncBoards();
};

const onGenerateMaze = () => {
  onPause();
  pathA.rows.value = rows.value; pathA.cols.value = cols.value;
  pathA.initGrid();
  pathA.generateRecursiveMaze();
  syncBoards();
};

const onClear = () => {
  onPause();
  pathA.rows.value = rows.value; pathA.cols.value = cols.value;
  pathA.initGrid();
  syncBoards();
};

onMounted(() => { 
  pathA.initGrid(); 
  pathB.initGrid(); 
});

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval);
});

const onPlay = () => {
  isPlaying.value = true;
  pathA.play(algoA.value);
  pathB.play(algoB.value);
  
  checkInterval = window.setInterval(() => {
    if (!pathA.isPlaying.value && !pathB.isPlaying.value) {
      isPlaying.value = false;
      if (checkInterval) clearInterval(checkInterval);
    }
  }, 100);
};

const onPause = () => {
  isPlaying.value = false;
  pathA.pause();
  pathB.pause();
};

const onStep = () => {
  pathA.step(algoA.value);
  pathB.step(algoB.value);
};

const onStepBack = () => {
  pathA.stepBack();
  pathB.stepBack();
};

const onReset = () => {
  onPause();
  pathA.clearPath();
  pathB.clearPath();
};

</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Pathfinding Comparison</h1>
      <p class="description">Race pathfinding algorithms head-to-head on identical grid constraints to analyze heuristic efficiencies.</p>
    </div>

    <div class="controls-panel">
      <!-- Sync Controls -->
      <div class="control-group">
        <label>Generators:</label>
        <button @click="onGenerateWalls" class="btn-primary">Sync Random Walls</button>
        <button @click="onGenerateMaze" class="btn-primary">Sync Recursive Maze</button>
        <button @click="onClear">Clear Grids</button>
      </div>
      <div class="control-group">
        <label>
          Cols: {{ cols }}
          <input type="range" min="10" max="80" v-model="cols" @change="onClear" />
        </label>
        <label>
          Rows: {{ rows }}
          <input type="range" min="10" max="40" v-model="rows" @change="onClear" />
        </label>
      </div>
      <div class="control-group playback">
        <button @click="onStepBack" :disabled="isPlaying">Step Back</button>
        <button @click="onStep" :disabled="isPlaying">Step Forward</button>
        <button v-if="!isPlaying" @click="onPlay" class="btn-success">Play Simultaneously</button>
        <button v-else @click="onPause" class="btn-danger">Pause</button>
        <button @click="onReset">Reset</button>
      </div>
    </div>

    <div class="split-layout">
      <!-- View A -->
      <div class="split-pane">
        <div class="pane-header">
           <select v-model="algoA" :disabled="isPlaying" @change="pathA.clearPath()">
             <option value="dijkstra">Dijkstra's Algorithm</option>
             <option value="astar">A* Search</option>
             <option value="greedy">Greedy Best-First</option>
             <option value="bidir">Bidirectional Search</option>
             <option value="bfs">Breadth-First Search</option>
             <option value="dfs">Depth-First Search</option>
           </select>
        </div>
        <MetricsDashboard 
          metric1Label="Nodes Explored" :metric1Value="pathA.nodesExplored.value"
          metric2Label="Path Length" :metric2Value="pathA.pathLength.value"
          :timeMs="pathA.executionTime.value"
        />
        <GridDisplay :grid="pathA.grid.value" />
      </div>

      <!-- View B -->
      <div class="split-pane">
        <div class="pane-header">
           <select v-model="algoB" :disabled="isPlaying" @change="pathB.clearPath()">
             <option value="dijkstra">Dijkstra's Algorithm</option>
             <option value="astar">A* Search</option>
             <option value="greedy">Greedy Best-First</option>
             <option value="bidir">Bidirectional Search</option>
             <option value="bfs">Breadth-First Search</option>
             <option value="dfs">Depth-First Search</option>
           </select>
        </div>
        <MetricsDashboard 
          metric1Label="Nodes Explored" :metric1Value="pathB.nodesExplored.value"
          metric2Label="Path Length" :metric2Value="pathB.pathLength.value"
          :timeMs="pathB.executionTime.value"
        />
        <GridDisplay :grid="pathB.grid.value" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { max-width: 1500px; margin: 0 auto; display: flex; flex-direction: column; }
.header { margin-bottom: 20px; }
h1 { margin-top: 0; margin-bottom: 8px; color: #c9d1d9; font-size: 32px; }
.description { color: #8b949e; margin: 0; font-size: 16px; }
.controls-panel { display: flex; flex-wrap: wrap; gap: 24px; background-color: #161b22; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #30363d; }
.control-group { display: flex; align-items: center; gap: 12px; }
button { background-color: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: opacity 0.2s; }
button:hover:not(:disabled) { opacity: 0.8; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background-color: #1f6feb; border-color: #388bfd; color: white; }
.btn-success { background-color: #238636; border-color: #2ea043; color: white; }
.btn-danger { background-color: #da3633; border-color: #f85149; color: white; }
label { display: flex; flex-direction: column; font-size: 13px; font-weight: bold; color: #c9d1d9; }
input[type=range] { margin-top: 6px; }

.split-layout { display: flex; gap: 20px; flex-wrap: wrap; }
.split-pane { flex: 1; min-width: 400px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #30363d; padding: 10px; border-radius: 8px; background-color: #0d1117; }
.pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
select { background-color: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 10px; border-radius: 6px; font-weight: bold; width: 100%; font-size: 16px; cursor: pointer; }
</style>
