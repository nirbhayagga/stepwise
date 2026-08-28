<script setup lang="ts">
import { computed } from 'vue';
import { CELL, NODE_STATE } from '../../algorithms/pathfinding';

const props = defineProps<{
  rows: number;
  cols: number;
  cells: Uint8Array;
  states: Uint8Array | null;
  start: number;
  target: number;
  interactive?: boolean;
}>();
const emit = defineEmits<{ (e: 'down', i: number): void; (e: 'enter', i: number): void; (e: 'up'): void }>();

const TYPE_CLASS = ['', 'wall', 'weight'];
const STATE_CLASS = ['', 'frontier', 'visiting', 'visited', 'path'];

const classes = computed(() => {
  const n = props.rows * props.cols;
  const out = new Array<string>(n);
  for (let i = 0; i < n; i++) {
    let cls = TYPE_CLASS[props.cells[i]] ?? '';
    const s = props.states ? props.states[i] : NODE_STATE.unvisited;
    if (s && props.cells[i] !== CELL.wall) cls += ' ' + STATE_CLASS[s];
    if (i === props.start) cls += ' start';
    else if (i === props.target) cls += ' target';
    out[i] = cls;
  }
  return out;
});
</script>

<template>
  <div
    class="panel grid"
    :class="{ interactive }"
    :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }"
    @mouseleave="emit('up')"
    @mouseup="emit('up')"
  >
    <div
      v-for="(cls, i) in classes"
      :key="i"
      class="node"
      :class="cls"
      @mousedown.prevent="interactive && emit('down', i)"
      @mouseenter="interactive && emit('enter', i)"
    ></div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 1px;
  padding: 1px;
  background: var(--border);
  user-select: none;
  width: 100%;
}
.grid.interactive { cursor: crosshair; }
.node { aspect-ratio: 1; background: var(--g-empty); min-width: 0; transition: background 0.06s; }
.node.wall { background: var(--g-wall); }
.node.weight { background: var(--g-weight); }
.node.frontier { background: var(--g-frontier); }
.node.visiting { background: var(--g-visiting); }
.node.visited { background: var(--g-visited); }
.node.weight.visited { background: color-mix(in srgb, var(--g-visited) 60%, var(--g-weight)); }
.node.weight.frontier { background: color-mix(in srgb, var(--g-frontier) 60%, var(--g-weight)); }
.node.path { background: var(--g-path); transition: none; }
.node.start { background: var(--g-start); }
.node.target { background: var(--g-target); }
</style>
