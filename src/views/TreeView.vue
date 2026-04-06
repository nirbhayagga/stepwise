<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTree } from '../composables/useTree';
import TreeCanvas from '../components/tree/TreeCanvas.vue';
import WatchWindow from '../components/layout/WatchWindow.vue';
import PseudocodePanel from '../components/layout/PseudocodePanel.vue';
import { algorithmPseudocode } from '../utils/pseudocode';

const currentAlgorithm = ref<'bst' | 'avl'>('bst');
const pseudoCode = computed(() => algorithmPseudocode[currentAlgorithm.value] || []);
const inputPayload = ref('15, 10, 20, 8, 12, 17, 25, 22, 28, 5');

const {
  root, isPlaying, currentVariables, activeLine,
  resetTree, step, stepBack, play, pause
} = useTree();

const getKeys = () => {
    return inputPayload.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
};

const onPlay = () => { play(currentAlgorithm.value, [getKeys()]); };
const onPause = () => { pause(); };
const onStep = () => { step(currentAlgorithm.value, [getKeys()]); };
const onStepBack = () => { stepBack(); };
const onReset = () => { resetTree(); };

const switchAlgo = (val: 'bst' | 'avl') => {
    currentAlgorithm.value = val;
    onReset();
};
</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Tree Visualizer</h1>
      <p class="description">Visualize recursive object branching and tree rotation logic automatically mapping parent/children object behaviors down visual depth paths.</p>
    </div>

    <div class="controls-panel">
      <div class="config-group">
        <select :value="currentAlgorithm" @change="(e) => switchAlgo((e.target as HTMLSelectElement).value as any)">
          <option value="bst">Binary Search Tree (Unbalanced)</option>
          <option value="avl">AVL Tree (Self-Balancing)</option>
        </select>
        
        <div class="dp-inputs">
           <label>Insertion Sequence: <input v-model="inputPayload" placeholder="20, 10, 30..." @change="onReset" /></label>
        </div>
      </div>
      
      <div class="control-group playback">
        <button @click="onStepBack" :disabled="isPlaying">Step Back</button>
        <button @click="onStep" :disabled="isPlaying">Step Forward</button>
        <button v-if="!isPlaying" @click="onPlay" class="btn-success">Play Insertion</button>
        <button v-else @click="onPause" class="btn-danger">Pause</button>
        <button @click="onReset">Clear Tree</button>
      </div>
    </div>
    
    <div class="dashboard-layout">
      <div class="main-visual">
        <TreeCanvas :root="root" />
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
.dp-inputs input { background-color: #0d1117; color: #c9d1d9; border: 1px solid #30363d; padding: 6px; border-radius: 4px; width: 250px; font-family: monospace; }
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
