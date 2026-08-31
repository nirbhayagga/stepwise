<script setup lang="ts">
import { useStrings } from '../composables/useStrings';
import { useKeyboard } from '../engine/useKeyboard';
import { STRING_LIST } from '../algorithms/strings';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import StringCanvas from '../components/strings/StringCanvas.vue';

const {
  algorithmId, inputs, error, setup, meta, textStates, patternStates, shift, aux, found, comparisons, variables, activeLine,
  index, frameCount, lastIndex, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useStrings();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(lastIndex.value) });

const legend = [
  { label: 'Comparing', color: 'var(--s-compare)' },
  { label: 'Mismatch', color: 'var(--s-write)' },
  { label: 'Marker (bad char, Z-box, hash window)', color: 'var(--s-mark)' },
  { label: 'Occurrence found', color: 'var(--accent)' },
];
</script>

<template>
  <div class="view">
    <PageHeader title="String Matching" subtitle="Find every occurrence of a pattern in a text. The auxiliary row shows the table each algorithm precomputes; the pattern row slides to its current alignment." />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="STRING_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!setup"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <div class="workspace">
      <div class="workspace-main">
        <MetricsBar :metrics="[
          { label: 'Character comparisons', value: comparisons },
          { label: 'Occurrences', value: found.length },
          { label: 'n · m', value: setup ? `${setup.text.length} · ${setup.pattern.length || '—'}` : '—' },
        ]" />
        <StringCanvas v-if="setup" :text="setup.text" :pattern="setup.pattern" :text-states="textStates" :pattern-states="patternStates" :shift="shift" :aux="aux" :aux-label="setup.auxLabel" />
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
