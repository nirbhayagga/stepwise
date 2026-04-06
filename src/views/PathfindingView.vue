<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { usePathfinding } from '../composables/usePathfinding';
import GridDisplay from '../components/pathfinding/GridDisplay.vue';
import PathfindingControls from '../components/layout/PathfindingControls.vue';
import MetricsDashboard from '../components/layout/MetricsDashboard.vue';
import WatchWindow from '../components/layout/WatchWindow.vue';
import PseudocodePanel from '../components/layout/PseudocodePanel.vue';
import { algorithmPseudocode } from '../utils/pseudocode';

const {
  grid, initGrid, clearTerrain, clearPath, generateRandomWalls, generateRecursiveMaze, drawMode, nodesExplored, pathLength, executionTime, isPlaying, currentVariables, activeLine,
  handleMouseDown, handleMouseEnter, handleMouseUp, step, stepBack, play, pause
} = usePathfinding();

const currentAlgorithm = ref('dijkstra');
const pseudoCode = computed(() => algorithmPseudocode[currentAlgorithm.value] || []);

onMounted(() => { initGrid(); });

const onAlgorithmChange = (val: string) => { 
  currentAlgorithm.value = val;
  clearPath(); 
};

const onPlay = () => { play(currentAlgorithm.value); };
const onPause = () => { pause(); };
const onStep = () => { step(currentAlgorithm.value); };
const onStepBack = () => { stepBack(); };
const onReset = () => { clearPath(); clearTerrain(); };

</script>

<template>
  <div class="view-container">
    <div class="header">
      <h1>Pathfinding Visualizer</h1>
      <p class="description">Click and drag on the grid to create walls or move the start and target nodes.</p>
    </div>

    <PathfindingControls 
      :isPlaying="isPlaying"
      :algorithm="currentAlgorithm"
      :drawMode="drawMode"
      :rows="rows"
      :cols="cols"
      @update-draw="(val) => drawMode = val"
      @update-rows="(val) => { rows = val; initGrid(); }"
      @update-cols="(val) => { cols = val; initGrid(); }"
      @random-walls="generateRandomWalls"
      @recursive-maze="generateRecursiveMaze"
      @clear-terrain="clearTerrain"
      @clear-path="clearPath"
      @update-algorithm="onAlgorithmChange"
      @play="onPlay"
      @pause="onPause"
      @step="onStep"
      @step-back="onStepBack"
      @reset="onReset"
    />
    
    <div class="dashboard-layout">
      <div class="main-visual">
         <MetricsDashboard 
          metric1Label="Nodes Explored"
          :metric1Value="nodesExplored"
          metric2Label="Path Length"
          :metric2Value="pathLength"
          :timeMs="executionTime"
        />
        <GridDisplay 
          :grid="grid"
          @mouseDown="handleMouseDown"
          @mouseEnter="handleMouseEnter"
          @mouseUp="handleMouseUp"
        />
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
  overflow: hidden;
}
.side-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
