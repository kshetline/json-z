const parse = require('./parse');
const stringify = require('./stringify');
const big = require('./bignumber-util');
const util = require('./util');
const options = require('./options-manager');

const JSONZ = {
  parse,
  stringify,

  Quote: options.Quote,
  ExtendedTypeMode: options.ExtendedTypeMode,
  OptionSet: options.OptionSet,
  setOptions: options.setOptions,
  resetOptions: options.resetOptions,

  setParseOptions: options.setParseOptions,
  resetParseOptions: options.resetParseOptions,

  LITERALLY_AS: util.LITERALLY_AS,
  DELETE: util.DELETE,
  EXCISE: util.EXCISE,
  UNDEFINED: util.UNDEFINED,

  addTypeHandler: options.addTypeHandler,
  removeTypeHandler: options.removeTypeHandler,
  resetStandardTypeHandlers: options.resetStandardTypeHandlers,
  restoreStandardTypeHandlers: options.restoreStandardTypeHandlers,
  globalizeTypeHandlers: options.globalizeTypeHandlers,
  removeGlobalizedTypeHandlers: options.removeGlobalizedTypeHandlers,

  hasBigDecimal: big.hasBigDecimal,
  setBigDecimal: big.setBigDecimal,
  hasDecimal: big.hasDecimal,
  setDecimal: big.setDecimal
};

module.exports = JSONZ;
