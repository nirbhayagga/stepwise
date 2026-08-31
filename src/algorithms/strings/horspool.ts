import type { StringAction, StringAlgorithm } from './types';
import { STR_STATE, TEXT_INPUT, PATTERN_INPUT, validate } from './types';

export const horspool: StringAlgorithm = {
  id: 'horspool',
  name: 'Boyer–Moore–Horspool',
  summary: 'Compares the pattern right-to-left and, on a mismatch, jumps by the bad-character rule: the text character under the pattern\'s end decides how far the whole pattern can slide.',
  complexity: { time: { best: 'Ω(n/m)', average: 'Θ(n)', worst: 'O(n·m)' }, space: 'O(σ)', tags: ['Right-to-left', 'Bad-character rule', 'Sublinear on average'] },
  inputs: [TEXT_INPUT, PATTERN_INPUT],
  pseudocode: [
    'procedure Horspool(T[0..n−1], P[0..m−1])',                     // 1
    '  shift[c] ← m for every character c',                         // 2
    '  for j ← 0 to m−2: shift[P[j]] ← m−1−j',                      // 3
    '  s ← 0',                                                      // 4
    '  while s ≤ n−m',                                              // 5
    '    j ← m−1',                                                  // 6
    '    while j ≥ 0 and T[s+j] = P[j] do j ← j−1',                 // 7
    '    if j < 0 then report match at s',                          // 8
    '    s ← s + shift[T[s+m−1]]',                                  // 9
  ],
  setup(d) {
    const text = d.text as string, pattern = d.pattern as string;
    const err = validate(text, pattern);
    if (err) return { error: err };
    return {
      text, pattern,
      *run(): Generator<StringAction, void, unknown> {
        const n = text.length, m = pattern.length;
        const shiftOf = new Map<string, number>();
        for (let j = 0; j < m - 1; j++) shiftOf.set(pattern[j], m - 1 - j);
        const table = Object.fromEntries([...new Set((pattern + text).split(''))].sort().map(c => [c, shiftOf.get(c) ?? m]));
        yield { shift: 0, line: 3, variables: { 'shift table': table } };
        let s = 0;
        while (s <= n - m) {
          let j = m - 1;
          let ok = true;
          while (j >= 0) {
            yield { text: [[s + j, STR_STATE.compare]], pattern: [[j, STR_STATE.compare]], shift: s, line: 7, variables: { s, j, 'T[s+j]': text[s + j], 'P[j]': pattern[j] } };
            if (text[s + j] !== pattern[j]) {
              yield { text: [[s + j, STR_STATE.mismatch]], pattern: [[j, STR_STATE.mismatch]], shift: s, line: 7, variables: { s, j } };
              ok = false;
              break;
            }
            j--;
          }
          if (ok) yield { foundAt: s, shift: s, line: 8, variables: { 'match at': s } };
          const step = shiftOf.get(text[s + m - 1]) ?? m;
          yield { text: [[s + m - 1, STR_STATE.mark]], shift: s, line: 9, variables: { s, 'bad character': text[s + m - 1], jump: step } };
          s += step;
        }
        yield { line: 9, variables: { done: true } };
      },
    };
  },
};
