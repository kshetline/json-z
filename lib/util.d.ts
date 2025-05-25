export declare class LITERALLY_AS_CLASS {
  constructor(value)
}

export declare class ValueSourceWrapper {
  constructor (source: string, value: any)
}

export type TypeContainer = { _$_: string, _$_value: any };

export declare function createTypeContainer(type: string, value: any): TypeContainer
export declare function isBinaryDigit(c?: string): boolean
export declare function isDigit(c?: string): boolean
export declare function isHexDigit(c?: string): boolean
export declare function isIdContinueChar(c?: string): boolean
export declare function isIdStartChar(c?: string): boolean
export declare function isOctalDigit(c?: string): boolean
export declare function isSpaceSeparator(c?: string): boolean
export declare function isTypeContainer(obj: unknown): boolean
export declare function LITERALLY_AS(text?: string): LITERALLY_AS_CLASS
export declare function unwrap(obj: any): any

export const DELETE: Symbol;
export const LITERALLY_AS: (value: string) => any;
export const UNDEFINED: Symbol;
