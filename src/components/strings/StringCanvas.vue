<script setup lang="ts">
import { computed } from 'vue';
import { STR_STATE } from '../../algorithms/strings';

const props = defineProps<{
  text: string;
  pattern: string;
  textStates: Uint8Array;
  patternStates: Uint8Array;
  shift: number;
  aux: (number | string)[];
  auxLabel?: string;
}>();

const CLASS = ['', 'compare', 'match', 'mismatch', 'matched', 'mark'];
const cls = (s?: number) => CLASS[s ?? STR_STATE.none];
const textCells = computed(() => props.text.split('').map((ch, i) => ({ ch, cls: cls(props.textStates[i]) })));
const patternCells = computed(() => props.pattern.split('').map((ch, i) => ({ ch, cls: cls(props.patternStates[i]) })));
</script>

<template>
  <div class="panel wrap">
    <div class="scroller mono" role="img" aria-label="Text, pattern alignment and auxiliary table">
      <div class="row ruler">
        <span v-for="(_, i) in textCells" :key="i" class="cell idx">{{ i % 5 === 0 ? i : '' }}</span>
      </div>
      <div class="row">
        <span class="row-label">T</span>
        <span v-for="(c, i) in textCells" :key="i" class="cell" :class="c.cls">{{ c.ch }}</span>
      </div>
      <div v-if="pattern && shift >= 0" class="row">
        <span class="row-label">P</span>
        <span class="cell spacer" :style="{ width: `calc(${shift} * (var(--cw) + 2px))` }"></span>
        <span v-for="(c, i) in patternCells" :key="i" class="cell pat" :class="c.cls">{{ c.ch }}</span>
      </div>
      <div v-if="aux.length" class="row">
        <span class="row-label">{{ auxLabel ?? 'aux' }}</span>
        <span v-for="(v, i) in aux" :key="i" class="cell aux">{{ v }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { padding: 14px; --cw: 26px; }
.scroller { overflow-x: auto; padding-bottom: 4px; }
.row { display: flex; margin-bottom: 3px; align-items: center; }
.row-label { width: 26px; flex-shrink: 0; color: var(--text-muted); font-size: 11px; }
.cell {
  width: var(--cw); height: 28px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  background: var(--surface-2); border: 1px solid var(--border); margin-right: 2px; font-size: 13px;
}
.ruler .cell, .cell.idx { background: none; border-color: transparent; color: var(--text-faint); font-size: 10px; height: 14px; }
.ruler { margin-left: 26px; }
.cell.spacer { background: none; border: none; margin-right: 0; padding: 0; height: 0; }
.cell.pat { background: var(--surface-3); }
.cell.aux { background: none; border-color: var(--border); color: var(--accent); font-size: 11.5px; height: 22px; }
.cell.compare { background: var(--s-compare); border-color: var(--s-compare); color: #14120a; }
.cell.match { background: var(--s-sorted); border-color: var(--s-sorted); color: #0d1a10; }
.cell.mismatch { background: var(--s-write); border-color: var(--s-write); color: #1a0d0c; }
.cell.matched { background: var(--accent-bg); border-color: var(--accent); color: var(--accent-strong); }
.cell.mark { background: var(--s-mark); border-color: var(--s-mark); color: #1a1020; }
</style>
