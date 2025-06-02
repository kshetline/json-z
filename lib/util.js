class LITERALLY_AS {
  constructor(value) {
    this.value = value;
  }
}

class ValueSourceWrapper {
  constructor(value, source) {
    this.value = value;
    this.source = source;
  }
}

module.exports = {
  isSpaceSeparator(c) {
    return c === 0x1680 || // OGHAM SPACE MARK
           (0x2000 <= c && c <= 0x200A) || // spaces of various kinds
           c === 0x202F || // NARROW NO-BREAK SPACE
           c === 0x205F || // MEDIUM MATHEMATICAL SPACE
           c === 0x3000; // IDEOGRAPHIC SPACE
  },

  isIdStartChar(c) {
    // Test for Unicode letters, plus $ and _
    if (c === 0x024 ||
        (0x041 <= c && c <= 0x05A) ||
        c === 0x05F ||
        (0x061 <= c && c <= 0x07A) ||
        c === 0x0AA || c === 0x0B5 || c === 0x0BA ||
        (0x0C0 <= c && c <= 0x0D6) ||
        (0x0D8 <= c && c <= 0x0F6) ||
        (0x0F8 <= c && c <= 0x2C1) ||
        (0x2C6 <= c && c <= 0x2D1) ||
        (0x2E0 <= c && c <= 0x2E4) ||
        c === 0x2EC || c === 0x2EE ||
        (0x370 <= c && c <= 0x374) ||
        c === 0x376 || c === 0x377 ||
        (0x37A <= c && c <= 0x37D) ||
        c === 0x37F || c === 0x386 ||
        (0x388 <= c && c <= 0x38A) ||
        c === 0x38C ||
        (0x38E <= c && c <= 0x3A1) ||
        (0x3A3 <= c && c <= 0x3F5) ||
        (0x3F7 <= c && c <= 0x481)) {
      return true;
    }
    else if (!c || c < 0x482) {
      return false;
    }

    return /\p{L}/u.test(String.fromCodePoint(c));
  },

  isIdContinueChar(c) {
    // Test, as above, for Unicode letters, $, and _, but also digit characters
    // and other ECMAScript-defined identifier continuation characters.
    if (c === 0x024 ||
        (0x030 <= c && c <= 0x039) ||
        (0x041 <= c && c <= 0x05A) ||
        c === 0x05F ||
        (0x061 <= c && c <= 0x07A) ||
        c === 0x0AA || c === 0x0B5 || c === 0x0BA ||
        (0x0C0 <= c && c <= 0x0D6) ||
        (0x0D8 <= c && c <= 0x0F6) ||
        (0x0F8 <= c && c <= 0x2C1) ||
        (0x2C6 <= c && c <= 0x2D1) ||
        (0x2E0 <= c && c <= 0x2E4) ||
        c === 0x2EC || c === 0x2EE ||
        (0x300 <= c && c <= 0x374) ||
        c === 0x376 || c === 0x377 ||
        (0x37A <= c && c <= 0x37D) ||
        c === 0x37F || c === 0x386 ||
        (0x388 <= c && c <= 0x38A) ||
        c === 0x38C ||
        (0x38E <= c && c <= 0x3A1) ||
        (0x3A3 <= c && c <= 0x3F5) ||
        (0x3F7 <= c && c <= 0x481) ||
        (0x483 <= c && c <= 0x487) ||
        c === 0x200C || c === 0x200D) { // ZERO WIDTH NON-JOINER, ZERO WIDTH JOINER
      return true;
    }
    /* eslint-enable no-multi-spaces */
    else if (!c || c < 0x482) {
      return false;
    }

    return /\p{L}|\p{Mc}|\p{Mn}|\p{Nd}|\p{Pc}/u.test(String.fromCodePoint(c));
  },

  isDigit(c) {
    return (0x30 <= c && c <= 0x39);
  },

  isHexDigit(c) {
    return (0x30 <= c && c <= 0x39) || (0x41 <= c && c <= 0x46) || (0x61 <= c && c <= 0x66);
  },

  isBinaryDigit(c) {
    return c === 0x30 || c === 0x31;
  },

  isOctalDigit(c) {
    return (0x30 <= c && c <= 0x37);
  },

  createTypeContainer(type, value) {
    return { _$_: type, _$_value: value };
  },

  isTypeContainer(obj) {
    return obj && typeof obj === 'object' && obj.hasOwnProperty('_$_') &&
           obj.hasOwnProperty('_$_value') && Object.keys(obj).length === 2;
  },

  unwrap(obj) {
    if (obj instanceof ValueSourceWrapper) {
      return obj.value;
    }

    return obj;
  },

  setObjectProperty(obj, key, value) {
    Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  },

  LITERALLY_AS: function (value) {
    return new LITERALLY_AS(value);
  },

  LITERALLY_AS_CLASS: LITERALLY_AS,
  ValueSourceWrapper,

  DELETE: Symbol('DELETE'),
  UNDEFINED: Symbol('UNDEFINED')
};
