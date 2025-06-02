const util = require('./util');
const big = require('./bignumber-util');
const optionsMgr = require('./options-manager');
const { isBigNumber } = require('./bignumber-util');
const { ValueSourceWrapper, unwrap, setObjectProperty } = require('./util');

let stateCount = 0;

const ParseState = {
  start: stateCount++,
  beforeArrayValue: stateCount++,
  beforePropertyName: stateCount++,
  beforePropertyValue: stateCount++,
  afterArrayValue: stateCount++,
  afterPropertyName: stateCount++,
  afterPropertyValue: stateCount++,
  afterTypeArgument: stateCount++,
  afterTypeName: stateCount++,
  typeArgument: stateCount++,
  end: stateCount++
};

const LexState = {
  default: stateCount++,
  binary: stateCount++,
  binaryInteger: stateCount++,
  comment: stateCount++,
  decimalExponent: stateCount++,
  decimalExponentInteger: stateCount++,
  decimalExponentSign: stateCount++,
  decimalFraction: stateCount++,
  decimalInteger: stateCount++,
  decimalPoint: stateCount++,
  decimalPointLeading: stateCount++,
  hexadecimal: stateCount++,
  hexadecimalInteger: stateCount++,
  identifierName: stateCount++,
  identifierNameEscape: stateCount++,
  identifierNameStartEscape: stateCount++,
  multiLineComment: stateCount++,
  multiLineCommentAsterisk: stateCount++,
  octal: stateCount++,
  octalInteger: stateCount++,
  sign: stateCount++,
  singleLineComment: stateCount++,
  string: stateCount++,
  typeName: stateCount++,
  value: stateCount++,
  zero: stateCount++
};

/* eslint-disable no-multi-spaces */
const TAB                      = 0x0009;
const LF                       = 0x000A;
const VT                       = 0x000B;
const FF                       = 0x000C;
const CR                       = 0x000D;
const SPACE                    = 0x0020;
const HASH                     = 0x0023;
const DOLLAR                   = 0x0024;
const SINGLE_QUOTE             = 0x0027;
const LEFT_PARENTHESIS         = 0x0028;
const RIGHT_PARENTHESIS        = 0x0029;
const ASTERISK                 = 0x002A;
const PLUS                     = 0x002B;
const COMMA                    = 0x002C;
const DOT                      = 0x002E;
const SLASH                    = 0x002F;
const QUOTE                    = 0x0022;
const HYPHEN                   = 0x002D;
const ZERO                     = 0x0030;
const ONE                      = 0x0031;
const TWO                      = 0x0032;
const THREE                    = 0x0033;
const FOUR                     = 0x0034;
const FIVE                     = 0x0035;
const SIX                      = 0x0036;
const SEVEN                    = 0x0037;
const EIGHT                    = 0x0038;
const NINE                     = 0x0039;
const COLON                    = 0x003A;
const UPPER_B                  = 0x0042;
const UPPER_E                  = 0x0045;
const UPPER_I                  = 0x0049;
const UPPER_N                  = 0x004E;
const UPPER_O                  = 0x004F;
const UPPER_X                  = 0x0058;
const LEFT_BRACKET             = 0x005B;
const RIGHT_BRACKET            = 0x005D;
const BACKSLASH                = 0x005C;
const UNDERSCORE               = 0x005F;
const LOWER_b                  = 0x0062;
const LOWER_d                  = 0x0064;
const LOWER_e                  = 0x0065;
const LOWER_f                  = 0x0066;
const LOWER_m                  = 0x006D;
const LOWER_n                  = 0x006E;
const LOWER_o                  = 0x006F;
const LOWER_r                  = 0x0072;
const LOWER_t                  = 0x0074;
const LOWER_u                  = 0x0075;
const LOWER_v                  = 0x0076;
const LOWER_x                  = 0x0078;
const LEFT_BRACE               = 0x007B;
const RIGHT_BRACE              = 0x007D;
const BACKTICK                 = 0x0060;
const NB_SPACE                 = 0x00A0;
const ZERO_WIDTH_NON_JOINER    = 0x200C;
const ZERO_WIDTH_JOINER        = 0x200D;
const LINE_SEPARATOR           = 0x2028;
const PARAGRAPH_SEPARATOR      = 0x2029;
const ZERO_WIDTH_NOBREAK_SPACE = 0xFEFF;
/* eslint-enable no-multi-spaces */

const toChar = String.fromCodePoint;
const getCodePointLength = c => c >= 65536 ? 2 : 1;

const EMPTY = Symbol('EMPTY');

class ExtendedType {
  constructor(typeName, parent) {
    this.name = typeName;
    this.parent = parent;
    this.key = undefined;
    this.atRoot = false;
    this.arg = undefined;
  }
}

