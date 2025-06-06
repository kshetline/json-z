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
    return !!c && /\$|_|\p{L}/u.test(String.fromCodePoint(c));
  },

  isIdContinueChar(c) {
    return !!c && /\$|_|\u200C|\u200D|\p{L}|\p{Mc}|\p{Mn}|\p{Nd}|\p{Pc}/u.test(String.fromCodePoint(c));
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

  getCodePointLength: c => c >= 65536 ? 2 : 1,

  setObjectProperty(obj, key, value) {
    Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  },

  LITERALLY_AS: function (value) {
    return new LITERALLY_AS(value);
  },

  LITERALLY_AS_CLASS: LITERALLY_AS,
  ValueSourceWrapper,

  DELETE: Symbol('DELETE'),
  EXCISE: Symbol('EXCISE'),
  UNDEFINED: Symbol('UNDEFINED')
};
