const util = require('./util');
const big = require('./bignumber-util');
const optionsMgr = require('./options-manager');
const isArrayLike = require('./platform-specifics').isArrayLike;
const { LITERALLY_AS_CLASS } = require('./util');

const escapes = {
  "'": "\\'",
  '"': '\\"',
  '`': '\\`',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\v': '\\v',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
};

for (let c = 0; c < 32; ++c) {
  const ch = String.fromCharCode(c);

  if (!escapes[ch]) {
    escapes[ch] = '\\u' + (c < 16 ? '000' : '00') + c.toString(16).toUpperCase();
  }
}

const quoteRegexes = {
  "'": /'/g,
  '"': /"/g,
  '`': /`/g
};

module.exports = function stringify(value, replacer, space) {
  const stack = [];
  const options = {};
  let propertyList;
  let replacerFunc;
  let tab = '';
  let fixedQuote;

  Object.assign(options, optionsMgr.getOptions());

  if (typeof replacer === 'number') {
    Object.assign(options, optionsMgr.getOptionSet(replacer));
    replacer = undefined;
  }
  else if (typeof replacer === 'object' && !Array.isArray(replacer)) {
    Object.assign(options, replacer);
    replacer = options.replacer;
  }

  if (space === undefined) {
    space = options.space;
  }

  const trailingComma = options.trailingComma ? ',' : '';
  const quoteAllKeys = !!options.quoteAllKeys;
  const quote = options.quote;
  const sparseArrays = options.sparseArrays;
  const extendedPrimitives = options.extendedPrimitives;
  const extendedTypes = options.extendedTypes;
  const revealHiddenArrayProperties = options.revealHiddenArrayProperties;
  const maxIndent = options.maxIndent;
  let propertyFilter = options.propertyFilter;
  let oneLiners = options.oneLiners;

  if (typeof oneLiners === 'string') {
    oneLiners = oneLiners.split(',').map(s => s.trim()).filter(s => !!s);
  }

  if (Array.isArray(oneLiners)) {
    oneLiners = new Set(oneLiners);
  }
  else if (!(oneLiners instanceof Set)) {
    oneLiners = undefined;
  }

  let indent = options.indent || '';

  if (quote === '"' || quote === optionsMgr.Quote.DOUBLE) {
    fixedQuote = '"';
  }
  else if (quote === "'" || quote === optionsMgr.Quote.SINGLE) {
    fixedQuote = "'";
  }

  const preferredQuote = fixedQuote || (quote === optionsMgr.Quote.PREFER_DOUBLE ? '"' : "'");

  if (typeof replacer === 'function') {
    replacerFunc = replacer;
  }
  else if (Array.isArray(replacer) && !propertyFilter) {
    propertyFilter = replacer;
  }

  if (propertyFilter) {
    propertyList = [];

    for (const v of propertyFilter) {
      let item;

      if (typeof v === 'string') {
        item = v;
      }
      else if (typeof v === 'number' || v instanceof String || v instanceof Number) {
        item = String(v);
      }

      if (item !== undefined && propertyList.indexOf(item) < 0) {
        propertyList.push(item);
      }
    }

    if (propertyList.length === 0) {
      propertyList = undefined;
    }
  }

  if (space instanceof Number) {
    space = space.valueOf();
  }
  else if (space instanceof String) {
    space = space.toString();
  }

  if (typeof space === 'number') {
    if (space > 0) {
      space = Math.min(10, Math.floor(space));
      tab = ' '.repeat(space);
    }
  }
  else {
    tab = space.toString().substr(0, 10);
  }

  const gap = tab ? ' ' : '';

  const result = serializeProperty('', { '': value });

  return (result === util.DELETE || result === util.EXCISE ? undefined : result);

  function serializeProperty(key, holder, forArray, keyStack) {
    keyStack = keyStack ? (keyStack.push(key), keyStack) : [];
    const result = serializePropertyAux(key, holder, forArray, keyStack);
    keyStack.pop();
    return result;
  }

  function serializePropertyAux(key, holder, forArray, keyStack) {
    let value = holder[key];
    let ignoreToJson = big.isBigNumber(value);

    if (value) {
      if (typeof value.toJSONZ === 'function') {
        value = value.toJSONZ(key, holder);
        ignoreToJson = true;
      }
      else if (typeof value.toJSON5 === 'function') {
        value = value.toJSON5(key);
        ignoreToJson = true;
      }
      else if (extendedTypes !== optionsMgr.ExtendedTypeMode.OFF) {
        const subOptions = Object.assign({}, options);

        subOptions.space = gap;
        subOptions.indent = indent;

        const extendedValue = optionsMgr.serializeExtendedType(value, subOptions, module.exports);

        if (extendedValue) {
          ignoreToJson = true;

          if (extendedTypes === optionsMgr.ExtendedTypeMode.AS_FUNCTIONS) {
            return extendedValue;
          }
          else {
            value = extendedValue;
          }
        }
      }
    }

    if (!ignoreToJson && value && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    const originalValue = value;

    if (replacerFunc) {
      value = replacerFunc.call(holder, key, value, { holder, stack: keyStack });
    }

    if (value && (value instanceof String || value instanceof Boolean)) {
      value = value.valueOf();
    }

    if (value instanceof LITERALLY_AS_CLASS) {
      return value.value;
    }

    switch (value) {
      case null: return 'null';
      case true: return 'true';
      case false: return 'false';
      case undefined: return originalValue !== undefined ? util.DELETE : extendedPrimitives ? ('undefined') : 'null';
      case util.DELETE: return util.DELETE;
      case util.EXCISE: return util.EXCISE;
      case util.UNDEFINED: return 'undefined';
    }

    if (typeof value === 'string') {
      return quoteString(value, false);
    }

    if (big.isNumberOrBigNumber(value)) {
      return big.stringify(value, options, preferredQuote);
    }

    if (typeof value === 'object') {
      const doIndent = (!maxIndent || keyStack.length < maxIndent) && (!oneLiners || !oneLiners.has(key));

      return Array.isArray(value) || isArrayLike(value)
        ? serializeArray(value, doIndent, keyStack)
        : serializeObject(value, doIndent, keyStack);
    }

    return forArray ? 'null' : util.DELETE;
  }

  function quoteString(value) {
    const quotes = {
      "'": 0.2 - (quote === optionsMgr.Quote.PREFER_SINGLE ? 0.1 : 0),
      '"': 0.2 - (quote === optionsMgr.Quote.PREFER_DOUBLE ? 0.1 : 0),
      '`': 0.3
    };

    let product = '';

    for (let i = 0; i < value.length; i++) {
      const c = value[i];

      switch (c) {
        case "'":
        case '"':
        case '`':
          quotes[c]++;
          product += c;
          continue;

        case '\0':
          if (util.isDigit(value[i + 1].codePointAt(0))) {
            product += '\\x00';
            continue;
          }
      }

      if (escapes[c]) {
        product += escapes[c];
      }
      else {
        product += c;
      }
    }

    const quoteChar = fixedQuote || Object.keys(quotes).reduce((a, b) => (quotes[a] < quotes[b]) ? a : b);

    product = product.replace(quoteRegexes[quoteChar], escapes[quoteChar]);

    if (quoteChar === '`') {
      product = product.replace(/\$\{/g, '$\\{');
    }

    return quoteChar + product + quoteChar;
  }

  function serializeObject(value, doIndent, keyStack) {
    if (stack.indexOf(value) >= 0) {
      throw TypeError('Converting circular structure to JSON-Z');
    }

    stack.push(value);

    const stepback = indent;

    if (doIndent) {
      indent = indent + tab;
    }

    const keys = propertyList || Object.keys(value);
    const partial = [];

    for (const key of keys) {
      if (propertyList && value[key] === undefined) {
        continue;
      }

      const propertyString = serializeProperty(key, value, false, keyStack);

      if (propertyString !== util.DELETE && propertyString !== util.EXCISE) {
        let member = serializeKey(key) + ':' + gap;

        member += propertyString;
        partial.push(member);
      }
    }

    let final;

    if (partial.length === 0) {
      final = '{}';
    }
    else {
      let properties;
      const itc = util.isTypeContainer(value);

      // Type containers are not internally indented, just gapped.
      if (!doIndent || tab === '' || tab === ' ' || itc) {
        properties = partial.join(',' + gap);
        final = `{${properties}}`;
      }
      else {
        const separator = ',\n' + indent;

        properties = partial.join(separator);
        final = `{\n${indent}${properties}${trailingComma}\n${stepback}}`;
      }
    }

    stack.pop();
    indent = stepback;

    return final;
  }

  function serializeKey(key) {
    if (quoteAllKeys || key.length === 0) {
      return quoteString(key, true);
    }

    const firstChar = key.codePointAt(0);

    if (!util.isIdStartChar(firstChar)) {
      return quoteString(key, true);
    }

    for (let i = util.getCodePointLength(firstChar); i < key.length; i++) {
      if (!util.isIdContinueChar(key.codePointAt(i))) {
        return quoteString(key, true);
      }
    }

    return key;
  }

  function serializeArray(value, doIndent, keyStack) {
    if (stack.indexOf(value) >= 0) {
      throw TypeError('Converting circular structure to JSON-Z');
    }

    stack.push(value);

    const stepback = indent;

    if (doIndent) {
      indent = indent + tab;
    }

    const partial = [];
    let lastLength = value.length;

    // Note: looping backward over array indices allows replacer to easily shrink parent array if desired
    for (let i = value.length - 1; i >= 0; --i) {
      if (!sparseArrays || i in value) {
        const propertyString = serializeProperty(String(i), value, true, keyStack);

        if (lastLength > value.length) {
          lastLength = value.length;
        }
        else if (propertyString === util.DELETE) {
          partial.push('');
        }
        else if (propertyString !== util.EXCISE) {
          partial.push(propertyString);
        }
      }
      else {
        partial.push('');
      }
    }

    partial.reverse();

    if (revealHiddenArrayProperties) {
      const keys = Object.keys(value);

      // This gets a little weird. We need to skip over keys that are numbers, because they've already been handled by
      // the previous loop. All of the keys "Object,keys()" returns, however, are represented as strings even when they're
      // for numeric indices, so typeof doesn't help. Further, a key can parse as a valid number, like "00", but that
      // is a distinct key from "0", and would need to be covered here.
      //
      // Oh, and negative or non-integer number keys can exist too, and they don't change the length property of an
      // array either, and need to be handled here as well.
      for (const key of keys) {
        const n = Number(key);

        if (n < 0 || n.toString() !== key || Math.floor(n) !== n) {
          const propertyString = serializeProperty(key, value, false);

          if (propertyString !== util.DELETE) {
            let member = '#' + serializeKey(key) + ':' + gap;

            member += propertyString;
            partial.push(member);
          }
        }
      }
    }

    let final;

    if (partial.length === 0) {
      final = '[]';
    }
    else {
      if (!doIndent || tab === '' || tab === ' ') {
        const properties = partial.join(',' + gap);

        final = `[${properties}]`;
      }
      else {
        const separator = ',\n' + indent;
        const properties = partial.join(separator);

        final = `[\n${indent}${properties}${trailingComma}\n${stepback}]`;
      }
    }

    stack.pop();
    indent = stepback;

    return final;
  }
};
