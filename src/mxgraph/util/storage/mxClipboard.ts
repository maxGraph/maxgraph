/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */

import mxCell from '../../view/cell/mxCell';
import mxGraph from '../../view/graph/mxGraph';
import mxGraphModel from "../../view/graph/mxGraphModel";

/**
 * Class: mxClipboard
 *
 * Singleton that implements a clipboard for graph cells.
 *
 * Example:
 *
 * (code)
 * mxClipboard.copy(graph);
 * mxClipboard.paste(graph2);
 * (end)
 *
 * This copies the selection cells from the graph to the clipboard and
 * pastes them into graph2.
 *
 * For fine-grained control of the clipboard data the <mxGraph.canExportCell>
 * and <mxGraph.canImportCell> functions can be overridden.
 *
 * To restore previous parents for pasted cells, the implementation for
 * <copy> and <paste> can be changed as follows.
 *
 * (code)
 * mxClipboard.copy = (graph, cells)=>
 * {
 *   cells = cells || graph.getSelectionCells();
 *   let result = graph.getExportableCells(cells);
 *
 *   mxClipboard.parents = {};
 *
 *   for (let i = 0; i < result.length; i += 1)
 *   {
 *     mxClipboard.parents[i] = graph.model.getParent(cells[i]);
 *   }
 *
 *   mxClipboard.insertCount = 1;
 *   mxClipboard.setCells(graph.cloneCells(result));
 *
 *   return result;
 * };
 *
 * mxClipboard.paste = (graph)=>
 * {
 *   if (!mxClipboard.isEmpty())
 *   {
 *     let cells = graph.getImportableCells(mxClipboard.getCells());
 *     let delta = mxClipboard.insertCount * mxClipboard.STEPSIZE;
 *     let parent = graph.getDefaultParent();
 *
 *     graph.model.beginUpdate();
 *     try
 *     {
 *       for (let i = 0; i < cells.length; i += 1)
 *       {
 *         let tmp = (mxClipboard.parents != null && graph.model.contains(mxClipboard.parents[i])) ?
 *              mxClipboard.parents[i] : parent;
 *         cells[i] = graph.importCells([cells[i]], delta, delta, tmp)[0];
 *       }
 *     }
 *     finally
 *     {
 *       graph.model.endUpdate();
 *     }
 *
 *     // Increments the counter and selects the inserted cells
 *     mxClipboard.insertCount++;
 *     graph.setSelectionCells(cells);
 *   }
 * };
 * (end)
 */
class mxClipboard {
  /*
   * Variable: STEPSIZE
   *
   * Defines the step size to offset the cells after each paste operation.
   * Default is 10.
   */
  static STEPSIZE: number = 10;

  /**
   * Variable: insertCount
   *
   * Counts the number of times the clipboard data has been inserted.
   */
  static insertCount: number = 1;

  /**
   * Variable: cells
   *
   * Holds the array of <mxCells> currently in the clipboard.
   */
  static cells: mxCell[] | null = null;

  /**
   * Function: setCells
   *
   * Sets the cells in the clipboard. Fires a <mxEvent.CHANGE> event.
   */
  static setCells(cells: mxCell[] | null) {
    mxClipboard.cells = cells;
  }

  /**
   * Function: getCells
   *
   * Returns  the cells in the clipboard.
   */
  static getCells() {
    return mxClipboard.cells;
  }

  /**
   * Function: isEmpty
   *
   * Returns true if the clipboard currently has not data stored.
   */
  static isEmpty() {
    return mxClipboard.getCells() == null;
  }

  /**
   * Function: cut
   *
   * Cuts the given array of <mxCells> from the specified graph.
   * If cells is null then the selection cells of the graph will
   * be used. Returns the cells that have been cut from the graph.
   *
   * Parameters:
   *
   * graph - <mxGraph> that contains the cells to be cut.
   * cells - Optional array of <mxCells> to be cut.
   */
  static cut(graph: mxGraph, cells: mxCell[] | null) {
    cells = mxClipboard.copy(graph, cells);
    mxClipboard.insertCount = 0;
    mxClipboard.removeCells(graph, cells);

    return cells;
  }

  /**
   * Function: removeCells
   *
   * Hook to remove the given cells from the given graph after
   * a cut operation.
   *
   * Parameters:
   *
   * graph - <mxGraph> that contains the cells to be cut.
   * cells - Array of <mxCells> to be cut.
   */
  static removeCells(graph: mxGraph, cells: mxCell[] | null) {
    graph.removeCells(cells);
  }

  /**
   * Function: copy
   *
   * Copies the given array of <mxCells> from the specified
   * graph to <cells>. Returns the original array of cells that has
   * been cloned. Descendants of cells in the array are ignored.
   *
   * Parameters:
   *
   * graph - <mxGraph> that contains the cells to be copied.
   * cells - Optional array of <mxCells> to be copied.
   */
  static copy(graph: mxGraph, cells: mxCell[] | null): mxCell[] | null {
    cells = cells || graph.getSelectionCells();
    const result = graph.getExportableCells((<mxGraphModel>graph.model).getTopmostCells(cells));
    mxClipboard.insertCount = 1;
    mxClipboard.setCells(graph.cloneCells(<mxCell[]>result));

    return result;
  }

  /**
   * Function: paste
   *
   * Pastes the <cells> into the specified graph restoring
   * the relation to <parents>, if possible. If the parents
   * are no longer in the graph or invisible then the
   * cells are added to the graph's default or into the
   * swimlane under the cell's new location if one exists.
   * The cells are added to the graph using <mxGraph.importCells>
   * and returned.
   *
   * Parameters:
   *
   * graph - <mxGraph> to paste the <cells> into.
   */
  static paste(graph: mxGraph) {
    let cells = null;

    if (!mxClipboard.isEmpty()) {
      // @ts-ignore
      cells = graph.getImportableCells(mxClipboard.getCells());
      const delta = mxClipboard.insertCount * mxClipboard.STEPSIZE;
      const parent = graph.getDefaultParent();
      cells = graph.importCells(cells, delta, delta, parent);

      // Increments the counter and selects the inserted cells
      mxClipboard.insertCount++;
      graph.setSelectionCells(<mxCell[]>cells);
    }

    return cells;
  }
}

export default mxClipboard;