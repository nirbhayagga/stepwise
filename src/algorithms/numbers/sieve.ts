import type { BoardAction, BoardAlgorithm } from '../../engine/board';
import { BOARD_STATE as B } from '../../engine/board';

export const sieve: BoardAlgorithm = {
  id: 'sieve',
  name: 'Sieve of Eratosthenes',
  summary: 'Finds every prime up to N by crossing out multiples: each surviving p starting from 2 is prime, and its multiples from p² upward are struck in one sweep.',
  complexity: { time: { worst: 'O(N log log N)' }, space: 'O(N)', tags: ['Number theory', 'No divisions'] },
  inputs: [{ key: 'n', label: 'Upper bound N', kind: 'int', default: '120', min: 10, max: 300 }],
  pseudocode: [
    'procedure Sieve(N)',                                     // 1
    '  cross out 1',                                          // 2
    '  for p ← 2 to ⌊√N⌋',                                    // 3
    '    if p is not crossed out then      ▷ p is prime',     // 4
    '      for m ← p² to N step p',                           // 5
    '        cross out m',                                    // 6
    '  every number never crossed out is prime',              // 7
  ],
  setup(d) {
    const n = d.n as number;
    const cols = 10;
    const rows = Math.ceil(n / cols);
    return {
      rows, cols,
      *run(): Generator<BoardAction, void, unknown> {
        const at = (v: number) => v - 1; // cell index of the number v
        const crossed = new Uint8Array(n + 1);
        yield {
          set: [
            ...Array.from({ length: n }, (_, i) => [i, String(i + 1), B.empty] as [number, string, number]),
            [at(1), '1', B.fixed],
          ],
          line: 2, variables: { N: n },
        };
        crossed[1] = 1;
        for (let p = 2; p * p <= n; p++) {
          if (crossed[p]) {
            yield { flash: [[at(p), B.removed]], line: 4, variables: { p, prime: false } };
            continue;
          }
          yield { set: [[at(p), String(p), B.placed]], flash: [[at(p), B.trying]], line: 4, variables: { p, prime: true, 'first multiple': p * p } };
          for (let m = p * p; m <= n; m += p) {
            if (!crossed[m]) {
              crossed[m] = 1;
              yield { set: [[at(m), String(m), B.removed]], flash: [[at(m), B.conflict], [at(p), B.trying]], line: 6, variables: { p, m } };
            } else {
              yield { flash: [[at(m), B.conflict], [at(p), B.trying]], line: 5, variables: { p, m, 'already crossed': true } };
            }
          }
        }
        const primes: number[] = [];
        for (let v = 2; v <= n; v++) if (!crossed[v]) primes.push(v);
        yield {
          set: primes.map(v => [at(v), String(v), B.placed] as [number, string, number]),
          line: 7, variables: { primes: primes.length, largest: primes[primes.length - 1] },
        };
      },
    };
  },
};
