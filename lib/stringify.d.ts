import { JsonZAllowedKeys, JsonZOptions, JsonZReplacer, OptionSet } from './options-manager';

export function stringify(value: any, replacer?: JsonZReplacer | JsonZAllowedKeys,
                          space?: string | number | String | Number): string;
export function stringify(value: any, options?: JsonZOptions | OptionSet,
                          space?: string | number | String | Number): string;
