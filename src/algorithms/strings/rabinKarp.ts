import type { StringAction, StringAlgorithm } from './types';
import { STR_STATE, TEXT_INPUT, PATTERN_INPUT, validate } from './types';

const BASE = 256, MOD = 101;

export const rabinKarp: StringAlgorithm = {
  id: 'rabin-karp',
  name: 'Rabin–Karp',
  summary: 'Compares rolling hashes instead of characters: each window\'s hash is updated in O(1) as the window slides, and only hash collisions are verified character by character (spurious hits included).',
  complexity: { time: { average: 'Θ(n + m)', worst: 'O(n·m)' }, space: 'O(1)', tags: ['Rolling hash', 'Monte-Carlo flavour', 'Multi-pattern friendly'] },
  inputs: [TEXT_INPUT, PATTERN_INPUT],
  pseudocode: [
    'procedure RabinKarp(T, P)                ▷ base b, modulus q',   // 1
    '  hP ← hash(P); hT ← hash(T[0..m−1])',                           // 2
    '  for s ← 0 to n−m',                                             // 3
    '    if hT = hP then                       ▷ possible match',     // 4
    '      compare T[s..s+m−1] with P character by character',        // 5
    '      if equal then report match at s else spurious hit',        // 6
    '    hT ← (hT − T[s]·bᵐ⁻¹) · b + T[s+m]    ▷ roll the window',    // 7
  ],
  setup(d) {
    const text = d.text as string, pattern = d.pattern as string;
    const err = validate(text, pattern);
    if (err) return { error: err };
    return {
      text, pattern,
      *run(): Generator<StringAction, void, unknown> {
        const n = text.length, m = pattern.length;
        const code = (c: string) => c.charCodeAt(0);
        let hP = 0, hT = 0, pow = 1;
        for (let i = 0; i < m; i++) {
          hP = (hP * BASE + code(pattern[i])) % MOD;
          hT = (hT * BASE + code(text[i])) % MOD;
          if (i < m - 1) pow = (pow * BASE) % MOD;
        }
        const win = (s: number, st: number) => Array.from({ length: m }, (_, k) => [s + k, st] as [number, number]);
        yield { shift: 0, line: 2, variables: { 'hash(P)': hP, 'hash(T[0..m−1])': hT, modulus: MOD } };
        for (let s = 0; s <= n - m; s++) {
          if (hT === hP) {
            yield { text: win(s, STR_STATE.mark), shift: s, line: 4, variables: { s, 'window hash': hT, 'pattern hash': hP, 'hashes equal': true } };
            let ok = true;
            for (let k = 0; k < m; k++) {
              yield { text: [[s + k, STR_STATE.compare]], pattern: [[k, STR_STATE.compare]], shift: s, line: 5, variables: { s, k, 'T[s+k]': text[s + k], 'P[k]': pattern[k] } };
              if (text[s + k] !== pattern[k]) {
                yield { text: [[s + k, STR_STATE.mismatch]], pattern: [[k, STR_STATE.mismatch]], shift: s, line: 6, variables: { s, 'spurious hit': true } };
                ok = false;
                break;
              }
            }
            if (ok) yield { foundAt: s, shift: s, line: 6, variables: { 'match at': s } };
          } else {
            yield { text: win(s, STR_STATE.compare).slice(0, 1), shift: s, line: 4, variables: { s, 'window hash': hT, 'pattern hash': hP, 'hashes equal': false } };
          }
          if (s < n - m) {
            hT = ((hT - code(text[s]) * pow) % MOD + MOD) % MOD;
            hT = (hT * BASE + code(text[s + m])) % MOD;
            yield { text: [[s, STR_STATE.mismatch], [s + m, STR_STATE.mark]], shift: s, line: 7, variables: { 'drop': text[s], 'add': text[s + m], 'new hash': hT } };
          }
        }
        yield { line: 7, variables: { done: true } };
      },
    };
  },
};
