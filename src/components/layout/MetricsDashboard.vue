<script setup lang="ts">
withDefaults(defineProps<{
  metric1Label?: string;
  metric1Value: number;
  metric2Label?: string;
  metric2Value: number;
  timeMs: number;
}>(), {
  metric1Label: 'Comparisons',
  metric2Label: 'Swaps'
});
</script>

<template>
  <div class="metrics">
    <div class="metric-box">
      <span class="label">{{ metric1Label }}</span>
      <span class="value">{{ metric1Value }}</span>
    </div>
    <div class="metric-box">
      <span class="label">{{ metric2Label }}</span>
      <span class="value">{{ metric2Value }}</span>
    </div>
    <div class="metric-box">
      <span class="label">TimeElapsed</span>
      <span class="value">{{ timeMs }} <small>ms</small></span>
    </div>
  </div>
</template>

<style scoped>
.metrics { display: flex; gap: 15px; margin-bottom: 20px; }
.metric-box {
  background-color: #161b22; border: 1px solid #30363d;
  padding: 12px 24px; border-radius: 8px; display: flex;
  flex-direction: column; align-items: center; min-width: 140px;
}
.metric-box .label { font-size: 13px; color: #8b949e; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
.metric-box .value { font-size: 28px; font-weight: bold; color: #58a6ff; margin-top: 4px; }
.metric-box .value small { font-size: 16px; color: #8b949e; }
</style>
