class LITERALLY_AS {
  constructor(value) {
    this.value = value;
  }
}

module.exports = {
  isSpaceSeparator(c) {
    return !!c && /[\u1680\u2000-\u200A\u202F\u205F\u3000]/.test(c);
  },

  isIdStartChar(c) {
    return !!c && (
      (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      (c === '$') || (c === '_') ||
      /\p{L}/u.test(c)
    );
  },

  isIdContinueChar(c) {
    return !!c && (
      (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      (c >= '0' && c <= '9') ||
      (c === '$') || (c === '_') ||
      (c === '\u200C') || (c === '\u200D') ||
      /\p{L}|\p{Mc}|\p{Mn}|\p{Nd}|\p{Pc}/u.test(c)
    );
  },

  isDigit(c) {
    return !!c && /[0-9]/.test(c);
  },

  isHexDigit(c) {
    return !!c && /[0-9A-Fa-f]/.test(c);
  },

  isBinaryDigit(c) {
    return !!c && /[01]/.test(c);
  },

  isOctalDigit(c) {
    return !!c && /[0-7]/.test(c);
  },

  createTypeContainer(type, value) {
    return { _$_: type, _$_value: value };
  },

  isTypeContainer(obj) {
    return obj && typeof obj === 'object' && obj.hasOwnProperty('_$_') &&
           obj.hasOwnProperty('_$_value') && Object.keys(obj).length === 2;
  },

  LITERALLY_AS: function (value) {
    return new LITERALLY_AS(value);
  },

  LITERALLY_AS_CLASS: LITERALLY_AS,

  DELETE: Symbol('DELETE'),
  UNDEFINED: Symbol('UNDEFINED')
};
