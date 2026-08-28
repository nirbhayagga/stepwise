<script setup lang="ts">
import { ref } from 'vue';
import { MAZES } from '../../algorithms/pathfinding';

defineProps<{ rows: number; cols: number; disabled?: boolean }>();
const emit = defineEmits<{
  (e: 'generate', mazeId: string): void;
  (e: 'clear'): void;
  (e: 'clear-path'): void;
  (e: 'resize', rows: number, cols: number): void;
}>();
const mazeId = ref(MAZES[0].id);
</script>

<template>
  <div class="toolbar-group">
    <label class="field">
      <span>Generator</span>
      <select class="select" v-model="mazeId" :disabled="disabled">
        <option v-for="m in MAZES" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </label>
    <button class="btn" :disabled="disabled" @click="emit('generate', mazeId)">Generate</button>
    <button class="btn" :disabled="disabled" @click="emit('clear')">Clear walls</button>
    <button class="btn" :disabled="disabled" @click="emit('clear-path')">Clear search</button>
    <label class="field">
      <span>Rows · {{ rows }}</span>
      <input type="range" class="range" min="9" max="41" step="2" :value="rows" :disabled="disabled" @change="emit('resize', Number(($event.target as HTMLInputElement).value), cols)" />
    </label>
    <label class="field">
      <span>Columns · {{ cols }}</span>
      <input type="range" class="range" min="9" max="81" step="2" :value="cols" :disabled="disabled" @change="emit('resize', rows, Number(($event.target as HTMLInputElement).value))" />
    </label>
  </div>
</template>
