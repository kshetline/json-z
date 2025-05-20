import { assert } from 'chai';
import { createRequire } from 'module';

const JSONZ = (await import('../lib/index.js')).default;
const require = createRequire(import.meta.url);

JSONZ.setOptions(JSONZ.OptionSet.MAX_COMPATIBILITY);

describe('require(*.jsonz)', () => {
  it('parses a JSON-Z document', () => {
    require('../lib/register');
    assert.deepStrictEqual({ $: 100, a: 1, b: 2 }, require('./test.jsonz'));
  });

  it('throws on invalid JSON-Z', () => {
    require('../lib/register');
    assert.throws(() => { require('./invalid.jsonz'); }, SyntaxError);
  });
});
