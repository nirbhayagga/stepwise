<script setup lang="ts">
import type { GridNode } from '../../composables/usePathfinding';

defineProps<{ grid: GridNode[][] }>();
const emit = defineEmits(['mouseDown', 'mouseEnter', 'mouseUp']);
</script>

<template>
  <div class="grid-container" @mouseleave="emit('mouseUp')">
    <div 
      v-for="(row, r) in grid" 
      :key="`row-${r}`"
      class="grid-row"
    >
      <div 
        v-for="node in row" 
        :key="node.id"
        class="grid-node"
        :class="[node.type, node.state]"
        @mousedown="emit('mouseDown', node)"
        @mouseenter="emit('mouseEnter', node)"
        @mouseup="emit('mouseUp')"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.grid-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #161b22;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #30363d;
  user-select: none;
  width: 100%;
  box-sizing: border-box;
}
.grid-board { display: flex; flex-direction: column; width: 100%; justify-content: center; align-items: center; }
.grid-row { display: flex; width: 100%; justify-content: center; }
.grid-node {
  flex: 1 1 0;
  aspect-ratio: 1;
  max-width: 45px;
  max-height: 45px;
  min-width: 8px;
  border: 1px solid #30363d;
  background-color: #0d1117;
  transition: background-color 0.1s;
}
.grid-node.wall { background-color: #8b949e; border-color: #8b949e; }
.grid-node.weight { background-color: #bb8652; border-color: #bb8652; }
.grid-node.start {
  background-color: #3fb950; 
  border-color: #3fb950; 
  z-index: 2;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M8 5v14l11-7z"/></svg>');
  background-size: 60%;
  background-position: center;
  background-repeat: no-repeat;
}
.grid-node.target {
  background-color: #ff7b72; 
  border-color: #ff7b72; 
  z-index: 2;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><circle cx="12" cy="12" r="8"/></svg>');
  background-size: 60%;
  background-position: center;
  background-repeat: no-repeat;
}

.grid-node.visiting:not(.start):not(.target):not(.wall):not(.weight) { background-color: #fce141; }
.grid-node.visited:not(.start):not(.target):not(.wall):not(.weight) { background-color: #a371f7; }
.grid-node.path:not(.start):not(.target):not(.wall) { background-color: #58a6ff; transition: background-color 0s; }
</style>
