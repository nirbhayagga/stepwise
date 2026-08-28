<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <header class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="muted">{{ subtitle }}</p>
    </div>
    <div class="page-header-aside"><slot /></div>
  </header>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; padding-bottom: 4px; }
.page-header p { margin-top: 2px; font-size: 13px; }
.page-header-aside { display: flex; gap: 8px; align-items: center; }
</style>
