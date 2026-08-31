import type { HashAction, HashAlgorithm } from './types';
import { HASH_STATE, KEYS_INPUT, SEARCH_INPUT, SIZE_INPUT } from './types';

type Probe = (k: number, i: number, m: number) => number;

const LOAD_LIMIT = 0.7;

/** Open addressing with a pluggable probe sequence. */
function openAddressing(id: string, name: string, summary: string, tags: string[], probeCode: string, probe: Probe): HashAlgorithm {
  return {
    id, name, summary,
    complexity: { time: { average: 'Θ(1)', worst: 'O(n)' }, space: 'O(m)', tags },
    inputs: [KEYS_INPUT, SEARCH_INPUT, SIZE_INPUT],
    pseudocode: [
      `procedure Insert(T, k)          ▷ ${probeCode}`,           // 1
      '  if load factor > 0.7 then rehash into 2m+ slots',        // 2
      '  for i ← 0, 1, 2, …',                                     // 3
      '    s ← probe(k, i) mod m',                                // 4
      '    if T[s] is empty then T[s] ← k; return',               // 5
      '    else keep probing              ▷ collision',           // 6
      'procedure Search(T, k)',                                   // 7
      '  probe the same sequence until k or an empty slot',       // 8
    ],
    setup(d) {
      const keys = d.keys as number[], searches = d.searches as number[];
      let m = d.size as number;
      if (new Set(keys).size !== keys.length) return { error: 'Keys must be distinct' };
      if (!keys.length) return { error: 'Enter at least one key' };
      return {
        slots: m,
        *run(): Generator<HashAction, void, unknown> {
          let table: (number | null)[] = new Array(m).fill(null);
          const snapshotSet = (): [number, number[]][] => table.map((v, i) => [i, v === null ? [] : [v]] as [number, number[]]);
          let count = 0;

          function* insert(k: number, announce: boolean): Generator<HashAction, void, unknown> {
            for (let i = 0; ; i++) {
              const s = ((probe(k, i, m) % m) + m) % m;
              if (table[s] === null) {
                table[s] = k;
                yield { set: [[s, [k]]], states: [[s, announce ? HASH_STATE.placed : HASH_STATE.moving]], line: 5, variables: { key: k, probe: i, slot: s } };
                return;
              }
              yield { states: [[s, HASH_STATE.probe]], line: 6, variables: { key: k, probe: i, slot: s, occupant: table[s] } };
            }
          }

          for (const k of keys) {
            if ((count + 1) / m > LOAD_LIMIT) {
              const old = table.filter((v): v is number => v !== null);
              m = 2 * m + 1;
              table = new Array(m).fill(null);
              yield { resize: m, line: 2, variables: { rehash: true, 'new m': m, reinserting: old.length } };
              for (const v of old) yield* insert(v, false);
              yield { set: snapshotSet(), line: 2, variables: { 'rehash done': true, 'load factor': ((count) / m).toFixed(2) } };
            }
            yield { line: 3, variables: { inserting: k, 'h(k)': ((probe(k, 0, m) % m) + m) % m } };
            yield* insert(k, true);
            count++;
          }
          for (const k of searches) {
            yield { line: 7, variables: { searching: k } };
            for (let i = 0; ; i++) {
              const s = ((probe(k, i, m) % m) + m) % m;
              if (table[s] === null) { yield { states: [[s, HASH_STATE.miss]], line: 8, variables: { key: k, slot: s, found: false } }; break; }
              if (table[s] === k) { yield { states: [[s, HASH_STATE.hit]], line: 8, variables: { key: k, slot: s, found: true, probes: i + 1 } }; break; }
              yield { states: [[s, HASH_STATE.probe]], line: 8, variables: { key: k, slot: s, occupant: table[s] } };
              if (i > 2 * m) break; // full-table safety
            }
          }
        },
      };
    },
  };
}

export const chaining: HashAlgorithm = {
  id: 'chaining',
  name: 'Separate Chaining',
  summary: 'Every slot holds a linked list; colliding keys simply append. Performance degrades gracefully with the load factor α, costing Θ(1 + α) per operation.',
  complexity: { time: { average: 'Θ(1 + α)', worst: 'O(n)' }, space: 'O(n + m)', tags: ['Linked lists', 'α may exceed 1', 'Simple deletion'] },
  inputs: [KEYS_INPUT, SEARCH_INPUT, SIZE_INPUT],
  pseudocode: [
    'procedure Insert(T, k)',                        // 1
    '  s ← h(k) = k mod m',                          // 2
    '  append k to the list at T[s]',                // 3
    'procedure Search(T, k)',                        // 4
    '  s ← h(k)',                                    // 5
    '  scan the list at T[s] for k',                 // 6
  ],
  setup(d) {
    const keys = d.keys as number[], searches = d.searches as number[], m = d.size as number;
    if (new Set(keys).size !== keys.length) return { error: 'Keys must be distinct' };
    if (!keys.length) return { error: 'Enter at least one key' };
    return {
      slots: m,
      *run(): Generator<HashAction, void, unknown> {
        const lists: number[][] = Array.from({ length: m }, () => []);
        for (const k of keys) {
          const s = k % m;
          yield { states: [[s, HASH_STATE.probe]], line: 2, variables: { key: k, 'h(k)': s, 'chain length': lists[s].length } };
          lists[s].push(k);
          yield { set: [[s, lists[s]]], states: [[s, HASH_STATE.placed]], line: 3, variables: { key: k, slot: s, collision: lists[s].length > 1 } };
        }
        for (const k of searches) {
          const s = k % m;
          yield { states: [[s, HASH_STATE.probe]], line: 5, variables: { searching: k, 'h(k)': s } };
          let found = false, steps = 0;
          for (const v of lists[s]) { steps++; if (v === k) { found = true; break; } }
          yield { states: [[s, found ? HASH_STATE.hit : HASH_STATE.miss]], line: 6, variables: { searching: k, found, 'chain steps': steps } };
        }
      },
    };
  },
};

export const linearProbing = openAddressing(
  'linear', 'Linear Probing',
  'Open addressing that tries h(k), h(k)+1, h(k)+2, …; simple and cache-friendly but suffers primary clustering — runs of occupied slots grow and merge.',
  ['Open addressing', 'Primary clustering', 'Cache-friendly'],
  'probe(k, i) = h(k) + i',
  (k, i, m) => (k % m) + i,
);

export const quadraticProbing = openAddressing(
  'quadratic', 'Quadratic Probing',
  'Probes h(k), h(k)+1², h(k)+2², …; breaks up primary clustering, though keys sharing h(k) still follow the same path (secondary clustering).',
  ['Open addressing', 'No primary clustering', 'Secondary clustering'],
  'probe(k, i) = h(k) + i²',
  (k, i, m) => (k % m) + i * i,
);

export const doubleHashing = openAddressing(
  'double', 'Double Hashing',
  'The probe step itself is a second hash, h₂(k) = 1 + (k mod (m−2)), so different keys follow different sequences — the closest open addressing gets to uniform hashing.',
  ['Open addressing', 'No clustering', 'Two hash functions'],
  'probe(k, i) = h(k) + i · h₂(k)',
  (k, i, m) => (k % m) + i * (1 + (k % Math.max(2, m - 2))),
);
