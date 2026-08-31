<script setup lang="ts">
import { HASH_STATE } from '../../algorithms/hashing';

defineProps<{ slots: number[][]; states: Uint8Array }>();
const CLASS = ['', 'probe', 'placed', 'hit', 'miss', 'moving'];
const cls = (s?: number) => CLASS[s ?? HASH_STATE.default];
</script>

<template>
  <div class="panel wrap">
    <div class="table mono">
      <div v-for="(slot, i) in slots" :key="i" class="col">
        <div class="idx">{{ i }}</div>
        <div class="slot" :class="[cls(states[i]), { empty: slot.length === 0 }]">
          <div v-if="slot.length === 0" class="nil">·</div>
          <div v-for="(v, j) in slot" :key="j" class="val">{{ v }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { padding: 14px; overflow-x: auto; }
.table { display: flex; gap: 4px; align-items: flex-start; justify-content: center; min-width: min-content; }
.col { display: flex; flex-direction: column; align-items: stretch; min-width: 40px; }
.idx { text-align: center; font-size: 10.5px; color: var(--text-faint); padding-bottom: 3px; }
.slot { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--border); background: var(--surface-2); padding: 3px; min-height: 34px; transition: border-color 0.1s, background 0.1s; }
.nil { text-align: center; color: var(--text-faint); line-height: 26px; }
.val { text-align: center; background: var(--surface-3); border: 1px solid var(--border-strong); padding: 3px 4px; font-size: 12.5px; }
.slot.probe { border-color: var(--s-compare); background: rgba(217, 178, 92, 0.12); }
.slot.placed { border-color: var(--s-sorted); background: rgba(111, 181, 137, 0.14); }
.slot.moving { border-color: var(--s-mark); background: rgba(180, 142, 173, 0.14); }
.slot.hit { border-color: var(--accent); background: var(--accent-bg); }
.slot.miss { border-color: var(--s-write); background: rgba(212, 122, 116, 0.12); }
</style>
