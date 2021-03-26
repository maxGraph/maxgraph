/**
 * Copyright (c) 2006-2013, JGraph Ltd
 * Converted to ES9 syntax/React by David Morrissey 2021
 */

import React from 'react';
import mxEvent from '../../mxgraph/util/mxEvent';
import mxGraph from '../../mxgraph/view/mxGraph';
import mxRubberband from '../../mxgraph/handler/mxRubberband';
import mxConstants from '../../mxgraph/util/mxConstants';
import mxUtils from '../../mxgraph/util/mxUtils';
import mxRectangle from '../../mxgraph/util/mxRectangle';
import mxImage from '../../mxgraph/util/mxImage';
import mxPerimeter from '../../mxgraph/view/mxPerimeter';

class Images extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>Images</h1>
        This example demonstrates using background images and images for for the
        label- and image-shape.
        <div
          ref={el => {
            this.el = el;
          }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            height: '200px',
            cursor: 'default',
          }}
        />
      </>
    );
  }

  componentDidMount() {
    // Creates the graph inside the given container
    const graph = new mxGraph(this.el);

    // Sets a background image and restricts child movement to its bounds
    graph.setBackgroundImage(
      new mxImage('images/gradient_background.jpg', 360, 200)
    );
    graph.maximumGraphBounds = new mxRectangle(0, 0, 360, 200);

    // Resizes the container but never make it bigger than the background
    graph.minimumContainerSize = new mxRectangle(0, 0, 360, 200);
    graph.setResizeContainer(true);

    // Disables basic selection and cell handling
    // graph.setEnabled(false);
    configureStylesheet(graph);

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    graph.getModel().beginUpdate();
    try {
      var v1 = graph.insertVertex(
        parent,
        null,
        'First Line\nSecond Line',
        20,
        10,
        80,
        100,
        'bottom'
      );
      var v1 = graph.insertVertex(
        parent,
        null,
        'First Line\nSecond Line',
        130,
        10,
        80,
        100,
        'top'
      );
      var v1 = graph.insertVertex(parent, null, '', 230, 10, 100, 100, 'image');
      var v2 = graph.insertVertex(
        parent,
        null,
        'First Line\nSecond Line',
        20,
        130,
        140,
        60,
        'right'
      );
      var v2 = graph.insertVertex(
        parent,
        null,
        'First Line\nSecond Line',
        180,
        130,
        140,
        60,
        'left'
      );
    } finally {
      // Updates the display
      graph.getModel().endUpdate();
    }

    function configureStylesheet(graph) {
      let style = {};
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
      style[mxConstants.STYLE_IMAGE] = 'images/icons48/keys.png';
      style[mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
      graph.getStylesheet().putCellStyle('image', style);

      style = mxUtils.clone(style);
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_LABEL;
      style[mxConstants.STYLE_STROKECOLOR] = '#000000';
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
      style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
      style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
      style[mxConstants.STYLE_IMAGE] = 'images/icons48/gear.png';
      style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
      style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
      style[mxConstants.STYLE_SPACING_TOP] = '56';
      style[mxConstants.STYLE_SPACING] = '8';
      graph.getStylesheet().putCellStyle('bottom', style);

      style = mxUtils.clone(style);
      style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_BOTTOM;
      style[mxConstants.STYLE_IMAGE] = 'images/icons48/server.png';
      delete style[mxConstants.STYLE_SPACING_TOP];
      graph.getStylesheet().putCellStyle('top', style);

      style = mxUtils.clone(style);
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
      style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_LEFT;
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
      style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
      style[mxConstants.STYLE_IMAGE] = 'images/icons48/earth.png';
      style[mxConstants.STYLE_SPACING_LEFT] = '55';
      style[mxConstants.STYLE_SPACING] = '4';
      graph.getStylesheet().putCellStyle('right', style);

      style = mxUtils.clone(style);
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_RIGHT;
      style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_RIGHT;
      delete style[mxConstants.STYLE_SPACING_LEFT];
      style[mxConstants.STYLE_SPACING_RIGHT] = '55';
      graph.getStylesheet().putCellStyle('left', style);
    }
  }
}

export default Images;