<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * Amdahl's law: if a fraction p of the work parallelises perfectly, speedup on
 * n cores is S(n) = 1 / ((1 − p) + p/n), capped at 1/(1 − p) no matter how
 * many cores are added. Gustafson's rebuttal scales the problem with n
 * instead: S(n) = n − (1 − p)(n − 1).
 */
const percent = ref(90);
const showGustafson = ref(false);

const W = 820, H = 300;
const PAD = { l: 52, r: 16, t: 12, b: 36 };
const CORES = [1, 2, 4, 8, 16, 32, 64];
const MAXN = 64;

const p = computed(() => percent.value / 100);
const amdahl = (n: number) => 1 / ((1 - p.value) + p.value / n);
const gustafson = (n: number) => n - (1 - p.value) * (n - 1);
const ceiling = computed(() => (p.value >= 1 ? Infinity : 1 / (1 - p.value)));

const yMax = computed(() => showGustafson.value ? MAXN : Math.max(4, Math.min(ceiling.value === Infinity ? MAXN : ceiling.value * 1.15, MAXN)));
const sx = (n: number) => PAD.l + (Math.log2(n) / Math.log2(MAXN)) * (W - PAD.l - PAD.r);
const sy = (s: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - Math.min(s, yMax.value) / yMax.value);

const samples = Array.from({ length: 61 }, (_, i) => 2 ** (i / 10)); // 1..64 log-spaced
const pathOf = (f: (n: number) => number) =>
  samples.map((n, i) => `${i ? 'L' : 'M'}${sx(n).toFixed(1)},${sy(f(n)).toFixed(1)}`).join(' ');

const yTicks = computed(() => {
  const step = yMax.value <= 8 ? 1 : yMax.value <= 20 ? 4 : yMax.value <= 40 ? 8 : 16;
  const out: number[] = [];
  for (let v = 0; v <= yMax.value; v += step) out.push(v);
  return out;
});
</script>

<template>
  <div class="panel">
    <div class="panel-title">Amdahl's law — why more cores stop helping</div>
    <div class="panel-body body">
      <div class="controls">
        <label class="field">
          <span>Parallel fraction p · {{ percent }}%</span>
          <input type="range" class="range" min="0" max="99" v-model.number="percent" />
        </label>
        <label class="field check">
          <input type="checkbox" v-model="showGustafson" />
          <span>Gustafson (scaled problem)</span>
        </label>
        <span class="mono muted note">ceiling 1/(1−p) = {{ ceiling === Infinity ? '∞' : ceiling.toFixed(1) }}×</span>
      </div>

      <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img"
        :aria-label="`Amdahl speedup curve for a ${percent} percent parallel fraction`">
        <line v-for="t in yTicks" :key="'y' + t" :x1="PAD.l" :x2="W - PAD.r" :y1="sy(t)" :y2="sy(t)" class="grid" />
        <text v-for="t in yTicks" :key="'yl' + t" :x="PAD.l - 8" :y="sy(t) + 3" class="tick" text-anchor="end">{{ t }}×</text>
        <text v-for="n in CORES" :key="'xl' + n" :x="sx(n)" :y="H - PAD.b + 16" class="tick" text-anchor="middle">{{ n }}</text>
        <text :x="(PAD.l + W - PAD.r) / 2" :y="H - 4" class="tick" text-anchor="middle">cores (log scale)</text>
        <line :x1="PAD.l" :x2="W - PAD.r" :y1="H - PAD.b" :y2="H - PAD.b" class="axis" />
        <line :x1="PAD.l" :x2="PAD.l" :y1="PAD.t" :y2="H - PAD.b" class="axis" />
        <line v-if="ceiling !== Infinity && ceiling <= yMax" :x1="PAD.l" :x2="W - PAD.r" :y1="sy(ceiling)" :y2="sy(ceiling)" class="asymptote" />
        <path :d="pathOf(amdahl)" fill="none" stroke="var(--accent)" stroke-width="2" />
        <path v-if="showGustafson" :d="pathOf(gustafson)" fill="none" stroke="var(--s-sorted)" stroke-width="1.6" stroke-dasharray="5 4" />
      </svg>

      <p class="muted note-text">
        With p = {{ percent }}% of the work parallel, {{ MAXN }} cores give only
        <strong class="mono">{{ amdahl(MAXN).toFixed(1) }}×</strong> — the serial
        {{ 100 - percent }}% caps speedup at {{ ceiling === Infinity ? '∞' : ceiling.toFixed(1) + '×' }} forever.
        That serial part is exactly the critical sections and coordination shown above: locks buy correctness
        by making code serial again.<template v-if="showGustafson"> Gustafson's law (dashed) answers with a
        scaled workload: grow the problem with the machine and the parallel share dominates.</template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.body { display: flex; flex-direction: column; gap: 10px; }
.controls { display: flex; gap: 18px; align-items: flex-end; flex-wrap: wrap; }
.check { flex-direction: row; align-items: center; gap: 6px; }
.note { margin-left: auto; font-size: 12px; }
.chart { width: 100%; height: auto; display: block; }
.grid { stroke: var(--border); stroke-width: 1; }
.axis { stroke: var(--border-strong); stroke-width: 1; }
.asymptote { stroke: var(--danger); stroke-width: 1; stroke-dasharray: 3 4; }
.tick { fill: var(--text-faint); font-size: 10.5px; font-family: var(--font-mono); }
.note-text { font-size: 12.5px; line-height: 1.55; }
.note-text strong { color: var(--text); }
</style>
