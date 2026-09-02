<script setup lang="ts">
import { useTree } from '../composables/useTree';
import { useKeyboard } from '../engine/useKeyboard';
import { RECURSION, RECURSION_LIST, DEFAULT_RECURSION } from '../algorithms/recursion';
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
  algorithmId, inputs, error, meta, root, forest, variables, activeLine,
  index, frameCount, lastIndex, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useTree(RECURSION, DEFAULT_RECURSION, 300);

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(lastIndex.value) });

const legend = [
  { label: 'Active call', color: 'var(--s-compare)', shape: 'circle' as const },
  { label: 'Returned (value on label)', color: 'var(--s-sorted)', shape: 'circle' as const },
  { label: 'Memo hit / leaf result', color: 'var(--accent)', shape: 'circle' as const },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Recursion" subtitle="The call tree, drawn as it happens. Each node is one invocation; its caption fills in when the call returns. Compare naive and memoized Fibonacci on the same n." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="RECURSION_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!!error"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <TreeCanvas :root="root" :forest="forest" />
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
