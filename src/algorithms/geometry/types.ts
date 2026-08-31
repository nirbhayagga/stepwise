import type { AlgorithmMeta, BaseAction, BaseFrame } from '../../engine/types';
import { checkLine } from '../../engine/types';
import { mulberry32 } from '../../engine/random';

export interface GeoPoint { id: number; x: number; y: number }

export const GPT = { default: 0, active: 1, hull: 2, rejected: 3, best: 4, strip: 5 } as const;

export interface GeoSegment { x1: number; y1: number; x2: number; y2: number; kind: 'hull' | 'active' | 'best' | 'divider' }

export interface GeoAction extends BaseAction {
  /** Transient point highlights. */
  points?: [id: number, state: number][];
  /** Persistent point states (hull membership, final best pair). */
  mark?: [id: number, state: number][];
  /** Replaces the persistent segment list (hull chain, best pair). */
  segments?: GeoSegment[];
  /** Drawn only on this frame (candidate edges, comparisons, dividers). */
  overlay?: GeoSegment[];
}

export interface GeometryAlgorithm extends AlgorithmMeta {
  run(points: GeoPoint[]): Generator<GeoAction, void, unknown>;
}

export interface GeoFrame extends BaseFrame {
  pointStates: Uint8Array;
  segments: GeoSegment[];
}

export function buildGeoFrames(meta: GeometryAlgorithm, points: GeoPoint[]): GeoFrame[] {
  const persist = new Uint8Array(points.length);
  let segments: GeoSegment[] = [];
  let line = 0;
  const frames: GeoFrame[] = [];
  const push = (action: GeoAction | null) => {
    const pointStates = Uint8Array.from(persist);
    if (action?.points) for (const [id, s] of action.points) if (id >= 0 && id < points.length) pointStates[id] = s;
    frames.push({ pointStates, segments: [...segments, ...(action?.overlay ?? [])], variables: action?.variables ?? {}, line });
  };
  push(null);
  for (const action of meta.run(points)) {
    if (action.line !== undefined) { checkLine(meta, action.line); line = action.line; }
    if (action.mark) for (const [id, s] of action.mark) persist[id] = s;
    if (action.segments) segments = action.segments.slice();
    push(action);
  }
  const lastVars = frames[frames.length - 1].variables;
  push(null);
  frames[frames.length - 1].variables = lastVars;
  return frames;
}

export const seg = (a: GeoPoint, b: GeoPoint, kind: GeoSegment['kind']): GeoSegment => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, kind });

/** Twice the signed area of (a, b, c): > 0 means counter-clockwise. */
export const cross = (a: GeoPoint, b: GeoPoint, c: GeoPoint) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export const dist = (a: GeoPoint, b: GeoPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export function generatePoints(n: number, seedValue: number): GeoPoint[] {
  const rnd = mulberry32(seedValue);
  const pts: GeoPoint[] = [];
  const minDist = Math.max(0.05, 0.35 / Math.sqrt(n));
  let tries = 0;
  while (pts.length < n && tries < 5000) {
    tries++;
    const p = { id: pts.length, x: 0.05 + rnd() * 0.9, y: 0.07 + rnd() * 0.86 };
    if (pts.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= minDist)) pts.push(p);
  }
  return pts;
}
