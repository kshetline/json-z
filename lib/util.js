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
    /* eslint-disable no-multi-spaces */
    if (c === 0x24 ||                                  // $
      (0x41 <= c && c <= 0x5A) ||                      // A-Z
      c === 0x5F ||                                    // _
      (0x61 <= c && c <= 0x7A) ||                      // a-z
      c === 0x00AA || c === 0x00B5 || c === 0x00BA ||  // ª µ º
      (0xC0 <= c && c <= 0xD6) ||                      // À-Ö
      (0xD8 <= c && c <= 0xF6) ||                      // Ø-ö
      (0xF8 <= c && c <= 0x2C1)) {                     // ø-ÿ
      return true;
    }
    /* eslint-enable no-multi-spaces */
    else if (!c || c < 0x2C1) {
      return false;
    }

    return /\p{L}/u.test(String.fromCodePoint(c));
  },

  isIdContinueChar(c) {
    /* eslint-disable no-multi-spaces */
    if (c === 0x24 ||                                  // $
      (0x30 <= c && c <= 0x39) ||                      // 0-9
      (0x41 <= c && c <= 0x5A) ||                      // A-Z
      c === 0x5F ||                                    // _
      (0x61 <= c && c <= 0x7A) ||                      // a-z
      c === 0x00AA || c === 0x00B5 || c === 0x00BA ||  // ª µ º
      (0xC0 <= c && c <= 0xD6) ||                      // À-Ö
      (0xD8 <= c && c <= 0xF6) ||                      // Ø-ö
      (0xF8 <= c && c <= 0x2C1) ||                     // ø-ÿ
      c === 0x200C || c === 0x200D) {                  // ZERO WIDTH NON-JOINER, ZERO WIDTH JOINER
      return true;
    }
    /* eslint-enable no-multi-spaces */
    else if (!c || c < 0x2C1) {
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
