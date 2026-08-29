<script setup lang="ts">
export interface Metric { label: string; value: number | string; unit?: string }
defineProps<{ metrics: Metric[] }>();
const fmt = (v: number | string) => (typeof v === 'number' ? v.toLocaleString() : v);
</script>

<template>
  <div class="metrics">
    <div v-for="m in metrics" :key="m.label" class="metric">
      <span class="label">{{ m.label }}</span>
      <span class="value mono">{{ fmt(m.value) }}<small v-if="m.unit"> {{ m.unit }}</small></span>
    </div>
  </div>
</template>

<style scoped>
.metrics { display: flex; gap: 24px; flex-wrap: wrap; padding: 6px 2px; }
.metric { display: flex; flex-direction: column; gap: 2px; }
.label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.value { font-size: 18px; color: var(--text); font-weight: 500; font-variant-numeric: tabular-nums; min-width: 5ch; }
.value small { font-size: 12px; color: var(--text-muted); }
</style>
