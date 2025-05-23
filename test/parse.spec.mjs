/* eslint-disable dot-notation */
import { assert, expect } from 'chai';
import { Decimal } from 'proposal-decimal';
import { Decimal as BigDecimal } from 'decimal.js';
import DecimalLight from 'decimal.js-light';
import sinon from 'sinon';

const JSONZ = (await import('../lib/index.js')).default;
const big = (await import('../lib/bignumber-util.js')).default;
const util = (await import('../lib/util.js')).default;

const DecimalAlt = DecimalLight.clone().set({ precision: 34, minE: -6143, maxE: 6144 });

JSONZ.setDecimal(Decimal);
JSONZ.setBigDecimal(BigDecimal);
JSONZ.setParseOptions({
  reviveTypedContainers: true
});
JSONZ.setOptions(JSONZ.OptionSet.THE_WORKS);

function equalBigNumber(a, b) {
  if (a === b) {
    return true;
  }
  else if (!!a !== !!b || !a) {
    return false;
  }
  else if (typeof a.isNaN === 'function' && a.isNaN()) {
    return typeof b.isNaN === 'function' && b.isNaN();
  }
  else if (typeof a.equals === 'function') {
    return a.equals(b);
  }
  else if (typeof a.compare === 'function') {
    return a.compare(b) === 0;
  }
  else if (typeof a.comparedTo === 'function') {
    return a.comparedTo(b) === 0;
  }
  else {
    return undefined;
  }
}

