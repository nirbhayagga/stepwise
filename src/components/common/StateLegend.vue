<script setup lang="ts">
export interface LegendItem { label: string; color: string; shape?: 'square' | 'circle' }
defineProps<{ items: LegendItem[] }>();
</script>

<template>
  <div class="legend">
    <div v-for="i in items" :key="i.label" class="item">
      <span class="swatch" :class="i.shape ?? 'square'" :style="{ background: i.color }"></span>
      <span>{{ i.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--text-muted); padding: 2px 2px; }
.item { display: flex; align-items: center; gap: 6px; }
.swatch { width: 10px; height: 10px; display: inline-block; border: 1px solid rgba(255,255,255,0.08); }
.swatch.circle { border-radius: 50%; }
</style>
