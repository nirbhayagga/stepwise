import type { StringAction, StringAlgorithm } from './types';
import { STR_STATE, TEXT_INPUT, PATTERN_INPUT, validate } from './types';

export const zAlgorithm: StringAlgorithm = {
  id: 'z-algorithm',
  name: 'Z-Algorithm',
  summary: 'Computes Z[i] — the length of the longest substring starting at i that matches a prefix — over P#T in linear time by reusing the current Z-box; every Z[i] = |P| inside T is a match.',
  complexity: { time: { worst: 'O(n + m)' }, space: 'O(n + m)', tags: ['Z-box reuse', 'Prefix matching', 'Linear'] },
  inputs: [TEXT_INPUT, PATTERN_INPUT],
  pseudocode: [
    'procedure ZMatch(T, P)',                                        // 1
    '  S ← P + "#" + T; n ← |S|',                                    // 2
    '  l ← 0; r ← 0                       ▷ current Z-box [l..r]',   // 3
    '  for i ← 1 to n−1',                                            // 4
    '    if i < r then Z[i] ← min(r − i, Z[i − l])   ▷ reuse',       // 5
    '    while i + Z[i] < n and S[Z[i]] = S[i + Z[i]] do Z[i]++',    // 6
    '    if i + Z[i] > r then l ← i; r ← i + Z[i]',                  // 7
    '    if Z[i] = |P| then report match at i − |P| − 1 in T',       // 8
  ],
  setup(d) {
    const textIn = d.text as string, pattern = d.pattern as string;
    const err = validate(textIn, pattern);
    if (err) return { error: err };
    if (textIn.includes('#') || pattern.includes('#')) return { error: 'The separator "#" may not appear in the input' };
    const S = pattern + '#' + textIn;
    return {
      text: S, pattern: '', auxLabel: 'Z',
      *run(): Generator<StringAction, void, unknown> {
        const n = S.length, m = pattern.length;
        const Z = new Array<number>(n).fill(0);
        Z[0] = n;
        yield { shift: -1, aux: [n], line: 2, variables: { 'S = P#T': true, m, n } };
        let l = 0, r = 0;
        for (let i = 1; i < n; i++) {
          if (i < r) {
            Z[i] = Math.min(r - i, Z[i - l]);
            yield { text: [[i, STR_STATE.mark], [l, STR_STATE.mark], [r - 1, STR_STATE.mark]], aux: Z.slice(0, i + 1), line: 5, variables: { i, l, r, reused: Z[i] } };
          }
          while (i + Z[i] < n && S[Z[i]] === S[i + Z[i]]) {
            yield { text: [[Z[i], STR_STATE.compare], [i + Z[i], STR_STATE.compare]], aux: Z.slice(0, i + 1), line: 6, variables: { i, 'Z[i]': Z[i] } };
            Z[i]++;
          }
          if (i + Z[i] < n) yield { text: [[Z[i], STR_STATE.mismatch], [i + Z[i], STR_STATE.mismatch]], aux: Z.slice(0, i + 1), line: 6, variables: { i, 'Z[i]': Z[i] } };
          if (i + Z[i] > r) { l = i; r = i + Z[i]; }
          yield { aux: Z.slice(0, i + 1), line: 7, variables: { i, 'Z[i]': Z[i], 'Z-box': `[${l}..${r - 1}]` } };
          if (Z[i] === m) yield { foundAt: i, aux: Z.slice(0, i + 1), line: 8, variables: { 'match in T at': i - m - 1 } };
        }
        yield { aux: Z.slice(), line: 8, variables: { done: true } };
      },
    };
  },
};
