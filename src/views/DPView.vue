<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDP } from '../composables/useDP';
import DPMatrixBoard from '../components/dp/DPMatrixBoard.vue';
import WatchWindow from '../components/layout/WatchWindow.vue';
import PseudocodePanel from '../components/layout/PseudocodePanel.vue';
import { algorithmPseudocode } from '../utils/pseudocode';

const currentAlgorithm = ref<'knapsack' | 'lcs'>('knapsack');
const pseudoCode = computed(() => algorithmPseudocode[currentAlgorithm.value] || []);

// State
const knapsack_weights = ref('1,2,3');
const knapsack_values = ref('10,15,40');
const knapsack_W = ref(6);

const lcs_s1 = ref('AGGTAB');
const lcs_s2 = ref('GXTXAYB');

const {
  matrix, isPlaying, currentVariables, activeLine,
  initMatrix, step, stepBack, play, pause
} = useDP();

const getConfigArgs = () => {
    if (currentAlgorithm.value === 'knapsack') {
        const w = knapsack_weights.value.split(',').map(Number);
        const v = knapsack_values.value.split(',').map(Number);
        const W = knapsack_W.value;
        return { args: [w, v, W], rows: w.length + 1, cols: W + 1 };
    } else {
        const s1 = lcs_s1.value;
        const s2 = lcs_s2.value;
        return { args: [s1, s2], rows: s1.length + 1, cols: s2.length + 1 };
    }
};

const setupMatrix = () => {
    const { rows, cols } = getConfigArgs();
    initMatrix(rows, cols);
};

onMounted(setupMatrix);

const onPlay = () => { const { args } = getConfigArgs(); play(currentAlgorithm.value, args); };
const onPause = () => { pause(); };
const onStep = () => { const { args } = getConfigArgs(); step(currentAlgorithm.value, args); };
const onStepBack = () => { stepBack(); };
const onReset = () => { setupMatrix(); };

const switchAlgo = (val: 'knapsack' | 'lcs') => {
    currentAlgorithm.value = val;
    setupMatrix();
};
</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Dynamic Programming Visualizer</h1>
      <p class="description">Watch matrices populate to understand memoization and 2D caching patterns over arrays or strings.</p>
    </div>

    <div class="controls-panel">
      <div class="config-group">
        <select :value="currentAlgorithm" @change="(e) => switchAlgo((e.target as HTMLSelectElement).value as any)">
          <option value="knapsack">0/1 Knapsack Problem</option>
          <option value="lcs">Longest Common Subsequence</option>
        </select>
        
        <div v-if="currentAlgorithm === 'knapsack'" class="dp-inputs">
           <label>Weights: <input v-model="knapsack_weights" @change="setupMatrix" /></label>
           <label>Values: <input v-model="knapsack_values" @change="setupMatrix" /></label>
           <label>Capacity: <input type="number" v-model="knapsack_W" @change="setupMatrix" /></label>
        </div>
        <div v-if="currentAlgorithm === 'lcs'" class="dp-inputs">
           <label>String A: <input v-model="lcs_s1" @change="setupMatrix" /></label>
           <label>String B: <input v-model="lcs_s2" @change="setupMatrix" /></label>
        </div>
      </div>
      
      <div class="control-group playback">
        <button @click="onStepBack" :disabled="isPlaying">Step Back</button>
        <button @click="onStep" :disabled="isPlaying">Step Forward</button>
        <button v-if="!isPlaying" @click="onPlay" class="btn-success">Play Array</button>
        <button v-else @click="onPause" class="btn-danger">Pause</button>
        <button @click="onReset">Reset</button>
      </div>
    </div>
    
    <div class="dashboard-layout">
      <div class="main-visual">
        <DPMatrixBoard :matrix="matrix" />
      </div>
      <div class="side-panels">
         <WatchWindow :variables="currentVariables" />
         <PseudocodePanel :code="pseudoCode" :activeLine="activeLine" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; }
.header { margin-bottom: 20px; }
h1 { margin-top: 0; margin-bottom: 8px; color: #c9d1d9; font-size: 32px; }
.description { color: #8b949e; margin: 0; font-size: 16px; }

.controls-panel { display: flex; justify-content: space-between; align-items: center; background-color: #161b22; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #30363d; gap: 20px; flex-wrap: wrap; }
.config-group { display: flex; gap: 15px; align-items: center; }
.config-group select { background-color: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 10px 16px; border-radius: 6px; font-weight: bold; width: auto; font-size: 15px; cursor: pointer; }
.dp-inputs { display: flex; gap: 10px; }
.dp-inputs label { font-size: 12px; font-weight: bold; color: #8b949e; display: flex; flex-direction: column; gap: 5px; }
.dp-inputs input { background-color: #0d1117; color: #c9d1d9; border: 1px solid #30363d; padding: 6px; border-radius: 4px; width: 100px; font-family: monospace; }
.playback { display: flex; gap: 10px; }
button { background-color: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: opacity 0.2s; }
button:hover:not(:disabled) { opacity: 0.8; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-success { background-color: #238636; border-color: #2ea043; color: white; }
.btn-danger { background-color: #da3633; border-color: #f85149; color: white; }

.dashboard-layout { display: flex; gap: 20px; align-items: stretch; height: 60vh; }
.main-visual { flex: 3; display: flex; flex-direction: column; }
.side-panels { flex: 1; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
</style>
