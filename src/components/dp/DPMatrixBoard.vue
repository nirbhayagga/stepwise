<script setup lang="ts">
import { DP_STATE } from '../../algorithms/dp';

defineProps<{ rows: number; cols: number; values: string[]; states: Uint8Array; rowLabels: string[]; colLabels: string[] }>();
const CLASS = ['', 'filled', 'current', 'source'];
const cls = (s: number | undefined) => CLASS[s ?? DP_STATE.empty];
</script>

<template>
  <div class="panel board">
    <table class="mono">
      <thead>
        <tr>
          <th class="corner"></th>
          <th v-for="(c, j) in colLabels" :key="j" class="hdr">{{ c }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r">
          <th class="hdr row-hdr">{{ rowLabels[r - 1] }}</th>
          <td v-for="c in cols" :key="c" class="cell" :class="cls(states[(r - 1) * cols + (c - 1)])">
            {{ values[(r - 1) * cols + (c - 1)] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.board { padding: 14px; overflow: auto; }
table { border-collapse: separate; border-spacing: 3px; margin: 0 auto; }
.hdr { font-size: 11px; font-weight: 500; color: var(--text-muted); padding: 2px 6px; text-align: center; white-space: nowrap; }
.row-hdr { text-align: right; }
.cell {
  width: 38px; height: 34px; min-width: 38px; text-align: center; font-size: 13px;
  background: var(--surface-2); border: 1px solid var(--border); color: var(--text-faint);
  transition: background 0.12s;
}
.cell.filled { color: var(--text); }
.cell.source { background: var(--accent-bg); border-color: var(--accent); color: var(--accent-strong); }
.cell.current { background: var(--s-compare); border-color: var(--s-compare); color: #14120a; font-weight: 500; }
</style>
