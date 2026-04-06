<script setup lang="ts">

defineProps<{
  isPlaying: boolean;
  algorithm: string;
}>();

const emit = defineEmits(['generate', 'play', 'pause', 'step', 'step-back', 'reset', 'update-algorithm', 'update-size', 'update-speed']);

</script>

<template>
  <div class="controls-panel">
    <div class="control-group">
      <button @click="emit('generate')" class="btn-primary">Generate Array</button>
      <select :value="algorithm" @change="(e) => emit('update-algorithm', (e.target as HTMLSelectElement).value)">
        <option value="bubble">Bubble Sort</option>
        <option value="merge">Merge Sort</option>
        <option value="quick">Quick Sort</option>
        <option value="insertion">Insertion Sort</option>
        <option value="selection">Selection Sort</option>
      </select>
    </div>
    <div class="control-group">
      <label>
        Array Size
        <input type="range" min="10" max="150" value="50" @input="(e) => emit('update-size', Number((e.target as HTMLInputElement).value))" />
      </label>
      <label>
        Animation Speed
        <input type="range" min="1" max="100" value="50" @input="(e) => emit('update-speed', Number((e.target as HTMLInputElement).value))" />
      </label>
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
button:hover:not(:disabled) {
  opacity: 0.8;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
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
label {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  font-weight: bold;
}
input[type=range] {
  margin-top: 6px;
}
</style>
