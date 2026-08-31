import type { TreeAction, TreeAlgorithm, TreeNode } from './types';
import { makeNode, snapshot } from './types';

const child = (n: TreeNode, ch: string) => n.children!.find(c => c.text === ch);

export const trie: TreeAlgorithm = {
  id: 'trie',
  name: 'Trie (prefix tree)',
  summary: 'N-ary tree keyed by characters: every root-to-node path spells a prefix, and word ends are marked. Insert and lookup cost O(word length) regardless of how many words are stored.',
  complexity: { time: { worst: 'O(L) per word' }, space: 'O(total characters)', tags: ['N-ary', 'Strings', 'Prefix search'] },
  inputs: [
    { key: 'words', label: 'Insert words', kind: 'text', default: 'tree trie trip try tea team', maxLength: 80 },
    { key: 'queries', label: 'Search words', kind: 'text', default: 'trie tram tea', maxLength: 60 },
  ],
  pseudocode: [
    'procedure Insert(word)',                                       // 1
    '  cur ← root',                                                 // 2
    '  for each character c of word',                               // 3
    '    if cur has no child c then create it',                     // 4
    '    cur ← cur.child(c)',                                       // 5
    '  mark cur as end of word',                                    // 6
    'procedure Search(word)',                                       // 7
    '  walk the children; missing child → not present',             // 8
    '  present iff the final node is marked end of word',           // 9
  ],
  setup(d) {
    const words = (d.words as string).toLowerCase().split(/\s+/).filter(Boolean);
    const queries = (d.queries as string).toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return { error: 'Enter at least one word' };
    if (words.some(w => !/^[a-z]+$/.test(w)) || queries.some(w => !/^[a-z]+$/.test(w))) return { error: 'Words must be a–z only' };
    return {
      *run(): Generator<TreeAction, void, unknown> {
        const root = makeNode(0, { text: '·', children: [], state: 'default' });
        const snap = () => snapshot(root);
        for (const word of words) {
          let cur = root;
          for (const ch of word) {
            let next = child(cur, ch);
            if (!next) {
              next = makeNode(0, { text: ch, children: [], state: 'inserted' });
              cur.children!.push(next);
              cur.children!.sort((a, b) => (a.text! < b.text! ? -1 : 1));
              yield { root: snap(), line: 4, variables: { word, created: ch } };
              next.state = 'default';
            } else {
              next.state = 'visiting';
              yield { root: snap(), line: 5, variables: { word, following: ch } };
              next.state = 'default';
            }
            cur = next;
          }
          cur.label = '✓';
          cur.state = 'found';
          yield { root: snap(), line: 6, variables: { word, 'end marked': true } };
          cur.state = 'default';
        }
        for (const word of queries) {
          let cur: TreeNode | undefined = root;
          let ok = true;
          for (const ch of word) {
            cur = cur ? child(cur, ch) : undefined;
            if (!cur) { ok = false; break; }
            cur.state = 'visiting';
            yield { root: snap(), line: 8, variables: { searching: word, at: ch } };
            cur.state = 'default';
          }
          const found = ok && cur?.label === '✓';
          if (found && cur) {
            cur.state = 'output';
            yield { root: snap(), line: 9, variables: { searching: word, found: true } };
            cur.state = 'default';
          } else {
            yield { root: snap(), line: ok ? 9 : 8, variables: { searching: word, found: false, reason: ok ? 'no end marker' : 'missing child' } };
          }
        }
        yield { root: snap(), line: 9, variables: { words: words.length, nodes: countNodes(root) } };
        function countNodes(n: TreeNode): number { return 1 + (n.children ?? []).reduce((acc, c) => acc + countNodes(c), 0); }
      },
    };
  },
};
