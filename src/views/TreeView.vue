<script setup lang="ts">
import { computed } from 'vue';
import { useTree } from '../composables/useTree';
import { useKeyboard } from '../engine/useKeyboard';
import { TREE_LIST } from '../algorithms/tree';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import TreeCanvas from '../components/tree/TreeCanvas.vue';

const {
  algorithmId, inputs, error, meta, root, forest, output, variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useTree();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });

const isRB = computed(() => algorithmId.value === 'red-black');
const legend = computed(() => [
  { label: 'Visiting / comparing', color: 'var(--s-compare)', shape: 'circle' as const },
  { label: 'Inserted', color: 'var(--s-sorted)', shape: 'circle' as const },
  { label: 'Rotation pivot / swap', color: 'var(--s-mark)', shape: 'circle' as const },
  { label: 'Output', color: 'var(--accent)', shape: 'circle' as const },
  ...(isRB.value ? [{ label: 'Red', color: '#5a2b2b', shape: 'circle' as const }, { label: 'Black', color: '#11151b', shape: 'circle' as const }] : []),
]);
</script>

<template>
  <div class="view">
    <PageHeader title="Binary Trees" subtitle="Search trees, balancing rotations, heaps and traversals. Duplicate keys are ignored for search trees." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="TREE_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!!error"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <TreeCanvas :root="root" :forest="forest" />
        <div v-if="output.length" class="panel output mono">
          <span class="eyebrow">Output</span>
          <span v-for="(k, i) in output" :key="i" class="tok">{{ k }}</span>
        </div>
        <StateLegend :items="legend" />
      </div>
      <div class="workspace-side">
        <ComplexityCard :meta="meta" />
        <WatchWindow :variables="variables" />
        <PseudocodePanel :code="meta.pseudocode" :active-line="activeLine" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.output { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 12px; font-size: 12.5px; }
.output .eyebrow { margin-right: 6px; }
.tok { background: var(--accent-bg); color: var(--accent-strong); padding: 1px 6px; border-radius: 3px; }
</style>
