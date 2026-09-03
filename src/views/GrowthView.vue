<script setup lang="ts">
import { computed, ref } from 'vue';
import { SORTING_LIST } from '../algorithms/sorting';
import type { Distribution, GrowthPoint, OrderEstimate } from '../algorithms/sorting/measure';
import { DISTRIBUTIONS, GROWTH_SIZES, estimateOrder, measureGrowth } from '../algorithms/sorting/measure';
import PageHeader from '../components/common/PageHeader.vue';

// Bogo is capped at 7 elements; every other sort can run the full size range.
const MEASURABLE = SORTING_LIST.filter(a => a.cap === undefined);

const PALETTE = [
  'var(--s-compare)', 'var(--g-visited)', 'var(--s-mark)', 'var(--s-write)',
  'var(--g-weight)', 'var(--accent)', 'var(--g-frontier)', 'var(--accent-strong)',
  'var(--s-sorted)', 'var(--g-wall)', 'var(--text)', 'var(--text-faint)', 'var(--g-path)',
];
const colorOf = (id: string) => PALETTE[MEASURABLE.findIndex(a => a.id === id) % PALETTE.length];

const selected = ref<string[]>(['insertion', 'merge', 'quick']);
const distribution = ref<Distribution>('random');
const logY = ref(true);

const toggleAlgo = (id: string) => {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(x => x !== id)
    : [...selected.value, id];
};

interface Series { id: string; name: string; color: string; points: GrowthPoint[]; estimate: OrderEstimate | null }

// Measuring runs every selected generator to completion at every size, so it
// is recomputed only when the selection or distribution changes.
const series = computed<Series[]>(() =>
  MEASURABLE.filter(a => selected.value.includes(a.id)).map(a => {
    const points = measureGrowth(a, distribution.value);
    return { id: a.id, name: a.name, color: colorOf(a.id), points, estimate: estimateOrder(points) };
  })
);

// ---- chart geometry ----
const W = 820, H = 420;
const PAD = { l: 64, r: 16, t: 14, b: 40 };
const xMax = GROWTH_SIZES[GROWTH_SIZES.length - 1];
const yMax = computed(() => Math.max(10, ...series.value.flatMap(s => s.points.map(p => p.ops))));

const sx = (n: number) => PAD.l + (n / xMax) * (W - PAD.l - PAD.r);
const sy = (ops: number) => {
  const h = H - PAD.t - PAD.b;
  if (logY.value) {
    const top = Math.log10(yMax.value);
    return PAD.t + h - (Math.log10(Math.max(1, ops)) / Math.max(1, top)) * h;
  }
  return PAD.t + h - (ops / yMax.value) * h;
};
const pathOf = (pts: GrowthPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.n).toFixed(1)},${sy(p.ops).toFixed(1)}`).join(' ');

const yTicks = computed<number[]>(() => {
  if (logY.value) {
    const top = Math.ceil(Math.log10(yMax.value));
    return Array.from({ length: top + 1 }, (_, k) => 10 ** k).filter(v => v <= yMax.value * 1.01 && v >= 1);
  }
  const step = 10 ** Math.floor(Math.log10(yMax.value / 4));
  const nice = [step, 2 * step, 5 * step, 10 * step].find(s => yMax.value / s <= 6) ?? step;
  const out: number[] = [];
  for (let v = 0; v <= yMax.value; v += nice) out.push(v);
  return out;
});

const fmt = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`
  : v >= 1e3 ? `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}k`
  : String(v);
</script>

