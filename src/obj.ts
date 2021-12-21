
export enum OKind {
  ARRAY = "array",
  FIELD = "field",
  OBJECT = "object"
}


export type OBJVisitor = EnterLeaveVisitor | KindVisitor;

type KindVisitor = {
  readonly [NodeT in OKind]?:
    | OBJVisitFn
    | EnterLeaveVisitor;
};

interface EnterLeaveVisitor {
  readonly enter?: OBJVisitFn;
  readonly leave?: OBJVisitFn;
}

/**
 * A visitor is comprised of visit functions, which are called on each node
 * during the visitor's traversal.
 */
export type OBJVisitFn = (
  /** The current node being visiting. */
  node: any,
  /** The index or key to this node from the parent node or Array. */
  key: string | number | undefined,
  /** The parent immediately above this node, which may be an Array. */
  parent: any | ReadonlyArray<any> | undefined,
  /** The key path to get to this node from the root node. */
  path: ReadonlyArray<string | number>,
  /**
   * All nodes and Arrays visited before reaching parent of this node.
   * These correspond to array indices in `path`.
   * Note: ancestors includes arrays which contain the parent of visited node.
   */
  ancestors: ReadonlyArray<any | ReadonlyArray<any>>,
) => any;

/**
 * A reducer is comprised of reducer functions which convert OBJ nodes into
 * another form.
 */
export type OBJReducer<R> = {
  readonly [NodeT in OKind]?: {
    readonly enter?: OBJVisitFn;
    readonly leave: OBJReducerFn;
  };
};

type OBJReducerFn = (
  /** The current node being visiting. */
  node: any,
  /** The index or key to this node from the parent node or Array. */
  key: string | number | undefined,
  /** The parent immediately above this node, which may be an Array. */
  parent: any | ReadonlyArray<any> | undefined,
  /** The key path to get to this node from the root node. */
  path: ReadonlyArray<string | number>,
  /**
   * All nodes and Arrays visited before reaching parent of this node.
   * These correspond to array indices in `path`.
   * Note: ancestors includes arrays which contain the parent of visited node.
   */
  ancestors: ReadonlyArray<any | ReadonlyArray<any>>,
) => any;

type ReducedField<T, R> = T extends null | undefined
  ? T
  : T extends ReadonlyArray<any>
  ? ReadonlyArray<R>
  : R;

// /**
//  * A KeyMap describes each the traversable properties of each kind of node.
//  *
//  * @deprecated Please inline it. Will be removed in v17
//  */
// export type OBJVisitorKeyMap = {
//   [NodeT in OKind]?: ReadonlyArray<keyof NodeT>;
// };

export const BREAK: unknown = Object.freeze({});
export const SKIP: unknown = void 1;




export function objVisit(
  root: any,
  visitor: OBJVisitor | OBJReducer<any>,
) {
  const enterLeaveMap = new Map<OKind, EnterLeaveVisitor>();
  for (const kind of Object.values(OKind)) {
    enterLeaveMap.set(kind, getEnterLeaveForKind(visitor, kind));
  }


  let stack: any = undefined;
  let inArray = Array.isArray(root);
  let keys = [root];
  let index = -1;
  let edits = [];
  let node: any = undefined;
  let key = undefined;
  let parent = undefined;
  const path: string[] = [];
  const ancestors: any[] = [];
  let newRoot = root;

  do {
    index++;
    const isLeaving = index === keys.length;
    const isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? undefined : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();

      if (isEdited) {
        if (inArray) {
          node = node.slice();
          let editOffset = 0;

          for (const [editKey, editValue] of edits) {
            const arrayKey = editKey - editOffset;

            if (editValue === null) {
              node.splice(arrayKey, 1);
              editOffset++;
            } else {
              node[arrayKey] = editValue;
            }
          }
        } else {
          node = Object.defineProperties(
            {},
            Object.getOwnPropertyDescriptors(node)
          );

          for (const [editKey, editValue] of edits) {
            node[editKey] = editValue;
          }
        }
      }

      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else {
      key = parent ? (inArray ? index : keys[index]) : undefined;
      node = parent ? parent[key] : newRoot;

      if (node === null || node === undefined) {
        continue;
      }

      if (parent) {
        path.push(key);
      }
    }
    let result = node;
    // if (!Array.isArray(node)) {
      // devAssert(isNode(node), `Invalid AST Node: ${inspect(node)}.`);
    let kind = Array.isArray(node) ? OKind.ARRAY : (isObject(node) ? OKind.OBJECT : OKind.FIELD);
    const visitFn = isLeaving
      ? enterLeaveMap.get(kind)?.leave
      : enterLeaveMap.get(kind)?.enter;
  
    if(visitFn) {
      result = visitFn.call(visitor, node, key, parent, path, ancestors);
    }
    if (result === BREAK) {
      break;
    }

    if (result === undefined) {
      if (!isLeaving) {
        path.pop();
        continue;
      }
    } else {
      edits.push([key, result]);
      if (!isLeaving) {
        // if (result !== SKIP) {
        node = result;
        // } else {
        //   path.pop();
        //   continue;
        // }
      }
    }
    // }

    if (result === undefined && isEdited) {
      edits.push([key, node]);
    }

    if (isLeaving) {
      path.pop();
    } else {
      stack = { inArray, index, keys, edits, prev: stack };
      inArray = Array.isArray(node);
      keys = inArray ? node : (isObject(node) ? Object.keys(node) : []);
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== undefined);

  if (edits.length !== 0) {
    newRoot = edits[edits.length - 1][1];
  }

  return newRoot;
}


/**
 * Given a visitor instance and a node kind, return EnterLeaveVisitor for that kind.
 */
 export function getEnterLeaveForKind(
  visitor: OBJVisitor,
  kind: OKind,
): EnterLeaveVisitor {
  const kindVisitor:
    | OBJVisitFn
    | EnterLeaveVisitor
    | undefined = (visitor as any)[kind];

  if (typeof kindVisitor === 'object') {
    // { Kind: { enter() {}, leave() {} } }
    return kindVisitor;
  } else if (typeof kindVisitor === 'function') {
    // { Kind() {} }
    return { enter: kindVisitor, leave: undefined };
  }

  // { enter() {}, leave() {} }
  return { enter: (visitor as any).enter, leave: (visitor as any).leave };
}


function isObject(val: any) {
  if (val === null) { return false;}
  return typeof val === "object";
}