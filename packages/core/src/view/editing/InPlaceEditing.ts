import Cell from "../cell/datatypes/Cell";
import {isMultiTouchEvent} from "../../util/EventUtils";
import EventObject from "../event/EventObject";
import InternalEvent from "../event/InternalEvent";
import CellEditor from "./CellEditor";
import InternalMouseEvent from "../event/InternalMouseEvent";
import Graph from "../Graph";

class InPlaceEditing {
  constructor(graph: Graph) {
    this.graph = graph;
  }

  graph: Graph;

  /*****************************************************************************
   * Group: Cell in-place editing
   *****************************************************************************/

  /**
   * Calls {@link startEditingAtCell} using the given cell or the first selection
   * cell.
   *
   * @param evt Optional mouse event that triggered the editing.
   */
  startEditing(evt: MouseEvent): void {
    this.startEditingAtCell(null, evt);
  }

  /**
   * Fires a {@link startEditing} event and invokes {@link CellEditor.startEditing}
   * on {@link editor}. After editing was started, a {@link editingStarted} event is
   * fired.
   *
   * @param cell {@link mxCell} to start the in-place editor for.
   * @param evt Optional mouse event that triggered the editing.
   */
  startEditingAtCell(cell: Cell | null = null, evt: MouseEvent): void {
    if (evt == null || !isMultiTouchEvent(evt)) {
      if (cell == null) {
        cell = this.getSelectionCell();
        if (cell != null && !this.isCellEditable(cell)) {
          cell = null;
        }
      }

      if (cell != null) {
        this.fireEvent(
          new EventObject(InternalEvent.START_EDITING, 'cell', cell, 'event', evt)
        );
        (<CellEditor>this.cellEditor).startEditing(cell, evt);
        this.fireEvent(
          new EventObject(InternalEvent.EDITING_STARTED, 'cell', cell, 'event', evt)
        );
      }
    }
  }

  /**
   * Returns the initial value for in-place editing. This implementation
   * returns {@link convertValueToString} for the given cell. If this function is
   * overridden, then {@link Model.valueForCellChanged} should take care
   * of correctly storing the actual new value inside the user object.
   *
   * @param cell {@link mxCell} for which the initial editing value should be returned.
   * @param evt Optional mouse event that triggered the editor.
   */
  getEditingValue(
    cell: Cell,
    evt: EventObject | InternalMouseEvent
  ): string | null {
    return this.convertValueToString(cell);
  }

  /**
   * Stops the current editing  and fires a {@link editingStopped} event.
   *
   * @param cancel Boolean that specifies if the current editing value
   * should be stored.
   */
  stopEditing(cancel: boolean = false): void {
    (<CellEditor>this.cellEditor).stopEditing(cancel);
    this.fireEvent(
      new EventObject(InternalEvent.EDITING_STOPPED, 'cancel', cancel)
    );
  }

  /**
   * Sets the label of the specified cell to the given value using
   * {@link cellLabelChanged} and fires {@link InternalEvent.LABEL_CHANGED} while the
   * transaction is in progress. Returns the cell whose label was changed.
   *
   * @param cell {@link mxCell} whose label should be changed.
   * @param value New label to be assigned.
   * @param evt Optional event that triggered the change.
   */
  // labelChanged(cell: mxCell, value: any, evt?: MouseEvent): mxCell;
  labelChanged(
    cell: Cell,
    value: any,
    evt: InternalMouseEvent | EventObject
  ): Cell {
    this.getModel().beginUpdate();
    try {
      const old = cell.value;
      this.cellLabelChanged(cell, value, this.isAutoSizeCell(cell));
      this.fireEvent(
        new EventObject(
          InternalEvent.LABEL_CHANGED,
          'cell',
          cell,
          'value',
          value,
          'old',
          old,
          'event',
          evt
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cell;
  }

  /**
   * Sets the new label for a cell. If autoSize is true then
   * {@link cellSizeUpdated} will be called.
   *
   * In the following example, the function is extended to map changes to
   * attributes in an XML node, as shown in {@link convertValueToString}.
   * Alternatively, the handling of this can be implemented as shown in
   * {@link Model.valueForCellChanged} without the need to clone the
   * user object.
   *
   * ```javascript
   * var graphCellLabelChanged = graph.cellLabelChanged;
   * graph.cellLabelChanged = function(cell, newValue, autoSize)
   * {
   * 	// Cloned for correct undo/redo
   * 	var elt = cell.value.cloneNode(true);
   *  elt.setAttribute('label', newValue);
   *
   *  newValue = elt;
   *  graphCellLabelChanged.apply(this, arguments);
   * };
   * ```
   *
   * @param cell {@link mxCell} whose label should be changed.
   * @param value New label to be assigned.
   * @param autoSize Boolean that specifies if {@link cellSizeUpdated} should be called.
   */
  cellLabelChanged(cell: Cell, value: any, autoSize: boolean = false): void {
    this.batchUpdate(() => {
      this.getModel().setValue(cell, value);
      if (autoSize) {
        this.cellSizeUpdated(cell, false);
      }
    });
  }
}

export default InPlaceEditing;