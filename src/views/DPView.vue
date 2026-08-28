<script setup lang="ts">
import { useDP } from '../composables/useDP';
import { useKeyboard } from '../engine/useKeyboard';
import { DP_LIST } from '../algorithms/dp';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import DPMatrixBoard from '../components/dp/DPMatrixBoard.vue';

const {
  algorithmId, inputs, error, table, meta, values, states, variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useDP();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });

const legend = [
  { label: 'Empty', color: 'var(--surface-2)' },
  { label: 'Computed', color: 'var(--surface-3)' },
  { label: 'Read from (subproblem)', color: 'var(--accent)' },
  { label: 'Being written', color: 'var(--s-compare)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="Dynamic Programming" subtitle="Bottom-up table filling. Each step writes one cell and highlights the subproblems it was computed from." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="DP_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!table"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <template v-if="table">
          <p class="muted meaning mono">{{ table.cellMeaning }}</p>
          <DPMatrixBoard :rows="table.rows" :cols="table.cols" :values="values" :states="states" :row-labels="table.rowLabels" :col-labels="table.colLabels" />
          <StateLegend :items="legend" />
        </template>
        <div v-else class="panel panel-body muted">Fix the input to build the table.</div>
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
.meaning { font-size: 12px; }
</style>
