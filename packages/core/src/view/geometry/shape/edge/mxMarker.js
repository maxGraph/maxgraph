/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import {
  ARROW_CLASSIC,
  ARROW_CLASSIC_THIN,
  ARROW_DIAMOND,
} from '../../../../util/Constants';

/**
 * A static class that implements all markers for VML and SVG using a registry.
 * NOTE: The signatures in this class will change.
 * @class mxMarker
 */
class mxMarker {
  /**
   * Maps from markers names to functions to paint the markers.
   *
   * Mapping: the attribute name on the object is the marker type, the associated value is the function to paint the marker
   */
  // static markers: object;
  static markers = [];

  /**
   * Adds a factory method that updates a given endpoint and returns a
   * function to paint the marker onto the given canvas.
   */
  // static addMarker(type: string, funct: Function): void;
  static addMarker(type, funct) {
    mxMarker.markers[type] = funct;
  }

  /**
   * Function: createMarker
   *
   * Returns a function to paint the given marker.
   */
  static createMarker(
    canvas,
    shape,
    type,
    pe,
    unitX,
    unitY,
    size,
    source,
    sw,
    filled
  ) {
    const funct = mxMarker.markers[type];
    return funct != null
      ? funct(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
      : null;
  }
}

/**
 * Adds the classic and block marker factory method.
 */
(() => {
  function createArrow(widthFactor) {
    widthFactor = widthFactor != null ? widthFactor : 2;

    return (
      canvas,
      shape,
      type,
      pe,
      unitX,
      unitY,
      size,
      source,
      sw,
      filled
    ) => {
      // The angle of the forward facing arrow sides against the x axis is
      // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
      // only half the strokewidth is processed ).
      const endOffsetX = unitX * sw * 1.118;
      const endOffsetY = unitY * sw * 1.118;

      unitX *= size + sw;
      unitY *= size + sw;

      const pt = pe.clone();
      pt.x -= endOffsetX;
      pt.y -= endOffsetY;

      const f =
        type !== ARROW_CLASSIC && type !== ARROW_CLASSIC_THIN ? 1 : 3 / 4;
      pe.x += -unitX * f - endOffsetX;
      pe.y += -unitY * f - endOffsetY;

      return () => {
        canvas.begin();
        canvas.moveTo(pt.x, pt.y);
        canvas.lineTo(
          pt.x - unitX - unitY / widthFactor,
          pt.y - unitY + unitX / widthFactor
        );

        if (type === ARROW_CLASSIC || type === ARROW_CLASSIC_THIN) {
          canvas.lineTo(pt.x - (unitX * 3) / 4, pt.y - (unitY * 3) / 4);
        }

        canvas.lineTo(
          pt.x + unitY / widthFactor - unitX,
          pt.y - unitY - unitX / widthFactor
        );
        canvas.close();

        if (filled) {
          canvas.fillAndStroke();
        } else {
          canvas.stroke();
        }
      };
    };
  }

  mxMarker.addMarker('classic', createArrow(2));
  mxMarker.addMarker('classicThin', createArrow(3));
  mxMarker.addMarker('block', createArrow(2));
  mxMarker.addMarker('blockThin', createArrow(3));

  function createOpenArrow(widthFactor) {
    widthFactor = widthFactor != null ? widthFactor : 2;

    return (
      canvas,
      shape,
      type,
      pe,
      unitX,
      unitY,
      size,
      source,
      sw,
      filled
    ) => {
      // The angle of the forward facing arrow sides against the x axis is
      // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
      // only half the strokewidth is processed ).
      const endOffsetX = unitX * sw * 1.118;
      const endOffsetY = unitY * sw * 1.118;

      unitX *= size + sw;
      unitY *= size + sw;

      const pt = pe.clone();
      pt.x -= endOffsetX;
      pt.y -= endOffsetY;

      pe.x += -endOffsetX * 2;
      pe.y += -endOffsetY * 2;

      return () => {
        canvas.begin();
        canvas.moveTo(
          pt.x - unitX - unitY / widthFactor,
          pt.y - unitY + unitX / widthFactor
        );
        canvas.lineTo(pt.x, pt.y);
        canvas.lineTo(
          pt.x + unitY / widthFactor - unitX,
          pt.y - unitY - unitX / widthFactor
        );
        canvas.stroke();
      };
    };
  }

  mxMarker.addMarker('open', createOpenArrow(2));
  mxMarker.addMarker('openThin', createOpenArrow(3));

  mxMarker.addMarker(
    'oval',
    (canvas, shape, type, pe, unitX, unitY, size, source, sw, filled) => {
      const a = size / 2;

      const pt = pe.clone();
      pe.x -= unitX * a;
      pe.y -= unitY * a;

      return () => {
        canvas.ellipse(pt.x - a, pt.y - a, size, size);

        if (filled) {
          canvas.fillAndStroke();
        } else {
          canvas.stroke();
        }
      };
    }
  );

  function diamond(
    canvas,
    shape,
    type,
    pe,
    unitX,
    unitY,
    size,
    source,
    sw,
    filled
  ) {
    // The angle of the forward facing arrow sides against the x axis is
    // 45 degrees, 1/sin(45) = 1.4142 / 2 = 0.7071 ( / 2 allows for
    // only half the strokewidth is processed ). Or 0.9862 for thin diamond.
    // Note these values and the tk variable below are dependent, update
    // both together (saves trig hard coding it).
    const swFactor = type === ARROW_DIAMOND ? 0.7071 : 0.9862;
    const endOffsetX = unitX * sw * swFactor;
    const endOffsetY = unitY * sw * swFactor;

    unitX *= size + sw;
    unitY *= size + sw;

    const pt = pe.clone();
    pt.x -= endOffsetX;
    pt.y -= endOffsetY;

    pe.x += -unitX - endOffsetX;
    pe.y += -unitY - endOffsetY;

    // thickness factor for diamond
    const tk = type === ARROW_DIAMOND ? 2 : 3.4;

    return () => {
      canvas.begin();
      canvas.moveTo(pt.x, pt.y);
      canvas.lineTo(
        pt.x - unitX / 2 - unitY / tk,
        pt.y + unitX / tk - unitY / 2
      );
      canvas.lineTo(pt.x - unitX, pt.y - unitY);
      canvas.lineTo(
        pt.x - unitX / 2 + unitY / tk,
        pt.y - unitY / 2 - unitX / tk
      );
      canvas.close();

      if (filled) {
        canvas.fillAndStroke();
      } else {
        canvas.stroke();
      }
    };
  }

  mxMarker.addMarker('diamond', diamond);
  mxMarker.addMarker('diamondThin', diamond);
})();

export default mxMarker;