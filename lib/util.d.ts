export declare class LITERALLY_AS_CLASS {
  constructor(value)
}

export declare class ValueSourceWrapper {
  constructor (source: string, value: any)
}

export type TypeContainer = { _$_: string, _$_value: any };

export declare function createTypeContainer(type: string, value: any): TypeContainer;
export declare function isBinaryDigit(c?: number): boolean;
export declare function isDigit(c?: number): boolean;
export declare function isHexDigit(c?: number): boolean;
export declare function isIdContinueChar(c?: number | string): boolean;
export declare function isIdStartChar(c?: number | string): boolean;
export declare function isOctalDigit(c?: number): boolean;
export declare function isSpaceSeparator(c?: number): boolean;
export declare function isTypeContainer(obj: unknown): boolean;
export declare function LITERALLY_AS(text?: string): LITERALLY_AS_CLASS;
export declare function setObjectProperty(obj: any, key: string | number | symbol, value: any): void;
export declare function unwrap(obj: any): any;
export declare function getCodePointLength(c?: number): number;

export const DELETE: Symbol;
export const EXCISE: Symbol;
export const LITERALLY_AS: (value: string) => any;
export const UNDEFINED: Symbol;
