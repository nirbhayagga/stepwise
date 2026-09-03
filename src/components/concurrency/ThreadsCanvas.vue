<script setup lang="ts">
import type { ThreadSnap } from '../../algorithms/concurrency';
import { tname } from '../../algorithms/concurrency';

defineProps<{
  threads: ThreadSnap[];
  strip: Int8Array;
  counter: number;
  lock: number | null;
  expected: number;
  lost: number | null;
  hasLock: boolean;
}>();

const PALETTE = ['var(--s-compare)', 'var(--accent)', 'var(--s-sorted)', 'var(--s-mark)'];
const colorOf = (tid: number) => PALETTE[tid % PALETTE.length];
const PHASE_LABEL = { ready: 'ready', blocked: 'blocked on lock', done: 'finished' } as const;
</script>

<template>
  <div class="threads-wrap" role="img" aria-label="Simulated thread interleaving on a shared counter">
    <!-- executed-instruction history -->
    <div class="strip-row">
      <span class="cap">Interleaving</span>
      <div class="strip">
        <span v-for="(tid, k) in strip" :key="k" class="tick mono" :style="{ background: colorOf(tid) }">{{ tname(tid) }}</span>
        <span v-if="!strip.length" class="muted mono">— nothing executed yet</span>
      </div>
    </div>

    <!-- shared memory -->
    <div class="shared">
      <div class="mem">
        <span class="cap">shared counter</span>
        <span class="big mono" :class="{ bad: lost !== null && lost > 0, good: lost !== null && lost === 0 }">{{ counter }}</span>
        <span class="muted mono">expected {{ expected }}</span>
      </div>
      <div v-if="hasLock" class="mem">
        <span class="cap">lock</span>
        <span class="big mono">{{ lock === null ? 'free' : tname(lock) }}</span>
        <span class="muted mono">{{ lock === null ? '' : 'held' }}</span>
      </div>
      <div v-if="lost !== null" class="mem">
        <span class="cap">lost updates</span>
        <span class="big mono" :class="lost > 0 ? 'bad' : 'good'">{{ lost }}</span>
        <span class="muted mono">{{ lost > 0 ? 'race!' : 'correct' }}</span>
      </div>
    </div>

    <!-- per-thread cards -->
    <div class="cards">
      <div v-for="t in threads" :key="t.id" class="card" :class="t.phase">
        <div class="head">
          <span class="dot" :style="{ background: colorOf(t.id) }" />
          <span class="name mono">{{ tname(t.id) }}</span>
          <span class="phase" :class="t.phase">{{ PHASE_LABEL[t.phase] }}</span>
        </div>
        <div class="row mono"><span class="k">i</span><span>{{ t.phase === 'done' ? '—' : t.iter }}</span></div>
        <div class="row mono"><span class="k">register r</span><span>{{ t.reg ?? '—' }}</span></div>
        <div class="row mono next"><span class="k">next</span><span>{{ t.nextText ?? 'done' }}</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.threads-wrap { display: flex; flex-direction: column; gap: 14px; }
.cap { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.strip-row { display: flex; flex-direction: column; gap: 6px; }
.strip { display: flex; flex-wrap: wrap; gap: 2px; min-height: 20px; }
.tick {
  width: 28px; height: 20px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 10.5px; color: #10141b; border-radius: 2px; flex: none;
}
.shared { display: flex; gap: 28px; flex-wrap: wrap; }
.mem { display: flex; flex-direction: column; gap: 2px; }
.big { font-size: 26px; font-weight: 500; color: var(--text); font-variant-numeric: tabular-nums; }
.big.bad { color: var(--danger); }
.big.good { color: var(--success); }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.card { border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; background: var(--surface-2); }
.card.blocked { border-color: var(--danger); }
.card.done { opacity: 0.65; }
.head { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.name { font-size: 13px; color: var(--text); }
.phase { font-size: 10.5px; color: var(--text-muted); margin-left: auto; }
.phase.blocked { color: var(--danger); }
.phase.done { color: var(--success); }
.row { display: flex; justify-content: space-between; font-size: 12px; color: var(--text); padding: 1px 0; }
.row .k { color: var(--text-faint); }
.row.next span:last-child { color: var(--accent-strong); }
</style>
