<script setup lang="ts">
import { useBoard } from '../composables/useBoard';
import { useKeyboard } from '../engine/useKeyboard';
import { BACKTRACKING, BACKTRACKING_LIST, DEFAULT_BACKTRACKING } from '../algorithms/backtracking';
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
} = useBoard(BACKTRACKING, DEFAULT_BACKTRACKING, 90);

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(lastIndex.value) });

const legend = [
  { label: 'Given / final', color: 'var(--surface-3)' },
  { label: 'Placed', color: 'var(--s-sorted)' },
  { label: 'Trying', color: 'var(--s-compare)' },
  { label: 'Conflict', color: 'var(--s-write)' },
  { label: 'Backtracked', color: 'var(--surface)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Backtracking" subtitle="Pruned depth-first search over a constraint problem: extend a partial solution until a constraint fails, then undo the last choice and try the next." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="BACKTRACKING_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
      <span class="muted note">Prefer solving them yourself? Play at <a href="https://sudoku.nirbhay.dev" rel="noopener">sudoku.nirbhay.dev</a>.</span>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!setup"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <BoardCanvas v-if="setup" :rows="setup.rows" :cols="setup.cols" :cells="cells" :states="states" :box-size="setup.boxSize" />
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
.note { font-size: 12px; align-self: center; padding-bottom: 6px; }
</style>
