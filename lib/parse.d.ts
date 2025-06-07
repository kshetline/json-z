import { JsonZParseOptions } from './options-manager';

export type ReviverContext = { source?: string, holder?: any, stack?: string[] };
export type JsonZReviver = (key: string, value: any, context?: ReviverContext) => any;
export function parse<T = any>(text: string, options?: JsonZParseOptions): T;
export function parse<T = any>(text: string, reviver?: JsonZReviver, options?: JsonZParseOptions): T;
