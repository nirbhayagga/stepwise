<script setup lang="ts">
import { computed } from 'vue';
import { useConcurrency } from '../composables/useConcurrency';
import { useKeyboard } from '../engine/useKeyboard';
import { CONCURRENCY_LIST } from '../algorithms/concurrency';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import ThreadsCanvas from '../components/concurrency/ThreadsCanvas.vue';
import AmdahlPanel from '../components/concurrency/AmdahlPanel.vue';

const {
  algorithmId, inputs, error, meta,
  threads, counter, lock, strip, executed, switches, expected, lost, hasLock,
  variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, shuffle, setAlgorithm,
} = useConcurrency();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });

const metrics = computed(() => [
  { label: 'Executed', value: executed.value },
  { label: 'Context switches', value: switches.value },
  { label: 'Counter', value: `${counter.value} / ${expected.value}` },
  { label: 'Lost updates', value: lost.value ?? '—' },
]);
</script>

<template>
  <div class="view">
    <PageHeader
      title="Threads & Race Conditions"
      subtitle="Simulated threads run the same program against shared memory; a seeded scheduler picks which one executes its next instruction. One interleaving at a time, fully scrubbable — shuffle the seed to find a different one."
    />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="CONCURRENCY_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
      <button class="btn" :disabled="isPlaying" @click="shuffle()">Shuffle interleaving</button>
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!!error"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <MetricsBar :metrics="metrics" />

    <div class="workspace">
      <div class="workspace-main">
        <div class="panel pad">
          <ThreadsCanvas :threads="threads" :strip="strip" :counter="counter" :lock="lock" :expected="expected" :lost="lost" :has-lock="hasLock" />
        </div>
        <AmdahlPanel />
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
.pad { padding: 14px; }
</style>
