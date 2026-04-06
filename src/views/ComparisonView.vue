<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSorting } from '../composables/useSorting';
import SortingCanvas from '../components/sorting/SortingCanvas.vue';
import MetricsDashboard from '../components/layout/MetricsDashboard.vue';

const algoA = ref('bubble');
const algoB = ref('quick');
const arraySize = ref(50);
const animationSpeed = ref(50);

const sortA = useSorting();
const sortB = useSorting();

const isPlaying = ref(false);
let checkInterval: number | null = null;

const onGenerate = () => {
  sortA.pause();
  sortB.pause();
  isPlaying.value = false;
  if (checkInterval) clearInterval(checkInterval);
  
  const values = Array.from({ length: arraySize.value }, () => Math.floor(Math.random() * 95) + 5);
  sortA.setArray(values);
  sortB.setArray(values);
};

onMounted(onGenerate);

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval);
});

const onPlay = () => {
  isPlaying.value = true;
  sortA.play(algoA.value, animationSpeed.value);
  sortB.play(algoB.value, animationSpeed.value);
  
  checkInterval = window.setInterval(() => {
    if (!sortA.isPlaying.value && !sortB.isPlaying.value) {
      isPlaying.value = false;
      if (checkInterval) clearInterval(checkInterval);
    }
  }, 100);
};

const onPause = () => {
  isPlaying.value = false;
  sortA.pause();
  sortB.pause();
};

const onStep = () => {
  sortA.step(algoA.value);
  sortB.step(algoB.value);
};

const onStepBack = () => {
  sortA.stepBack();
  sortB.stepBack();
};

const onReset = () => {
  onPause();
  sortA.resetGenerator();
  sortB.resetGenerator();
};

</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Algorithm Comparison</h1>
      <p class="description">Run identical datasets through distinct algorithms simultaneously to directly observe and intuitively graph complex runtime efficiencies.</p>
    </div>

    <div class="controls-panel">
      <!-- Sync Controls -->
      <div class="control-group">
        <button @click="onGenerate" class="btn-primary">Generate Synced Array</button>
      </div>
      <div class="control-group">
        <label>
          Array Size
          <input type="range" min="10" max="150" value="50" @input="(e) => { arraySize = Number((e.target as HTMLInputElement).value); onGenerate(); }" />
        </label>
        <label>
          Animation Speed
          <input type="range" min="1" max="100" value="50" @input="(e) => { animationSpeed = Number((e.target as HTMLInputElement).value); }" />
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
           <select v-model="algoA" :disabled="isPlaying" @change="sortA.resetGenerator()">
             <option value="bubble">Bubble Sort (O(n²))</option>
             <option value="selection">Selection Sort (O(n²))</option>
             <option value="insertion">Insertion Sort (O(n²))</option>
             <option value="merge">Merge Sort (O(n log n))</option>
             <option value="quick">Quick Sort (O(n log n))</option>
           </select>
        </div>
        <MetricsDashboard 
          metric1Label="Comparisons" :metric1Value="sortA.comparisons.value"
          metric2Label="Swaps" :metric2Value="sortA.swaps.value"
          :timeMs="sortA.executionTime.value"
        />
        <SortingCanvas :bars="sortA.array.value" />
      </div>

      <!-- View B -->
      <div class="split-pane">
        <div class="pane-header">
           <select v-model="algoB" :disabled="isPlaying" @change="sortB.resetGenerator()">
             <option value="bubble">Bubble Sort (O(n²))</option>
             <option value="selection">Selection Sort (O(n²))</option>
             <option value="insertion">Insertion Sort (O(n²))</option>
             <option value="merge">Merge Sort (O(n log n))</option>
             <option value="quick">Quick Sort (O(n log n))</option>
           </select>
        </div>
        <MetricsDashboard 
          metric1Label="Comparisons" :metric1Value="sortB.comparisons.value"
          metric2Label="Swaps" :metric2Value="sortB.swaps.value"
          :timeMs="sortB.executionTime.value"
        />
        <SortingCanvas :bars="sortB.array.value" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; }
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

.split-layout { display: flex; gap: 20px; }
.split-pane { flex: 1; display: flex; flex-direction: column; border: 1px solid #30363d; padding: 20px; border-radius: 8px; background-color: #0d1117; }
.pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
select { background-color: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 12px 16px; border-radius: 6px; font-weight: bold; width: 100%; font-size: 16px; cursor: pointer; }
</style>
