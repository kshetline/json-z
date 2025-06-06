import { JsonZOptions, Quote } from './options-manager';

export function hasBigDecimal(): boolean;
export function hasDecimal(): boolean;
export function isBigDecimal(value: unknown): boolean;
export function isBigInt(value: unknown): boolean;
export function isBigNumber(value: unknown): boolean;
export function isDecimal(value: unknown): boolean;
export function isNumberOrBigNumber(value: unknown): boolean;
export function setBigDecimal(bigDoubleClass: any): void;
export function setDecimal(decimalClass: any): void;
export function stringify(value: any, options: JsonZOptions, preferredQuote: Quote, noSuffix: boolean)
export function toBigDecimal(s: string): any;
export function toBigInt(s: string): BigInt;
export function toDecimal(s: string): any;
