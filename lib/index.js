import parse from './parse';
import stringify from './stringify';
import big from './bignumber-util';
import util from './util';
import options from './options-manager';

export const JSONZ = {
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
