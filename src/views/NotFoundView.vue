<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<template>
  <div class="view">
    <div class="panel wrap">
      <h1>Page not found</h1>
      <p class="muted">Nothing lives at <code>#{{ route.fullPath }}</code>.</p>
      <router-link class="btn btn-primary back" to="/sort">Back to the visualizer</router-link>
    </div>
  </div>
</template>

<style scoped>
.wrap { padding: 48px 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.back { margin-top: 8px; }
code { color: var(--accent); }
</style>
