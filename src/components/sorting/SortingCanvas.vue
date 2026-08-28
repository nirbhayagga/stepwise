<script setup lang="ts">
import { computed } from 'vue';
import { SORT_STATE } from '../../algorithms/sorting';

const props = defineProps<{ values: Uint16Array; states: Uint8Array; height?: number }>();

const CLASS = ['default', 'compare', 'write', 'sorted', 'mark'];
const max = computed(() => {
  let m = 1;
  for (let i = 0; i < props.values.length; i++) if (props.values[i] > m) m = props.values[i];
  return m;
});
const bars = computed(() =>
  Array.from(props.values, (v, i) => ({ i, h: (v / max.value) * 100, cls: CLASS[props.states[i] ?? SORT_STATE.default] }))
);
</script>

<template>
  <div class="panel canvas" :style="{ height: (height ?? 420) + 'px' }">
    <div v-for="b in bars" :key="b.i" class="bar" :class="b.cls" :style="{ height: b.h + '%' }"></div>
  </div>
</template>

<style scoped>
.canvas { display: flex; align-items: flex-end; gap: 1px; padding: 16px 16px 0; overflow: hidden; }
.bar { flex: 1 1 0; min-width: 1px; background: var(--s-default); transition: height 0.08s linear; }
.bar.compare { background: var(--s-compare); }
.bar.write { background: var(--s-write); }
.bar.sorted { background: var(--s-sorted); }
.bar.mark { background: var(--s-mark); }
</style>
