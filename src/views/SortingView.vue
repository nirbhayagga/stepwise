<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSorting } from '../composables/useSorting';
import { useKeyboard } from '../engine/useKeyboard';
import { SORTING_LIST } from '../algorithms/sorting';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import SortingCanvas from '../components/sorting/SortingCanvas.vue';
import SortingLegend from '../components/sorting/SortingLegend.vue';

const {
  algorithmId, meta, values, states, comparisons, swaps, writes, variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, generateArray, setAlgorithm,
} = useSorting();

const size = ref(60);
onMounted(() => generateArray(size.value));

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });
</script>

<template>
  <div class="view">
    <PageHeader title="Sorting" subtitle="Comparison and non-comparison sorts on a random integer array. Every step is recorded, so the timeline can be scrubbed in either direction." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="SORTING_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <label class="field">
        <span>Array size · {{ size }}</span>
        <input type="range" class="range" min="5" max="200" v-model.number="size" :disabled="isPlaying" @change="generateArray(size)" />
      </label>
      <button class="btn" :disabled="isPlaying" @click="generateArray(size)">New array</button>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <MetricsBar :metrics="[
          { label: 'Comparisons', value: comparisons },
          { label: 'Swaps', value: swaps },
          { label: 'Writes', value: writes },
          { label: 'n', value: values.length },
        ]" />
        <SortingCanvas :values="values" :states="states" />
        <SortingLegend />
      </div>
      <div class="workspace-side">
        <ComplexityCard :meta="meta" />
        <WatchWindow :variables="variables" />
        <PseudocodePanel :code="meta.pseudocode" :active-line="activeLine" />
      </div>
    </div>
  </div>
</template>
