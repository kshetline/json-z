/* eslint-disable quotes,dot-notation,no-new-wrappers */
// noinspection JSUnresolvedReference,JSPrimitiveTypeWrapperUsage

import { assert, expect } from 'chai';
import { Decimal } from 'proposal-decimal';
import { Decimal as BigDecimal } from 'decimal.js';
import DecimalLight from 'decimal.js-light';

const JSONZ = (await import('../lib/index.js')).default;
const big = (await import('../lib/bignumber-util.js')).default;
const optionsMgr = (await import('../lib/options-manager.js')).default;

const DecimalAlt = DecimalLight.clone().set({ precision: 34, minE: -6143, maxE: 6144 });
const BigDecimalAlt = DecimalLight.clone().set({ precision: 100, minE: -6143, maxE: 6144 });

JSONZ.setDecimal(Decimal);
JSONZ.setBigDecimal(BigDecimal);
JSONZ.setOptions({
  extendedPrimitives: true,
  extendedTypes: JSONZ.ExtendedTypeMode.AS_FUNCTIONS,
  primitiveBigDecimal: true,
  primitiveBigInt: true,
  primitiveDecimal: true,
  quote: JSONZ.Quote.PREFER_SINGLE,
  quoteAllKeys: false,
  sparseArrays: true
});