describe('JSONZ', () => {
  it('objects', () => {
    expect(
      JSONZ.parse('{}')).to.deep.equal(
      {},
      'parses empty objects'
    );

    expect(
      JSONZ.parse('{"a":1}')).to.deep.equal(
      { a: 1 },
      'parses double-quoted string property names'
    );

    expect(
      JSONZ.parse("{'a':1}")).to.deep.equal(
      { a: 1 },
      'parses single-quoted string property names'
    );

    expect(
      JSONZ.parse('{`a`:1}')).to.deep.equal(
      { a: 1 },
      'parses backtick-quoted string property names'
    );

    expect(
      JSONZ.parse('{a:1}')).to.deep.equal(
      { a: 1 },
      'parses unquoted property names'
    );

    expect(
      JSONZ.parse('{$_:1,_$:2,a\u200C:3}')).to.deep.equal(
      // eslint-disable-next-line quote-props
      { $_: 1, _$: 2, 'a\u200C': 3 },
      'parses special character property names'
    );

    // noinspection NonAsciiCharacters
    expect(
      JSONZ.parse('{ùńîċõďë:9}')).to.deep.equal(
      // eslint-disable-next-line quote-props
      { 'ùńîċõďë': 9 },
      'parses unicode property names'
    );

    expect(
      JSONZ.parse('{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}')).to.deep.equal(
      { ab: 1, $_: 2, _$: 3 },
      'parses escaped property names'
    );

    expect(
      JSONZ.parse('{abc:1,def:2}')).to.deep.equal(
      { abc: 1, def: 2 },
      'parses multiple properties'
    );

    expect(
      JSONZ.parse('{a:{b:2}}')).to.deep.equal(
      { a: { b: 2 } },
      'parses nested objects'
    );
  });

  it('arrays', () => {
    expect(
      JSONZ.parse('[]')).to.deep.equal(
      [],
      'parses empty arrays'
    );

    expect(
      JSONZ.parse('[1]')).to.deep.equal(
      [1],
      'parses array values'
    );

    expect(
      JSONZ.parse('[1,2]')).to.deep.equal(
      [1, 2],
      'parses multiple array values'
    );

    expect(
      JSONZ.parse('[1,[2,3]]')).to.deep.equal(
      [1, [2, 3]],
      'parses nested arrays'
    );

    // noinspection JSConsecutiveCommasInArrayLiteral
    expect(
      JSONZ.parse('[1,,2]')).to.deep.equal(
      // eslint-disable-next-line no-sparse-arrays
      [1,, 2],
      'parses sparse array'
    );
  });

  it('nulls', () => {
    expect(
      JSONZ.parse('null')).to.equal(
      null,
      'parses nulls'
    );
  });

  it('undefined values', () => {
    expect(
      JSONZ.parse('undefined')).to.equal(
      undefined,
      'parses undefined'
    );
  });

  it('Booleans', () => {
    expect(
      JSONZ.parse('true')).to.equal(
      true,
      'parses true'
    );

    expect(
      JSONZ.parse('false')).to.equal(
      false,
      'parses false'
    );
  });

  it('numbers', () => {
    expect(
      JSONZ.parse('[0,0.,0e0]')).to.deep.equal(
      [0, 0, 0],
      'parses leading zeroes'
    );

    expect(
      JSONZ.parse('[1,23,456,7890,09,-08]')).to.deep.equal(
      [1, 23, 456, 7890, 9, -8],
      'parses integers'
    );

    expect(
      JSONZ.parse('[-1,+2,-.1,-0]')).to.deep.equal(
      [-1, +2, -0.1, -0],
      'parses signed numbers'
    );

    expect(
      JSONZ.parse('[.1,.23]')).to.deep.equal(
      [0.1, 0.23],
      'parses leading decimal points'
    );

    expect(
      JSONZ.parse('[1.0,1.23]')).to.deep.equal(
      [1, 1.23],
      'parses fractional numbers'
    );

    expect(
      JSONZ.parse('[123_456,.1_2,-3e2_2,0_6]')).to.deep.equal(
      [123456, 0.12, -3e22, 6],
      'parses numbers with underscore separators'
    );

    expect(
      JSONZ.parse('[1e0,1e1,1e01,1.e0,1.1e0,1e-1,1e+1]')).to.deep.equal(
      [1, 10, 10, 1, 1.1, 0.1, 10],
      'parses exponents'
    );

    expect(
      JSONZ.parse('[0x1,0x10,0xff,0xFF,0x1_1]')).to.deep.equal(
      [1, 16, 255, 255, 17],
      'parses hexadecimal numbers'
    );

    expect(
      JSONZ.parse('[0b1,0B10,0b1011,-0b110101,0b1_01]')).to.deep.equal(
      [1, 2, 11, -53, 5],
      'parses binary numbers'
    );

    expect(
      JSONZ.parse('[0o7,0o10,0O755,-0o123,0o2_3,010,-010]')).to.deep.equal(
      [7, 8, 493, -83, 19, 8, -8],
      'parses octal numbers'
    );

    expect(
      JSONZ.parse('[Infinity,-Infinity]')).to.deep.equal(
      [Infinity, -Infinity],
      'parses signed and unsigned Infinity'
    );

    // parses NaN
    expect(
      isNaN(JSONZ.parse('NaN'))).to.be.ok;

    // parses signed NaN
    expect(
      isNaN(JSONZ.parse('-NaN'))).to.be.ok;
  });

  function compareBigIntArrays(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (!equalBigNumber(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  it('bigints', () => {
    const testDigits = '-408151623426875309';

    // parses bigint
    expect(
      equalBigNumber(JSONZ.parse(testDigits + 'n'), big.toBigInt(testDigits))).to.be.ok;

    // parses signed bigint
    expect(
      equalBigNumber(JSONZ.parse('64n'), big.toBigInt('+0x40'))).to.be.ok;

    // parses bigints in hex, binary, and octal form
    expect(compareBigIntArrays(
      JSONZ.parse('[0x21n,-0xCAFEn,+0xCAFEn,0b11n,-0b1001n,0O17n,-0o123n]'),
      [big.toBigInt(33), big.toBigInt(-51966), big.toBigInt(51966), big.toBigInt(3),
        big.toBigInt(-9), big.toBigInt(15), big.toBigInt(-83)])).to.be.ok;

    // parses bigints in exponential form
    expect(compareBigIntArrays(
      JSONZ.parse('[123E3n,-6700e-1n,3.14E3n]'),
      [big.toBigInt(123000), big.toBigInt(-670), big.toBigInt(3140)])).to.be.ok;
  });

  it('bigdecimals', () => {
    const testValues = [
      '3.1415926535_8979323846_2643383279_5028841971_6939937510',
      '-3.14',
      '314',
      '-314',
      '3.14E02',
      '-3.14E02',
      '66.',
      '-66.'
    ];

    for (const testValue of testValues) {
      const bdTestValue = big.toBigDecimal(testValue.replace(/_/g, ''));
      const parsedValue = JSONZ.parse(testValue + 'm');

      // parses bigdecimal (or best approximation of bigdecimal)
      expect(
        equalBigNumber(bdTestValue, parsedValue)).to.be.ok;
    }

    expect(equalBigNumber(JSONZ.parse('NaNm'), BigDecimal(NaN))).to.be.ok; // parses NaNm
    expect(equalBigNumber(JSONZ.parse('NaN_m'), BigDecimal(NaN))).to.be.ok; // parses NaN_m
    expect(equalBigNumber(JSONZ.parse('+NaN_m'), BigDecimal(NaN))).to.be.ok; // parses +NaN_m
    expect(equalBigNumber(JSONZ.parse('Infinitym'), BigDecimal(Infinity))).to.be.ok; // parses Infinitym
    expect(equalBigNumber(JSONZ.parse('Infinity_m'), BigDecimal(Infinity))).to.be.ok; // parses Infinity_m
    expect(equalBigNumber(JSONZ.parse('-Infinitym'), BigDecimal(-Infinity))).to.be.ok; // parses -Infinitym
    expect(equalBigNumber(JSONZ.parse('-Infinity_m'), BigDecimal(-Infinity))).to.be.ok; // parses -Infinity_m

    JSONZ.setBigDecimal(null);
    expect(big.getBigDecimalType() === 'number').to.be.ok; // can disable big decimal support
    expect(typeof JSONZ.parse('4m') === 'number').to.be.ok; // can parse big decimal as primitive number
    JSONZ.setBigDecimal(BigDecimal);
  });

  it('pseudo decimal128', () => {
    const testValues = [
      '3.1415926535_8979323846_2643383279_5028841971_6939937510',
      '-3.14',
      '314',
      '-314',
      '3.14E02',
      '-3.14E02',
      '66.',
      '-66.'
    ];

    for (const testValue of testValues) {
      const fbdTestValue = big.toDecimal(testValue.replace(/_/g, ''));
      const parsedValue = JSONZ.parse(testValue + 'd');

      // parses decimal128 (or best approximation of decimal128)
      expect(
        equalBigNumber(fbdTestValue, parsedValue)).to.be.ok;
    }

    expect(equalBigNumber(JSONZ.parse('NaNd'), new Decimal(NaN))).to.be.ok; // parses NaNd
    expect(equalBigNumber(JSONZ.parse('NaN_d'), new Decimal(NaN))).to.be.ok; // parses NaN_d
    expect(equalBigNumber(JSONZ.parse('+NaN_d'), new Decimal(NaN))).to.be.ok; // parses +NaN_d
    expect(equalBigNumber(JSONZ.parse('Infinityd'), new Decimal(Infinity))).to.be.ok; // parses Infinityd
    expect(equalBigNumber(JSONZ.parse('Infinity_d'), new Decimal(Infinity))).to.be.ok; // parses Infinity_d
    expect(equalBigNumber(JSONZ.parse('-Infinityd'), new Decimal(-Infinity))).to.be.ok; // parses -Infinityd
    expect(equalBigNumber(JSONZ.parse('-Infinity_d'), new Decimal(-Infinity))).to.be.ok; // parses -Infinity_d

    JSONZ.setDecimal(null);
    expect(big.getDecimalType() === 'number').to.be.ok; // can disable fixed big decimal support
    expect(typeof JSONZ.parse('4d') === 'number').to.be.ok; // can parse fixed big decimal as primitive number
    JSONZ.setDecimal(Decimal);
  });

  it('decimal from two different classes', () => {
    JSONZ.setDecimal(DecimalAlt);
    expect(typeof JSONZ.parse('1.01m').toString(), '1.01').to.be.ok; // parses decimal
    expect(typeof JSONZ.parse('2.02d').toString(), '2.02').to.be.ok; // parses fixed decimal
    JSONZ.setDecimal(null);
    expect(typeof JSONZ.parse('3d').toString(), '3').to.be.ok; // parses fixed decimal as plain number
    JSONZ.setDecimal(Decimal);
  });

  it('extended types', () => {
    const dateStr = '2019-07-28T08:49:58.202Z';
    const date = new Date(dateStr);

    JSONZ.setParseOptions({ reviveTypedContainers: true });

    expect(
      JSONZ.parse(`_Date('${dateStr}')`).getTime()).to.equal(
      date.getTime(),
      'parses date as extended type at root'
    );

    expect(
      JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`).getTime()).to.equal(
      date.getTime(),
      'parses date as from type container at root'
    );

    // parses date without argument
    expect(
      isNaN(JSONZ.parse('_Date()', {}).getTime())).to.be.ok;

    expect(
      JSONZ.parse(`[1,2,_Date('${dateStr}'),4]`)[2].getTime()).to.equal(
      date.getTime(),
      'parses date as extended type in array'
    );

    expect(
      JSONZ.parse(`[1,2,{_$_:'Date',_$_value:'${dateStr}'},4]`)[2].getTime(),
      date.getTime(),
      'parses date from type container in array'
    );

    expect(
      JSONZ.parse(`{a:1,b:2,c:_Date('${dateStr}'),d:4}`)['c'].getTime(),
      date.getTime(),
      'parses date as extended type in object'
    );

    expect(
      JSONZ.parse(`{a:1,b:2,c:{_$_:'Date',_$_value:'${dateStr}'},d:4}`)['c'].getTime(),
      date.getTime(),
      'parses date from type container in object'
    );

    expect(
      JSONZ.parse(`_$y310_Date   // comment
      ( /* another comment */'${dateStr}'  )  `).getTime(),
      date.getTime(),
      'parses extended types with arbitrary prefixes, embedded whitespace, and comments'
    );

    expect(
      JSONZ.parse("_BigInt('-123')").toString()).to.equal(
      '-123',
      'parses bigint as extended type'
    );

    expect(
      JSONZ.parse("_BigDecimal('3.14')").toString()).to.equal(
      '3.14',
      'parses bigdecimal as extended type'
    );

    expect(
      JSONZ.parse("_Decimal('3.14')").toString()).to.equal(
      '3.14',
      'parses fixed decimal as extended type'
    );

    expect(
      Array.from(JSONZ.parse('_Set([1,2,3])'))).to.deep.equal(
      [1, 2, 3],
      'parses Set as extended type'
    );

    expect(
      Array.from(JSONZ.parse('_Map([[1,2]])'))).to.deep.equal(
      [[1, 2]],
      'parses Map as extended type'
    );

    expect(
      JSONZ.parse('_RegExp("/\\\\d+z/")').toString()).to.equal(
      '/\\d+z/',
      'parses RegExp without flags as extended type'
    );

    expect(
      JSONZ.parse('_RegExp("/\\\\d+z/gi")').toString()).to.equal(
      '/\\d+z/gi',
      'parses RegExp with flags as extended type'
    );

    expect(
      Array.from(JSONZ.parse('_Uint8Array("AAEC/f7/")'))).to.deep.equal(
      [0, 1, 2, 253, 254, 255],
      'parses Uint8Array as extended type'
    );

    expect(
      JSONZ.parse('_foo("bar")')).to.deep.equal(
      { _$_: 'foo', _$_value: 'bar' },
      'falls back on using a type container for unknown extended type'
    );

    // is strict about recognizing type containers
    expect(
      !util.isTypeContainer(5) && !util.isTypeContainer({ _$_: 'foo' }) &&
      !util.isTypeContainer({ _$_value: 'foo' }) && !util.isTypeContainer({ _$_: 'foo', _$_value: 'bar', baz: 0 })).to.be.ok;
  });

  it('strings', () => {
    expect(
      JSONZ.parse('"abc"')).to.equal(
      'abc',
      'parses double-quoted strings'
    );

    expect(
      JSONZ.parse("'abc'")).to.equal(
      'abc',
      'parses single-quoted strings'
    );

    expect(
      JSONZ.parse('`abc`')).to.equal(
      'abc',
      'parses backtick-quoted strings'
    );

    expect(
      // eslint-disable-next-line quotes
      JSONZ.parse(`['"',"'",'\`']`)).to.deep.equal(
      ['"', "'", '`'],
      'parses quotes in strings');

    expect(
      // eslint-disable-next-line quotes
      JSONZ.parse(`'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\"'`)).to.equal(
      `\b\f\n\r\t\v\0\x0f\u01FF\a'"`, // eslint-disable-line no-useless-escape,quotes
      'parses escaped characters'
    );
  });

  it('parses line and paragraph separators with a warning', () => {
    const mock = sinon.mock(console);
    mock
      .expects('warn')
      .twice()
      .calledWithMatch('not valid ECMAScript');

    assert.deepStrictEqual(
      JSONZ.parse("'\u2028\u2029'"),
      '\u2028\u2029'
    );

    mock.verify();
    mock.restore();
  });

  it('comments', () => {
    expect(
      JSONZ.parse('{//comment\n}')).to.deep.equal(
      {},
      'parses single-line comments'
    );

    expect(
      JSONZ.parse('{}//comment')).to.deep.equal(
      {},
      'parses single-line comments at end of input'
    );

    expect(
      JSONZ.parse('{/*comment\n** */}')).to.deep.equal(
      {},
      'parses multi-line comments'
    );
  });

  it('whitespace', () => {
    expect(
      JSONZ.parse('{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}')).to.deep.equal(
      {},
      'parses whitespace'
    );
  });
});

it('parse(text, reviver)', () => {
  expect(
    JSONZ.parse('{a:1,b:2,c:null}', (k, v) => (k === 'a') ? 'revived' : v)).to.deep.equal(
    { a: 'revived', b: 2, c: null },
    'modifies property values'
  );

  expect(
    JSONZ.parse('{a:{b:2}}', (k, v) => (k === 'b') ? 'revived' : v)).to.deep.equal(
    { a: { b: 'revived' } },
    'modifies nested object property values'
  );

  expect(
    JSONZ.parse('{a:1,b:2}', (k, v) => (k === 'a') ? JSONZ.DELETE : v)).to.deep.equal(
    { b: 2 },
    'deletes property values'
  );

  expect(
    JSONZ.parse('{a:1,b:2}', (k, v) => (k === 'a') ? undefined : v)).to.deep.equal(
    { b: 2 },
    'also deletes property values'
  );

  expect(
    JSONZ.parse('{a:1,b:2}', (k, v) => (k === 'a') ? JSONZ.UNDEFINED : v)).to.deep.equal(
    { a: undefined, b: 2 },
    'replaces property values with `undefined`'
  );

  expect(
    JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? 'revived' : v)).to.deep.equal(
    [0, 'revived', 2],
    'modifies array values'
  );

  expect(
    JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? JSONZ.UNDEFINED : v)).to.deep.equal(
    [0, undefined, 2],
    'modifies array values'
  );

  expect(
    JSONZ.parse('[0,[1,2,3]]', (k, v) => (k === '2') ? 'revived' : v)).to.deep.equal(
    [0, [1, 2, 'revived']],
    'modifies nested array values'
  );

  // noinspection JSConsecutiveCommasInArrayLiteral
  expect(
    JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? JSONZ.DELETE : v)).to.deep.equal(
    [0, , 2], // eslint-disable-line no-sparse-arrays
    'deletes array values'
  );

  expect(
    JSONZ.parse('33', () => JSONZ.DELETE)).to.equal(
    undefined,
    'returns undefined if top-level value is deleted'
  );

  expect(
    JSONZ.parse('1', (k, v) => (k === '') ? 'revived' : v)).to.equal(
    'revived',
    'modifies the root value'
  );

  expect(
    JSONZ.parse('{a:{b:2}}', function (k, v) { return (k === 'b' && this.b) ? 'revived' : v; })).to.deep.equal(
    { a: { b: 'revived' } },
    'sets `this` to the parent value'
  );

  expect(
    JSONZ.parse('{a:{b:"true"}}', function (k, v) { return (k === 'b') ? JSONZ.parse(v) : v; })).to.deep.equal(
    { a: { b: true } },
    'make sure parse is reëntrant'
  );
});

