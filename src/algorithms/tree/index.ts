import { toRegistry } from '../../engine/types';
import type { TreeAlgorithm } from './types';
import { bst } from './bst';
import { bstDelete } from './bstDelete';
import { avl } from './avl';
import { redBlack } from './redBlack';
import { heapInsert, heapExtract } from './heap';
import { inorder, preorder, postorder, levelOrder } from './traversal';
import { segmentTree } from './segmentTree';
import { trie } from './trie';
import { huffman } from './huffman';

export * from './types';

/** Display order. Adding an algorithm = one file + one entry here. */
export const TREE_LIST: TreeAlgorithm[] = [bst, bstDelete, avl, redBlack, heapInsert, heapExtract, segmentTree, trie, huffman, inorder, preorder, postorder, levelOrder];
export const TREE = toRegistry(TREE_LIST);
export const DEFAULT_TREE = bst.id;
