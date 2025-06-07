import { JsonZReviver } from './parse';

export const enum Quote {
  DOUBLE,
  SINGLE,
  PREFER_DOUBLE,
  PREFER_SINGLE
}

export const enum ExtendedTypeMode {
  OFF,
  AS_FUNCTIONS,
  AS_OBJECTS
}

export type JsonZAllowedKeys = (string | number)[];
export type ReplacerContext = { holder?: any, stack?: string[] };
export type JsonZReplacer = (key: string, value: any, context?: ReplacerContext) => any;

export const enum OptionSet {
  MAX_COMPATIBILITY,
  RELAXED,
  THE_WORKS
}

export interface JsonZOptions {
  extendedPrimitives?: boolean,
  extendedTypes?: ExtendedTypeMode,
  maxIndent?: number;
  oneLiners?: string | string[] | Set<string>;
  propertyFilter?: (string | number | String | Number)[];
  primitiveBigDecimal?: boolean;
  primitiveBigInt?: boolean;
  primitiveDecimal?: boolean;
  quote?: '"' | "'" | Quote;
  quoteAllKeys?: boolean;
  replacer?: JsonZReplacer | JsonZAllowedKeys;
  revealHiddenArrayProperties?: boolean;
  space?: string | number | String | Number;
  sparseArrays?: boolean;
  trailingComma?: boolean;
  typePrefix?: string;
}

export interface JsonZTypeHandler {
  name: string;
  test: (instance: any, options?: JsonZOptions) => boolean;
  creator: (value: any) => any;
  serializer: (instance: any, options?: JsonZOptions) => any;
}

export interface JsonZParseOptions {
  reviveTypedContainers?: boolean;
  reviver?: JsonZReviver;
}

export function addTypeHandler(handler: JsonZTypeHandler): void;
export function getOptions(): JsonZOptions;
export function getOptionSet(set: OptionSet): JsonZOptions;
export function getParseOptions(): JsonZParseOptions;
export function globalizeTypeHandlers(prefix?: string): void;
export function removeGlobalizedTypeHandlers(): void;
export function removeTypeHandler(typeName: string): void;
export function resetOptions(): void;
export function resetParseOptions(): void;
export function resetStandardTypeHandlers(): void;
export function restoreStandardTypeHandlers(): void;
export function reviveTypeValue(typeNameOrContainer: any, value: any): any;
export function serializeExtendedType(value: any, options: JsonZOptions, stringify: (...args) => any): string | undefined;
export function setOptions(options: JsonZOptions | OptionSet, extraOptions?: JsonZOptions): void;
export function setParseOptions(options: JsonZParseOptions): void;
