/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */

import mxObjectCodec from './mxObjectCodec';

/**
 * Class: mxCodecRegistry
 *
 * Singleton class that acts as a global registry for codecs.
 *
 * Adding an <mxCodec>:
 *
 * 1. Define a default codec with a new instance of the
 * object to be handled.
 *
 * (code)
 * let codec = new mxObjectCodec(new mxGraphModel());
 * (end)
 *
 * 2. Define the functions required for encoding and decoding
 * objects.
 *
 * (code)
 * codec.encode = (enc, obj)=> { ... }
 * codec.decode = (dec, node, into)=> { ... }
 * (end)
 *
 * 3. Register the codec in the <mxCodecRegistry>.
 *
 * (code)
 * mxCodecRegistry.register(codec);
 * (end)
 *
 * <mxObjectCodec.decode> may be used to either create a new
 * instance of an object or to configure an existing instance,
 * in which case the into argument points to the existing
 * object. In this case, we say the codec "configures" the
 * object.
 *
 * Variable: codecs
 *
 * Maps from constructor names to codecs.
 */
class mxCodecRegistry {
  static codecs = [];

  /**
   * Variable: aliases
   *
   * Maps from classnames to codecnames.
   */
  static aliases = [];

  /**
   * Function: register
   *
   * Registers a new codec and associates the name of the template
   * constructor in the codec with the codec object.
   *
   * Parameters:
   *
   * codec - <mxObjectCodec> to be registered.
   */
  static register(codec) {
    if (codec != null) {
      const name = codec.getName();
      mxCodecRegistry.codecs[name] = codec;

      const classname = codec.template.constructor.name;

      if (classname !== name) {
        mxCodecRegistry.addAlias(classname, name);
      }
    }
    return codec;
  }

  /**
   * Function: addAlias
   *
   * Adds an alias for mapping a classname to a codecname.
   */
  static addAlias(classname, codecname) {
    mxCodecRegistry.aliases[classname] = codecname;
  }

  /**
   * Function: getCodec
   *
   * Returns a codec that handles objects that are constructed
   * using the given constructor.
   *
   * Parameters:
   *
   * ctor - JavaScript constructor function.
   */
  static getCodec(constructor_) {
    let codec = null;

    if (constructor_ != null) {
      let { name } = constructor_;
      const tmp = mxCodecRegistry.aliases[name];

      if (tmp != null) {
        name = tmp;
      }

      codec = mxCodecRegistry.codecs[name];

      // Registers a new default codec for the given constructor
      // if no codec has been previously defined.
      if (codec == null) {
        try {
          codec = new mxObjectCodec(new constructor_());
          mxCodecRegistry.register(codec);
        } catch (e) {
          // ignore
        }
      }
    }
    return codec;
  }
}

export default mxCodecRegistry;