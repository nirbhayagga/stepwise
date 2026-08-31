<script setup lang="ts">
import type { GeoPoint, GeoSegment } from '../../algorithms/geometry';

defineProps<{ points: GeoPoint[]; pointStates: Uint8Array; segments: GeoSegment[] }>();
const W = 1000, H = 600;
const CLASS = ['', 'active', 'hull', 'rejected', 'best', 'strip'];
</script>

<template>
  <div class="panel canvas">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet">
      <line
        v-for="(s, i) in segments" :key="i"
        :x1="s.x1 * W" :y1="s.y1 * H" :x2="s.x2 * W" :y2="s.y2 * H"
        class="seg" :class="s.kind"
      />
      <g v-for="p in points" :key="p.id" class="pt" :class="CLASS[pointStates[p.id] ?? 0]" :transform="`translate(${p.x * W}, ${p.y * H})`">
        <circle r="7" />
        <text class="lbl" y="-12" text-anchor="middle">{{ p.id }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.canvas { padding: 6px; }
svg { width: 100%; height: auto; display: block; }
.seg { stroke-width: 1.5; }
.seg.hull { stroke: var(--accent-strong); stroke-width: 2.5; }
.seg.active { stroke: var(--s-compare); }
.seg.best { stroke: var(--s-sorted); stroke-width: 2.5; }
.seg.divider { stroke: var(--text-faint); stroke-dasharray: 5 5; }
.pt circle { fill: var(--surface-3); stroke: var(--text-faint); stroke-width: 1.5; transition: fill 0.12s, stroke 0.12s; }
.pt .lbl { fill: var(--text-faint); font-family: var(--font-mono); font-size: 11px; }
.pt.active circle { fill: var(--s-compare); stroke: var(--s-compare); }
.pt.hull circle { fill: var(--accent-bg); stroke: var(--accent); }
.pt.hull .lbl { fill: var(--accent-strong); }
.pt.rejected circle { fill: var(--surface-2); stroke: var(--border-strong); }
.pt.best circle { fill: var(--s-sorted); stroke: var(--s-sorted); }
.pt.strip circle { fill: #3d3a2a; stroke: var(--s-compare); }
</style>
