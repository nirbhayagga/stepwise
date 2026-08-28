<script setup lang="ts">
import StateLegend from '../common/StateLegend.vue';
import { WEIGHT_COST } from '../../algorithms/pathfinding';
const items = [
  { label: 'Start', color: 'var(--g-start)' },
  { label: 'Target', color: 'var(--g-target)' },
  { label: 'Wall', color: 'var(--g-wall)' },
  { label: `Weight (cost ×${WEIGHT_COST})`, color: 'var(--g-weight)' },
  { label: 'Frontier (open)', color: 'var(--g-frontier)' },
  { label: 'Expanding', color: 'var(--g-visiting)' },
  { label: 'Visited (closed)', color: 'var(--g-visited)' },
  { label: 'Path', color: 'var(--g-path)' },
];
</script>
<template><StateLegend :items="items" /></template>
