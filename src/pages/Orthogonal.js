/**
 * Copyright (c) 2006-2013, JGraph Ltd
  
  Orthogonal example for mxGraph. This example demonstrates the use
  of port constraints and orthogonal edge styles and handlers.
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import mxGraphHandler from "../mxgraph/handler/mxGraphHandler";
import mxGuide from "../mxgraph/util/mxGuide";
import mxEdgeHandler from "../mxgraph/handler/mxEdgeHandler";
import mxConnectionHandler from "../mxgraph/handler/mxConnectionHandler";
import mxGraphView from "../mxgraph/view/mxGraphView";
import mxPoint from "../mxgraph/util/mxPoint";
import mxCellState from "../mxgraph/view/mxCellState";

class Orthogonal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Orthogonal example for mxGraph</h1>
        <div
          ref={el => {
            this.el = el;
          }}
          style={{
            overflow: 'hidden',
            position: 'relative',
            width: '321px',
            height: '241px',
            background: "url('editors/images/grid.gif')",
            cursor: 'default',
          }}
        />
      </>
    );
  }

  componentDidMount() {
    // Enables guides
    mxGraphHandler.prototype.guidesEnabled = true;

    // Alt disables guides
    mxGuide.prototype.isEnabledForEvent = function(evt) {
      return !mxEvent.isAltDown(evt);
    };

    // Enables snapping waypoints to terminals
    mxEdgeHandler.prototype.snapToTerminals = true;

    // Enables orthogonal connect preview in IE
    mxConnectionHandler.prototype.movePreviewAway = false;

    // Creates the graph inside the given container
    const graph = new mxGraph(this.el);
    graph.disconnectOnMove = false;
    graph.foldingEnabled = false;
    graph.cellsResizable = false;
    graph.extendParents = false;
    graph.setConnectable(true);

    // Implements perimeter-less connection points as fixed points (computed before the edge style).
    graph.view.updateFixedTerminalPoint = function(
      edge,
      terminal,
      source,
      constraint
    ) {
      mxGraphView.prototype.updateFixedTerminalPoint.apply(this, arguments);

      const pts = edge.absolutePoints;
      const pt = pts[source ? 0 : pts.length - 1];

      if (
        terminal != null &&
        pt == null &&
        this.getPerimeterFunction(terminal) == null
      ) {
        edge.setAbsoluteTerminalPoint(
          new mxPoint(
            this.getRoutingCenterX(terminal),
            this.getRoutingCenterY(terminal)
          ),
          source
        );
      }
    };

    // Changes the default edge style
    graph.getStylesheet().getDefaultEdgeStyle().edgeStyle =
      'orthogonalEdgeStyle';
    delete graph.getStylesheet().getDefaultEdgeStyle().endArrow;

    // Implements the connect preview
    graph.connectionHandler.createEdgeState = function(me) {
      const edge = graph.createEdge(null, null, null, null, null);

      return new mxCellState(
        this.graph.view,
        edge,
        this.graph.getCellStyle(edge)
      );
    };

    // Uncomment the following if you want the container
    // to fit the size of the graph
    // graph.setResizeContainer(true);

    // Enables rubberband selection
    new mxRubberband(graph);

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    graph.getModel().beginUpdate();
    try {
      const v1 = graph.insertVertex(parent, null, '', 40, 40, 40, 30);
      v1.setConnectable(false);
      const v11 = graph.insertVertex(
        v1,
        null,
        '',
        0.5,
        0,
        10,
        40,
        'portConstraint=northsouth;',
        true
      );
      v11.geometry.offset = new mxPoint(-5, -5);
      const v12 = graph.insertVertex(
        v1,
        null,
        '',
        0,
        0.5,
        10,
        10,
        'portConstraint=west;shape=triangle;direction=west;perimeter=none;' +
          'routingCenterX=-0.5;routingCenterY=0;',
        true
      );
      v12.geometry.offset = new mxPoint(-10, -5);
      const v13 = graph.insertVertex(
        v1,
        null,
        '',
        1,
        0.5,
        10,
        10,
        'portConstraint=east;shape=triangle;direction=east;perimeter=none;' +
          'routingCenterX=0.5;routingCenterY=0;',
        true
      );
      v13.geometry.offset = new mxPoint(0, -5);

      const v2 = graph.addCell(graph.getModel().cloneCell(v1));
      v2.geometry.x = 200;
      v2.geometry.y = 60;

      const v3 = graph.addCell(graph.getModel().cloneCell(v1));
      v3.geometry.x = 40;
      v3.geometry.y = 150;

      const v4 = graph.addCell(graph.getModel().cloneCell(v1));
      v4.geometry.x = 200;
      v4.geometry.y = 170;

      graph.insertEdge(parent, null, '', v1.getChildAt(2), v2.getChildAt(1));
      graph.insertEdge(parent, null, '', v2.getChildAt(2), v3.getChildAt(1));
      graph.insertEdge(parent, null, '', v3.getChildAt(2), v4.getChildAt(1));
    } finally {
      // Updates the display
      graph.getModel().endUpdate();
    }
  }
}

export default Orthogonal;