describe('stringify', () => {
  describe('objects', () => {
    it('stringifies empty objects', () => {
      assert.strictEqual(JSONZ.stringify({ }), '{}');
    });

    it('stringifies unquoted property names', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1 }), '{a:1}');
    });

    it('stringifies single quoted string property names', () => {
      assert.strictEqual(JSONZ.stringify({ 'a-b': 1 }), "{'a-b':1}");
    });

    it('stringifies double quoted string property names', () => {
      assert.strictEqual(JSONZ.stringify({ "a'": 1 }), `{"a'":1}`);
    });

    it('stringifies empty string property names', () => {
      assert.strictEqual(JSONZ.stringify({ '': 1 }), "{'':1}");
    });

    it('stringifies special character property names', () => {
      assert.strictEqual(JSONZ.stringify({ $_: 1, _$: 2, a\u200C: 3 }), '{$_:1,_$:2,a\u200C:3}');
    });

    it('stringifies unicode property names', () => {
      // noinspection NonAsciiCharacters
      assert.strictEqual(JSONZ.stringify({ 'ùńîċõďë': 9, 𠀋: 0 }), '{ùńîċõďë:9,𠀋:0}'); // eslint-disable-line quote-props
    });

    it('stringifies escaped property names', () => {
      assert.strictEqual(JSONZ.stringify({ '\\\b\f\n\r\t\v\0\x01': 1 }), "{'\\\\\\b\\f\\n\\r\\t\\v\\0\\u0001':1}");
    });

    it('stringifies escaped null character property names', () => {
      assert.strictEqual(JSONZ.stringify({ '\0\x001': 1 }), "{'\\0\\x001':1}");
    });

    it('stringifies multiple properties', () => {
      assert.strictEqual(JSONZ.stringify({ abc: 1, def: 2 }), '{abc:1,def:2}');
    });

    it('stringifies nested objects', () => {
      assert.strictEqual(JSONZ.stringify({ a: { b: 2 } }), '{a:{b:2}}');
    });

    it('stringifies undefined', () => {
      assert.strictEqual(JSONZ.stringify(undefined), 'undefined');
      assert.strictEqual(JSONZ.stringify([1, undefined, 3]), '[1,undefined,3]');
      assert.strictEqual(JSONZ.stringify({ a: 1, b: undefined, c: 2 }), '{a:1,b:undefined,c:2}');
    });
  });

  describe('arrays', () => {
    it('stringifies empty arrays', () => {
      assert.strictEqual(JSONZ.stringify([]), '[]');
    });

    it('stringifies array values', () => {
      assert.strictEqual(JSONZ.stringify([1]), '[1]');
    });

    it('stringifies multiple array values', () => {
      assert.strictEqual(JSONZ.stringify([1, 2]), '[1,2]');
    });

    it('stringifies nested arrays', () => {
      assert.strictEqual(JSONZ.stringify([1, [2, 3]]), '[1,[2,3]]');
    });

    it('stringifies sparse arrays', () => {
      // noinspection JSConsecutiveCommasInArrayLiteral
      assert.strictEqual(JSONZ.stringify([1,, 2]), '[1,,2]'); // eslint-disable-line no-sparse-arrays
    });

    it('stringifies sparse arrays with null for JSON compatibility', () => {
      // noinspection JSConsecutiveCommasInArrayLiteral
      assert.strictEqual(JSONZ.stringify([1,, 2], // eslint-disable-line no-sparse-arrays
        { extendedPrimitives: false, sparseArrays: false }), '[1,null,2]');
    });

    it('stringifies arrays with hidden negative, non-integer and non-numeric keys', () => {
      const a = [1, 2, 3];

      a[-1] = 'foo';
      a[4.5] = 'bar';
      a['six'] = 'baz';

      assert.strictEqual(JSONZ.stringify(a,
        { revealHiddenArrayProperties: true }), "[1,2,3,#'-1':'foo',#'4.5':'bar',#six:'baz']");

      a[4.5] = JSONZ.DELETE;

      assert.strictEqual(JSONZ.stringify(a,
        { revealHiddenArrayProperties: true, space: 1 }), "[1, 2, 3, #'-1': 'foo', #six: 'baz']");
    });
  });

  it('stringifies nulls', () => {
    assert.strictEqual(JSONZ.stringify(null), 'null');
  });

  it('returns undefined for functions', () => {
    assert.strictEqual(JSONZ.stringify(() => {}), undefined);
  });

  it('ignores function properties', () => {
    assert.strictEqual(JSONZ.stringify({ a() {} }), '{}');
  });

  it('returns null for functions in arrays', () => {
    assert.strictEqual(JSONZ.stringify([() => {}]), '[null]');
  });

  describe('Booleans', () => {
    it('stringifies true', () => {
      assert.strictEqual(JSONZ.stringify(true), 'true');
    });

    it('stringifies false', () => {
      assert.strictEqual(JSONZ.stringify(false), 'false');
    });

    it('stringifies true Boolean objects', () => {
      assert.strictEqual(JSONZ.stringify(Boolean(true)), 'true');
    });

    it('stringifies false Boolean objects', () => {
      assert.strictEqual(JSONZ.stringify(Boolean(false)), 'false');
    });
  });

  describe('numbers', () => {
    it('stringifies numbers', () => {
      assert.strictEqual(JSONZ.stringify(-1.2), '-1.2');
    });

    it('stringifies distinct negative zero', () => {
      assert.strictEqual(JSONZ.stringify(-0), '-0');
    });

    it('doesn\'t create double negative sign', () => {
      assert.strictEqual(JSONZ.stringify(-0.1), '-0.1');
    });

    it('stringifies non-finite numbers', () => {
      assert.strictEqual(JSONZ.stringify([Infinity, -Infinity, NaN]), '[Infinity,-Infinity,NaN]');
    });

    it('stringifies Number objects', () => {
      assert.strictEqual(JSONZ.stringify(new Number(-1.2)), '-1.2');
    });

    it('eliminates unnecessary exponential notation', () => {
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e-3')), '0.0012345678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('-1.2345678e-2')), '-0.012345678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e-1')), '0.12345678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('-1.2345678e+0')), '-1.2345678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+1')), '12.345678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('-1.2345678e+2')), '-123.45678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+3')), '1234.5678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+4')), '12345.678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+5')), '123456.78d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+6')), '1234567.8d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+7')), '12345678d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+8')), '123456780d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+9')), '1234567800d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.2345678e+10')), '12345678000d');
      assert.strictEqual(JSONZ.stringify(new Decimal('1.234567890123456789e+25')), '1.234567890123456789e+25d');
    });
  });

  describe('bigints', () => {
    it('stringifies bigints', () => {
      assert.strictEqual(JSONZ.stringify([big.toBigInt('4081516234268675309')]), '[4081516234268675309n]');
      assert.strictEqual(JSONZ.stringify(big.toBigInt('-4081516234268675309')), '-4081516234268675309n');
    });

    it('stringifies bigint values for standard JSON', () => {
      assert.strictEqual(JSONZ.stringify(
        big.toBigInt('4081516234268675309'),
        { primitiveBigInt: false, extendedTypes: JSONZ.ExtendedTypeMode.OFF, quote: JSONZ.Quote.PREFER_DOUBLE }),
      '"4081516234268675309"');
    });

    it('stringifies bigint values as function values', () => {
      assert.strictEqual(JSONZ.stringify(
        big.toBigInt('4081516234268675309'),
        { primitiveBigInt: false, extendedTypes: JSONZ.ExtendedTypeMode.AS_FUNCTIONS }),
      "_BigInt('4081516234268675309')");
    });

    it('stringifies bigint values as type containers', () => {
      assert.strictEqual(JSONZ.stringify(
        big.toBigInt('4081516234268675309'),
        { primitiveBigInt: false, extendedTypes: JSONZ.ExtendedTypeMode.AS_OBJECTS }),
      "{_$_:'BigInt',_$_value:'4081516234268675309'}");

      assert.strictEqual(JSONZ.stringify(
        big.toBigInt('4081516234268675309'),
        { primitiveBigInt: false, extendedTypes: JSONZ.ExtendedTypeMode.AS_OBJECTS, space: 2 }),
      "{_$_: 'BigInt', _$_value: '4081516234268675309'}");
    });
  });

  if (big.hasBigDecimal()) {
    describe('bigdecimals', () => {
      it('stringifies bigdecimals', () => {
        assert.strictEqual(JSONZ.stringify([big.toBigDecimal('3.141592653589793238462643383279')]), '[3.141592653589793238462643383279m]');
        assert.strictEqual(JSONZ.stringify(big.toBigDecimal('-4081516234268675309')), '-4081516234268675309m');
      });

      it('stringifies bigdecimal special values', () => {
        assert.strictEqual(JSONZ.stringify([big.toBigDecimal(1 / 0), big.toBigDecimal(-1 / 0), big.toBigDecimal(0 / 0)]),
          '[Infinity_m,-Infinity_m,NaN_m]');

        assert.strictEqual(JSONZ.stringify(
          big.toBigDecimal(1 / 0),
          { primitiveBigDecimal: false, extendedPrimitives: true, extendedTypes: JSONZ.ExtendedTypeMode.OFF, quote: JSONZ.Quote.PREFER_DOUBLE }),
        'Infinity');
      });

      it('stringifies distinct bigdecimal negative zero', () => {
        assert.strictEqual(JSONZ.stringify(big.toBigDecimal('-0')), '-0m');
      });

      it('stringifies bigdecimal values for standard JSON', () => {
        assert.strictEqual(JSONZ.stringify(
          [big.toBigDecimal(1 / 0), big.toBigDecimal(-1 / 0), big.toBigDecimal(0 / 0), big.toBigDecimal('3.14')],
          { primitiveBigDecimal: false, extendedPrimitives: false, extendedTypes: JSONZ.ExtendedTypeMode.OFF, quote: JSONZ.Quote.PREFER_DOUBLE }),
        '[null,null,null,"3.14"]');
      });

      it('stringifies bigdecimal values as function values', () => {
        assert.strictEqual(JSONZ.stringify(
          big.toBigDecimal('2.718281828459045'),
          { primitiveBigDecimal: false, extendedTypes: JSONZ.ExtendedTypeMode.AS_FUNCTIONS }),
        "_BigDecimal('2.718281828459045')");
      });

      it('stringifies fixed decimal values as function values', () => {
        assert.strictEqual(JSONZ.stringify(
          big.toDecimal('2.718281828459045'),
          { primitiveDecimal: false, extendedTypes: JSONZ.ExtendedTypeMode.AS_FUNCTIONS }),
        "_Decimal('2.718281828459045')");
      });

      it('stringifies bigdecimal values as type containers', () => {
        assert.strictEqual(JSONZ.stringify(
          big.toBigDecimal('2.718281828459045'),
          { primitiveBigDecimal: false, extendedTypes: JSONZ.ExtendedTypeMode.AS_OBJECTS }),
        "{_$_:'BigDecimal',_$_value:'2.718281828459045'}");
      });
    });
  }

  if (big.hasBigDecimal() && big.hasDecimal()) {
    it('decimal handling with different classes', () => {
      JSONZ.setDecimal(DecimalAlt);
      assert.strictEqual(JSONZ.stringify(new BigDecimal('1.01')), '1.01m', 'parses decimal');
      assert.strictEqual(JSONZ.stringify(new BigDecimal('-0')), '-0m', 'handles alt negative zero decimal');
      assert.strictEqual(JSONZ.stringify(DecimalAlt('2.02')), '2.02d', 'parses fixed decimal');
      JSONZ.setBigDecimal(BigDecimalAlt);
      assert.strictEqual(JSONZ.stringify(new BigDecimalAlt('1.01')), '1.01m', 'parses decimal');
      // decimal.js-light doesn't do negative zero
      assert.strictEqual(JSONZ.stringify(DecimalAlt('2.02')), '2.02d', 'parses fixed decimal');
      JSONZ.setDecimal(Decimal);
      JSONZ.setBigDecimal(BigDecimal);
      assert.strictEqual(JSONZ.stringify(new Decimal('-0')), '-0d', 'handles negative zero decimal');
    });
  }

  describe('extended types', () => {
    it('stringifies Date objects as extended types', () => {
      assert.strictEqual(JSONZ.stringify(new Date(Date.UTC(2019, 6, 28, 8, 49, 58, 202))),
        "_Date('2019-07-28T08:49:58.202Z')");
    });

    it('stringifies regexes objects as extended types', () => {
      assert.strictEqual(JSONZ.stringify(/\d+z/),
        "_RegExp('/\\\\d+z/')");

      assert.strictEqual(JSONZ.stringify(/\d+z/gi),
        "_RegExp('/\\\\d+z/gi')");
    });
  });

  describe('strings', () => {
    it('stringifies single quoted strings', () => {
      assert.strictEqual(JSONZ.stringify('abc'), "'abc'");
    });

    it('stringifies double quoted strings', () => {
      assert.strictEqual(JSONZ.stringify("ab😀c'"), `"ab😀c'"`);
    });

    it('stringifies escaped characters', () => {
      assert.strictEqual(JSONZ.stringify('\\\b\f\n\r\t\v\0\x0f'), "'\\\\\\b\\f\\n\\r\\t\\v\\0\\u000F'");
    });

    it('stringifies escaped null characters', () => {
      assert.strictEqual(JSONZ.stringify('\0\x001'), "'\\0\\x001'");
    });

    it('stringifies with backtick quoting', () => {
      assert.strictEqual(JSONZ.stringify(`'"$-{`), `\`'"$-{\``);
      assert.strictEqual(JSONZ.stringify(`'"$\{`), `\`'"$\\{\``);
    });

    it('stringifies escaped single quotes', () => {
      assert.strictEqual(JSONZ.stringify(`\`'"`), '\'`\\\'"\'');
    });

    it('stringifies escaped double quotes', () => {
      assert.strictEqual(JSONZ.stringify(`\`''"`), "\"`''\\\"\"");
    });

    it('stringifies escaped backticks', () => {
      assert.strictEqual(JSONZ.stringify(`\`''""`), `\`\\\`''""\``);
    });

    it('stringifies escaped line and paragraph separators', () => {
      assert.strictEqual(JSONZ.stringify('\u2028\u2029'), "'\\u2028\\u2029'");
    });

    it('stringifies String objects', () => {
      assert.strictEqual(JSONZ.stringify(new String('abc')), "'abc'");
    });
  });

  it('stringifies using built-in toJSON methods', () => {
    assert.strictEqual(JSONZ.stringify(new Date('2016-01-01T00:00:00.000Z'), { extendedTypes: JSONZ.ExtendedTypeMode.OFF }),
      "'2016-01-01T00:00:00.000Z'");
  });

  it('stringifies using user defined toJSON methods', () => {
    function C() { }
    Object.assign(C.prototype, { toJSON() { return { a: 1, b: 2 }; } });
    assert.strictEqual(JSONZ.stringify(new C(), { extendedTypes: JSONZ.ExtendedTypeMode.OFF }), '{a:1,b:2}');
  });

  it('stringifies using user defined toJSON(key) methods', () => {
    function C() {}
    Object.assign(C.prototype, { toJSON(key) { return (key === 'a') ? 1 : 2; } });
    assert.strictEqual(JSONZ.stringify({ a: new C(), b: new C() }), '{a:1,b:2}');
  });

  it('stringifies using user defined toJSON5 methods', () => {
    function C() { }
    Object.assign(C.prototype, { toJSON() { return { a: 1, b: 2 }; } });
    assert.strictEqual(JSONZ.stringify(new C(), { extendedTypes: JSONZ.ExtendedTypeMode.OFF }), '{a:1,b:2}');
  });

  it('stringifies using user defined toJSON5(key) methods', () => {
    function C() {}
    Object.assign(C.prototype, { toJSON5(key) { return (key === 'a') ? 1 : 2; } });
    assert.strictEqual(JSONZ.stringify({ a: new C(), b: new C() }), '{a:1,b:2}');
  });

  it('stringifies using toJSONZ methods', () => {
    function C() {}
    Object.assign(C.prototype, { toJSONZ() { return { a: 1, b: 2 }; } });
    assert.strictEqual(JSONZ.stringify(new C()), '{a:1,b:2}');
  });

  it('stringifies using toJSONZ(key) methods', () => {
    function C() {}
    Object.assign(C.prototype, { toJSONZ(key) { return (key === 'a') ? 1 : 2; } });
    assert.strictEqual(JSONZ.stringify({ a: new C(), b: new C() }), '{a:1,b:2}');
  });

  it('calls toJSONZ instead of toJSON if both are defined', () => {
    function C() {}
    Object.assign(C.prototype, {
      toJSON() { return { a: 1, b: 2 }; },
      toJSONZ() { return { a: 2, b: 2 }; }
    });
    assert.strictEqual(JSONZ.stringify(new C()), '{a:2,b:2}');
  });

  it('calls toJSONZ instead of toJSON5 if both are defined', () => {
    function C() {}
    Object.assign(C.prototype, {
      toJSON5() { return { a: 1, b: 2 }; },
      toJSONZ() { return { a: 2, b: 2 }; }
    });
    assert.strictEqual(JSONZ.stringify(new C()), '{a:2,b:2}');
  });

  it('calls toJSONZ instead of toJSON or toJSON5 if all are defined', () => {
    function C() {}
    Object.assign(C.prototype, {
      toJSON() { return { a: 1, b: 2 }; },
      toJSON5() { return { a: 1, b: 2 }; },
      toJSONZ() { return { a: 2, b: 3 }; }
    });
    assert.strictEqual(JSONZ.stringify(new C()), '{a:2,b:3}');
  });

  it('calls toJSON5 instead of toJSON if both are defined', () => {
    function C() {}
    Object.assign(C.prototype, {
      toJSON() { return { a: 1, b: 2 }; },
      toJSON5() { return { a: 2, b: 2 }; }
    });
    assert.strictEqual(JSONZ.stringify(new C()), '{a:2,b:2}');
  });

  it('throws on circular objects', () => {
    const a = {};
    a.a = a;
    assert.throws(() => { JSONZ.stringify(a); }, TypeError, 'Converting circular structure to JSON-Z');
  });

  it('throws on circular arrays', () => {
    const a = [];
    a[0] = a;
    assert.throws(() => { JSONZ.stringify(a); }, TypeError, 'Converting circular structure to JSON-Z');
  });

  describe('stringify(value, null, space)', () => {
    it('does not indent when no value is provided', () => {
      assert.strictEqual(JSONZ.stringify([1]), '[1]');
    });

    it('does not indent when 0 is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 0), '[1]');
    });

    it('does not indent when an empty string is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, ''), '[1]');
    });

    it('does not indent when a single space is provided', () => {
      assert.strictEqual(JSONZ.stringify([1, 2], null, ' '), '[1, 2]');
    });

    it('indents n spaces when a number > 1 is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 2), '[\n  1\n]');
    });

    it('does not indent more than 10 spaces when a number is provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 11), '[\n          1\n]');
    });

    it('indents with the string provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, '\t'), '[\n\t1\n]');
    });

    it('does not indent more than 10 characters of the string provided', () => {
      assert.strictEqual(JSONZ.stringify([1], null, '           '), '[\n          1\n]');
    });

    it('indents in arrays', () => {
      assert.strictEqual(JSONZ.stringify([1], null, 2), '[\n  1\n]');
    });

    it('indents with trailing comma in arrays', () => {
      assert.strictEqual(JSONZ.stringify([1], { trailingComma: true, space: 2 }), '[\n  1,\n]');
    });

    it('indents in nested arrays', () => {
      assert.strictEqual(JSONZ.stringify([1, [2], 3], null, 2), '[\n  1,\n  [\n    2\n  ],\n  3\n]');
    });

    it('indents in objects', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1 }, null, 2), '{\n  a: 1\n}');
    });

    it('indents with trailing comma in objects', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1 }, { trailingComma: true, space: 2 }), '{\n  a: 1,\n}');
    });

    it('indents in nested objects', () => {
      assert.strictEqual(JSONZ.stringify({ a: { b: 2 } }, null, 2), '{\n  a: {\n    b: 2\n  }\n}');
    });

    it("extended type value arguments don't get indented", () => {
      assert.strictEqual(JSONZ.stringify([0, new Set([1, 2])], null, 2), '[\n  0,\n  _Set([1, 2])\n]');
    });

    it('suppresses indentation of selected keys', () => {
      assert.strictEqual(JSONZ.stringify({ a: [1, 2], b: [3, 4], c: [5, 6] }, { oneLiners: 'b,c', space: 2 }),
        '{\n  a: [\n    1,\n    2\n  ],\n  b: [3, 4],\n  c: [5, 6]\n}');
      assert.strictEqual(JSONZ.stringify({ a: [1, 2], b: [3, 4], c: [5, 6] }, { oneLiners: ['b'], space: 2 }),
        '{\n  a: [\n    1,\n    2\n  ],\n  b: [3, 4],\n  c: [\n    5,\n    6\n  ]\n}');
      assert.strictEqual(JSONZ.stringify({ a: [1, 2], b: { x: 3, y: 4 }, c: [5, 6] }, { oneLiners: new Set(['b']), space: 2 }),
        '{\n  a: [\n    1,\n    2\n  ],\n  b: {x: 3, y: 4},\n  c: [\n    5,\n    6\n  ]\n}');
    });

    it('suppresses indentation greater than maxIndent', () => {
      assert.strictEqual(JSONZ.stringify({ a: [1, 2], b: [3, 4, [5, 6]], c: { d: 7, e: { f: 8 } } }, { maxIndent: 2, space: 2 }),
        '{\n  a: [\n    1,\n    2\n  ],\n  b: [\n    3,\n    4,\n    [5, 6]\n  ],\n  c: {\n    d: 7,\n    e: {f: 8}\n  }\n}');
    });

    it('accepts Number objects', () => {
      assert.strictEqual(JSONZ.stringify([1], null, new Number(2)), '[\n  1\n]');
    });

    it('accepts String objects', () => {
      assert.strictEqual(JSONZ.stringify([1], null, new String('\t')), '[\n\t1\n]');
    });
  });

  describe('stringify(value, replacer)', () => {
    it('filters keys when an array is provided', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1, b: 2, 3: 3 }, ['a', 3]), "{a:1,'3':3}");
    });

    it('only filters string and number keys when an array is provided', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1, b: 2, 3: 3, false: 4 }, ['a', 3, false]), "{a:1,'3':3}");
    });

    it('accepts String and Number objects when an array is provided', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1, b: 2, 3: 3 }, [new String('a'), new Number(3)]), "{a:1,'3':3}");
    });

    it('replaces values when a function is provided', () => {
      assert.strictEqual(
        JSONZ.stringify({ a: 1, b: 2 }, (key, value) => (key === 'a') ? 2 : value),
        '{a:2,b:2}'
      );
    });

    it('sets `this` to the parent value', () => {
      assert.strictEqual(
        JSONZ.stringify({ a: { b: 1 } }, function (k, v) { return (k === 'b' && this.b) ? 2 : v; }),
        '{a:{b:2}}');
    });

    it('deletes object values when a replacer returns DELETE or `undefined`', () => {
      assert.strictEqual(
        JSONZ.stringify({ a: 1, b: 2 }, (key, value) => (key === 'b') ? JSONZ.DELETE : value),
        '{a:1}'
      );

      assert.strictEqual(
        JSONZ.stringify({ a: 1, b: 2, c: undefined }, (key, value) => (key && key !== 'a') ? undefined : value),
        '{a:1,c:undefined}'
      );

      assert.strictEqual(
        JSONZ.stringify({ a: 1, b: 2, c: undefined }, (key, value) => (key && key !== 'a') ? JSONZ.DELETE : value),
        '{a:1}'
      );
    });

    it('can transform object values into undefined values with replacer', () => {
      assert.strictEqual(
        JSONZ.stringify({ a: 1, b: 2 }, (key, value) => (key === 'b') ? JSONZ.UNDEFINED : value),
        '{a:1,b:undefined}'
      );
    });

    it('creates empty array slots when a replacer returns DELETE', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 77, 3, undefined], (key, value) => (value === 77) ? JSONZ.DELETE : value),
        '[1,,3,undefined]'
      );
    });

    it('replaces array item with `undefined`', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 77, 3], (key, value) => (value === 77) ? JSONZ.UNDEFINED : value),
        '[1,undefined,3]'
      );
    });

    it('creates empty array slots when a replacer returns `undefined`, unless original value is `undefined`', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 77, 3, undefined], (key, value) => (key > 1) ? undefined : value),
        '[1,77,,undefined]'
      );

      assert.strictEqual(
        JSONZ.stringify([1, 77, 3, undefined], (key, value) => (key > 1) ? JSONZ.DELETE : value),
        '[1,77,,]'
      );
    });

    it('can shrink array by manipulating holder', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 77, 3, undefined], (key, value, context) => {
          if (key > 1) {
            --context.holder.length;
            return JSONZ.DELETE;
          }
          else {
            return value;
          }
        }),
        '[1,77]'
      );

      assert.strictEqual(
        JSONZ.stringify([1, 2, 3, 4, 5], (key, value, context) => {
          if (key === '2') {
            context.holder.splice(2, 1);
            return JSONZ.DELETE;
          }
          else {
            return value;
          }
        }),
        '[1,2,4,5]'
      );

      assert.strictEqual(
        JSONZ.stringify([1, 2, 3, 4, 5], (key, value) => key === '2' ? JSONZ.DELETE : value),
        '[1,2,,4,5]'
      );
    });

    it('can shrink array using JSONZ.EXCISE`', () => {
      assert.strictEqual(
        JSONZ.stringify([1, 2, 3, 4, 5], (key, value) => key === '2' ? JSONZ.EXCISE : value),
        '[1,2,4,5]'
      );
    });

    it('`JSONZ.EXCISE` works identically to `JSONZ.DELETE` when used on objects`', () => {
      assert.strictEqual(
        JSONZ.stringify({ a: 1, b: 2, c: 3 }, (k, v) => k === 'b' ? JSONZ.EXCISE : v),
        JSONZ.stringify({ a: 1, b: 2, c: 3 }, (k, v) => k === 'b' ? JSONZ.DELETE : v)
      );
    });

    it('is called after toJSON', () => {
      function C() {}
      Object.assign(C.prototype, { toJSON() { return { a: 1, b: 2 }; } });
      assert.strictEqual(
        JSONZ.stringify(new C(), (key, value) => (key === 'a') ? 2 : value),
        '{a:2,b:2}'
      );
    });

    it('does not affect space when calls are nested', () => {
      assert.strictEqual(
        JSONZ.stringify({ a: 1 }, (key, value) => {
          JSONZ.stringify({}, null, 4);
          return value;
        }, 2),
        '{\n  a: 1\n}'
      );
    });
  });

  describe('stringify(value, options)', () => {
    it('accepts replacer as an option', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1, b: 2, 3: 3 }, { replacer: ['a', 3] }), "{a:1,'3':3}");
    });

    it('accepts space as an option', () => {
      assert.strictEqual(JSONZ.stringify([1], { space: 2 }), '[\n  1\n]');
    });

    it('accepts trailingComma as an option', () => {
      assert.strictEqual(JSONZ.stringify([1], { trailingComma: true, space: 2 }), '[\n  1,\n]');
    });

    it('filters keys when propertyFilter option is provided', () => {
      assert.strictEqual(JSONZ.stringify({ a: 1, b: 2, 3: 3 }, { propertyFilter: ['a', 3] }), "{a:1,'3':3}");
      assert.strictEqual(JSONZ.stringify({ b: 2, 3: 3 }, { propertyFilter: ['a', 3] }), "{'3':3}");
      assert.strictEqual(JSONZ.stringify({ a: 1, b: 2, c: 3 }, { propertyFilter: [] }), "{a:1,b:2,c:3}");
    });
  });

  describe('stringify(value, {quote})', () => {
    it('uses double quotes if provided', () => {
      assert.strictEqual(JSONZ.stringify({ 'a"': '1"' }, { quote: '"' }), '{"a\\"":"1\\""}');
    });

    it('uses single quotes if provided', () => {
      assert.strictEqual(JSONZ.stringify({ "a'": "1'" }, { quote: "'" }), "{'a\\'':'1\\''}");
    });
  });

  describe('stringify(text, reviver) context.stack', () => {
    it('correct object stack', () =>
      JSONZ.stringify([0, 1, { a: 'foo' }, 3], (k, v, context) => {
        if (v === 'foo') {
          expect(context.stack).to.deep.equal(['2', 'a']);
        }

        return v;
      })
    );

    it('only values of `bar` should be changed', () =>
      expect(
        JSONZ.stringify({ foo: [1, 2, 3], bar: [1, 2, 3] }, (k, v, context) => context.stack.at(-2) === 'bar' ? -1 : v
        )).to.equal(
        '{foo:[1,2,3],bar:[-1,-1,-1]}',
        'only values of `bar` should be changed'
      )
    );
  });

  describe('global stringify options', () => {
    it('formats mostly like standard JSON using default options', () => {
      JSONZ.resetOptions();
      assert.strictEqual(JSONZ.stringify({ a: 1 }), '{"a":1}');
    });

    it('setting null global options has no effect', () => {
      JSONZ.setOptions(null);
      assert.strictEqual(JSONZ.stringify({ a: 1 }), '{"a":1}');
    });

    it('global options work', () => {
      JSONZ.setOptions({
        quote: JSONZ.Quote.PREFER_SINGLE,
        space: '  ',
        trailingComma: true
      });
      assert.strictEqual(JSONZ.stringify({ a: 1, b: [1, 2] }), "{\n  'a': 1,\n  'b': [\n    1,\n    2,\n  ],\n}");

      JSONZ.setOptions({ quote: JSONZ.Quote.PREFER_DOUBLE });
      assert.strictEqual(JSONZ.stringify({ a: 1, b: [1, 2] }), '{\n  "a": 1,\n  "b": [\n    1,\n    2,\n  ],\n}');
    });

    it('option sets work', () => {
      const bi = big.toBigInt(1);
      const bd = big.toBigDecimal(1);

      JSONZ.setOptions(JSONZ.OptionSet.MAX_COMPATIBILITY);
      assert.strictEqual(JSONZ.stringify({ a: 1, b: NaN, c: bi, d: bd }), '{"a":1,"b":null,"c":"1","d":"1"}');

      JSONZ.setOptions(JSONZ.OptionSet.RELAXED);
      assert.strictEqual(JSONZ.stringify({ a: 1, b: NaN, c: bi, d: bd }), "{a:1,b:NaN,c:1n,d:'1'}");

      JSONZ.setOptions(JSONZ.OptionSet.THE_WORKS);
      assert.strictEqual(JSONZ.stringify({ a: 1, b: NaN, c: bi, d: bd }), '{a:1,b:NaN,c:1n,d:1m}');

      JSONZ.setOptions(JSONZ.OptionSet.THE_WORKS, { space: 1 });
      assert.strictEqual(JSONZ.stringify({ a: 1, b: NaN, c: bi, d: bd }), '{a: 1, b: NaN, c: 1n, d: 1m}');
      assert.strictEqual(JSONZ.stringify({ a: 1, b: NaN, c: bi, d: bd }, JSONZ.OptionSet.MAX_COMPATIBILITY),
        '{"a":1,"b":null,"c":"1","d":"1"}');
      JSONZ.setOptions(-1); // Invalid option
      assert.strictEqual(JSONZ.stringify({ a: 1, b: NaN, c: bi, d: bd }), '{a: 1, b: NaN, c: 1n, d: 1m}');

      assert.ok(optionsMgr.getOptionSet(JSONZ.OptionSet.RELAXED));
      assert.deepStrictEqual(optionsMgr.getOptionSet(-1), {});
    });
  });

  describe('type handlers', () => {
    function Half(n) {
      this.value = n / 2;
    }

    function Double(n) {
      this.value = n * 2;
    }

    beforeEach(() => {
      JSONZ.setOptions({ space: 0 });

      JSONZ.addTypeHandler({
        name: 'half',
        test: obj => obj instanceof Half,
        creator: value => new Half(value),
        serializer: instance => (instance.value * 2)
      });

      JSONZ.addTypeHandler({
        name: 'double',
        test: obj => obj instanceof Double,
        creator: value => new Double(value),
        serializer: instance => (instance.value / 2)
      });
    });

    it('uses registered type handlers', () =>
      assert.strictEqual(
        JSONZ.stringify([new Half(6), new Double(7)]),
        '[_half(6),_double(7)]'
      )
    );

    it('appropriately handles removed type handlers', () => {
      JSONZ.removeTypeHandler('half');
      assert.strictEqual(
        JSONZ.stringify([new Half(6), new Double(7)]),
        '[{value:3},_double(7)]'
      );
    });

    const dateStr = '2019-07-28T08:49:58.202Z';
    const date = new Date(dateStr);

    it('stringifies Date in absence of default type handler', () => {
      JSONZ.removeTypeHandler('Date');
      JSONZ.removeTypeHandler('notThere');
      assert.strictEqual(JSONZ.stringify(date), "'2019-07-28T08:49:58.202Z'");
    });

    it('restores default type handlers, retaining added handlers', () => {
      JSONZ.restoreStandardTypeHandlers();
      assert.strictEqual(JSONZ.stringify([date, new Double(2)]), `[_Date('${dateStr}'),_double(2)]`);
    });

    it('resets type handlers, removing any added handlers', () => {
      JSONZ.resetStandardTypeHandlers();
      assert.strictEqual(JSONZ.stringify(new Date(NaN)), '_Date(NaN)');
      assert.strictEqual(JSONZ.stringify([date, new Double(2)]), `[_Date('${dateStr}'),{value:4}]`);
    });

    it('supports various built-in type handlers', () => {
      assert.strictEqual(JSONZ.stringify(new Set([4, 5])), '_Set([4,5])');
      assert.strictEqual(JSONZ.stringify(new Map([['foo', 4], ['bar', 5]]), null, 1), "_Map([['foo', 4], ['bar', 5]])");
      assert.strictEqual(JSONZ.stringify(new Uint8Array([0, 1, 2, 253, 254, 255])), "_Uint8Array('AAEC/f7/')");
      assert.strictEqual(JSONZ.stringify(JSONZ.parse('_Uint8Array("T25l")'), { extendedTypes: 0 }), '[79,110,101]');
    });

    it('adds and removes globalized type handlers', () => {
      assert.strictEqual(global._Date, undefined);
      JSONZ.globalizeTypeHandlers();
      assert.strictEqual(global._Date(dateStr).getTime(), date.getTime());
      JSONZ.removeGlobalizedTypeHandlers();
      assert.strictEqual(global._Date, undefined);
    });
  });

  it('replacer LITERALLY_AS', () => {
    assert.strictEqual(JSONZ.stringify({ hexValue: 0xDECAF }, (k, v) =>
      /hex/i.test(k) && typeof v === 'number' && isFinite(v) && !isNaN(v)
        ? JSONZ.LITERALLY_AS('0x' + v.toString(16).toUpperCase())
        : v
    ), '{hexValue:0xDECAF}');

    assert.strictEqual(JSONZ.stringify([0xDECAF], (k, v) =>
      typeof v === 'number' && isFinite(v) && !isNaN(v)
        ? JSONZ.LITERALLY_AS('0x' + v.toString(16).toUpperCase())
        : v
    ), '[0xDECAF]');

    assert.strictEqual(JSONZ.stringify(0xDECAF, (k, v) =>
      typeof v === 'number' && isFinite(v) && !isNaN(v)
        ? JSONZ.LITERALLY_AS('0x' + v.toString(16).toUpperCase())
        : v
    ), '0xDECAF');
  });
});
