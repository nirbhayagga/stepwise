<script setup lang="ts">

defineProps<{ isPlaying: boolean; algorithm: string; drawMode: string; rows: number; cols: number; }>();
const emit = defineEmits(['clear-terrain', 'clear-path', 'random-walls', 'recursive-maze', 'play', 'pause', 'step', 'step-back', 'reset', 'update-algorithm', 'update-draw', 'update-rows', 'update-cols']);
</script>

<template>
  <div class="controls-panel">
    <div class="control-group">
      <label>Algorithm:
        <select :value="algorithm" @change="(e) => emit('update-algorithm', (e.target as HTMLSelectElement).value)">
          <option value="dijkstra">Dijkstra's Algorithm</option>
          <option value="astar">A* Search</option>
          <option value="greedy">Greedy Best-First Search</option>
          <option value="bidir">Bidirectional Search</option>
          <option value="bfs">Breadth-First Search</option>
          <option value="dfs">Depth-First Search</option>
        </select>
      </label>
    </div>
    <div class="control-group">
      <label>Generators:</label>
      <button @click="emit('random-walls')" class="btn-primary">Random Walls</button>
      <button @click="emit('recursive-maze')" class="btn-primary">Recursive Maze</button>
      <button @click="emit('clear-terrain')" class="btn-primary">Clear Terrain</button>
      <button @click="emit('clear-path')" class="btn-primary">Clear Path</button>
    </div>
    <div class="control-group">
      <label>🖱️ Draw Mode:
        <select :value="drawMode" @change="(e) => emit('update-draw', (e.target as HTMLSelectElement).value)">
          <option value="wall">Impassable Wall</option>
          <option value="weight">High Cost Terrain</option>
          <option value="start">Start Node (Green)</option>
          <option value="target">Target Node (Red)</option>
        </select>
      </label>
      <div class="slider-group">
        <label>Cols: {{ cols }}
          <input type="range" :value="cols" @input="(e) => emit('update-cols', parseInt((e.target as HTMLInputElement).value))" min="10" max="80" step="1" :disabled="isPlaying" />
        </label>
        <label>Rows: {{ rows }}
          <input type="range" :value="rows" @input="(e) => emit('update-rows', parseInt((e.target as HTMLInputElement).value))" min="10" max="40" step="1" :disabled="isPlaying" />
        </label>
      </div>
    </div>
    <div class="control-group playback">
      <button @click="emit('step-back')" :disabled="isPlaying">Step Back</button>
      <button @click="emit('step')" :disabled="isPlaying">Step Forward</button>
      <button v-if="!isPlaying" @click="emit('play')" class="btn-success">Play to End</button>
      <button v-else @click="emit('pause')" class="btn-danger">Pause</button>
      <button @click="emit('reset')">Reset State</button>
    </div>
  </div>
</template>

<style scoped>
.controls-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  background-color: #161b22;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #30363d;
}
button {
  background-color: #21262d;
  color: #c9d1d9;
  border: 1px solid #30363d;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: opacity 0.2s;
}
button:hover:not(:disabled) { opacity: 0.8; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background-color: #1f6feb; border-color: #388bfd; color: white; }
.btn-success { background-color: #238636; border-color: #2ea043; color: white; }
.btn-danger { background-color: #da3633; border-color: #f85149; color: white; }

select {
  background-color: #21262d;
  color: #c9d1d9;
  border: 1px solid #30363d;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
}
.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slider-group {
  display: flex;
  gap: 15px;
  margin-left: 10px;
  align-items: center;
}
.slider-group label {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #8b949e;
}
</style>
