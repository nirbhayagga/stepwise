import type { StringAction, StringAlgorithm } from './types';
import { STR_STATE, TEXT_INPUT, PATTERN_INPUT, validate } from './types';

export const kmp: StringAlgorithm = {
  id: 'kmp',
  name: 'Knuth–Morris–Pratt',
  summary: 'Never re-reads a text character: the failure function π (longest proper prefix that is also a suffix) tells the pattern how far to slide itself on a mismatch.',
  complexity: { time: { worst: 'O(n + m)' }, space: 'O(m)', tags: ['No text backtracking', 'Failure function', 'Online'] },
  inputs: [TEXT_INPUT, PATTERN_INPUT],
  pseudocode: [
    'procedure BuildFailure(P[0..m−1])',                        // 1
    '  π[0] ← 0; k ← 0',                                        // 2
    '  for i ← 1 to m−1',                                       // 3
    '    while k > 0 and P[i] ≠ P[k] do k ← π[k−1]',            // 4
    '    if P[i] = P[k] then k ← k+1',                          // 5
    '    π[i] ← k',                                             // 6
    'procedure KMP(T, P)',                                      // 7
    '  q ← 0                        ▷ matched prefix length',   // 8
    '  for i ← 0 to n−1',                                       // 9
    '    while q > 0 and T[i] ≠ P[q] do q ← π[q−1]',            // 10
    '    if T[i] = P[q] then q ← q+1',                          // 11
    '    if q = m then report match at i−m+1; q ← π[q−1]',      // 12
  ],
  setup(d) {
    const text = d.text as string, pattern = d.pattern as string;
    const err = validate(text, pattern);
    if (err) return { error: err };
    return {
      text, pattern, auxLabel: 'π',
      *run(): Generator<StringAction, void, unknown> {
        const n = text.length, m = pattern.length;
        const pi = new Array<number>(m).fill(0);
        const auxNow = () => pi.map((v, j) => (j === 0 || v || pi[j] === 0 ? v : v));
        yield { shift: -1, aux: [0], line: 2, variables: { phase: 'build π' } };
        let k = 0;
        for (let i = 1; i < m; i++) {
          while (k > 0 && pattern[i] !== pattern[k]) {
            yield { pattern: [[i, STR_STATE.mismatch], [k, STR_STATE.mismatch]], aux: pi.slice(0, i), line: 4, variables: { i, k, 'π[k−1]': pi[k - 1] } };
            k = pi[k - 1];
          }
          yield { pattern: [[i, STR_STATE.compare], [k, STR_STATE.compare]], aux: pi.slice(0, i), line: 5, variables: { i, k, 'P[i]': pattern[i], 'P[k]': pattern[k] } };
          if (pattern[i] === pattern[k]) k++;
          pi[i] = k;
          yield { pattern: [[i, STR_STATE.match]], aux: pi.slice(0, i + 1), line: 6, variables: { i, 'π[i]': k } };
        }
        yield { shift: 0, aux: auxNow(), line: 8, variables: { phase: 'scan', 'π': pi.join(' ') } };
        let q = 0;
        for (let i = 0; i < n; i++) {
          while (q > 0 && text[i] !== pattern[q]) {
            yield { text: [[i, STR_STATE.mismatch]], pattern: [[q, STR_STATE.mismatch]], shift: i - q, line: 10, variables: { i, q, 'slide to': pi[q - 1] } };
            q = pi[q - 1];
            yield { shift: i - q, line: 10, variables: { i, q } };
          }
          yield { text: [[i, STR_STATE.compare]], pattern: [[q, STR_STATE.compare]], shift: i - q, line: 11, variables: { i, q, 'T[i]': text[i], 'P[q]': pattern[q] } };
          if (text[i] === pattern[q]) q++;
          if (q === m) {
            yield { foundAt: i - m + 1, shift: i - m + 1, line: 12, variables: { 'match at': i - m + 1 } };
            q = pi[q - 1];
          }
        }
        yield { line: 12, variables: { done: true } };
      },
    };
  },
};
