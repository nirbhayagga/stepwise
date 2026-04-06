<script setup lang="ts">

defineProps<{ variables: Record<string, any> }>();
</script>

<template>
  <div class="watch-window">
    <h3>Live Variables</h3>
    <div v-if="Object.keys(variables).length === 0" class="empty">No variables captured.</div>
    <div v-else class="var-list">
      <div v-for="(value, key) in variables" :key="key" class="var-item">
        <span class="var-name">{{ key }}</span>:
        <span class="var-value">{{ JSON.stringify(value) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watch-window {
  background-color: #161b22;
  border: 1px solid #30363d;
  padding: 15px;
  border-radius: 8px;
  min-width: 250px;
  height: 200px;
  display: flex;
  flex-direction: column;
}
h3 { margin-top: 0; color: #c9d1d9; font-size: 16px; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
.empty { color: #8b949e; font-size: 13px; font-style: italic; }
.var-list { overflow-y: auto; flex: 1; }
.var-item { display: flex; justify-content: space-between; margin-bottom: 6px; font-family: monospace; font-size: 14px; }
.var-name { color: #58a6ff; font-weight: bold; }
.var-value { color: #3fb950; }
</style>
