<script setup lang="ts">
import { computed } from 'vue';
import type { Graph } from '../../algorithms/graph';

const props = defineProps<{
  graph: Graph;
  nodeStates: Uint8Array;
  edgeStates: Uint8Array;
  labels: string[];
  edgeLabels?: string[];
  source: number;
  showSource: boolean;
  weighted: boolean;
}>();
const emit = defineEmits<{ (e: 'select', id: number): void }>();

const W = 1000, H = 600, R = 16;
const NODE_CLASS = ['', 'frontier', 'current', 'visited', 'result'];
const EDGE_CLASS = ['', 'active', 'tree', 'rejected'];

const px = (x: number) => x * W;
const py = (y: number) => y * H;

const edges = computed(() => props.graph.edges.map(e => {
  const a = props.graph.nodes[e.u], b = props.graph.nodes[e.v];
  const x1 = px(a.x), y1 = py(a.y), x2 = px(b.x), y2 = py(b.y);
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  // Shorten so arrowheads stop at the circle edge.
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const trim = R + (props.graph.directed ? 6 : 0);
  const lbl = props.edgeLabels?.[e.id] || (props.weighted ? String(e.w) : '');
  return {
    id: e.id, lbl, half: Math.max(11, lbl.length * 3.5 + 5),
    x1: x1 + ux * R, y1: y1 + uy * R, x2: x2 - ux * trim, y2: y2 - uy * trim,
    mx: (x1 + x2) / 2, my: (y1 + y2) / 2,
    cls: EDGE_CLASS[props.edgeStates[e.id] ?? 0],
  };
}));
</script>

<template>
  <div class="panel canvas">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Graph diagram of vertices and weighted edges">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="arrow" />
        </marker>
      </defs>
      <g v-for="e in edges" :key="e.id" class="edge" :class="e.cls">
        <line :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" :marker-end="graph.directed ? 'url(#arrow)' : undefined" />
        <g v-if="e.lbl" :transform="`translate(${e.mx}, ${e.my})`">
          <rect :x="-e.half" y="-8" :width="2 * e.half" height="16" rx="2" class="wbg" />
          <text dominant-baseline="central" text-anchor="middle" class="w">{{ e.lbl }}</text>
        </g>
      </g>
      <g
        v-for="n in graph.nodes" :key="n.id"
        class="node" :class="[NODE_CLASS[nodeStates[n.id] ?? 0], { source: showSource && n.id === source, clickable: showSource }]"
        :transform="`translate(${px(n.x)}, ${py(n.y)})`"
        @click="showSource && emit('select', n.id)"
      >
        <circle :r="R" />
        <text dominant-baseline="central" text-anchor="middle">{{ n.id }}</text>
        <text v-if="labels[n.id]" class="lbl" :y="R + 13" text-anchor="middle">{{ labels[n.id] }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.canvas { padding: 6px; }
svg { width: 100%; height: auto; display: block; }
.edge line { stroke: var(--border-strong); stroke-width: 1.5; transition: stroke 0.15s; }
.edge.active line { stroke: var(--s-compare); stroke-width: 2.5; }
.edge.tree line { stroke: var(--accent-strong); stroke-width: 3; }
.edge.rejected line { stroke: var(--border); stroke-dasharray: 4 4; }
.arrow { fill: var(--border-strong); }
.edge.active .arrow { fill: var(--s-compare); }
.edge.tree .arrow { fill: var(--accent-strong); }
.wbg { fill: var(--surface); }
.w { fill: var(--text-muted); font-family: var(--font-mono); font-size: 11px; }
.edge.active .w, .edge.tree .w { fill: var(--text); }
.node circle { fill: var(--surface-3); stroke: var(--text-faint); stroke-width: 1.5; transition: fill 0.15s, stroke 0.15s; }
.node text { fill: var(--text); font-family: var(--font-mono); font-size: 13px; pointer-events: none; }
.node .lbl { fill: var(--text-muted); font-size: 11px; }
.node.clickable { cursor: pointer; }
.node.source circle { stroke: var(--s-sorted); stroke-width: 3; }
.node.frontier circle { fill: #3d3a2a; stroke: var(--s-compare); }
.node.current circle { fill: var(--s-compare); stroke: var(--s-compare); }
.node.current text:not(.lbl) { fill: #14120a; }
.node.visited circle { fill: var(--g-visited); stroke: var(--g-visited); }
.node.result circle { fill: var(--accent-bg); stroke: var(--accent); }
.node.result text:not(.lbl) { fill: var(--accent-strong); }
</style>
