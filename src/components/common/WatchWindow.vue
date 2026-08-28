<script setup lang="ts">
defineProps<{ variables: Record<string, unknown> }>();

const fmt = (v: unknown): string => {
  if (v === undefined) return 'undefined';
  if (v === Infinity) return '∞';
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(2);
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
};
</script>

<template>
  <div class="panel">
    <div class="panel-title">Variables</div>
    <div class="vars">
      <div v-if="Object.keys(variables).length === 0" class="faint empty">—</div>
      <table v-else class="mono">
        <tbody>
          <tr v-for="(value, key) in variables" :key="key">
            <td class="k">{{ key }}</td>
            <td class="v">{{ fmt(value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.vars { padding: 6px 12px; max-height: 190px; overflow-y: auto; min-height: 60px; }
.empty { padding: 6px 0; }
table { border-collapse: collapse; width: 100%; }
td { padding: 2px 0; vertical-align: top; font-size: 12.5px; }
.k { color: var(--accent); padding-right: 12px; white-space: nowrap; width: 1%; }
.v { color: var(--text); word-break: break-all; }
</style>
