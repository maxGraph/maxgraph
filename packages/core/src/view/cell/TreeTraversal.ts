import Cell from "./datatypes/Cell";
import CellArray from "./datatypes/CellArray";
import mxDictionary from "../../util/mxDictionary";
import Graph from "../Graph";

class TreeTraversal {
  constructor(graph: Graph) {
    this.graph = graph;
  }

  graph: Graph;

  /*****************************************************************************
   * Group: Tree and traversal-related
   *****************************************************************************/

  /**
   * Returns all children in the given parent which do not have incoming
   * edges. If the result is empty then the with the greatest difference
   * between incoming and outgoing edges is returned.
   *
   * @param parent {@link mxCell} whose children should be checked.
   * @param isolate Optional boolean that specifies if edges should be ignored if
   * the opposite end is not a child of the given parent cell. Default is
   * false.
   * @param invert Optional boolean that specifies if outgoing or incoming edges
   * should be counted for a tree root. If false then outgoing edges will be
   * counted. Default is `false`.
   */
  findTreeRoots(
    parent: Cell,
    isolate: boolean = false,
    invert: boolean = false
  ): CellArray {
    const roots: CellArray = new CellArray();

    if (parent != null) {
      let best = null;
      let maxDiff = 0;

      for (const cell of parent.getChildren()) {
        if (cell.isVertex() && cell.isVisible()) {
          const conns = this.getConnections(cell, isolate ? parent : null);
          let fanOut = 0;
          let fanIn = 0;

          for (let j = 0; j < conns.length; j++) {
            const src = this.getView().getVisibleTerminal(conns[j], true);

            if (src == cell) {
              fanOut++;
            } else {
              fanIn++;
            }
          }

          if (
            (invert && fanOut == 0 && fanIn > 0) ||
            (!invert && fanIn == 0 && fanOut > 0)
          ) {
            roots.push(cell);
          }

          const diff = invert ? fanIn - fanOut : fanOut - fanIn;

          if (diff > maxDiff) {
            maxDiff = diff;
            best = cell;
          }
        }
      }

      if (roots.length == 0 && best != null) {
        roots.push(best);
      }
    }
    return roots;
  }

  /**
   * Function: traverse
   *
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * Example:
   *
   * (code)
   * mxLog.show();
   * let cell = graph.getSelectionCell();
   * graph.traverse(cell, false, (vertex, edge)=>
   * {
   *   mxLog.debug(graph.getLabel(vertex));
   * });
   * (end)
   *
   * Parameters:
   *
   * vertex - <mxCell> that represents the vertex where the traversal starts.
   * directed - Optional boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * func - Visitor function that takes the current vertex and the incoming
   * edge as arguments. The traversal stops if the function returns false.
   * edge - Optional <mxCell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * visited - Optional <mxDictionary> from cells to true for the visited cells.
   * inverse - Optional boolean to traverse in inverse direction. Default is false.
   * This is ignored if directed is false.
   */
  traverse(
    vertex: Cell | null = null,
    directed: boolean = true,
    func: Function | null = null,
    edge: Cell | null = null,
    visited: mxDictionary | null = null,
    inverse: boolean = false
  ): void {
    if (func != null && vertex != null) {
      directed = directed != null ? directed : true;
      inverse = inverse != null ? inverse : false;
      visited = visited || new mxDictionary();

      if (!visited.get(vertex)) {
        visited.put(vertex, true);
        const result = func(vertex, edge);

        if (result == null || result) {
          const edgeCount = vertex.getEdgeCount();

          if (edgeCount > 0) {
            for (let i = 0; i < edgeCount; i += 1) {
              const e = <Cell>vertex.getEdgeAt(i);
              const isSource = e.getTerminal(true) == vertex;

              if (!directed || !inverse == isSource) {
                const next = e.getTerminal(!isSource);
                this.traverse(next, directed, func, e, visited, inverse);
              }
            }
          }
        }
      }
    }
  }
}

export default TreeTraversal;