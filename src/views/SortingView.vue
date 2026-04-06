<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSorting } from '../composables/useSorting';
import SortingCanvas from '../components/sorting/SortingCanvas.vue';
import AppControls from '../components/layout/AppControls.vue';
import MetricsDashboard from '../components/layout/MetricsDashboard.vue';
import WatchWindow from '../components/layout/WatchWindow.vue';
import PseudocodePanel from '../components/layout/PseudocodePanel.vue';
import { algorithmPseudocode } from '../utils/pseudocode';

const { 
  array, comparisons, swaps, executionTime, isPlaying, currentVariables, activeLine,
  generateArray, step, stepBack, play, pause, resetGenerator 
} = useSorting();

const currentAlgorithm = ref('bubble');
const arraySize = ref(50);
const animationSpeed = ref(50);

const pseudoCode = computed(() => algorithmPseudocode[currentAlgorithm.value] || []);

onMounted(() => {
  generateArray(arraySize.value);
});

const onGenerate = () => {
  generateArray(arraySize.value);
};

const onChangeAlgorithm = (val: string) => {
  currentAlgorithm.value = val;
  resetGenerator();
};

const onChangeSize = (val: number) => {
  arraySize.value = val;
  onGenerate();
};

const onChangeSpeed = (val: number) => {
  animationSpeed.value = val;
};

const onPlay = () => {
  play(currentAlgorithm.value, animationSpeed.value);
};

const onStep = () => {
  step(currentAlgorithm.value);
};

const onStepBack = () => {
  stepBack();
};

</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Sorting Algorithms Visualizer</h1>
      <p class="description">Select an algorithm and visualize its mechanics step by step or continuously.</p>
    </div>

    <AppControls 
      :isPlaying="isPlaying"
      :algorithm="currentAlgorithm"
      @generate="onGenerate"
      @update-algorithm="onChangeAlgorithm"
      @update-size="onChangeSize"
      @update-speed="onChangeSpeed"
      @play="onPlay"
      @pause="pause"
      @step="onStep"
      @step-back="onStepBack"
      @reset="resetGenerator"
    />
    
    <div class="dashboard-layout">
      <div class="main-visual">
         <MetricsDashboard 
          metric1Label="Comparisons"
          :metric1Value="comparisons"
          metric2Label="Swaps"
          :metric2Value="swaps"
          :timeMs="executionTime"
        />
        <SortingCanvas :bars="array" />
      </div>
      <div class="side-panels">
         <WatchWindow :variables="currentVariables" />
         <PseudocodePanel :code="pseudoCode" :activeLine="activeLine" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
}
.header { margin-bottom: 20px; }
h1 { margin-top: 0; margin-bottom: 8px; color: #c9d1d9; font-size: 32px; }
.description { color: #8b949e; margin: 0; font-size: 16px; }

.dashboard-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.main-visual {
  flex: 3;
  display: flex;
  flex-direction: column;
}
.side-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
