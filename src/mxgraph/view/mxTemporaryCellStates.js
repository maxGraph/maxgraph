/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 */
/**
 * Class: mxTemporaryCellStates
 *
 * Creates a temporary set of cell states.
 */

import mxRectangle from "../util/mxRectangle";
import mxDictionary from "../util/mxDictionary";

class mxTemporaryCellStates {
  /**
   * Variable: view
   *
   * Holds the width of the rectangle. Default is 0.
   */
  view = null;

  /**
   * Variable: oldStates
   *
   * Holds the height of the rectangle. Default is 0.
   */
  oldStates = null;

  /**
   * Variable: oldBounds
   *
   * Holds the height of the rectangle. Default is 0.
   */
  oldBounds = null;

  /**
   * Variable: oldScale
   *
   * Holds the height of the rectangle. Default is 0.
   */
  oldScale = null;

  constructor(view, scale, cells, isCellVisibleFn, getLinkForCellState) {
    scale = (scale != null) ? scale : 1;
    this.view = view;

    // Stores the previous state
    this.oldValidateCellState = view.validateCellState;
    this.oldBounds = view.getGraphBounds();
    this.oldStates = view.getStates();
    this.oldScale = view.getScale();
    this.oldDoRedrawShape = view.graph.cellRenderer.doRedrawShape;

    let self = this;

    // Overrides doRedrawShape and paint shape to add links on shapes
    if (getLinkForCellState != null) {
      view.graph.cellRenderer.doRedrawShape = (state) => {
        let oldPaint = state.shape.paint;

        state.shape.paint = (c) => {
          let link = getLinkForCellState(state);

          if (link != null) {
            c.setLink(link);
          }

          oldPaint.apply(this, [c]);

          if (link != null) {
            c.setLink(null);
          }
        };

        self.oldDoRedrawShape.apply(view.graph.cellRenderer, [state]);
        state.shape.paint = oldPaint;
      };
    }

    // Overrides validateCellState to ignore invisible cells
    view.validateCellState = (cell, recurse) => {
      if (cell == null || isCellVisibleFn == null || isCellVisibleFn(cell)) {
        return self.oldValidateCellState.apply(view, [cell, recurse]);
      }
      return null;
    };

    // Creates space for new states
    view.setStates(new mxDictionary());
    view.setScale(scale);

    if (cells != null) {
      view.resetValidationState();
      let bbox = null;

      // Validates the vertices and edges without adding them to
      // the model so that the original cells are not modified
      for (let i = 0; i < cells.length; i++) {
        let bounds = view.getBoundingBox(view.validateCellState(view.validateCell(cells[i])));

        if (bbox == null) {
          bbox = bounds;
        } else {
          bbox.add(bounds);
        }
      }

      view.setGraphBounds(bbox || new mxRectangle());
    }
  };

  /**
   * Function: destroy
   *
   * Returns the top, left corner as a new <mxPoint>.
   */
  destroy = () => {
    this.view.setScale(this.oldScale);
    this.view.setStates(this.oldStates);
    this.view.setGraphBounds(this.oldBounds);
    this.view.validateCellState = this.oldValidateCellState;
    this.view.graph.cellRenderer.doRedrawShape = this.oldDoRedrawShape;
  };
}

export default mxTemporaryCellStates;