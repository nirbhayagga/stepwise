/** Geometry and bit-mask helpers shared by the three Sudoku entries. */
export const ALL = 0x1ff;

export const UNIT_LIST: number[][] = (() => {
  const list: number[][] = [];
  for (let r = 0; r < 9; r++) list.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) list.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const box: number[] = [];
    for (let r = br * 3; r < br * 3 + 3; r++) for (let c = bc * 3; c < bc * 3 + 3; c++) box.push(r * 9 + c);
    list.push(box);
  }
  return list;
})();

export const UNITS_OF: number[][][] = Array.from({ length: 81 }, (_, i) => UNIT_LIST.filter(u => u.includes(i)));

export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>();
  for (const unit of UNITS_OF[i]) for (const c of unit) set.add(c);
  set.delete(i);
  return [...set];
});

export const popcount = (m: number): number => {
  let n = 0;
  while (m) { n += m & 1; m >>= 1; }
  return n;
};
export const lowestDigit = (m: number): number => (m === 0 ? -1 : Math.log2(m & -m));
export const isSingle = (m: number): boolean => m !== 0 && (m & (m - 1)) === 0;
export const cellName = (i: number) => `R${Math.floor(i / 9) + 1}C${(i % 9) + 1}`;

export function parsePuzzle(raw: string): number[] | string {
  const chars = raw.replace(/[^0-9.]/g, '');
  if (chars.length !== 81) return `Puzzle must have exactly 81 cells (got ${chars.length})`;
  return chars.split('').map(c => (c === '.' || c === '0' ? 0 : Number(c)));
}
