export interface TreeNode {
    id: string;
    value: number;
    color: 'default' | 'red' | 'black' | 'visiting' | 'inserted';
    left: TreeNode | null;
    right: TreeNode | null;
    height: number;
}

export interface TreeAction {
    type: 'visiting' | 'inserted' | 'rotated';
    root: TreeNode | null;
    variables?: Record<string, any>;
    highlightLine?: number;
}

export function cloneTree(node: TreeNode | null): TreeNode | null {
   if (!node) return null;
   return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
}

function clearState(node: TreeNode | null) {
   if (!node) return;
   if (node.color !== 'red' && node.color !== 'black') node.color = 'default';
   clearState(node.left); clearState(node.right);
}

function height(node: TreeNode | null): number {
    if (!node) return 0;
    return node.height;
}

export function* bstGenerator(keys: number[]): Generator<TreeAction, void, unknown> {
    const context = { root: null as TreeNode | null };
    for(const key of keys) {
        context.root = yield* bstInsert(context.root, key, context);
        clearState(context.root);
        yield { type: 'inserted', root: cloneTree(context.root), highlightLine: 8 };
    }
}

function* bstInsert(node: TreeNode | null, key: number, context: { root: TreeNode | null }): Generator<TreeAction, TreeNode, unknown> {
    if (!node) {
        yield { type: 'inserted', root: cloneTree(context.root), highlightLine: 3, variables: { key } };
        return { id: crypto.randomUUID(), value: key, color: 'inserted', left: null, right: null, height: 1 };
    }
    
    node.color = 'visiting';
    yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 4, variables: { key, current: node.value } };
    node.color = 'default';

    if (key < node.value) {
        node.left = yield* bstInsert(node.left, key, context);
        yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 5, variables: { key, parent: node.value, direction: 'left' } };
    } else {
        node.right = yield* bstInsert(node.right, key, context);
        yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 7, variables: { key, parent: node.value, direction: 'right' } };
    }
    return node;
}

export function* avlGenerator(keys: number[]): Generator<TreeAction, void, unknown> {
    const context = { root: null as TreeNode | null };
    for(const key of keys) {
        context.root = yield* avlInsert(context.root, key, context);
        clearState(context.root);
        yield { type: 'inserted', root: cloneTree(context.root), highlightLine: 23 };
    }
}

function rightRotate(y: TreeNode): TreeNode {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = Math.max(height(y.left), height(y.right)) + 1;
    x.height = Math.max(height(x.left), height(x.right)) + 1;
    return x;
}

function leftRotate(x: TreeNode): TreeNode {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = Math.max(height(x.left), height(x.right)) + 1;
    y.height = Math.max(height(y.left), height(y.right)) + 1;
    return y;
}

function* avlInsert(node: TreeNode | null, key: number, context: { root: TreeNode | null }): Generator<TreeAction, TreeNode, unknown> {
    if (!node) {
        yield { type: 'inserted', root: cloneTree(context.root), highlightLine: 3, variables: { key } };
        return { id: crypto.randomUUID(), value: key, color: 'inserted', left: null, right: null, height: 1 };
    }
    
    node.color = 'visiting';
    yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 4, variables: { key, current: node.value } };
    node.color = 'default';

    if (key < node.value) {
        node.left = yield* avlInsert(node.left, key, context);
        yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 4, variables: { key, parent: node.value, inserted: 'left' } };
    } else {
        node.right = yield* avlInsert(node.right, key, context);
        yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 5, variables: { key, parent: node.value, inserted: 'right' } };
    }

    node.height = 1 + Math.max(height(node.left), height(node.right));
    const balance = height(node.left) - height(node.right);
    
    yield { type: 'visiting', root: cloneTree(context.root), highlightLine: 8, variables: { key, current: node.value, balance } };

    if (balance > 1 && key < node.left!.value) {
        yield { type: 'rotated', root: cloneTree(context.root), highlightLine: 11, variables: { rotation: 'RightRotate', pivot: node.value } };
        return rightRotate(node);
    }
    if (balance < -1 && key > node.right!.value) {
        yield { type: 'rotated', root: cloneTree(context.root), highlightLine: 13, variables: { rotation: 'LeftRotate', pivot: node.value } };
        return leftRotate(node);
    }
    if (balance > 1 && key > node.left!.value) {
        yield { type: 'rotated', root: cloneTree(context.root), highlightLine: 16, variables: { rotation: 'LeftRightRotate', pivot: node.value } };
        node.left = leftRotate(node.left!);
        return rightRotate(node);
    }
    if (balance < -1 && key < node.right!.value) {
        yield { type: 'rotated', root: cloneTree(context.root), highlightLine: 20, variables: { rotation: 'RightLeftRotate', pivot: node.value } };
        node.right = rightRotate(node.right!);
        return leftRotate(node);
    }

    return node;
}

export const treeAlgorithms = {
    bst: bstGenerator,
    avl: avlGenerator
};
