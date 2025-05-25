import { JsonZParseOptions } from './options-manager';

export type JsonZReviver = (key: string, value: any, extra?: (any | { source: string }),
                            noContext?: boolean) => any;

export function parse<T = any>(text: string, options?: JsonZParseOptions): T;
export function parse<T = any>(text: string, reviver?: JsonZReviver, options?: JsonZParseOptions): T;