class KeyedArrayValue {
  constructor() {
    this.parent = undefined;
    this.key = undefined;
  }
}

function getDecimalType() {
  return big.getDecimalType() === 'number' ? 'number' : 'decimal';
}

function parse(text, reviver, newOptions) {
  const source = String(text || '');
  const options = {};

  Object.assign(options, optionsMgr.getParseOptions());

  if (typeof reviver === 'object') {
    newOptions = reviver;
    reviver = undefined;
  }

  Object.assign(options, newOptions || {});

  reviver = reviver || options.reviver;

  const reviveTypedContainers = !!options.reviveTypedContainers;
  let parseState = ParseState.start;
  let lexState;
  let root;
  const stack = [];
  let c;
  let lastPos = 0;
  let pos = 0;
  let line = 1;
  let column = 0;
  let token;
  let key;
  let underscoreAllowed = false;
  let buffer;
  let quoteChar;
  let sign;
  let signChar;
  let $;
  let mantissa;
  let exponent;
  let decimalPos;
  let legacyOctal;
  let trailingUnderscore;

  const parseStates = getParseStates();
  const lexStates = getLexStates();

  do {
    token = lex();
    parseStates[parseState]();
  } while (token.type !== 'eof');

  if (reviver) {
    const result = internalize({ '': root }, '', reviver);

    root = result === util.DELETE ? undefined : result;
  }

  if (reviveTypedContainers && util.isTypeContainer(root)) {
    try {
      root = optionsMgr.reviveTypeValue(root, true);
    }
    catch (err) {
      throw syntaxError(err.message, true);
    }
  }

  return root;

  /* Functions using variable context of parse() function */

  function getParseStates() {
    return [
      start,
      beforeArrayValue,
      beforePropertyName,
      beforePropertyValue,
      afterArrayValue,
      afterPropertyName,
      afterPropertyValue,
      afterTypeArgument,
      afterTypeName,
      typeArgument,
      end
    ];
  }

  function getLexStates() {
    return [
      lexStart,
      lexBeforeArrayValue,
      lexBeforePropertyName,
      lexBeforePropertyValue,
      lexAfterArrayValue,
      lexAfterPropertyName,
      lexAfterPropertyValue,
      lexAfterTypeArgument,
      lexAfterTypeName,
      lexTypeArgument,
      lexEnd,
      lexDefault,
      binary,
      binaryInteger,
      comment,
      decimalExponent,
      decimalExponentInteger,
      decimalExponentSign,
      decimalFraction,
      decimalInteger,
      decimalPoint,
      decimalPointLeading,
      hexadecimal,
      hexadecimalInteger,
      identifierName,
      identifierNameEscape,
      identifierNameStartEscape,
      multiLineComment,
      multiLineCommentAsterisk,
      octal,
      octalInteger,
      lexSign,
      singleLineComment,
      string,
      typeName,
      value,
      zero
    ];
  }

  function lex() {
    lexState = LexState.default;
    buffer = '';
    quoteChar = '';
    sign = 1;
    signChar = '';

    while (true) {
      c = peek();

      // Assume valid lexState, lexStates[lexState]
      const token = lexStates[lexState]();

      if (token) {
        return token;
      }
    }
  }

  function start() {
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    push();
  }

  function beforePropertyName() {
    switch (token.type) {
      case 'identifier':
      case 'string':
        key = token.value;
        parseState = ParseState.afterPropertyName;
        return;

      case 'punctuator':
        // Shouldn't be able to reach here token values other than '}'.
        pop();
        return;

      case 'eof':
        throw invalidEOF();
    }

    // Shouldn't be able to reach here with other tokens.
  }

  function afterPropertyName() {
    // Shouldn't be able to reach here with tokens other than type 'punctuator', value ':'.
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    const parent = stack[stack.length - 1];

    if (parent instanceof KeyedArrayValue) {
      parent.key = key;
    }

    parseState = ParseState.beforePropertyValue;
  }

  function beforePropertyValue() {
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    push();
  }

  function beforeArrayValue() {
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    if (token.type === 'punctuator' && token.value === RIGHT_BRACKET) {
      pop();
      return;
    }

    push();
  }

  function afterPropertyValue() {
    // Shouldn't be able to reach here with tokens other than type 'punctuator'.
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    switch (token.value) {
      case COMMA:
        parseState = ParseState.beforePropertyName;
        return;

      case RIGHT_BRACE:
        pop();
    }

    // Shouldn't be able to reach here with other tokens.
  }

  function afterArrayValue() {
    // Shouldn't be able to reach here with tokens other than type 'punctuator'.
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    switch (token.value) {
      case COMMA:
        parseState = ParseState.beforeArrayValue;
        return;

      case RIGHT_BRACKET:
        pop();
    }

    // Shouldn't be able to reach here with other tokens.
  }

  function afterTypeName() {
    // Shouldn't be able to reach here with tokens other than type 'punctuator'.
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    parseState = ParseState.typeArgument;
  }

  function typeArgument() {
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    push();
  }

  function afterTypeArgument() {
    if (token.type === 'eof') {
      throw invalidEOF();
    }

    pop();
  }

  function end() {
    // Shouldn't be able to reach here with tokens other than type 'eof'.
  }

  function parseNumber() {
    read();
    literal('aN');

    if (peek() === UNDERSCORE) {
      read();
      trailingUnderscore = true;
    }

    if (peek() === LOWER_m) {
      read();
      return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(NaN));
    }

    if (peek() === LOWER_d) {
      read();
      return newPrimitiveToken(getDecimalType(), big.toDecimal(NaN));
    }

    if (trailingUnderscore) {
      throw invalidChar('_');
    }

    return newPrimitiveToken('number', NaN);
  }

  // From https://github.com/json5/json5/pull/233, by jlguardi
  function readString() {
    let from = pos;
    let str = '';

    while (true) {
      const c = read();

      switch (c) {
        case BACKSLASH: // escape char
          str += source.substring(from, pos - 1);
          str += escape();
          from = pos;
          break;

        case quoteChar:
          return str + source.substring(from, pos - 1);

        case LF:
        case CR:
          throw invalidChar(c);

        case LINE_SEPARATOR:
        case PARAGRAPH_SEPARATOR:
          separatorChar(c);
          break;

        case DOLLAR:
          if (quoteChar === BACKTICK && peek() === LEFT_BRACE) {
            throw syntaxError(`JSON-Z: $\{ must be escaped as $\\{ in a backtick-quoted string ${line}:${column}`);
          }
          break;

        case undefined:
          throw invalidChar(c);
      }
    }
  }

  function lexDefault() {
    switch (c) {
      case TAB:
      case LF:
      case VT:
      case FF:
      case CR:
      case SPACE:
      case NB_SPACE:
      case LINE_SEPARATOR:
      case PARAGRAPH_SEPARATOR:
      case ZERO_WIDTH_NOBREAK_SPACE:
        read();
        return;

      case SLASH:
        read();
        lexState = LexState.comment;
        return;

      case undefined:
        read();
        return newToken('eof');
    }

    if (util.isSpaceSeparator(c)) {
      read();
      return;
    }

    // Assume valid parseState, lexStates[parseState]
    return lexStates[parseState]();
  }

  function comment() {
    switch (c) {
      case ASTERISK:
        read();
        lexState = LexState.multiLineComment;
        return;

      case SLASH:
        read();
        lexState = LexState.singleLineComment;
        return;
    }

    throw invalidChar(read());
  }

  function multiLineComment() {
    switch (c) {
      case ASTERISK:
        read();
        lexState = LexState.multiLineCommentAsterisk;
        return;

      case undefined:
        throw invalidChar(read());
    }

    read();
  }

  function multiLineCommentAsterisk() {
    switch (c) {
      case ASTERISK:
        read();
        return;

      case SLASH:
        read();
        lexState = LexState.default;
        return;

      case undefined:
        throw invalidChar(read());
    }

    read();
    lexState = LexState.multiLineComment;
  }

  function singleLineComment() {
    switch (c) {
      case LF:
      case CR:
      case LINE_SEPARATOR:
      case PARAGRAPH_SEPARATOR:
        read();
        lexState = LexState.default;
        return;

      case undefined:
        read();
        return newToken('eof');
    }

    read();
  }

  function value() {
    trailingUnderscore = false;

    switch (c) {
      case LEFT_BRACKET:
      case LEFT_BRACE:
      case COMMA:
      case HASH:
        return newToken('punctuator', read());

      case LOWER_n:
        read();
        literal('ull');
        return newPrimitiveToken('null', null);

      case LOWER_u:
        read();
        literal('ndefined');
        return newPrimitiveToken('undefined', undefined);

      case LOWER_t:
        read();
        literal('rue');
        return newPrimitiveToken('boolean', true);

      case LOWER_f:
        read();
        literal('alse');
        return newPrimitiveToken('boolean', false);

      case HYPHEN:
      case PLUS:
        if (read() === HYPHEN) {
          sign = -1;
          signChar = '-';
        }

        lexState = LexState.sign;
        return;

      case DOT:
        buffer = readChar();
        lexState = LexState.decimalPointLeading;
        return;

      case ZERO:
        buffer = readChar();
        lexState = LexState.zero;
        underscoreAllowed = true;
        legacyOctal = true;
        return;

      case ONE:
      case TWO:
      case THREE:
      case FOUR:
      case FIVE:
      case SIX:
      case SEVEN:
      case EIGHT:
      case NINE:
        buffer = readChar();
        lexState = LexState.decimalInteger;
        underscoreAllowed = true;
        legacyOctal = false;
        return;

      case UPPER_I:
        read();
        literal('nfinity');

        if (peek() === UNDERSCORE) {
          read();
          trailingUnderscore = true;
        }

        if (peek() === LOWER_m) {
          read();
          return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(Infinity));
        }

        if (peek() === LOWER_d) {
          read();
          return newPrimitiveToken(getDecimalType(), big.toDecimal(Infinity));
        }

        if (trailingUnderscore) {
          throw invalidChar('_');
        }

        return newPrimitiveToken('number', Infinity);

      case UPPER_N:
        return parseNumber();

      case SINGLE_QUOTE:
      case QUOTE:
      case BACKTICK:
        read();
        quoteChar = c;
        buffer = '';
        lexState = LexState.string;
        return;

      case UNDERSCORE:
        buffer = readChar();
        lexState = LexState.typeName;
        return;
    }

    throw invalidChar(read());
  }

  function identifierNameStartEscape() {
    if (c !== LOWER_u) {
      throw invalidChar(read());
    }

    read();
    const u = unicodeEscape();
    switch (u) {
      case DOLLAR:
      case UNDERSCORE:
        break;

      default:
        if (!util.isIdStartChar(u)) {
          throw invalidIdentifier();
        }

        break;
    }

    buffer += toChar(u);
    lexState = LexState.identifierName;
  }

  function identifierName() {
    if (c === BACKSLASH) {
      read();
      lexState = LexState.identifierNameEscape;
      return;
    }

    if (util.isIdContinueChar(c)) {
      buffer += readChar();
      return;
    }

    return newToken('identifier', buffer);
  }

  function identifierNameEscape() {
    if (c !== LOWER_u) {
      throw invalidChar(read());
    }

    read();
    const u = unicodeEscape();
    switch (u) {
      case DOLLAR:
      case UNDERSCORE:
      case ZERO_WIDTH_NON_JOINER:
      case ZERO_WIDTH_JOINER:
        break;

      default:
        if (!util.isIdContinueChar(u)) {
          throw invalidIdentifier();
        }

        break;
    }

    buffer += toChar(u);
    lexState = LexState.identifierName;
  }

  function lexSign() {
    let trailingUnderscore = false;

    switch (c) {
      case DOT:
        buffer = readChar();
        lexState = LexState.decimalPointLeading;
        underscoreAllowed = false;
        return;

      case ZERO:
        buffer = readChar();
        lexState = LexState.zero;
        underscoreAllowed = true;
        legacyOctal = true;
        return;

      case ONE:
      case TWO:
      case THREE:
      case FOUR:
      case FIVE:
      case SIX:
      case SEVEN:
      case EIGHT:
      case NINE:
        buffer = readChar();
        lexState = LexState.decimalInteger;
        underscoreAllowed = true;
        legacyOctal = false;
        return;

      case UPPER_I:
        read();
        literal('nfinity');

        if (peek() === UNDERSCORE) {
          read();
          trailingUnderscore = true;
        }

        if (peek() === LOWER_m) {
          read();
          return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(sign * Infinity));
        }

        if (peek() === LOWER_d) {
          read();
          return newPrimitiveToken(getDecimalType(), big.toDecimal(sign * Infinity));
        }

        if (trailingUnderscore) {
          throw invalidChar('_');
        }

        return newPrimitiveToken('number', sign * Infinity);

      case UPPER_N:
        return parseNumber();
    }

    throw invalidChar(read());
  }

  function zero() {
    switch (c) {
      case DOT:
        buffer += readChar();
        lexState = LexState.decimalPoint;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UPPER_E:
      case LOWER_e:
        buffer += readChar();
        lexState = LexState.decimalExponent;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UPPER_X:
      case LOWER_x:
        buffer += readChar();
        lexState = LexState.hexadecimal;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UPPER_B:
      case LOWER_b:
        buffer += readChar();
        lexState = LexState.binary;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UPPER_O:
      case LOWER_o:
        buffer += readChar();
        lexState = LexState.octal;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UNDERSCORE:
        read();
        underscoreAllowed = false;
        lexState = LexState.decimalInteger;
    }

    lexState = LexState.decimalInteger;
  }

  function decimalInteger() {
    switch (c) {
      case DOT:
        if (!underscoreAllowed) {
          throw invalidChar('_');
        }

        buffer += readChar();
        lexState = LexState.decimalPoint;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UPPER_E:
      case LOWER_e:
        if (!underscoreAllowed) {
          throw invalidChar('_');
        }

        buffer += readChar();
        lexState = LexState.decimalExponent;
        underscoreAllowed = false;
        legacyOctal = false;
        return;

      case UNDERSCORE:
        read();
        if (underscoreAllowed) {
          underscoreAllowed = false;
          return;
        }
        else {
          throw invalidChar('_');
        }
    }

    if (util.isDigit(c)) {
      buffer += readChar();
      underscoreAllowed = true;
      legacyOctal = legacyOctal && c < 0x38;
      return;
    }
    else if (!underscoreAllowed) {
      throw invalidChar('_');
    }

    if (legacyOctal && buffer !== '0') {
      buffer = '0o' + buffer;
    }

    if (c === LOWER_n) {
      read();
      return newPrimitiveToken('bigint', big.toBigInt(signChar + buffer));
    }
    else if (c === LOWER_m) {
      read();
      return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
    }
    else if (c === LOWER_d) {
      read();
      return newPrimitiveToken(getDecimalType(), big.toDecimal(signChar + buffer));
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function decimalPointLeading() {
    if (util.isDigit(c)) {
      buffer += readChar();
      lexState = LexState.decimalFraction;
      underscoreAllowed = true;
      legacyOctal = false;
      return;
    }

    throw invalidChar(read());
  }

  function decimalPoint() {
    switch (c) {
      case UPPER_E:
      case LOWER_e:
        buffer += readChar();
        lexState = LexState.decimalExponent;
        underscoreAllowed = false;
        return;
    }

    if (util.isDigit(c)) {
      buffer += readChar();
      lexState = LexState.decimalFraction;
      underscoreAllowed = true;
      return;
    }
    else if (c === LOWER_m) {
      read();
      return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
    }
    else if (c === LOWER_d) {
      read();
      return newPrimitiveToken(getDecimalType(), big.toDecimal(signChar + buffer));
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function decimalFraction() {
    switch (c) {
      case UPPER_E:
      case LOWER_e:
        buffer += readChar();
        lexState = LexState.decimalExponent;
        underscoreAllowed = false;
        return;
    }

    if (util.isDigit(c)) {
      buffer += readChar();
      underscoreAllowed = true;
      return;
    }
    else if (c === UNDERSCORE) {
      read();
      if (underscoreAllowed) {
        underscoreAllowed = false;
        return;
      }
      else {
        throw invalidChar('_');
      }
    }
    else if (c === LOWER_m) {
      read();
      return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
    }
    else if (c === LOWER_d) {
      read();
      return newPrimitiveToken(getDecimalType(), big.toDecimal(signChar + buffer));
    }
    else if (!underscoreAllowed) {
      throw invalidChar(UNDERSCORE);
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function decimalExponent() {
    switch (c) {
      case PLUS:
      case HYPHEN:
        buffer += readChar();
        lexState = LexState.decimalExponentSign;
        underscoreAllowed = false;
        return;
    }

    if (util.isDigit(c)) {
      buffer += readChar();
      lexState = LexState.decimalExponentInteger;
      underscoreAllowed = true;
      return;
    }

    throw invalidChar(read());
  }

  function decimalExponentSign() {
    if (util.isDigit(c)) {
      buffer += readChar();
      lexState = LexState.decimalExponentInteger;
      underscoreAllowed = true;
      return;
    }

    throw invalidChar(read());
  }

  function decimalExponentInteger() {
    if (util.isDigit(c)) {
      buffer += readChar();
      underscoreAllowed = true;
      return;
    }
    else if (c === UNDERSCORE) {
      read();
      if (underscoreAllowed) {
        underscoreAllowed = false;
        return;
      }
      else {
        throw invalidChar('_');
      }
    }
    else if (!underscoreAllowed) {
      throw invalidChar('_');
    }

    if (c === LOWER_n) {
      read();
      $ = /^(.*)E(.*)$/i.exec(buffer);
      mantissa = $[1];
      exponent = Number($[2]);
      decimalPos = mantissa.indexOf('.');

      if (decimalPos >= 0) {
        exponent -= mantissa.length - decimalPos - 1;
      }

      if (exponent < 0) {
        $ = /^(.*?)(0+)$/.exec(mantissa);

        if ($) {
          mantissa = $[1];
          exponent += $[2].length;
        }

        if (exponent < 0) {
          throw invalidExponentForBigInt(buffer);
        }
      }

      mantissa = mantissa.replace('.', '');
      buffer = mantissa + '0'.repeat(exponent);

      return newPrimitiveToken('bigint', big.toBigInt(signChar + buffer));
    }
    else if (c === LOWER_m) {
      read();
      return newPrimitiveToken(big.getBigDecimalType(), big.toBigDecimal(signChar + buffer));
    }
    else if (c === LOWER_d) {
      read();
      return newPrimitiveToken(getDecimalType(), big.toDecimal(signChar + buffer));
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function hexadecimal() {
    if (util.isHexDigit(c)) {
      buffer += readChar();
      lexState = LexState.hexadecimalInteger;
      underscoreAllowed = true;
      return;
    }

    throw invalidChar(read());
  }

  function hexadecimalInteger() {
    if (util.isHexDigit(c)) {
      buffer += readChar();
      underscoreAllowed = true;
      return;
    }
    else if (c === UNDERSCORE) {
      read();
      if (underscoreAllowed) {
        underscoreAllowed = false;
        return;
      }
      else {
        throw invalidChar('_');
      }
    }
    else if (!underscoreAllowed) {
      throw invalidChar('_');
    }

    if (c === LOWER_n) {
      read();
      return newPrimitiveToken('bigint', big.toBigInt(signChar + buffer));
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function binary() {
    if (util.isBinaryDigit(c)) {
      buffer += readChar();
      lexState = LexState.binaryInteger;
      underscoreAllowed = true;
      return;
    }

    throw invalidChar(read());
  }

  function binaryInteger() {
    if (util.isBinaryDigit(c)) {
      buffer += readChar();
      underscoreAllowed = true;
      return;
    }
    else if (c === UNDERSCORE) {
      read();
      if (underscoreAllowed) {
        underscoreAllowed = false;
        return;
      }
      else {
        throw invalidChar('_');
      }
    }
    else if (!underscoreAllowed) {
      throw invalidChar('_');
    }

    if (c === LOWER_n) {
      read();
      return newPrimitiveToken('bigint', big.toBigInt(signChar + buffer));
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function octal() {
    if (util.isOctalDigit(c)) {
      buffer += readChar();
      lexState = LexState.octalInteger;
      underscoreAllowed = true;
      return;
    }

    throw invalidChar(read());
  }

  function octalInteger() {
    if (util.isOctalDigit(c)) {
      buffer += readChar();
      underscoreAllowed = true;
      return;
    }
    else if (c === UNDERSCORE) {
      read();
      if (underscoreAllowed) {
        underscoreAllowed = false;
        return;
      }
      else {
        throw invalidChar('_');
      }
    }
    else if (!underscoreAllowed) {
      throw invalidChar('_');
    }

    if (c === LOWER_n) {
      read();
      return newPrimitiveToken('bigint', big.toBigInt(signChar + buffer));
    }

    return newPrimitiveToken('number', sign * Number(buffer));
  }

  function string() {
    return newPrimitiveToken('string', readString());
  }

  function typeName() {
    if (util.isIdContinueChar(c)) {
      buffer += readChar();
      return;
    }

    const $ = /.*_(.+)/.exec(buffer);

    if ($) {
      buffer = $[1];

      if (util.isIdStartChar(buffer.charCodeAt(0))) {
        return newToken('typeName', $[1]);
      }
    }

    throw invalidExtendedType(buffer);
  }

  function lexStart() {
    switch (c) {
      case LEFT_BRACKET:
      case LEFT_BRACE:
        return newToken('punctuator', read());
      // Shouldn't reach here with c being undefined, no need to return eof token.
    }

    lexState = LexState.value;
  }

  function lexBeforePropertyName() {
    switch (c) {
      case DOLLAR:
      case UNDERSCORE:
        buffer = readChar();
        lexState = LexState.identifierName;
        return;

      case BACKSLASH:
        read();
        lexState = LexState.identifierNameStartEscape;
        return;

      case RIGHT_BRACE:
        return newToken('punctuator', read());

      case SINGLE_QUOTE:
      case QUOTE:
      case BACKTICK:
        read();
        quoteChar = c;
        lexState = LexState.string;
        return;
    }

    if (util.isIdStartChar(c)) {
      buffer += readChar();
      lexState = LexState.identifierName;
      return;
    }

    throw invalidChar(read());
  }

  function lexAfterPropertyName() {
    if (c === COLON) {
      return newToken('punctuator', read());
    }

    throw invalidChar(read());
  }

  function lexBeforePropertyValue() {
    lexState = LexState.value;
  }

  function lexAfterPropertyValue() {
    switch (c) {
      case COMMA:
      case RIGHT_BRACE:
        return newToken('punctuator', read());
    }

    throw invalidChar(read());
  }

  function lexBeforeArrayValue() {
    if (c === RIGHT_BRACKET) {
      return newToken('punctuator', read());
    }

    lexState = LexState.value;
  }

  function lexAfterArrayValue() {
    switch (c) {
      case COMMA:
      case RIGHT_BRACKET:
        return newToken('punctuator', read());
    }

    throw invalidChar(read());
  }

  function lexAfterTypeName() {
    if (c === LEFT_PARENTHESIS) {
      return newToken('punctuator', read());
    }

    throw invalidChar(read());
  }

  function lexTypeArgument() {
    if (c === RIGHT_PARENTHESIS) {
      return newToken('undefined');
    }

    lexState = LexState.value;
  }

  function lexAfterTypeArgument() {
    if (c === RIGHT_PARENTHESIS) {
      return newToken('punctuator', read());
    }

    throw invalidChar(read());
  }

  function lexEnd() {
    // Shouldn't reach here with c being undefined, no need to return eof token.
    throw invalidChar(read());
  }

  function internalize(holder, name, reviver) {
    let value = holder[name];

    if (value && typeof value === 'object' && !isBigNumber(value) && !(value instanceof ValueSourceWrapper)) {
      // noinspection JSUnresolvedReference
      const keys = Object.keys(value).reverse();

      for (const key of keys) {
        const original = unwrap(value[key]);
        const replacement = internalize(value, key, reviver);

        if ((replacement === undefined && original !== undefined) || replacement === util.DELETE) {
          if (!Array.isArray(value) || key < value.length - 1) {
            delete value[key];
          }
        }
        else {
          setObjectProperty(value, key, replacement === util.UNDEFINED ? undefined : replacement);
        }
      }
    }

    let extra = holder;

    if (value instanceof ValueSourceWrapper) {
      extra = {
        holder,
        source: value.source
      };
      value = value.value;
    }

    return reviver.call(holder, name, value, extra, extra === holder);
  }

  function peek() {
    if (source[pos]) {
      return source.codePointAt(pos);
    }
  }

  function read() {
    const c = peek();

    if (c === LF) {
      line++;
      column = 0;
    }
    else if (c) {
      column += getCodePointLength(c);
    }
    else {
      column++;
    }

    if (c) {
      pos += getCodePointLength(c);
    }

    return c;
  }

  function readChar() {
    return toChar(read());
  }

  function newToken(type, value) {
    lastPos = pos;

    return { type, value, line, column };
  }

  function newPrimitiveToken(type, value) {
    const savedLastPos = lastPos;
    const token = newToken(type, value);

    if (reviver?.length > 2 && parseState !== ParseState.beforePropertyName) {
      token.offset = savedLastPos;
      token.source = source.slice(savedLastPos, pos).trim();
      token.value = new ValueSourceWrapper(value, token.source);
    }

    return token;
  }

  function literal(s) {
    for (const c of s) {
      const p = peek();

      if (p !== c.codePointAt(0)) {
        throw invalidChar(read());
      }

      read();
    }
  }

  function escape() {
    const c = peek();
    switch (c) {
      case LOWER_b:
        read();
        return '\b';

      case LOWER_f:
        read();
        return '\f';

      case LOWER_n:
        read();
        return '\n';

      case LOWER_r:
        read();
        return '\r';

      case LOWER_t:
        read();
        return '\t';

      case LOWER_v:
        read();
        return '\v';

      case ZERO:
        read();
        if (util.isDigit(peek())) {
          throw invalidChar(read());
        }

        return '\0';

      case LOWER_x:
        read();
        return hexEscape();

      case LOWER_u:
        read();
        return toChar(unicodeEscape());

      case LF:
      case LINE_SEPARATOR:
      case PARAGRAPH_SEPARATOR:
        read();
        return '';

      case CR:
        read();
        if (peek() === LF) {
          read();
        }

        return '';

      case ONE:
      case TWO:
      case THREE:
      case FOUR:
      case FIVE:
      case SIX:
      case SEVEN:
      case EIGHT:
      case NINE:
        throw invalidChar(read());

      case undefined:
        throw invalidChar(read());
    }

    return readChar();
  }

  function hexEscape() {
    let buffer = '';
    let c = peek();

    if (!util.isHexDigit(c)) {
      throw invalidChar(read());
    }

    buffer += readChar();

    c = peek();
    if (!util.isHexDigit(c)) {
      throw invalidChar(read());
    }

    buffer += readChar();

    return toChar(parseInt(buffer, 16));
  }

  function unicodeEscape() {
    let buffer = '';
    let count = 4;

    while (count-- > 0) {
      const c = peek();
      if (!util.isHexDigit(c)) {
        throw invalidChar(read());
      }

      buffer += readChar();
    }

    return parseInt(buffer, 16);
  }

  function push() {
    const parent = stack[stack.length - 1];
    let arrayParent = Array.isArray(parent);
    let value;
    let primitive = false;
    let extendedType = false;

    switch (token.type) {
      case 'punctuator':
        switch (token.value) {
          case LEFT_BRACE:
            value = {};
            break;

          case LEFT_BRACKET:
            value = [];
            break;

          case COMMA:
            value = EMPTY;
            break;

          case HASH:
            value = new KeyedArrayValue();
            break;
        }

        break;

      case 'null':
      case 'undefined':
      case 'boolean':
      case 'number':
      case 'bigint':
      case 'bigdecimal':
      case 'decimal':
      case 'string':
        primitive = true;
        value = token.value;
        break;

      case 'typeName':
        value = new ExtendedType(token.value, parent);
        extendedType = true;

    // Shouldn't be able to reach here with other tokens.
    }

    if (root === undefined) {
      root = value;

      if (extendedType) {
        value.atRoot = true;
      }
    }
    else {
      if (parent instanceof ExtendedType) {
        parent.arg = value;
      }
      else if (parent instanceof KeyedArrayValue) {
        --parent.parent.length;
        parent.parent[parent.key] = value;
        stack.pop();
        arrayParent = true;
        value = null;
      }
      else if (arrayParent) {
        if (value === EMPTY) {
          ++parent.length;
          parseState = ParseState.beforeArrayValue;
          return;
        }
        else {
          if (extendedType) {
            value.key = parent.length;
          }

          parent.push(value);
        }
      }
      else {
        if (extendedType) {
          value.key = key;
        }

        setObjectProperty(parent, key, value);
      }
    }

    if (value !== null && !primitive && typeof value === 'object' && !big.isBigNumber(value)) {
      stack.push(value);

      if (extendedType) {
        parseState = ParseState.afterTypeName;
      }
      else if (value instanceof KeyedArrayValue) {
        if (!arrayParent) {
          throw invalidChar('#');
        }

        value.parent = parent;
        parseState = ParseState.beforePropertyName;
      }
      else if (Array.isArray(value)) {
        parseState = ParseState.beforeArrayValue;
      }
      else {
        parseState = ParseState.beforePropertyName;
      }
    }
    else {
      if (!parent) {
        parseState = ParseState.end;
      }
      else if (parent instanceof ExtendedType) {
        parseState = ParseState.afterTypeArgument;
      }
      else if (arrayParent) {
        parseState = ParseState.afterArrayValue;
      }
      else {
        parseState = ParseState.afterPropertyValue;
      }
    }
  }

  function pop() {
    let current = stack[stack.length - 1];

    if (current instanceof ExtendedType) {
      let revived;

      try {
        const arg = reviver ? internalize({ '': current.arg }, '', reviver) : current.arg;

        revived = optionsMgr.reviveTypeValue(current.name, arg);
      }
      catch (err) {
        throw syntaxError(err.message, true);
      }

      if (!revived) {
        revived = util.createTypeContainer(current.name, current.arg);
      }

      if (current.atRoot) {
        root = revived;
      }
      else {
        current.parent[current.key] = revived;
      }
    }
    else if (reviveTypedContainers) {
      Object.keys(current).forEach(key => {
        const value = current[key];

        if (util.isTypeContainer(value)) {
          try {
            current[key] = optionsMgr.reviveTypeValue(value);
          }
          catch (err) {
            throw syntaxError(err.message, true);
          }
        }
      });
    }

    stack.pop();

    current = stack[stack.length - 1];

    if (!current) {
      parseState = ParseState.end;
    }
    else if (current instanceof ExtendedType) {
      parseState = ParseState.afterTypeArgument;
    }
    else if (Array.isArray(current)) {
      parseState = ParseState.afterArrayValue;
    }
    else {
      parseState = ParseState.afterPropertyValue;
    }
  }

  function invalidChar(c) {
    if (c === undefined) {
      return syntaxError(`JSON-Z: invalid end of input at ${line}:${column}`);
    }

    return syntaxError(`JSON-Z: invalid character '${formatChar(c)}' at ${line}:${column}`);
  }

  function invalidEOF() {
    return syntaxError(`JSON-Z: invalid end of input at ${line}:${column}`);
  }

  function invalidIdentifier() {
    column -= 5;
    return syntaxError(`JSON-Z: invalid identifier character at ${line}:${column}`);
  }

  function invalidExponentForBigInt(value) {
    column -= value.length;
    return syntaxError(`JSON-Z: "${value}n" contains invalid exponent for BigInt at ${line}:${column}`);
  }

  function invalidExtendedType(name) {
    column -= name.length;
    return syntaxError(`JSON-Z: invalid extended type "${name}" at ${line}:${column}`);
  }

  function separatorChar(c) {
    console.warn(`JSON-Z: '${formatChar(c)}' in strings is not valid ECMAScript; consider escaping`);
  }

  function formatChar(c) {
    if (typeof c === 'number') {
      c = toChar(c);
    }

    const replacements = {
      "'": "\\'",
      '"': '\\"',
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

    if (replacements[c]) {
      return replacements[c];
    }

    if (c < ' ') {
      const hexString = c.charCodeAt(0).toString(16);
      return '\\x' + ('00' + hexString).substring(hexString.length);
    }

    return c;
  }

  function syntaxError(message, addJSONZ) {
    const err = new SyntaxError((addJSONZ ? 'JSON-Z: ' : '') + message);
    err.lineNumber = line;
    err.columnNumber = column;
    return err;
  }
};

module.exports = parse;
