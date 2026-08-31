<script setup lang="ts">
defineProps<{ rows: number; cols: number; cells: string[]; states: Uint8Array; boxSize?: number }>();
const CLASS = ['empty', 'fixed', 'placed', 'trying', 'conflict', 'removed'];
</script>

<template>
  <div class="panel wrap">
    <div class="board mono" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
      <div
        v-for="(text, i) in cells"
        :key="i"
        class="cell"
        :class="[
          CLASS[states[i] ?? 0],
          boxSize && ((i % cols) % boxSize === boxSize - 1) && (i % cols) !== cols - 1 ? 'box-r' : '',
          boxSize && (Math.floor(i / cols) % boxSize === boxSize - 1) && Math.floor(i / cols) !== rows - 1 ? 'box-b' : '',
        ]"
      >{{ text }}</div>
    </div>
  </div>
</template>

<style scoped>
.wrap { padding: 14px; display: flex; justify-content: center; }
.board { display: grid; gap: 2px; max-width: 560px; width: 100%; }
.cell {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  background: var(--surface-2); border: 1px solid var(--border);
  font-size: clamp(10px, 2.2vw, 15px); color: var(--text); transition: background 0.1s;
  min-width: 0; overflow: hidden;
}
.cell.box-r { border-right: 2px solid var(--border-strong); }
.cell.box-b { border-bottom: 2px solid var(--border-strong); }
.cell.fixed { background: var(--surface-3); color: var(--text-muted); font-weight: 600; }
.cell.placed { background: rgba(111, 181, 137, 0.16); border-color: var(--s-sorted); color: var(--s-sorted); }
.cell.trying { background: var(--s-compare); border-color: var(--s-compare); color: #14120a; }
.cell.conflict { background: rgba(212, 122, 116, 0.2); border-color: var(--s-write); color: var(--s-write); }
.cell.removed { background: var(--surface); border-color: var(--border); color: var(--text-faint); }
</style>
