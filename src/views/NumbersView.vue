<script setup lang="ts">
import { useBoard } from '../composables/useBoard';
import { useKeyboard } from '../engine/useKeyboard';
import { NUMBERS, NUMBERS_LIST, DEFAULT_NUMBERS } from '../algorithms/numbers';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import BoardCanvas from '../components/board/BoardCanvas.vue';

const {
  algorithmId, inputs, error, setup, meta, cells, states, variables, activeLine,
  index, frameCount, lastIndex, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useBoard(NUMBERS, DEFAULT_NUMBERS, 60);

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(lastIndex.value) });

const legend = [
  { label: 'Prime', color: 'var(--s-sorted)' },
  { label: 'Current p', color: 'var(--s-compare)' },
  { label: 'Being crossed out', color: 'var(--s-write)' },
  { label: 'Composite (crossed)', color: 'var(--surface)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Number Theory" subtitle="The oldest algorithm on the site (~200 BC): primes fall out of a table when every multiple is struck exactly once." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="NUMBERS_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
      <span class="muted note">Modular arithmetic and the crypto side of number theory live at <a href="https://clientcrypt.nirbhay.dev" rel="noopener">clientcrypt.nirbhay.dev</a>.</span>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!setup"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <BoardCanvas v-if="setup" :rows="setup.rows" :cols="setup.cols" :cells="cells" :states="states" />
        <div v-else class="panel panel-body muted">Fix the input to run.</div>
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
.note { font-size: 12px; align-self: center; padding-bottom: 6px; max-width: 320px; }
</style>
