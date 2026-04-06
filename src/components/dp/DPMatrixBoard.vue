<script setup lang="ts">
import type { DPCell } from '../../composables/useDP';

defineProps<{ matrix: DPCell[][] }>();
</script>

<template>
  <div class="dp-board">
    <div v-for="(row, rIndex) in matrix" :key="'r' + rIndex" class="dp-row">
      <div 
        v-for="cell in row" 
        :key="cell.id" 
        class="dp-cell"
        :class="cell.state"
      >
        {{ cell.value }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-board {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
  align-items: center;
  justify-content: center;
  flex: 1;
}
.dp-row {
  display: flex;
  gap: 4px;
}
.dp-cell {
  width: 40px;
  height: 40px;
  background-color: #161b22;
  border: 1px solid #30363d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c9d1d9;
  font-family: monospace;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.2s;
}
.dp-cell.set { background-color: #a371f7; color: white; border-color: #d2a8ff; transform: scale(1.1); z-index: 2; }
.dp-cell.source { background-color: #3fb950; color: white; }
</style>
