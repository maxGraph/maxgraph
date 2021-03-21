/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */
import mxShape from "./mxShape";
import mxPoint from "../util/mxPoint";

class mxRhombus extends mxShape {
  /**
   * Class: mxRhombus
   *
   * Extends <mxShape> to implement a rhombus (aka diamond) shape.
   * This shape is registered under <mxConstants.SHAPE_RHOMBUS>
   * in <mxCellRenderer>.
   *
   * Constructor: mxRhombus
   *
   * Constructs a new rhombus shape.
   *
   * Parameters:
   *
   * bounds - <mxRectangle> that defines the bounds. This is stored in
   * <mxShape.bounds>.
   * fill - String that defines the fill color. This is stored in <fill>.
   * stroke - String that defines the stroke color. This is stored in <stroke>.
   * strokewidth - Optional integer that defines the stroke width. Default is
   * 1. This is stored in <strokewidth>.
   */
  constructor(bounds, fill, stroke, strokewidth) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokewidth = (strokewidth != null) ? strokewidth : 1;
  }

  /**
   * Function: isRoundable
   *
   * Adds roundable support.
   */
  isRoundable = () => {
    return true;
  };

  /**
   * Function: paintVertexShape
   *
   * Generic painting implementation.
   */
  paintVertexShape = (c, x, y, w, h) => {
    let hw = w / 2;
    let hh = h / 2;

    let arcSize = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2;
    c.begin();
    this.addPoints(c, [new mxPoint(x + hw, y), new mxPoint(x + w, y + hh), new mxPoint(x + hw, y + h),
      new mxPoint(x, y + hh)], this.isRounded, arcSize, true);
    c.fillAndStroke();
  };
}

export default mxRhombus;