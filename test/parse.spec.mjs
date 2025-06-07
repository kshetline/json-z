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

describe('parse', () => {
  describe('objects', () => {
    it('parses empty objects', () =>
      expect(
        JSONZ.parse('{}')).to.deep.equal(
        {}
      )
    );

    it('parses double-quoted string property names', () =>
      expect(
        JSONZ.parse('{"a":1}')).to.deep.equal(
        { a: 1 }
      )
    );

    it('parses single-quoted string property names', () =>
      expect(
        JSONZ.parse("{'a':1}")).to.deep.equal(
        { a: 1 }
      )
    );

    it('parses backtick-quoted string property names', () =>
      expect(
        JSONZ.parse('{`a`:1}')).to.deep.equal(
        { a: 1 }
      )
    );

    // noinspection NonAsciiCharacters
    it('parses unquoted property names', () =>
      expect(
        JSONZ.parse('{a४:1}')).to.deep.equal(
        { a४: 1 }
      )
    );

    it('parses special character property names', () =>
      expect(
        JSONZ.parse('{$_:1,_$:2,a\u200C:3}')).to.deep.equal(
        // eslint-disable-next-line quote-props
        { $_: 1, _$: 2, 'a\u200C': 3 }
      )
    );

    it('parses unicode property names', () =>
      // noinspection NonAsciiCharacters
      expect(
        JSONZ.parse('{ùńîċõďë:9}')).to.deep.equal(
        // eslint-disable-next-line quote-props
        { 'ùńîċõďë': 9 }
      )
    );

    it('parses escaped property names', () =>
      expect(
        JSONZ.parse('{\\u0061\\u0062:1,\\u0024\\u005F:2,\\u005F\\u0024:3}')).to.deep.equal(
        { ab: 1, $_: 2, _$: 3 }
      )
    );

    it('preserves __proto__ property names', () =>
      expect(
        // eslint-disable-next-line no-proto
        JSONZ.parse('{"__proto__":1}').__proto__).to.equal(
        1
      )
    );

    it('preserves __proto__ property names when reviver is used', () =>
      expect(
        // eslint-disable-next-line no-proto
        JSONZ.parse('{"__proto__":1}', (k, v) => v).__proto__).to.equal(
        1
      )
    );

    it('parses multiple properties', () =>
      expect(
        JSONZ.parse('{abc:1,def:2}')).to.deep.equal(
        { abc: 1, def: 2 }
      )
    );

    it('parses nested objects', () =>
      expect(
        JSONZ.parse('{a:{b:2}}')).to.deep.equal(
        { a: { b: 2 } }
      )
    );
  });

  describe('arrays', () => {
    it('parses empty arrays', () =>
      expect(
        JSONZ.parse('[]')).to.deep.equal(
        []
      )
    );

    it('parses array values', () =>
      expect(
        JSONZ.parse('[1]')).to.deep.equal(
        [1]
      )
    );

    it('parses multiple array values', () =>
      expect(
        JSONZ.parse('[1,2]')).to.deep.equal(
        [1, 2]
      )
    );

    it('parses nested arrays', () =>
      expect(
        JSONZ.parse('[1,[2,3]]')).to.deep.equal(
        [1, [2, 3]]
      )
    );

    it('parses sparse arrays', () =>
      // noinspection JSConsecutiveCommasInArrayLiteral
      expect(
        JSONZ.parse('[1,,2]')).to.deep.equal(
        // eslint-disable-next-line no-sparse-arrays
        [1,, 2]
      )
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

  describe('booleans', () => {
    it('parses true', () =>
      expect(
        JSONZ.parse('true')).to.equal(
        true
      )
    );

    it('parses false', () =>
      expect(
        JSONZ.parse('false')).to.equal(
        false
      )
    );
  });

  describe('numbers', () => {
    it('parses leading zeroes', () =>
      expect(
        JSONZ.parse('[0,0.,0e0,0E0]')).to.deep.equal(
        [0, 0, 0, 0]
      )
    );

    it('parses integers', () =>
      expect(
        JSONZ.parse('[1,23,456,7890,09,-08]')).to.deep.equal(
        [1, 23, 456, 7890, 9, -8]
      )
    );

    it('parses signed numbers', () =>
      expect(
        JSONZ.parse('[-1,+2,-.1,-0]')).to.deep.equal(
        [-1, +2, -0.1, -0]
      )
    );

    it('parses leading decimal points', () =>
      expect(
        JSONZ.parse('[.1,.23]')).to.deep.equal(
        [0.1, 0.23]
      )
    );

    it('parses fractional numbers', () =>
      expect(
        JSONZ.parse('[1.0,1.23]')).to.deep.equal(
        [1, 1.23]
      )
    );

    it('parses numbers with underscore separators', () =>
      expect(
        JSONZ.parse('[123_456,.1_2,-3e2_2,0_6]')).to.deep.equal(
        [123456, 0.12, -3e22, 6]
      )
    );

    it('parses exponents', () =>
      expect(
        JSONZ.parse('[1e0,1e1,1e01,1.e0,1.E0,1.1E0,1e-1,1E+1]')).to.deep.equal(
        [1, 10, 10, 1, 1, 1.1, 0.1, 10]
      )
    );

    it('parses hexadecimal numbers', () =>
      expect(
        JSONZ.parse('[0x1,0x10,0Xff,0xFF,0x1_1]')).to.deep.equal(
        [1, 16, 255, 255, 17]
      )
    );

    it('parses binary numbers', () =>
      expect(
        JSONZ.parse('[0b1,0B10,0b1011,-0b110101,0b1_01]')).to.deep.equal(
        [1, 2, 11, -53, 5]
      )
    );

    it('parses octal numbers', () =>
      expect(
        JSONZ.parse('[0o7,0o10,0O755,-0o123,0o2_3,010,-010]')).to.deep.equal(
        [7, 8, 493, -83, 19, 8, -8]
      )
    );

    it('parses signed and unsigned Infinity', () =>
      expect(
        JSONZ.parse('[Infinity,-Infinity]')).to.deep.equal(
        [Infinity, -Infinity]
      )
    );

    it('parses NaN', () => {
      expect(
        isNaN(JSONZ.parse('NaN'))).to.be.ok;

      // parses signed NaN
      expect(
        isNaN(JSONZ.parse('-NaN'))).to.be.ok;
    });

    it('parses 1', () => {
      expect(
        JSONZ.parse('1')).to.equal(
        1
      );
    });

    it('parses +1.23e100', () =>
      expect(
        JSONZ.parse('+1.23e100')).to.equal(
        1.23e100
      )
    );

    it('parses bare hexadecimal number', () => {
      expect(
        JSONZ.parse('0x1')).to.equal(
        0x1
      );

      expect(
        JSONZ.parse('-0x0123456789abcdefABCDEF')).to.equal(
        // eslint-disable-next-line no-loss-of-precision
        -0x0123456789abcdefABCDEF
      );
    });
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

  describe('bigints', () => {
    const testDigits = '-408151623426875309';

    it('parses bigint', () =>
      expect(
        equalBigNumber(JSONZ.parse(testDigits + 'n'), big.toBigInt(testDigits))).to.be.ok
    );

    it('parses signed bigint', () =>
      expect(
        equalBigNumber(JSONZ.parse('64n'), big.toBigInt('+0x40'))).to.be.ok
    );

    it('parses bigints in hex, binary, and octal form', () =>
      expect(compareBigIntArrays(
        JSONZ.parse('[0x21n,-0xCAFEn,+0xCAFEn,0b11n,-0b1001n,0O17n,-0o123n]'),
        [big.toBigInt(33), big.toBigInt(-51966), big.toBigInt(51966), big.toBigInt(3),
          big.toBigInt(-9), big.toBigInt(15), big.toBigInt(-83)])).to.be.ok
    );

    it('parses bigints in exponential form', () =>
      expect(compareBigIntArrays(
        JSONZ.parse('[123E3n,-6700e-1n,3.14E3n]'),
        [big.toBigInt(123000), big.toBigInt(-670), big.toBigInt(3140)])).to.be.ok
    );
  });

  describe('bigdecimals', () => {
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

    it('parses bigdecimal (or best approximation of bigdecimal', () => {
      for (const testValue of testValues) {
        const bdTestValue = big.toBigDecimal(testValue.replace(/_/g, ''));
        const parsedValue = JSONZ.parse(testValue + 'm');

        expect(equalBigNumber(bdTestValue, parsedValue)).to.be.ok;
      }
    });

    it('parses NaNm', () =>
      expect(equalBigNumber(JSONZ.parse('NaNm'), BigDecimal(NaN))).to.be.ok
    );

    it('parses NaN_m', () =>
      expect(equalBigNumber(JSONZ.parse('NaN_m'), BigDecimal(NaN))).to.be.ok
    );

    it('parses +NaN_m', () =>
      expect(equalBigNumber(JSONZ.parse('+NaN_m'), BigDecimal(NaN))).to.be.ok
    );

    it('parses Infinitym', () =>
      expect(equalBigNumber(JSONZ.parse('Infinitym'), BigDecimal(Infinity))).to.be.ok
    );

    it('parses Infinity_m', () =>
      expect(equalBigNumber(JSONZ.parse('Infinity_m'), BigDecimal(Infinity))).to.be.ok
    );

    it('parses -Infinitym', () =>
      expect(equalBigNumber(JSONZ.parse('-Infinitym'), BigDecimal(-Infinity))).to.be.ok
    );

    it('-Infinity_m', () =>
      expect(equalBigNumber(JSONZ.parse('-Infinity_m'), BigDecimal(-Infinity))).to.be.ok
    );

    it('can disable big decimal and parse big decimal as primitive number', () => {
      JSONZ.setBigDecimal(null);
      expect(big.hasBigDecimal()).to.be.false;
      expect(typeof JSONZ.parse('4m') === 'number').to.be.ok;
      JSONZ.setBigDecimal(BigDecimal);
    });
  });

  describe('pseudo decimal128', () => {
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

    it('parses decimal128 (or best approximation of decimal128)', () => {
      for (const testValue of testValues) {
        const fbdTestValue = big.toDecimal(testValue.replace(/_/g, ''));
        const parsedValue = JSONZ.parse(testValue + 'd');

        expect(
          equalBigNumber(fbdTestValue, parsedValue)).to.be.ok;
      }
    });

    it('parses NaNd', () =>
      expect(equalBigNumber(JSONZ.parse('NaNd'), new Decimal(NaN))).to.be.ok
    );

    it('parses NaN_d', () =>
      expect(equalBigNumber(JSONZ.parse('NaN_d'), new Decimal(NaN))).to.be.ok
    );

    it('parses +NaN_d', () =>
      expect(equalBigNumber(JSONZ.parse('+NaN_d'), new Decimal(NaN))).to.be.ok
    );

    it('parses Infinityd', () =>
      expect(equalBigNumber(JSONZ.parse('Infinityd'), new Decimal(Infinity))).to.be.ok
    );

    it('parses Infinity_d', () =>
      expect(equalBigNumber(JSONZ.parse('Infinity_d'), new Decimal(Infinity))).to.be.ok
    );

    it('parses -Infinityd', () =>
      expect(equalBigNumber(JSONZ.parse('-Infinityd'), new Decimal(-Infinity))).to.be.ok
    );

    it('parses -Infinity_d', () =>
      expect(equalBigNumber(JSONZ.parse('-Infinity_d'), new Decimal(-Infinity))).to.be.ok
    );

    it('can disable fixed big decimal and parse fixed big decimal as primitive number', () => {
      JSONZ.setDecimal(null);
      expect(big.hasDecimal()).to.be.false;
      expect(typeof JSONZ.parse('4d') === 'number').to.be.ok;
      JSONZ.setDecimal(Decimal);
    });
  });

  it('properly handles decimal from two different classes', () => {
    JSONZ.setDecimal(DecimalAlt);
    expect(typeof JSONZ.parse('1.01m').toString(), '1.01').to.be.ok; // parses decimal
    expect(typeof JSONZ.parse('2.02d').toString(), '2.02').to.be.ok; // parses fixed decimal
    JSONZ.setDecimal(null);
    expect(typeof JSONZ.parse('3d').toString(), '3').to.be.ok; // parses fixed decimal as plain number
    JSONZ.setDecimal(Decimal);
  });

  describe('extended types', () => {
    const dateStr = '2019-07-28T08:49:58.202Z';
    const date = new Date(dateStr);

    before(() =>
      JSONZ.setParseOptions({ reviveTypedContainers: true })
    );

    it('parses date as extended type at root', () =>
      expect(
        JSONZ.parse(`_Date('${dateStr}')`).getTime()).to.equal(
        date.getTime()
      )
    );

    it('parses date as from type container at root', () =>
      expect(
        JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`).getTime()).to.equal(
        date.getTime()
      )
    );

    it('parses date without argument', () =>
      expect(
        isNaN(JSONZ.parse('_Date()', {}).getTime())).to.be.ok
    );

    it('parses date as extended type in array', () =>
      expect(
        JSONZ.parse(`[1,2,_Date('${dateStr}'),4]`)[2].getTime()).to.equal(
        date.getTime()
      )
    );

    it('parses date from type container in array', () =>
      expect(
        JSONZ.parse(`[1,2,{_$_:'Date',_$_value:'${dateStr}'},4]`)[2].getTime(),
        date.getTime()
      )
    );

    it('parses date as extended type in object', () =>
      expect(
        JSONZ.parse(`{a:1,b:2,c:_Date('${dateStr}'),d:4}`)['c'].getTime(),
        date.getTime()
      )
    );

    it('parses date from type container in object', () =>
      expect(
        JSONZ.parse(`{a:1,b:2,c:{_$_:'Date',_$_value:'${dateStr}'},d:4}`)['c'].getTime(),
        date.getTime()
      )
    );

    it('parses extended types with arbitrary prefixes, embedded whitespace, and comments', () =>
      expect(
        JSONZ.parse(`_$y310_Date   // comment
        ( /* another comment */'${dateStr}'  )  `).getTime(),
        date.getTime()
      )
    );

    it('parses bigint as extended type', () =>
      expect(
        JSONZ.parse("_BigInt('-123')").toString()).to.equal(
        '-123'
      )
    );

    it('parses bigdecimal as extended type', () =>
      expect(
        JSONZ.parse("_BigDecimal('3.14')").toString()).to.equal(
        '3.14'
      )
    );

    it('parses fixed decimal as extended type', () =>
      expect(
        JSONZ.parse("_Decimal('3.14')").toString()).to.equal(
        '3.14'
      )
    );

    it('parses Set as extended type', () =>
      expect(
        Array.from(JSONZ.parse('_Set([1,2,3])'))).to.deep.equal(
        [1, 2, 3]
      )
    );

    it('parses Map as extended type', () =>
      expect(
        Array.from(JSONZ.parse('_Map([[1,2]])'))).to.deep.equal(
        [[1, 2]]
      )
    );

    it('parses RegExp without flags as extended type', () =>
      expect(
        JSONZ.parse('_RegExp("/\\\\d+z/")').toString()).to.equal(
        '/\\d+z/'
      )
    );

    it('parses RegExp with flags as extended type', () =>
      expect(
        JSONZ.parse('_RegExp("/\\\\d+z/gi")').toString()).to.equal(
        '/\\d+z/gi'
      )
    );

    it('parses Uint8Array as extended type', () =>
      expect(
        Array.from(JSONZ.parse('_Uint8Array("AAEC/f7/")'))).to.deep.equal(
        [0, 1, 2, 253, 254, 255]
      )
    );

    it('falls back on using a type container for unknown extended type', () =>
      expect(
        JSONZ.parse('_foo("bar")')).to.deep.equal(
        { _$_: 'foo', _$_value: 'bar' }
      )
    );

    it('is strict about recognizing type containers', () =>
      expect(
        !util.isTypeContainer(5) && !util.isTypeContainer({ _$_: 'foo' }) &&
        !util.isTypeContainer({ _$_value: 'foo' }) && !util.isTypeContainer({ _$_: 'foo', _$_value: 'bar', baz: 0 })).to.be.ok
    );
  });

  describe('strings', () => {
    it('parses double-quoted strings', () =>
      expect(
        JSONZ.parse('"ab😀c"')).to.equal(
        'ab😀c'
      )
    );

    it('parses single-quoted strings', () =>
      expect(
        JSONZ.parse("'abc'")).to.equal(
        'abc'
      )
    );

    it('parses backtick-quoted strings', () =>
      expect(
        JSONZ.parse('`abc`')).to.equal(
        'abc'
      )
    );

    it('parses quotes in strings', () =>
      expect(
        // eslint-disable-next-line quotes
        JSONZ.parse(`['"',"'",'\`']`)).to.deep.equal(
        ['"', "'", '`']
      )
    );

    it('parses escaped characters', () =>
      expect(
        // eslint-disable-next-line quotes
        JSONZ.parse(`'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\"'`)).to.equal(
        `\b\f\n\r\t\v\0\x0f\u01FF\a'"` // eslint-disable-line no-useless-escape,quotes
      )
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

  describe('comments', () => {
    it('parses single-line comments', () =>
      expect(
        JSONZ.parse('{//comment\n}')).to.deep.equal(
        {}
      )
    );

    it('parses single-line comments at end of input', () =>
      expect(
        JSONZ.parse('{}//comment')).to.deep.equal(
        {}
      )
    );

    it('parses multi-line comments', () =>
      expect(
        JSONZ.parse('{/*comment\n** */}')).to.deep.equal(
        {}
      )
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

describe('parse(text, reviver)', () => {
  it('modifies property values', () =>
    expect(
      JSONZ.parse('{a:1,b:2,c:null}', (k, v) => (k === 'a') ? 'revived' : v)).to.deep.equal(
      { a: 'revived', b: 2, c: null }
    )
  );

  it('modifies nested object property values', () =>
    expect(
      JSONZ.parse('{a:{b:2}}', (k, v) => (k === 'b') ? 'revived' : v)).to.deep.equal(
      { a: { b: 'revived' } }
    )
  );

  it('JSONZ.DELETE deletes property values', () =>
    expect(
      JSONZ.parse('{a:1,b:2,c:undefined}', (k, v) => (k && k !== 'b') ? JSONZ.DELETE : v)).to.deep.equal(
      { b: 2 }
    )
  );

  it('`undefined` deletes property values (but not already undefined values)', () =>
    expect(
      JSONZ.parse('{a:1,b:2,c:undefined}', (k, v) => (k && k !== 'b') ? undefined : v)).to.deep.equal(
      { b: 2, c: undefined }
    )
  );

  it('replaces property values with `undefined`', () =>
    expect(
      JSONZ.parse('{"a":1,`b`:2,c:_BigInt(3),d:_Map([[4,5]])}', (k, v) => (k === 'a') ? JSONZ.UNDEFINED : v)).to.deep.equal(
      { a: undefined, b: 2, c: 3n, d: new Map([[4, 5]]) }
    )
  );

  it('modifies array values', () =>
    expect(
      JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? 'revived' : v)).to.deep.equal(
      [0, 'revived', 2]
    )
  );

  it('replaces array values with `undefined` using `JSONZ.UNDEFINED`', () =>
    expect(
      JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? JSONZ.UNDEFINED : v)).to.deep.equal(
      [0, undefined, 2]
    )
  );

  it('modifies nested array values', () =>
    expect(
      JSONZ.parse('[0,[1,2,3]]', (k, v) => (k === '2') ? 'revived' : v)).to.deep.equal(
      [0, [1, 2, 'revived']]
    )
  );

  it('deletes array values using `JSONZ.DELETE`', () =>
    // noinspection JSConsecutiveCommasInArrayLiteral
    expect(
      JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? undefined : v)).to.deep.equal(
      [0, , 2] // eslint-disable-line no-sparse-arrays
    )
  );

  it('deletes array values', () =>
    // noinspection JSConsecutiveCommasInArrayLiteral
    expect(
      JSONZ.parse('[0,1,2]', (k, v) => (k === '1') ? JSONZ.DELETE : v)).to.deep.equal(
      [0, , 2] // eslint-disable-line no-sparse-arrays
    )
  );

  it('deletes array values and shrinks array', () =>
    expect(
      JSONZ.parse('[0,1,2]', (k, v, context) => {
        if (k === '1') {
          context.holder.splice(parseInt(k), 1);
          return JSONZ.DELETE;
        }
        else {
          return v;
        }
      })).to.deep.equal(
      [0, 2]
    )
  );

  it('deletes array values and shrinks array using `JSONZ.EXCISE`', () =>
    expect(
      JSONZ.parse('[0,1,2]', (k, v) => k === '1' ? JSONZ.EXCISE : v)).to.deep.equal(
      [0, 2]
    )
  );

  it('`JSONZ.DELETE` and `JSONZ.EXCISE` work properly together', () =>
    expect(
      JSONZ.parse('[1,1,2,3,5,5.5,8,5.5,13,221,21,221]', (k, v) => v === 5.5 ? JSONZ.DELETE : v === 221 ? JSONZ.EXCISE : v)).to.deep.equal(
      // eslint-disable-next-line no-sparse-arrays
      [1, 1, 2, 3, 5,, 8,, 13, 21]
    )
  );

  it('`JSONZ.EXCISE` works identically to `JSONZ.DELETE` when used on objects', () =>
    expect(
      JSONZ.parse('{a:1,b:2,c:3}', (k, v) => k === 'b' ? JSONZ.EXCISE : v)).to.deep.equal(
      JSONZ.parse('{a:1,b:2,c:3}', (k, v) => k === 'b' ? JSONZ.DELETE : v)
    )
  );

  it('returns undefined if top-level value is deleted', () =>
    expect(
      JSONZ.parse('33', () => JSONZ.DELETE)).to.equal(
      undefined
    )
  );

  it('modifies the root value', () =>
    expect(
      JSONZ.parse('1', (k, v) => (k === '') ? 'revived' : v)).to.equal(
      'revived'
    )
  );

  it('sets `this` to the parent value', () =>
    expect(
      JSONZ.parse('{a:{b:2}}', function (k, v) { return (k === 'b' && this.b) ? 'revived' : v; })).to.deep.equal(
      { a: { b: 'revived' } }
    )
  );

  it('make sure parse is reëntrant', () =>
    expect(
      JSONZ.parse('{a:{b:"true"}}', function (k, v) { return (k === 'b') ? JSONZ.parse(v) : v; })).to.deep.equal(
      { a: { b: true } }
    )
  );

  it('make sure content of primitive values is accessible', () =>
    expect(
      JSONZ.parse('{a:1234567890123456789001234567890,b:"x"}', function (k, v, context) {
        if (typeof v === 'number') {
          return BigInt(context.source);
        }
        else if (typeof v === 'string') {
          return context.source.replace(/"/g, '@');
        }
        return v;
      })).to.deep.equal(
      { a: 1234567890123456789001234567890n, b: '@x@' }
    )
  );
});

describe('parse(text, reviver) special cases', () => {
  it('`context.stack`', () =>
    JSONZ.parse('[0,1,{a:"foo"},3]', (k, v, context) => {
      if (v === 'foo') {
        expect(context.stack).to.deep.equal(['2', 'a']);
      }

      return v;
    })
  );

  it('`context.stack` - only values of `bar` should be changed', () =>
    expect(
      JSONZ.parse('{foo:[1,2,3],bar:[1,2,3]}', (k, v, context) => context.stack.at(-2) === 'bar' ? -1 : v
      )).to.deep.equal(
      { foo: [1, 2, 3], bar: [-1, -1, -1] }
    )
  );

  it('should convert type container to Date', () =>
    expect(
      JSONZ.stringify(JSONZ.parse('[{_$_:"Date",_$_value:"2025-06-01T00:00:00.000Z"}]', (k, v) => v))).to.equal(
      "[_Date('2025-06-01T00:00:00.000Z')]"
    )
  );

  it('should convert type container at root to Date', () =>
    expect(
      JSONZ.stringify(JSONZ.parse('{_$_:"Date",_$_value:"2025-06-01T00:00:00.000Z"}', (k, v) => v))).to.equal(
      "_Date('2025-06-01T00:00:00.000Z')"
    )
  );

  it('should not modify BigDecimal values', () =>
    expect(
      JSONZ.stringify(JSONZ.parse('{a:56.78m}', (k, v) => typeof v === 'number' ? 88 : v))).to.equal(
      '{a:56.78m}'
    )
  );

  it('no white space included in source', () =>
    expect(
      JSONZ.stringify(JSONZ.parse('[  4,5   ,   6  ,  7]', (k, v, context) => context.source || v))).to.equal(
      "['4','5','6','7']"
    )
  );

  it('should process `context.source` for primitive values', () =>
    expect(
      JSONZ.stringify(JSONZ.parse('[11,+11.,13,"q",`q`]',
        (k, v, context) => {
          if (context?.source) {
            if (context.source === '+11.') {
              return 12;
            }
            else if (context.source === '`q`') {
              return 'r';
            }
          }

          return v;
        }))).to.equal(
      "[11,12,13,'q','r']"
    )
  );
});

describe('hidden array properties', () => {
  const array1 = JSONZ.parse("[1, 2, 3, #foo: 'bar']");
  const array2 = JSONZ.parse("[7, 8, 9, #baz: 'quux', 10]");
  const array3 = JSONZ.parse('[#start: 77]');

  it('hidden property correctly parsed', () =>
    expect(
      array1['foo']).to.equal(
      'bar'
    )
  );

  it("hidden property doesn't effect array length", () =>
    expect(
      array1.length).to.equal(
      3
    )
  );

  it('hidden property works in middle of array', () =>
    expect(
      array2.length === 4 && array2['baz'] === 'quux' && array2[3] === 10).to.be.ok
  );

  it('hidden property works at beginning of array', () =>
    expect(
      array3.length === 0 && array3['start'] === 77).to.be.ok
  );
});

describe('global parse options', () => {
  const dateStr = '2019-07-28T08:49:58.202Z';
  const date = new Date(dateStr);

  before(() => {
    // Make sure typed container revival is working before these tests start
    expect(JSONZ.parse("{_$_:'Set',_$_value:[1,2]}")).to.deep.equal(new Set([1, 2]));
    JSONZ.setParseOptions({
      reviver: (key, value) => value === 77 ? 66 : value,
      reviveTypedContainers: false
    });
  });

  it('revival of type containers is defeated', () => {
    expect(
      JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`)).to.deep.equal(
      { _$_: 'Date', _$_value: dateStr }
    );
  });

  it('setting null options has no effect', () => {
    JSONZ.setParseOptions(null);
    expect(
      JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`)).to.deep.equal(
      { _$_: 'Date', _$_value: dateStr }
    );
  });

  it('revival of type containers can be restored by per-call option', () => {
    expect(
      JSONZ.parse(`{_$_:'Date',_$_value:'${dateStr}'}`, { reviveTypedContainers: true }).getTime()).to.equal(
      date.getTime());
  });

  it('global reviver works', () => {
    expect(
      JSONZ.parse('[1,2,77,4]')).to.deep.equal(
      [1, 2, 66, 4]
    );
  });

  after(() =>
    it('global reviver can be cleared by reset', () => {
      JSONZ.resetParseOptions();
      expect(
        JSONZ.parse('[1,2,77,4]')).to.deep.equal(
        [1, 2, 77, 4]
      );
    })
  );
});

describe('very long strings', () => {
  it('parse long string (1MB)', () => {
    const s = 'a'.repeat(1000 * 1000);
    assert.strictEqual(JSONZ.parse(`'${s}'`), s);
  });

  it('parse long escaped string (20KB)', () => {
    const s = '\\t'.repeat(10000);
    assert.strictEqual(JSONZ.parse(`'${s}'`), s.replace(/\\t/g, '\t'));
  });

  // Let's not run this slow test all the time.
  xit('parse long string (100MB)', function () {
    this.timeout(15000);
    const s = 'z'.repeat(100 * 1000 * 1000);
    assert.strictEqual(JSONZ.parse(`'${s}'`), s);
  });
});

describe('line ending agnosticism', () => {
  it('counts lines correctly', () => {
    try {
      JSONZ.parse('[1,\n2,\r3,\r\n4,\u20285,\u2029?]');
      expect(false).to.be.ok;
    }
    catch (err) {
      expect(err instanceof SyntaxError &&
        /^JSON-Z: invalid character/.test(err.message) &&
        err.lineNumber === 6 &&
        err.columnNumber === 1).to.be.ok;
    }
  });
});
