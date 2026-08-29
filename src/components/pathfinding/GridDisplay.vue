<script setup lang="ts">
import { computed, ref } from 'vue';
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

// Pointer events (mouse, touch and pen alike). Cells are hit-tested from
// coordinates so a drag keeps painting even when the pointer is captured.
const grid = ref<HTMLElement | null>(null);
let last = -1;
let painting = false;

const cellAt = (e: PointerEvent): number => {
  const el = grid.value!;
  const r = el.getBoundingClientRect();
  const col = Math.floor(((e.clientX - r.left - 1) / (r.width - 2)) * props.cols);
  const row = Math.floor(((e.clientY - r.top - 1) / (r.height - 2)) * props.rows);
  if (row < 0 || col < 0 || row >= props.rows || col >= props.cols) return -1;
  return row * props.cols + col;
};

const onDown = (e: PointerEvent) => {
  if (!props.interactive || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const i = cellAt(e);
  if (i < 0) return;
  painting = true;
  last = i;
  grid.value!.setPointerCapture(e.pointerId);
  emit('down', i);
};
const onMove = (e: PointerEvent) => {
  if (!painting) return;
  const i = cellAt(e);
  if (i < 0 || i === last) return;
  last = i;
  emit('enter', i);
};
const onUp = (e: PointerEvent) => {
  if (!painting) return;
  painting = false;
  last = -1;
  if (grid.value?.hasPointerCapture(e.pointerId)) grid.value.releasePointerCapture(e.pointerId);
  emit('up');
};
</script>

<template>
  <div
    ref="grid"
    class="panel grid"
    :class="{ interactive }"
    :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
  >
    <div v-for="(cls, i) in classes" :key="i" class="node" :class="cls"></div>
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
  contain: content;
}
.grid.interactive { cursor: crosshair; touch-action: none; }
.node { aspect-ratio: 1; background: var(--g-empty); min-width: 0; pointer-events: none; }
.node.wall { background: var(--g-wall); }
.node.weight { background: var(--g-weight); }
.node.frontier { background: var(--g-frontier); }
.node.visiting { background: var(--g-visiting); }
.node.visited { background: var(--g-visited); }
.node.weight.visited { background: color-mix(in srgb, var(--g-visited) 60%, var(--g-weight)); }
.node.weight.frontier { background: color-mix(in srgb, var(--g-frontier) 60%, var(--g-weight)); }
.node.path { background: var(--g-path); }
.node.start { background: var(--g-start); }
.node.target { background: var(--g-target); }
</style>
