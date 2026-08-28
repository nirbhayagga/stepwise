<script setup lang="ts">
import StateLegend from '../common/StateLegend.vue';
const items = [
  { label: 'Unsorted', color: 'var(--s-default)' },
  { label: 'Comparing', color: 'var(--s-compare)' },
  { label: 'Written / swapped', color: 'var(--s-write)' },
  { label: 'Marker (pivot, key, bound)', color: 'var(--s-mark)' },
  { label: 'Sorted', color: 'var(--s-sorted)' },
];
</script>
<template><StateLegend :items="items" /></template>