<template>
  <div class="view">
    <PageHeader
      title="Growth Analysis"
      subtitle="Measured operation counts (comparisons + swaps + writes) as input size grows, plotted against each other. The empirical order is fitted from the measurements alone — compare it with the Θ column each algorithm claims."
    />

    <div class="panel toolbar">
      <label class="field">
        <span>Input</span>
        <select class="select" v-model="distribution">
          <option v-for="d in DISTRIBUTIONS" :key="d.id" :value="d.id">{{ d.label }}</option>
        </select>
      </label>
      <label class="field check">
        <input type="checkbox" v-model="logY" />
        <span>Log-scale ops axis</span>
      </label>
      <span class="muted mono note">n = {{ GROWTH_SIZES[0] }} … {{ xMax }}</span>
    </div>

    <div class="panel">
      <div class="panel-title">Algorithms</div>
      <div class="panel-body picks">
        <label v-for="a in MEASURABLE" :key="a.id" class="pick" :class="{ on: selected.includes(a.id) }">
          <input type="checkbox" :checked="selected.includes(a.id)" @change="toggleAlgo(a.id)" />
          <span class="dot" :style="{ background: colorOf(a.id) }" />
          <span>{{ a.name }}</span>
        </label>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Operations vs input size</div>
      <div class="panel-body">
        <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img"
          aria-label="Line chart of measured operation counts against input size for the selected sorting algorithms">
          <line v-for="t in yTicks" :key="'y' + t" :x1="PAD.l" :x2="W - PAD.r" :y1="sy(t)" :y2="sy(t)" class="grid" />
          <text v-for="t in yTicks" :key="'yl' + t" :x="PAD.l - 8" :y="sy(t) + 3" class="tick" text-anchor="end">{{ fmt(t) }}</text>
          <line v-for="n in GROWTH_SIZES" :key="'x' + n" :x1="sx(n)" :x2="sx(n)" :y1="H - PAD.b" :y2="H - PAD.b + 4" class="axis" />
          <text v-for="n in [8, 128, 256, 384, 512]" :key="'xl' + n" :x="sx(n)" :y="H - PAD.b + 18" class="tick" text-anchor="middle">{{ n }}</text>
          <text :x="(PAD.l + W - PAD.r) / 2" :y="H - 6" class="tick" text-anchor="middle">n (elements)</text>
          <line :x1="PAD.l" :x2="W - PAD.r" :y1="H - PAD.b" :y2="H - PAD.b" class="axis" />
          <line :x1="PAD.l" :x2="PAD.l" :y1="PAD.t" :y2="H - PAD.b" class="axis" />
          <g v-for="s in series" :key="s.id">
            <path :d="pathOf(s.points)" fill="none" :stroke="s.color" stroke-width="1.8" />
            <circle v-for="p in s.points" :key="p.n" :cx="sx(p.n)" :cy="sy(p.ops)" r="2.6" :fill="s.color" />
          </g>
        </svg>
        <p v-if="!series.length" class="muted">Select at least one algorithm to plot.</p>
        <div class="fits">
          <span v-for="s in series" :key="s.id" class="fit mono">
            <span class="dot" :style="{ background: s.color }" />
            {{ s.name }}: <template v-if="s.estimate">observed ≈ {{ s.estimate.model.label }} (slope n^{{ s.estimate.exponent.toFixed(2) }})</template><template v-else>—</template>
          </span>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Measured operations</div>
      <div class="panel-body table-scroll">
        <table class="mono ops-table">
          <thead>
            <tr><th>Algorithm</th><th v-for="n in GROWTH_SIZES" :key="n">{{ n }}</th><th>Observed</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in series" :key="s.id">
              <td class="name"><span class="dot" :style="{ background: s.color }" /> {{ s.name }}</td>
              <td v-for="p in s.points" :key="p.n">{{ fmt(p.ops) }}</td>
              <td>{{ s.estimate?.model.label ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">Reading the notation</div>
      <div class="panel-body notation">
        <div class="def">
          <div class="term mono">O(f(n)) — upper bound</div>
          <p>g ∈ O(f) when g(n) ≤ c·f(n) for some constant c &gt; 0 and all large n. “The algorithm takes <em>at most</em> this order of work.” Worst cases are quoted with O.</p>
        </div>
        <div class="def">
          <div class="term mono">Ω(f(n)) — lower bound</div>
          <p>g ∈ Ω(f) when g(n) ≥ c·f(n) for all large n. “It takes <em>at least</em> this much.” Best cases are quoted with Ω; comparison sorting as a whole is Ω(n log n).</p>
        </div>
        <div class="def">
          <div class="term mono">Θ(f(n)) — tight bound</div>
          <p>g ∈ Θ(f) when both O(f) and Ω(f) hold — the growth rate is exactly f up to constants. Average cases are quoted with Θ when the analysis pins them down.</p>
        </div>
        <div class="def">
          <div class="term mono">Amortized</div>
          <p>The average cost per operation over a worst-case <em>sequence</em>, letting rare expensive steps (a hash-table rehash, an array doubling) be paid for by the many cheap ones around them.</p>
        </div>
        <div class="def">
          <div class="term mono">Empirical fit used here</div>
          <p>Each curve is fitted in log–log space over the larger input sizes: the slope of ln(ops) against ln(n) estimates the exponent (n² gives slope ≈ 2, n log n ≈ 1.1–1.2 in this range), and the model with the smallest residual is reported. Constants are invisible to the notation but very visible in the chart — that is the point.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; gap: 12px; }
.check { flex-direction: row; align-items: center; gap: 6px; }
.note { margin-left: auto; }
.picks { display: flex; flex-wrap: wrap; gap: 6px; }
.pick {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  font-size: 12px; color: var(--text-muted); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 3px 8px; user-select: none;
}
.pick.on { color: var(--text); border-color: var(--border-strong); background: var(--surface-2); }
.pick input { position: absolute; opacity: 0; pointer-events: none; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
.chart { width: 100%; height: auto; display: block; }
.grid { stroke: var(--border); stroke-width: 1; }
.axis { stroke: var(--border-strong); stroke-width: 1; }
.tick { fill: var(--text-faint); font-size: 10.5px; font-family: var(--font-mono); }
.fits { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; }
.fit { font-size: 11.5px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 6px; }
.table-scroll { overflow-x: auto; }
.ops-table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
.ops-table th { color: var(--text-faint); font-weight: 500; text-align: right; padding: 2px 8px; }
.ops-table th:first-child { text-align: left; }
.ops-table td { text-align: right; padding: 2px 8px; }
.ops-table td.name { text-align: left; color: var(--text-muted); }
.notation { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.term { font-size: 12.5px; color: var(--text); margin-bottom: 4px; }
.def p { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }
</style>
