<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useSorting } from '../composables/useSorting';
import { useKeyboard } from '../engine/useKeyboard';
import { SORTING_LIST, randomValues } from '../algorithms/sorting';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import SortingCanvas from '../components/sorting/SortingCanvas.vue';
import SortingLegend from '../components/sorting/SortingLegend.vue';

const a = reactive(useSorting());
const b = reactive(useSorting());
const panes = [a, b];
const size = ref(60);

const isPlaying = computed(() => a.isPlaying || b.isPlaying);
const index = computed(() => Math.max(a.index, b.index));
const frameCount = computed(() => Math.max(a.frameCount, b.frameCount));
const speed = computed({ get: () => a.speed, set: v => { a.speed = v; b.speed = v; } });

const generate = () => {
  const values = randomValues(size.value);
  panes.forEach(p => p.setArray(values));
};
const play = () => panes.forEach(p => p.play());
const pause = () => panes.forEach(p => p.pause());
const toggle = () => (isPlaying.value ? pause() : play());
const step = () => panes.forEach(p => p.step());
const stepBack = () => panes.forEach(p => p.stepBack());
const reset = () => panes.forEach(p => p.reset());
const seek = (i: number) => panes.forEach(p => p.seek(i));

onMounted(() => {
  b.setAlgorithm('quick');
  generate();
});

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });
</script>

<template>
  <div class="view">
    <PageHeader title="Sorting · Compare" subtitle="Two algorithms on identical input, advanced in lockstep. Step counts are directly comparable; wall-clock time is not shown because it would measure the recorder, not the algorithm." />

    <div class="panel toolbar">
      <label class="field">
        <span>Array size · {{ size }}</span>
        <input type="range" class="range" min="5" max="200" v-model.number="size" :disabled="isPlaying" @change="generate" />
      </label>
      <button class="btn" :disabled="isPlaying" @click="generate">New array</button>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="split">
      <div v-for="(p, i) in panes" :key="i" class="split-pane panel pane">
        <div class="pane-head">
          <AlgorithmSelect :model-value="p.algorithmId" :options="SORTING_LIST" :label="i === 0 ? 'Left' : 'Right'" :disabled="isPlaying" @update:model-value="p.setAlgorithm" />
          <span class="mono muted complexity">{{ p.meta.complexity.time.average ?? p.meta.complexity.time.worst }} · {{ p.meta.complexity.space }}</span>
        </div>
        <MetricsBar :metrics="[
          { label: 'Comparisons', value: p.comparisons },
          { label: 'Swaps', value: p.swaps },
          { label: 'Writes', value: p.writes },
          { label: 'Step', value: p.index + ' / ' + p.lastIndex },
        ]" />
        <SortingCanvas :values="p.values" :states="p.states" :height="320" />
      </div>
    </div>
    <SortingLegend />
  </div>
</template>

<style scoped>
.pane { padding: 12px; }
.pane-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
.complexity { font-size: 12px; padding-bottom: 6px; }
</style>
