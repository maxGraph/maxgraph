/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */

class mxDefaultPopupMenuCodec extends mxObjectCodec {
  /**
   * Class: mxDefaultPopupMenuCodec
   *
   * Custom codec for configuring <mxDefaultPopupMenu>s. This class is created
   * and registered dynamically at load time and used implicitly via
   * <mxCodec> and the <mxCodecRegistry>. This codec only reads configuration
   * data for existing popup menus, it does not encode or create menus. Note
   * that this codec only passes the configuration node to the popup menu,
   * which uses the config to dynamically create menus. See
   * <mxDefaultPopupMenu.createMenu>.
   */
  constructor() {
    super(new mxDefaultPopupMenu());
  }

  /**
   * Function: encode
   *
   * Returns null.
   */
  encode = (enc, obj) => {
    return null;
  };

  /**
   * Function: decode
   *
   * Uses the given node as the config for <mxDefaultPopupMenu>.
   */
  decode = (dec, node, into) => {
    var inc = node.getElementsByTagName('include')[0];

    if (inc != null) {
      this.processInclude(dec, inc, into);
    } else if (into != null) {
      into.config = node;
    }

    return into;
  };
}

mxCodecRegistry.register(new mxDefaultPopupMenuCodec());
export default mxDefaultPopupMenuCodec;