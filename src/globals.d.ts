interface NodeListOf<TNode extends Node> extends NodeList {
    [Symbol.iterator](): Iterator<TNode>;
}
