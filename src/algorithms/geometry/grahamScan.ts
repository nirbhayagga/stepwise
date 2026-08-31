import type { GeometryAlgorithm } from './types';
import { GPT, cross, seg } from './types';

export const grahamScan: GeometryAlgorithm = {
  id: 'graham',
  name: 'Graham Scan',
  summary: 'Sorts points by polar angle around the lowest point, then walks them once keeping a stack: any turn that is not counter-clockwise pops the concave corner.',
  complexity: { time: { worst: 'O(n log n)' }, space: 'O(n)', tags: ['Convex hull', 'Stack-based', 'Angular sort'] },
  pseudocode: [
    'procedure GrahamScan(P)',                                    // 1
    '  p₀ ← lowest point (leftmost on ties)',                     // 2
    '  sort the others by polar angle around p₀',                 // 3
    '  stack ← [p₀, p₁]',                                         // 4
    '  for each remaining point p in angular order',              // 5
    '    while turn(next-to-top, top, p) is not counter-clockwise',// 6
    '      pop                                  ▷ concave corner',// 7
    '    push p',                                                 // 8
    '  the stack is the hull, counter-clockwise',                 // 9
  ],
  *run(points) {
    // Mathematical convention on raw coordinates: anchor at minimum y,
    // counter-clockwise = positive cross product.
    const p0 = points.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x) ? b : a));
    yield { points: [[p0.id, GPT.active]], mark: [[p0.id, GPT.hull]], line: 2, variables: { 'p₀': p0.id } };
    const d2 = (a: typeof p0, b: typeof p0) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    const rest = points.filter(p => p !== p0).sort((a, b) => {
      const c = cross(p0, a, b);
      if (c !== 0) return c > 0 ? -1 : 1; // a before b when a→b turns counter-clockwise
      return d2(p0, a) - d2(p0, b);
    });
    yield { line: 3, variables: { order: rest.map(p => p.id).join(' ') } };
    const stack = [p0, rest[0]];
    const chain = () => stack.slice(0, -1).map((p, i) => seg(p, stack[i + 1], 'hull' as const));
    yield { mark: [[rest[0].id, GPT.hull]], segments: chain(), line: 4, variables: { stack: stack.map(p => p.id) } };
    let turns = 0;
    for (let i = 1; i < rest.length; i++) {
      const p = rest[i];
      yield { points: [[p.id, GPT.active]], overlay: [seg(stack[stack.length - 1], p, 'active')], line: 5, variables: { p: p.id, stack: stack.map(q => q.id) } };
      while (stack.length > 1) {
        const a = stack[stack.length - 2], b = stack[stack.length - 1];
        turns++;
        const c = cross(a, b, p);
        yield { points: [[p.id, GPT.active], [a.id, GPT.strip], [b.id, GPT.strip]], overlay: [seg(a, b, 'active'), seg(b, p, 'active')], line: 6, variables: { p: p.id, turn: c > 0 ? 'counter-clockwise' : c < 0 ? 'clockwise' : 'collinear', 'orientation tests': turns } };
        if (c > 0) break;
        const popped = stack.pop()!;
        yield { mark: [[popped.id, GPT.rejected]], segments: chain(), points: [[p.id, GPT.active]], line: 7, variables: { popped: popped.id } };
      }
      stack.push(p);
      yield { mark: [[p.id, GPT.hull]], segments: chain(), line: 8, variables: { stack: stack.map(q => q.id) } };
    }
    const closed = [...chain(), seg(stack[stack.length - 1], p0, 'hull')];
    yield { segments: closed, line: 9, variables: { hull: stack.map(q => q.id), 'hull size': stack.length, 'orientation tests': turns } };
  },
};
