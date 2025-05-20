const platform = require('./platform-specifics');

let bigDecimal;
let hasBigDecimal = false;
let bigDecimalValueOfAllowed = false;

let decimal;
let hasDecimal = false;
let decimalValueOfAllowed = false;

let compareDecimalTypesByConstructor = false;

function isBigInt(value) {
  return typeof value === 'bigint';
}

function isBigDecimal(value) {
  if (compareDecimalTypesByConstructor) {
    return value && value.constructor === bigDecimal;
  }
  else {
    return hasBigDecimal && value instanceof bigDecimal;
  }
}

function isDecimal(value) {
  if (compareDecimalTypesByConstructor) {
    return value && value.constructor === decimal;
  }
  else {
    return hasDecimal && value instanceof decimal;
  }
}

function isBigNumber(value) {
  return isBigInt(value) || isDecimal(value) || isBigDecimal(value);
}

function checkDecimalTypeComparison() {
  compareDecimalTypesByConstructor = false;

  if (hasBigDecimal !== hasDecimal || !hasBigDecimal) {
    return;
  }

  const bd = module.exports.toBigDecimal('0');
  const d = module.exports.toDecimal('0');

  if ((bd instanceof decimal || d instanceof bigDecimal) &&
      bd.constructor === bigDecimal && d.constructor === decimal) {
    compareDecimalTypesByConstructor = true;
  }
}

module.exports = {
  hasDecimal() { return hasDecimal; },

  hasBigDecimal() { return hasBigDecimal; },

  getBigDecimalType() { return hasBigDecimal ? 'bigdecimal' : 'numeric'; },

  getDecimalType() { return hasDecimal ? 'decimal' : 'numeric'; },

  setDecimal(decimalClass) {
    hasDecimal = !!decimalClass;
    decimal = decimalClass;
    checkDecimalTypeComparison();

    decimalValueOfAllowed = false;

    if (decimalClass) {
      try {
        module.exports.toDecimal('0').valueOf();
        decimalValueOfAllowed = true;
      }
      catch (e) {}
    }
  },

  setBigDecimal(bigDecimalClass) {
    hasBigDecimal = !!bigDecimalClass;
    bigDecimal = bigDecimalClass;
    checkDecimalTypeComparison();

    bigDecimalValueOfAllowed = false;

    if (bigDecimalClass) {
      try {
        module.exports.toBigDecimal('0').valueOf();
        bigDecimalValueOfAllowed = true;
      }
      catch (e) {}
    }
  },

  toBigInt(s) {
    if (s && s.startsWith && s.startsWith('-')) {
      return -BigInt(s.slice(1));
    }
    else if (s && s.startsWith && s.startsWith('+')) {
      return BigInt(s.slice(1));
    }
    else {
      return BigInt(s);
    }
  },

  toBigDecimal(s) {
    return platform.toBigDecimal(bigDecimal, s);
  },

  toDecimal(s) {
    return platform.toDecimal(decimal, s);
  },

  isBigInt,

  isBigDecimal,

  isDecimal,

  isBigNumber,

  isNumberOrBigNumber(value) {
    return typeof value === 'number' || value instanceof Number || isBigNumber(value);
  },

  stringify(value, options, preferredQuote, noSuffix) {
    if (value instanceof Number) {
      value = value.valueOf();
    }

    let str = String(value);
    let suffix = '';
    let goBig = false;
    let valueOfAllowed = true;
    let checkExpFormat = false;

    if (isBigInt(value)) {
      suffix = 'n';
      goBig = options.primitiveBigInt;
    }
    else if (isBigDecimal(value)) {
      suffix = 'm';
      goBig = options.primitiveBigDecimal;
      checkExpFormat = true;
      valueOfAllowed = bigDecimalValueOfAllowed;
    }
    else if (isDecimal(value)) {
      suffix = 'd';
      goBig = options.primitiveDecimal;
      checkExpFormat = true;
      valueOfAllowed = decimalValueOfAllowed;
    }

    if (checkExpFormat) {
      const $ = /^(-?)(\d+)\.(\d+)e([-+]\d+)$/.exec(str);

      if ($) { // Undo needless exponential notation if present
        if ($[4] === '+0') {
          str = str.slice(0, -3);
        }
        else {
          const expo = parseInt($[4].replace('+', ''));
          const digits = $[2].length + $[3].length;

          if (digits + Math.abs(expo) < 34) {
            if (expo < 0) {
              str = $[1] + '0.' + '0'.repeat(-1 - expo) + $[2] + $[3];
            }
            else {
              str = $[2] + $[3].slice(0, expo);
              str += '0'.repeat(Math.max(expo + 1 - str.length, 0));

              if ($[3].length - expo > 0) {
                str += '.' + $[3].slice(expo);
              }

              str = $[1] + str;
            }
          }
        }
      }
    }

    // Try to recover sign of negative zero.
    if (str === '0' && (Object.is(value, -0) || (valueOfAllowed && /-0\b/.test(value.valueOf().toString())) ||
        /* istanbul ignore next */ // Last-ditch case that might come up, but hasn't with the Decimal libraries being tested
        (value.isNegative && value.isNegative()))) {
      str = '-' + str;
    }

    const special = /[-+]?Infinity|NaN/.test(str);

    if (goBig) {
      if (special && suffix && !noSuffix) {
        str += '_';
      }

      return str + (noSuffix ? '' : suffix);
    }
    else if (special) {
      return options.extendedPrimitives ? str : 'null';
    }
    else if (suffix) {
      return preferredQuote + str + preferredQuote;
    }

    return str;
  }
};
