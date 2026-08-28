<script setup lang="ts">
import type { AlgorithmMeta } from '../../engine/types';
defineProps<{ meta: AlgorithmMeta }>();
</script>

<template>
  <div class="panel">
    <div class="panel-title">{{ meta.name }}</div>
    <div class="panel-body body">
      <p class="summary">{{ meta.summary }}</p>
      <table class="mono">
        <tbody>
          <tr v-if="meta.complexity.time.best"><td class="k">Best</td><td>{{ meta.complexity.time.best }}</td></tr>
          <tr v-if="meta.complexity.time.average"><td class="k">Average</td><td>{{ meta.complexity.time.average }}</td></tr>
          <tr><td class="k">Worst</td><td>{{ meta.complexity.time.worst }}</td></tr>
          <tr><td class="k">Space</td><td>{{ meta.complexity.space }}</td></tr>
        </tbody>
      </table>
      <div v-if="meta.complexity.tags?.length" class="tags">
        <span v-for="t in meta.complexity.tags" :key="t" class="tag">{{ t }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.body { display: flex; flex-direction: column; gap: 10px; }
.summary { font-size: 12.5px; color: var(--text-muted); }
table { border-collapse: collapse; }
td { padding: 1px 0; font-size: 12.5px; }
.k { color: var(--text-muted); padding-right: 16px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag {
  font-size: 11px; color: var(--text-muted); border: 1px solid var(--border-strong);
  border-radius: 3px; padding: 1px 6px;
}
</style>