it('parse(text, reviver) special cases', () => {
  expect(
    JSONZ.stringify(JSONZ.parse('{a:12.34d}', (k, v) => typeof v === 'number' ? 88 : v))).to.equal(
    '{a:12.34d}',
    'should not modify Decimal values'
  );

  expect(
    JSONZ.stringify(JSONZ.parse('{a:56.78m}', (k, v) => typeof v === 'number' ? 88 : v))).to.equal(
    '{a:56.78m}',
    'should not modify BigDecimal values'
  );

  expect(
    JSONZ.stringify(JSONZ.parse('[11,+11.,13,"q",`q`]',
      (k, v, context, noContext) => {
        if (!noContext) {
          if (context.source === '+11.') {
            return 12;
          }
          else if (context.source === '`q`') {
            return 'r';
          }
        }

        return v;
      }))).to.equal(
    "[11,12,13,'q','r']",
    'should process context.source for primitive values'
  );
});

it('hidden array properties', () => {
  const array1 = JSONZ.parse("[1, 2, 3, #foo: 'bar']");
  const array2 = JSONZ.parse("[7, 8, 9, #baz: 'quux', 10]");
  const array3 = JSONZ.parse('[#start: 77]');

  expect(
    array1['foo']).to.equal(
    'bar',
    'hidden property correctly parsed'
  );

  expect(
    array1.length).to.equal(
    3,
    "hidden property doesn't effect array length"
  );

  // hidden property works in middle of array
  expect(
    array2.length === 4 && array2['baz'] === 'quux' && array2[3] === 10).to.be.ok;

  // hidden property works at beginning of array
  expect(
    array3.length === 0 && array3['start'] === 77).to.be.ok;
});

it('global parse options', () => {
  const dateStr = '2019-07-28T08:49:58.202Z';
  const date = new Date(dateStr);

  JSONZ.setParseOptions({ reviveTypedContainers: false });

  expect(
    JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`)).to.deep.equal(
    { _$_: 'Date', _$_value: dateStr },
    'revival of type containers is defeated'
  );

  JSONZ.setParseOptions(null);

  expect(
    JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`)).to.deep.equal(
    { _$_: 'Date', _$_value: dateStr },
    'setting null options has no effect'
  );

  expect(
    JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`, { reviveTypedContainers: true }).getTime()).to.equal(
    date.getTime(),
    'revival of type containers can be restored by per-call option'
  );

  JSONZ.setParseOptions({ reviver: (key, value) => value === 77 ? 66 : value });

  expect(
    JSONZ.parse('[1,2,77,4]')).to.deep.equal(
    [1, 2, 66, 4],
    'global reviver works'
  );

  JSONZ.resetParseOptions();

  expect(
    JSONZ.parse('[1,2,77,4]')).to.deep.equal(
    [1, 2, 77, 4],
    'global reviver can be cleared by reset'
  );
});
