<script setup lang="ts">
import type { ArrayBar } from '../../composables/useSorting';

defineProps<{ bars: ArrayBar[] }>();
</script>

<template>
  <div class="sorting-canvas">
    <div 
      v-for="bar in bars" 
      :key="bar.id"
      class="array-bar"
      :class="bar.state"
      :style="{ height: `${bar.value}%`, width: `${Math.max(2, 80 / bars.length)}%` }"
    ></div>
  </div>
</template>

<style scoped>
.sorting-canvas {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 500px;
  width: 100%;
  gap: 2px;
  background-color: #161b22;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #30363d;
}

.array-bar {
  background-color: #58a6ff;
  border-radius: 4px 4px 0 0;
  transition: background-color 0.1s, height 0.1s;
}

.array-bar.comparing {
  background-color: #fce141;
}

.array-bar.swapping {
  background-color: #ff7b72;
}

.array-bar.sorted {
  background-color: #3fb950;
}
</style>
