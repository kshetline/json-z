import { expect } from 'chai';

const JSONZ = (await import('../lib/index.js')).default;

describe('JSONZ', () => {
  describe('#parse()', () => {
    describe('errors', () => {
      it('throws on empty documents', () => {
        try {
          JSONZ.parse('');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 1).to.be.ok;
        }
      });

      it('throws on documents with only comments', () => {
        try {
          JSONZ.parse('//a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on incomplete single line comments', () => {
        try {
          JSONZ.parse('/a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on unterminated multiline comments', () => {
        try {
          JSONZ.parse('/*');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on unterminated multiline comment closings', () => {
        try {
          JSONZ.parse('/**');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on invalid characters in values', () => {
        try {
          JSONZ.parse('a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 1).to.be.ok;
        }
      });

      it('throws on invalid characters in identifier start escapes', () => {
        try {
          JSONZ.parse('{\\a:1}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid identifier start characters', () => {
        try {
          JSONZ.parse('{\\u0021:1}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid identifier character/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on invalid characters in identifier continue escapes', () => {
        try {
          JSONZ.parse('{a\\a:1}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on invalid identifier continue characters', () => {
        try {
          JSONZ.parse('{a\\u0021:1}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid identifier character/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid characters following a sign', () => {
        try {
          JSONZ.parse('-a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on invalid characters following a leading decimal point', () => {
        try {
          JSONZ.parse('.a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on invalid characters following an exponent indicator', () => {
        try {
          JSONZ.parse('1ea');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid characters following an exponent sign', () => {
        try {
          JSONZ.parse('1e-a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'a'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on invalid characters following a hexadecimal indicator', () => {
        try {
          JSONZ.parse('0xg');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'g'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid characters following a binary indicator', () => {
        try {
          JSONZ.parse('0b2');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '2'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid characters following an octal indicator', () => {
        try {
          JSONZ.parse('0o?');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '?'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid use of underscore separators in numbers', () => {
        const badNumbers = [
          '_12', '1__2', '12_', '12_.3', '0._1', '._1', '.1_', '0.1__2', '12_E3', '1E_2', '1E2_', '1E2__3',
          '0x_12', '0x1__2', '0x12_',
          '0o_12', '0o1__2', '0o12_',
          '0b_11', '0b1__1', '0b11_',
          'NaN_', '-NaN_', 'Infinity_', '-Infinity_'
        ];

        for (const badNumber of badNumbers) {
          try {
            JSONZ.parse(badNumber);
            expect(false).to.be.ok;
          }
          catch (err) {
            expect(err instanceof SyntaxError &&
                   /^JSON-Z: invalid (character '_'|extended type)/.test(err.message)).to.be.ok;
          }
        }
      });

      it('throws on invalid exponent for bigint', () => {
        try {
          JSONZ.parse('1230e-2n');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: "1230e-2n" contains invalid exponent/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('123e-1n');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: "123e-1n" contains invalid exponent/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 1).to.be.ok;
        }
      });

      it('throws on invalid extended value types', () => {
        try {
          JSONZ.parse('_("bar")');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid extended type/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }
        try {
          JSONZ.parse('_7oo("bar")');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid extended type/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }
      });

      it('throws on invalid extended value syntax', () => {
        try {
          JSONZ.parse('_Date["bar")');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('_Date');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('_Date(');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('_Date("bar"{');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('_Date("bar"');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('_RegExp("foo")');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid regular expression/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('{_$_: "RegExp", _$_value: "foo"}', { reviveTypedContainers: true });
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid regular expression/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }

        try {
          JSONZ.parse('[{_$_: "RegExp", _$_value: "foo"}]', { reviveTypedContainers: true });
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid regular expression/.test(err.message) &&
                 err.lineNumber === 1).to.be.ok;
        }
      });

      it('throws on invalid new lines in strings', () => {
        try {
          JSONZ.parse('"\n"');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '\\n'/.test(err.message) &&
                 err.lineNumber === 2 &&
                 err.columnNumber === 0).to.be.ok;
        }
      });

      it('throws on unterminated strings', () => {
        try {
          JSONZ.parse('"');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on invalid identifier start characters in property names', () => {
        try {
          JSONZ.parse('{!:1}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '!'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on invalid characters following a property name', () => {
        try {
          JSONZ.parse('{a!1}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '!'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid characters following a property value', () => {
        try {
          JSONZ.parse('{a:1!}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '!'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 5).to.be.ok;
        }
      });

      it('throws on invalid characters following an array value', () => {
        try {
          JSONZ.parse('[1!]');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '!'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid characters in literals', () => {
        try {
          JSONZ.parse('tru!');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '!'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on unterminated escapes', () => {
        try {
          JSONZ.parse('"\\');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on invalid first digits in hexadecimal escapes', () => {
        try {
          JSONZ.parse('"\\xg"');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'g'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on invalid second digits in hexadecimal escapes', () => {
        try {
          JSONZ.parse('"\\x0g"');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'g'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 5).to.be.ok;
        }
      });

      it('throws on invalid unicode escapes', () => {
        try {
          JSONZ.parse('"\\u000g"');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character 'g'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 7).to.be.ok;
        }
      });

      it('throws on escaped digits other than 0', () => {
        for (let i = 1; i <= 9; i++) {
          try {
            JSONZ.parse(`'\\${i}'`);
            expect(false).to.be.ok;
          }
          catch (err) {
            expect(err instanceof SyntaxError &&
                   /^JSON-Z: invalid character '\d'/.test(err.message) &&
                   err.lineNumber === 1 &&
                   err.columnNumber === 3).to.be.ok;
          }
        }
      });

      it('throws on octal escapes', () => {
        try {
          JSONZ.parse("'\\01'");
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '1'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on unescaped ${ in backtick-quoted strings', () => {
        try {
          JSONZ.parse('"${"');
          JSONZ.parse("'${'");
          expect(true).to.be.ok;
          expect(JSONZ.parse("`Doesn't look like $\\{string} interpolation`"))
            // eslint-disable-next-line no-template-curly-in-string
            .to.eql("Doesn't look like ${string} interpolation");
          // eslint-disable-next-line no-template-curly-in-string
          JSONZ.parse('`Looks like ${string} interpolation`');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
            /^JSON-Z: \${ must be escaped/.test(err.message) &&
            err.lineNumber === 1 &&
            err.columnNumber === 13).to.be.ok;
        }
      });

      it('throws on multiple values', () => {
        try {
          JSONZ.parse('1 2');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '2'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws with control characters escaped in the message', () => {
        try {
          JSONZ.parse('\x01');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '\\x01'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 1).to.be.ok;
        }
      });

      it('throws on unclosed objects before property names', () => {
        try {
          JSONZ.parse('{');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on unclosed objects after property names', () => {
        try {
          JSONZ.parse('{a');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on unclosed objects before property values', () => {
        try {
          JSONZ.parse('{a:');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 4).to.be.ok;
        }
      });

      it('throws on unclosed objects after property values', () => {
        try {
          JSONZ.parse('{a:1');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 5).to.be.ok;
        }
      });

      it('throws on initial comma in object', () => {
        try {
          JSONZ.parse('{,a:1,b:2}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character ','/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on consecutive commas in object', () => {
        try {
          JSONZ.parse('{a:1,,b:2}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character ','/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 6).to.be.ok;
        }
      });

      it('throws on unclosed arrays before values', () => {
        try {
          JSONZ.parse('[');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 2).to.be.ok;
        }
      });

      it('throws on unclosed arrays after values', () => {
        try {
          JSONZ.parse('[1');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid end of input/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 3).to.be.ok;
        }
      });

      it('throws on trying to use array property syntax in non-array object', () => {
        try {
          JSONZ.parse('{foo: #"bar"}');
          expect(false).to.be.ok;
        }
        catch (err) {
          expect(err instanceof SyntaxError &&
                 /^JSON-Z: invalid character '#'/.test(err.message) &&
                 err.lineNumber === 1 &&
                 err.columnNumber === 7).to.be.ok;
        }
      });
    });
  });
});
