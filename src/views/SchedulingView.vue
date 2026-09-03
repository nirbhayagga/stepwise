<script setup lang="ts">
import { computed } from 'vue';
import { useScheduling } from '../composables/useScheduling';
import { useKeyboard } from '../engine/useKeyboard';
import { SCHEDULING_LIST, pname } from '../algorithms/scheduling';
import PageHeader from '../components/common/PageHeader.vue';
import AlgorithmSelect from '../components/common/AlgorithmSelect.vue';
import InputForm from '../components/common/InputForm.vue';
import PlaybackControls from '../components/common/PlaybackControls.vue';
import MetricsBar from '../components/common/MetricsBar.vue';
import WatchWindow from '../components/common/WatchWindow.vue';
import PseudocodePanel from '../components/common/PseudocodePanel.vue';
import ComplexityCard from '../components/common/ComplexityCard.vue';
import StateLegend from '../components/common/StateLegend.vue';
import GanttCanvas from '../components/scheduling/GanttCanvas.vue';

const {
  algorithmId, inputs, error, procs, meta,
  time, gantt, remaining, queue, completion, contextSwitches, avgWaiting, avgTurnaround,
  variables, activeLine,
  index, frameCount, isPlaying, speed,
  play, pause, toggle, step, stepBack, reset, seek, rebuild, setAlgorithm,
} = useScheduling();

useKeyboard({ toggle, step, stepBack, reset, toStart: () => seek(0), toEnd: () => seek(Infinity) });

const showPriority = computed(() => meta.value.inputs.some(s => s.key === 'priorities'));

const rows = computed(() => procs.value.map(p => {
  const done = completion.value[p.id];
  return {
    ...p,
    name: pname(p.id),
    left: remaining.value[p.id] ?? p.burst,
    completion: done,
    turnaround: done !== null && done !== undefined ? done - p.arrival : null,
    waiting: done !== null && done !== undefined ? done - p.arrival - p.burst : null,
  };
}));

const metrics = computed(() => [
  { label: 'Time', value: time.value },
  { label: 'Context switches', value: contextSwitches.value },
  { label: 'Avg waiting', value: avgWaiting.value ?? '—' },
  { label: 'Avg turnaround', value: avgTurnaround.value ?? '—' },
]);

const legend = [
  { label: 'Running (process colour)', color: 'var(--accent)' },
  { label: 'In ready queue', color: 'var(--surface-3)' },
  { label: 'CPU idle', color: 'var(--surface-2)' },
  { label: 'Arrival', color: 'var(--text-muted)' },
];
</script>

<template>
  <div class="view">
    <PageHeader
      title="CPU Scheduling"
      subtitle="One frame per scheduler decision or clock tick. The strip is the classic Gantt chart; the lanes below show each process running, waiting in the ready queue, or not yet arrived."
    />

    <div class="panel toolbar">
      <AlgorithmSelect :model-value="algorithmId" :options="SCHEDULING_LIST" :disabled="isPlaying" @update:model-value="setAlgorithm" />
      <InputForm :specs="meta.inputs" v-model="inputs" :disabled="isPlaying" :error="error" @change="rebuild" />
    </div>

    <PlaybackControls
      :is-playing="isPlaying" :index="index" :frame-count="frameCount" :speed="speed" :disabled="!!error"
      @play="play" @pause="pause" @step="step" @step-back="stepBack" @reset="reset" @seek="seek" @update:speed="speed = $event"
    />

    <MetricsBar :metrics="metrics" />

    <div class="workspace">
      <div class="workspace-main">
        <div class="panel pad">
          <GanttCanvas :procs="procs" :gantt="gantt" :queue="queue" :time="time" />
        </div>
        <StateLegend :items="legend" />
        <div class="panel">
          <div class="panel-title">Processes</div>
          <div class="panel-body table-scroll">
            <table class="mono proc-table">
              <thead>
                <tr>
                  <th>Process</th><th>Arrival</th><th>Burst</th>
                  <th v-if="showPriority">Priority</th>
                  <th>Remaining</th><th>Completion</th><th>Turnaround</th><th>Waiting</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rows" :key="r.id">
                  <td>{{ r.name }}</td><td>{{ r.arrival }}</td><td>{{ r.burst }}</td>
                  <td v-if="showPriority">{{ r.priority }}</td>
                  <td>{{ r.left }}</td>
                  <td>{{ r.completion ?? '—' }}</td><td>{{ r.turnaround ?? '—' }}</td><td>{{ r.waiting ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
.pad .panel-body { padding: 12px; }
.pad { padding: 12px; }
.table-scroll { overflow-x: auto; }
.proc-table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
.proc-table th { color: var(--text-faint); font-weight: 500; text-align: right; padding: 2px 10px; }
.proc-table td { text-align: right; padding: 2px 10px; }
.proc-table th:first-child, .proc-table td:first-child { text-align: left; padding-left: 2px; }
</style>
