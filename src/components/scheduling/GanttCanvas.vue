<script setup lang="ts">
import { computed } from 'vue';
import type { SchedProcess } from '../../algorithms/scheduling';
import { pname } from '../../algorithms/scheduling';

const props = defineProps<{
  procs: SchedProcess[];
  gantt: Int8Array;
  queue: number[];
  time: number;
}>();

const PALETTE = [
  'var(--s-compare)', 'var(--accent)', 'var(--s-sorted)', 'var(--s-write)',
  'var(--s-mark)', 'var(--g-weight)', 'var(--accent-strong)', 'var(--g-visited)',
];
const colorOf = (pid: number) => PALETTE[pid % PALETTE.length];

/** Classic Gantt strip: consecutive ticks of the same process merged into one segment. */
const segments = computed(() => {
  const segs: { pid: number; start: number; len: number }[] = [];
  for (let k = 0; k < props.gantt.length; k++) {
    const pid = props.gantt[k];
    const last = segs[segs.length - 1];
    if (last && last.pid === pid) last.len++;
    else segs.push({ pid, start: k, len: 1 });
  }
  return segs;
});

const CELL_WAIT = 1, CELL_RUN = 2;

/** Per-process lanes: run / waiting-in-ready-queue per elapsed tick. */
const lanes = computed(() => {
  const len = props.gantt.length;
  return props.procs.map(p => {
    let runs = 0, finish = len; // tick index at which the process completes
    for (let k = 0; k < len; k++) if (props.gantt[k] === p.id && ++runs === p.burst) finish = k;
    const cells: number[] = [];
    for (let k = 0; k < len; k++) {
      cells.push(props.gantt[k] === p.id ? CELL_RUN : p.arrival <= k && k < finish ? CELL_WAIT : 0);
    }
    return { pid: p.id, name: pname(p.id), arrival: p.arrival, cells };
  });
});
</script>

<template>
  <div class="gantt-wrap" role="img" :aria-label="`Gantt chart of the CPU schedule after ${time} time units`">
    <div class="scroll">
      <!-- combined CPU strip -->
      <div class="strip-row">
        <span class="lane-label">CPU</span>
        <div class="strip">
          <div
            v-for="s in segments" :key="s.start" class="seg mono"
            :class="{ idle: s.pid < 0 }"
            :style="{ width: `${s.len * 26}px`, background: s.pid >= 0 ? colorOf(s.pid) : undefined }"
          >{{ s.pid >= 0 ? pname(s.pid) : '—' }}</div>
          <span v-if="!segments.length" class="empty muted mono">t = 0</span>
        </div>
      </div>
      <div class="strip-row ticks-row" v-if="segments.length">
        <span class="lane-label" />
        <div class="ticks mono">
          <span v-for="s in segments" :key="s.start" :style="{ width: `${s.len * 26}px` }">{{ s.start }}</span>
          <span>{{ gantt.length }}</span>
        </div>
      </div>

      <!-- per-process lanes -->
      <div v-for="lane in lanes" :key="lane.pid" class="strip-row">
        <span class="lane-label mono">{{ lane.name }}</span>
        <div class="lane">
          <div
            v-for="(c, k) in lane.cells" :key="k" class="cell"
            :class="{ wait: c === CELL_WAIT, arrivalMark: k === lane.arrival }"
            :style="c === CELL_RUN ? { background: colorOf(lane.pid) } : undefined"
          />
        </div>
      </div>
    </div>

    <div class="queue-row">
      <span class="queue-label">Ready queue</span>
      <span v-if="!queue.length" class="muted mono">∅</span>
      <span v-for="pid in queue" :key="pid" class="chip mono" :style="{ borderColor: colorOf(pid) }">{{ pname(pid) }}</span>
    </div>
  </div>
</template>

<style scoped>
.gantt-wrap { display: flex; flex-direction: column; gap: 10px; }
.scroll { overflow-x: auto; padding-bottom: 2px; }
.strip-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.lane-label { flex: none; width: 34px; font-size: 11.5px; color: var(--text-muted); text-align: right; }
.strip { display: flex; height: 26px; }
.seg {
  height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #10141b; border-right: 1px solid var(--bg); flex: none;
  overflow: hidden; white-space: nowrap;
}
.seg.idle { background: var(--surface-2); color: var(--text-faint); }
.empty { font-size: 11px; align-self: center; }
.ticks-row { margin-top: -2px; margin-bottom: 8px; }
.ticks { display: flex; font-size: 10px; color: var(--text-faint); }
.ticks span { flex: none; }
.lane { display: flex; height: 16px; }
.cell { width: 26px; height: 100%; flex: none; background: var(--g-empty); border-right: 1px solid var(--bg); }
.cell.wait { background: var(--surface-3); }
.cell.arrivalMark { box-shadow: inset 2px 0 0 var(--text-muted); }
.queue-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.queue-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.chip { font-size: 11px; border: 1px solid var(--border-strong); border-radius: 3px; padding: 1px 7px; color: var(--text); }
</style>
