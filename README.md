# JSON-Z – JSON for Everyone

[![NPM Stats](https://nodei.co/npm/json-z.svg)](https://npmjs.org/package/json-z/)

[![npm](https://img.shields.io/npm/v/json-z.svg)](https://npmjs.org/package/json-z/)
[![Coverage Status](https://coveralls.io/repos/github/kshetline/json-z/badge.svg?branch=master)](https://coveralls.io/github/kshetline/json-z?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/json-z.svg)](https://npmjs.org/package/json-z/)
[![npm bundle size](https://img.shields.io/bundlephobia/min/json-z.svg)](https://npmjs.org/package/json-z/)
[![nggyu](https://json-z.org/nggyu.svg)](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

JSON-Z is a superset of [JSON] (and of [JSONC] and [JSON5] as well) which aims to alleviate some limitations of JSON by expanding its syntax (as do JSONC and JSON5), and then go a bit further.

JSON-Z is designed to increase flexibility when parsing while, by default, maintaining maximum compatibility with standard JSON when stringifying data (unless the user, through optional settings, eschews this compatibility).

JSON-Z output, like JSON and JSON5, is also valid JavaScript (with two *optional* exceptions).

Even when the additional grammar features of JSON-Z are not needed, this library's replacer functions, reviver functions, and formatting capabilities provide additional capabilities which can be useful when dealing JSON and JSON5.

This JavaScript library is the official reference implementation for JSON-Z parsing and serialization libraries.

<!-- Only the deprecated old "align" attribute will do the job for GitHub Markdown. -->
<!--suppress HtmlDeprecatedAttribute -->
<p align="center"><b>See the interactive JSON-Z demo at <a href="https://json-z.org/">json-z.org</a>.</b><br></p>

[Build Status]: https://travis-ci.com/kshetline/json-z

[Coverage Status]: https://coveralls.io/github/kshetline/json-z

[JSON]: https://tools.ietf.org/html/rfc7159

[JSONC]: https://github.com/komkom/jsonc

[JSON5]: https://json5.org/

> _JSON purportedly should be pronounced like the name “Jason”, although I can’t break the habit of thinking about it as_ JAY-sahn _instead._
>
>_I'm going to recommend that JSON-Z be pronounced_ jay-SANH-zee, _kind of like "Jumanji"._
>
> _Not that I expect anyone to go along with that._

## Summary of Features

The following features, which are not supported in standard JSON, have been added to JSON-Z. Items in **bold** are unique to JSON-Z.

### Objects

- Object keys may be unquoted ECMAScript 5.1 _[IdentifierName]_ s.
- Unquoted object keys may include character escapes.
- Character escapes with two hex digits (`\xXX`) are supported for parsing, as well as the standard four-digit `\uXXXX` form.
- Object keys may be single quoted or **backtick quoted** (using backticks is not however intended to invoke string interpolation).
- Object key/value pairs may have a single trailing comma.

### Arrays

- Array elements may have a single trailing comma.
- **Arrays may be sparse**, e.g. `[1, , 3, 4]`.
- **If arrays have string keys with associated values (not recommended!)**, e.g. `[1, 2, 3, #frequency: "Kenneth"]`, **such key/value pairs can be parsed and optionally stringified. This also applies to numeric keys which are negative or non-integer. (The** `#` **is not part of the key, it simply precedes any explicitly keyed value in an array.) Key/value pairs such as these are normally hidden, and do not affect the** `length` **property of an array.**

### Strings

- Strings may be single quoted or **backtick quoted** (using backticks is not however intended to invoke string interpolation<span>&#42;</span>).
- Strings may span multiple lines by escaping new line characters.
- Character escapes with two hex digits (`\xXX`) are supported for parsing, as well as the standard four-digit `\uXXXX` form.

<span>&#42;</span>The sequence `${` must be escaped as `$\{` to avoid being interpreted as the start of a template literal.

### Numbers

- Numbers may be hexadecimal, **octal**, or **binary**.
- Numbers may have a leading or trailing decimal point, **and may contain underscores used as separators**.
- Numbers may be [IEEE 754] positive infinity (`Infinity`), negative infinity (`-Infinity`), or `NaN`.
- Numbers may begin with an explicit plus sign.
- **Negative zero** (`-0`) **is parsed and stringified as distinct from positive 0**.
- **Numbers may be** `BigInt` **values by appending a lowercase** `n` **to the end of an integer value, e.g.** `-23888n`**, or** `9_223_372_036_854_775_807n`**.**<br><br>
`BigInt` values can be in decimal, hexadecimal, octal, or binary form. Exponential notation can also be used (e.g. `4.2E12n`) so long as the value, including its exponent, specifies an integer value.
- **Numbers may be arbitrary precision decimal values by appending a lowercase** `m`, **e.g.** `3.1415926535897932384626433832795028841971693993751m`**.** `NaN_m`**,** `Infinity_m`**, and** `-Infinity_m` **can also be used.** (Using a third-party extended-precision library is necessary to take full advantage of this feature.)
- **Numbers may be** [IEEE 754] **Decimal128 values by appending a lowercase** `d`, **e.g.** `2.718281828459045235360287471352662d`**.** `NaN_d`**,** `Infinity_d`**, and** `-Infinity_d` **can also be used.** (Using a third-party extended-precision library is necessary to take full advantage of this feature, with [proposal-decimal](https://www.npmjs.com/package/proposal-decimal) being recommended.)<br><br>_Note: Decimal math constants in JavaScript had been part of [a larger decimal math proposal](https://github.com/tc39/proposal-decimal) for future versions of JavaScript, but that particular feature from the proposal has been abandoned. JSON-Z support for such constants is now purely a convention of JSON-Z, with an `m` suffix for arbitrary precision decimal values, and `d` for fixed precision._

### Comments

- Single and multi-line comments are allowed.

### Whitespace

- Additional whitespace characters are allowed.

### Undefined

- **Handles** `undefined` **values**.

### Replacer functions (JSON-Z specific differences)

- When a replacer function returns `undefined` for the value of an item, for consistency with JSON replacer functions, that with cause the item to be deleted from the result. `JSONZ.DELETE` can also be used for this purpose, and *is the only way to delete an object or array item with a value that is originally `undefined`.*
- Since JSON-Z can handle explicit `undefined` values, a replacer function can return the special value `JSONZ.UNDEFINED` to replace an item’s value with `undefined`.
- Replacer functions can return the special value `JSONZ.DELETE` to indicate that a slot in an array be left empty, creating a sparse array.
- A global replacer function can be specified.
- For the benefit of anonymous (arrow) functions, which do not have their own `this` as `functions` do, replacer functions are passed the holder of a key/value pair as a third argument to the function.
- A replacer can return `JSONZ.LITERALLY_AS(`*string-value*`)` to specify [exactly how a given value will be stringified](#jsonzliterally_as).

### Reviver functions (JSON-Z specific differences)

- A global reviver function can be specified.
- For the benefit of anonymous (arrow) functions, which do not have their own `this`, reviver functions are passed the holder of a key/value pair as, or along with, the third argument to the function.

### Extended types (JSON-Z specific)

In standard JSON, all values are either:
 - Strings, numbers, `true`, `false`, or `null`
 - Objects or arrays composed of the above, as well as other objects and arrays.

JSON-Z optionally provides special handling for other data types, so that values such `Date` or `Set` objects can be specifically represented as such, parsed, and stringified distinctly without having to rely on reviver and replacer functions.

- Built-in support for `Date`, `Map`, `Set`, `RegExp`, and `Uint8Array` (using base64 representation). `Uint8ClampedArray` is also covered, treated as `Uint8Array`.
- There is also built-in support for `BigInt` and "Big Decimal" values as extended types, an alternative to “plain” numbers, with `n`, `m`, or `d` suffixes.
- User-defined extended type handlers can be specified, which can both add new data types or override the handling of built-in extended data types.

[IdentifierName]: https://www.ecma-international.org/ecma-262/5.1/#sec-7.6

[IEEE 754]: http://ieeexplore.ieee.org/servlet/opac?punumber=4610933

## Short Example

```
{
  // comments
  unquoted: 'and you can quote me on that',
  singleQuotes: 'I can use "double quotes" here',
  backtickQuotes: `I can use "double quotes"  and 'single quotes' here`,
  lineBreaks: "Look, Mom! \
No \\n's!",
  million: 1_000_000, // Underscore separators in numbers allowed
  hexadecimal: 0xdecaf,
  // Leading 0 indicates octal if no non-octal digits (8, 9) follow 
  octal: [0o7, 074],
  binary: 0b100101,
  leadingDecimalPoint: .8675309, andTrailing: 8675309.,
  negativeZero: -0,
  positiveSign: +1,
  notDefined: undefined,
  bigInt: -9223372036854775808n,
  decimal: 2.718281828459045235360287471352662d,
  bigDecimal: 3.1415926535897932384626433832795028841971693993751m,
  trailingComma: 'in objects', andIn: ['arrays',],
  sparseArray: [1, 2, , , 5],
  // Function-like extended types. This is revived as a JavaScript `Date` object
  date: _Date('2019-07-28T08:49:58.202Z'),
  // Type container extended types. This is optionally revived as a JavaScript `Date` object
  date2: {"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"},
  // A relatively compact way to send and receive binary data
  buffer: _Uint8Array('T25lLiBUd28uIEZpdmUuLi4gSSBtZWFuIHRocmVlIQ=='),
  "backwardsCompatible": "with JSON",
}
```

## Specification

For a detailed explication of JSON-Z grammar, please see the [formal grammar](https://json-z.org/assets/grammar.html) documentation.

## Installation

### Node.js
```sh
npm install json-z
```

```
const JSONZ = require('json-z')
```

Or, as TypeScript:

```typescript
import * as JSONZ from 'json-z';
```

### Browsers
```
<script src="https://unpkg.com/json-z/dist/index.min.js"></script>
```

This will create a global `JSONZ` variable.

## API

The JSON-Z API is compatible with the [JSON API]. Type definitions to support TypeScript are included.

[JSON API]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON

### JSONZ.parse

Parses a JSON-Z string, constructing the JavaScript value or object described by `text`. An optional reviver function can be provided to perform a transformation on the resulting object before it is returned.

_Note: One important change from JSON5 is that the `JSONZ.parse()` function is re-entrant, so it is safe to call `JSONZ.parse()` from within reviver functions and extended type handlers._

#### Syntax

    JSONZ.parse(text[, reviver][, options])

This works very much like [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse), but with the addition of an `options` parameter, which can be passed along with, or instead of, the `reviver` parameter.

#### Parameters

- `text`: The string to parse as JSON-Z.
- `reviver`: If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.
- `options`: An object with the following properties:
  - `reviveTypedContainers`: If `true` (the default is `false`), objects which take the form of an extended type container, e.g. `{"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"}`, can be revived as specific object classes, such as `Date`.
  - `reviver`: An alternate means of providing a reviver function when `options` is the second argument of `parse`.

A JSON-Z reviver function is a callback that works much like the not-quite-yet-standard `JSON.parse` reviver function from this proposal: https://github.com/tc39/proposal-json-parse-with-source, a proposal which has already been widely implemented.

The third argument passed to a JSON-Z reviver *might* be different from what a `JSON.parse` reviver receives, according to the above proposal. There is a forth argument that clarifies the difference.

> `reviver(key, value[, extra[, noContext]])`
> 
> - `key`: The object key (or array index) of the value being parsed. The `key` is an empty string if the `value` is the root value.
> - `value`: A value as originally parsed, which should be returned by the reviver as-is if the reviver is not modifying the original value.
> - `extra`: This is either a `context` object containing a `source` string, as described at the link above, or the holder of the value, i.e., the object or array, if any, which contains the given key/value pair.
> - `noContext`: if `true`, `extra` is the `holder` object or array which contains the current key/value pair. Otherwise, `value` is a primitive value, and `extra` functions like the (nearly) standard `context` object, containing a `source` string, but also containing a `holder` value as well.
> 
> Returns: Either the original `value`, `JSONZ.DELETE`, or a modified value (using `JSONZ.UNDEFINED` to change a value to `undefined`).

Please note that if you want to shrink the size of a containing array when using a reviver to delete an array element, you must both perform `holder.splice(parseInt(key), 1)` within the replacer and then return `JSONZ.DELETE` from the replacer function. Returning `JSONZ.DELETE` alone will simply result in a sparse array with an empty slot.

#### Return value

The object corresponding to the given JSON-Z text.

### JSONZ.stringify()

Converts a JavaScript value to a JSON-Z string, optionally replacing values if a replacer function is specified, or optionally including only the specified properties if a replacer array is specified.

This works very much like [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), with the addition of the `options` parameter, and that the `replacer` function is passed a third argument, `holder`, in addition to `key` and `value`, which lets the `replacer` know the array or object that contains the value being examined.

#### Syntax

    JSONZ.stringify(value[, replacer[, space]])
    JSONZ.stringify(value[, options])

#### Parameters

- `value`: The value to convert to a JSON-Z string.
- `replacer`: A function which alters the behavior of the stringification process, or an array of String and Number objects that serve as an allowlist for selecting/filtering the properties of the value object to be included in the JSON-Z string. If this value is null or not provided, all properties of the object are included in the resulting JSON-Z string.

  When using the standard `JSON.stringify()`, a replacer function is called with two arguments: `key` and `value`. JSON-Z adds a third argument, `holder`. This value is already available to standard replacer `function`s as `this`, but `this` won't be bound the holder when using an anonymous (arrow) function as a replacer. The JSON-Z third argument (which can be ignored if not needed) provides alternative access to the holder value.<br><br>
  > `replacer(key, value[, holder])`

  <br>Please note that if you want to shrink the size of a containing array when using a replacer to delete an array element, you must both perform `‑‑holder.length` within the replacer and then return `JSONZ.DELETE` from the replacer function. Returning `JSONZ.DELETE` alone will simply result in a sparse array with an empty slot.
  
- `space`: A string or number used to insert whitespace into the output JSON-Z string for readability purposes. If this is a number, it indicates the number of space characters to use as whitespace; this number is capped at 10. Values less than 1 indicate that no space should be used. If `space` is a string, that string (or the first 10 characters of the string if it's longer) is used as white space. A single space adds white space without adding indentation. If this parameter is not provided (or is null), no whitespace is added. If indenting white space is used, trailing commas can optionally appear in objects and arrays.
- `options`: This can either be an `OptionSet` value (see [below](#jsonzsetoptionsoptions-additionaloptions)), or an object with the following properties:
  - `extendedPrimitives`: If `true` (the default is `false`) this enables direct stringification of `Infinity`, `-Infinity`, `NaN`, and `undefined`. Otherwise, these values become `null`.
  - `extendedTypes`: If `JSONZ.ExtendedTypeMode.AS_FUNCTIONS` or `JSONZ.ExtendedTypeMode.AS_OBJECTS` (the default is `JSONZ.ExtendedTypeMode.OFF`), this enables special representation of additional data types, such as `_Date("2019-07-28T08:49:58.202Z")`, which can be parsed directly as a JavaScript `Date` object, or `{"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"}`, which can be automatically rendered as a `Date` object by a built-in replacer.
  - `primitiveBigDecimal`: 🧪 If `true` (the default is `false`) this enables direct stringification of arbitrary-precision big decimals using the '`m`' suffix. Otherwise, big decimals must be provided as quoted strings or extended types. _(Note: The '`m`' suffix can't be parsed as current valid JavaScript, but it is potentially a future valid standard notation.)_
  - `primitiveBigInt`: If `true` (the default is `false`) this enables direct stringification of big integers using the '`n`' suffix. Otherwise, big integers are provided as quoted strings or extended types.
  - `primitiveDecimal`: 🧪 If `true` (the default is `false`) this enables direct stringification of fixed-precision big decimals using the '`d`' suffix. Otherwise, big decimals must be provided as quoted strings or extended types. _(Note: The '`d`' suffix can't be parsed as current valid JavaScript, but it is potentially a future valid standard notation.)_
  - `quote`: A string representing the quote character to use when serializing strings (single quote `'` or double quote `"`), or one of the following values:
    - `JSONZ.Quote.DOUBLE`: Always quote with double quotes (this is the default).
    - `JSONZ.Quote.SINGLE`: Always quote with single quotes.
    - `JSONZ.Quote.PREFER_DOUBLE`: Quote with double quotes, but switch to single quotes or backticks to reduce the number of characters which have to be backslash escaped.
    - `JSONZ.Quote.PREFER_SINGLE`: Quote with single quotes, but switch to double quotes or backticks to reduce the number of characters which have to be backslash escaped.
  - `quoteAllKeys`: By default (a `true` value), object keys are quoted, just as in standard JSON. If set to `false` quotes are omitted unless syntactically necessary.
  - `replacer`: Same as the `replacer` parameter.
  - `revealHiddenArrayProperties`: 🧪 Consider this an experimental option. While normally arrays should only have data stored using non-negative integer indices, data _can_ be stored in arrays using string keys and other types of numeric keys. This option will reveal and stringify such additional key/value pairs if present, but this is at the expense of making the JSON-Z output something that must be parsed back using JSON-Z, and is no longer directly usable as valid JavaScript.
  - `space`: Same as the `space` parameter. The default is no spacing.
  - `sparseArrays`: If `true` (the default is `false`) empty slots in arrays are represented with consecutive commas, e.g. `[1,,3]`. This can't be parsed as valid standard JSON, so by default such an array will be stringified as `[1,null,3]`.
  - `trailingComma`: If `true` (the default is `false`), the final item in an indented object or array has a terminating comma.
  - `typePrefix`: Normally a single underscore (`_`), this is a prefix used for extended type notation. It can be any string of valid identifier characters staring and ending in an underscore. It is used to help create unique function names when extended type restoration is done using functions named in the global namespace.

#### Return value

A JSON-Z string representing the value.

#### Using obj.toJSON() and obj.toJSONZ()

For use with the standard `JSON.stringify()`, any object being stringified can have an optional `toJSON()` method. This way an object can explicitly tell `JSON.stringify()` how its value should be represented.

JSON-Z can also use an object's `toJSON()` method, but other factors might take priority as follows:

1. If an object has a `toJSONZ()` method, this takes the highest priority. The value returned by `toJSONZ()` can be further modified by any replacer function in effect. Note that when `toJSONZ()` is called, two arguments are passed to this function: `key` (an array index or object property name) and `holder` (the parent array or parent object (if any) of the object).
2. If an object can be converted by an extended type handler, that has the next priority. When `ExtendedTypeMode.AS_FUNCTIONS` is in effect, a conversion handled by an extended type handler is final. Replacer functions can, however, further act upon extended type conversions when `ExtendedTypeMode.AS_OBJECTS` is in effect.
3. `toJSON()` is the next possible value conversion, but only if `toJSONZ()` has not already taken priority.
4. Any active replacer function is then applied.
5. Finally, special handling for `BigInt` and "big decimal" numbers takes place.

### JSONZ.hasBigDecimal()

Returns true if JSON-Z is currently providing full arbitrary-precision big decimal support.

### JSONZ.hasDecimal()

Returns true if JSON-Z is currently providing full fixed-precision big decimal support.

### JSONZ.setBigDecimal()

Sets a function or class for handling arbitrary-precision decimal floating-point values.

#### Syntax

    JSONZ.setBigDecimal(bigDecimalClass)

#### Parameters

- `bigDecimalClass`: A function or class responsible for handling big decimal values. `bigDecimalClass(valueAsString | NaN | Infinity | -Infinity)`, e.g. `bigDecimalClass('14.7')` or `bigDecimalClass(NaN)`, either with or without a preceding `new`, must return a big decimal object that satisfies the test `bigDecimalValue instanceof bigDecimalClass`.

### JSONZ.setDecimal()

Sets a function or class for handling fixed-precision decimal floating-point values.

#### Syntax

    JSONZ.setDecimal(decimalClass)

#### Parameters

- `decimalClass`: A function or class responsible for handling big decimal values. `decimalClass(valueAsString | NaN | Infinity | -Infinity)`, e.g. `decimalClass('14.7')` or `decimalClass(NaN)`, either with or without a preceding `new`, must return a decimal object that satisfies the test `decimalValue instanceof decimalClass`.

#### Sample usage

```
npm install json-z
npm install decimal.js
npm install proposal-decimal
```

```
const JSONZ = require('json-z');
const Decimal = require('proposal-decimal');
const BigDecimal = require('decimal.js');

JSONZ.setDecimal(Decimal);
// Alternate approximate representation of decimal128
// JSONZ.setDecimal(BigDecimal.clone().set({precision: 34, minE: -6143, maxE: 6144}));
JSONZ.setBigDecimal(BigDecimal);
```

### JSONZ.setOptions(options[, additionalOptions])

Sets global options which will be used for all calls to `JSONZ.stringify()`. The specific options passed to `JSONZ.stringify()` itself override the global options on a per-option basis.

#### Parameters

- `options`: This can be an object just as described for [`JSONZ.stringify()`](#jsonzstringify), or it can be one of the following `OptionSet` constants:
  - `JSONZ.OptionSet.MAX_COMPATIBILITY`: These are the options that make the output of JSON-Z fully JSON-compliant.
  - `JSONZ.OptionSet.RELAXED`: These options produce output which is fully-valid (albeit cutting-edge) JavaScript, removing unnecessary quotes, favoring single quotes, permitting values like `undefined` and `NaN` and sparse arrays.
  - `JSONZ.OptionSet.THE_WORKS`: This set of options pulls out (nearly) all the stops, creating output which generally will have to be parsed back using JSON-Z, including function-style extended types and big decimal numbers. `revealHiddenArrayProperties` remains false, however, and must be expressly activated.
- `additionalOptions`: If `options` is an `OptionSet` value, `additionalOptions` can be used to make further options modifications.

### JSONZ.resetOptions()

This restores the default global stringification options for JSON-Z. It is equivalent to `JSONZ.setOptions(JSONZ.OptionSet.MAX_COMPATIBILITY)`.

### JSONZ.setParseOptions(options)

Sets global options which will be used for all calls to `JSONZ.parse()`. The specific options passed to `JSONZ.parse()` itself override the global options on a per-option basis.

#### Parameters

- `options`: An object with the following properties:
  - `reviveTypedContainers`: Same as described for [`JSONZ.parse()`](#jsonzparse).
  - `reviver`: A global reviver function.

### JSONZ.resetParseOptions()

Resets the global parsing options, i.e., no automatic type container revival, no global revival function.

### JSONZ.addTypeHandler(handler)

This adds a global extended type handler. These handlers allow JSON-Z to parse and stringify special data types beyond the arrays, simple objects, and primitives supported by standard JSON. Here, as an example, is the built-in handler for `Date` objects:

```javascript
const dateHandler = {
  name: 'Date',
  test: obj => obj instanceof Date,
  creator: date => new Date(date),
  serializer: date => (isNaN(date.getTime()) ? NaN : date.toISOString()),
};
```

When adding multiple type handlers, the most recently added handlers have priority over previous type handlers, which is important if it's possible for the `test` function to recognize objects or values also recognized by other handlers.

The `extendedTypes` option for `JSONZ.stringify()` lets you choose between two formats for extended types:

`JSONZ.ExtendedTypeMode.AS_FUNCTIONS` format:

     _Date('2019-07-28T08:49:58.202Z')

The disadvantage of this format is that it can't be parsed as standard JSON. The advantage is that it _is valid JavaScript_, and it works better as JSON-P. 

As long as `_Date` is a global function (see [`JSONZ.globalizeTypeHandlers`](#jsonzglobalizetypehandlersprefix)), the date object can be revived. To help with possible global namespace conflicts, the option `typePrefix` can be changed to something like `'_jsonz_'`, which will result in output like this:

     _jsonz_Date("2019-07-28T08:49:58.202Z")

`JSONZ.ExtendedTypeMode.AS_OBJECTS` format:

     {"_$_": "Date", "_$_value": "2019-07-28T08:49:58.202Z"}

This has the advantage of being valid standard JSON, and even without using JSON-Z on the receiving end, the right reviver function can convert this to a `Date`. The disadvantage is that it's harder to use this format with JSON-P, as there's no natural place to intercept the data and convert it.

`JSONZ.ExtendedTypeMode.OFF` disables both of the above options.

### JSONZ.globalizeTypeHandlers([prefix])

This function registers your type handlers (and the built-in type handlers) as global functions, which facilitates the process of handling JSON-Z output as JSON-P. The optional `prefix` argument (which needs to be either a single underscore (the default), or a valid JavaScript identifier that both begins and ends in an underscore) lets you control how these functions use the global namespace. If you change the default prefix, that same prefix needs to be used as an option by the call to `JSONZ.stringify()` which creates the output that you're consuming.

  Any previously globalized type handlers are first removed.

### JSONZ.removeGlobalizedTypeHandlers()

This function removes all previously globalized type handlers.

### JSONZ.removeTypeHandler(typeName)

This function removes the type handler for the given `typeName`.

### JSONZ.resetStandardTypeHandlers()

This removes all user-added type handlers, and restores all built-in type handlers.

### JSONZ.restoreStandardTypeHandlers()

This restores all built-in type handlers, leaving any user-added type handlers.

### JSONZ.DELETE

Return this value from a replacer function to delete an item from an object or to render a slot in an array as empty.

### JSONZ.UNDEFINED

Return this value from a replacer function (rather than returning `undefined` itself) to change a value to `undefined`.

### JSONZ.LITERALLY_AS()

Return `JSONZ.LITERALLY_AS(`*string-value*`)` from a replacer function to literally and explicitly specify how a particular value should be stringified. In this example:

```javascript
function showNumbersInHex(k, v) {
  return typeof v === 'number' && isFinite(v) && !isNaN(v)
         ? JSONZ.LITERALLY_AS((v < 0 ? '-' : '') +
             '0x' + Math.abs(v).toString(16).toUpperCase())
         : v;
}

JSONZ.stringify({ hexValue: 912559 }, showNumbersInHex)
```

...`stringify` with return `"{hexValue:0xDECAF}"` as a result.

### Node.js `require()` JSON-Z files

When using Node.js, you can `require()` JSON-Z files by adding the following
statement.

```javascript
require('json-z/lib/register')
```

Then you can load a JSON-Z file with a Node.js `require()` statement. For
example:

```javascript
const config = require('./config.jsonz')
```

## CLI

Since JSON is more widely used than JSON-Z, this package includes a CLI for
converting JSON-Z to JSON and for validating the syntax of JSON-Z documents.

### Installation

```sh
npm install --global json-z
```

### Usage

```sh
json-z [options] <file>
```

If `<file>` is not provided, then STDIN is used.

#### Options:

- `-s`, `--space`: The number of spaces to indent or `t` for tabs
- `-o`, `--out-file [file]`: Output to the specified file, otherwise STDOUT
- `-v`, `--validate`: Validate JSON-Z but do not output JSON
- `-V`, `--version`: Output the version number
- `-h`, `--help`: Output usage information

### Formal Grammar

Note: For simplicity's sake, the parsing of line and block comments is omitted from the grammar below.


### Development

```sh
git clone https://github.com/kshetline/json-z
cd json-z
npm install
```

When contributing code, please write relevant tests and run `npm test` and `npm
run lint` before submitting pull requests. Please use an editor that supports
[EditorConfig](http://editorconfig.org/).

### Issues

To report bugs or request features regarding the JavaScript implementation of
JSON-Z, please submit an issue to this repository.

## License

MIT. See [LICENSE.md](./LICENSE.md) for details.

## Credits

[Assem Kishore](https://github.com/aseemk) founded the [JSON5](https://json5.org/)
project, upon which JSON-Z is based.

[Michael Bolin](http://bolinfest.com/) independently arrived at and published
some of the same ideas that went into JSON5, with awesome explanations and detail. Recommended
reading: [Suggested Improvements to JSON](http://bolinfest.com/essays/json.html)

[Douglas Crockford](http://www.crockford.com/) of course designed and built
JSON, but his state machine diagrams on the [JSON website](http://json.org/),
gave the JSON5 team motivation and confidence that building
a new parser to implement these ideas was within reach. The original
implementation of JSON5 was also modeled directly off of Doug’s open-source
[json_parse.js] parser. We’re grateful for that clean and well-documented
code.

[json_parse.js]: https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js

[Max Nanasy](https://github.com/MaxNanasy) has been an early and prolific
supporter of JSON5, contributing multiple patches and ideas.

[Andrew Eisenberg](https://github.com/aeisenberg) contributed the original
JSON5 `stringify` method.

[Jordan Tucker](https://github.com/jordanbtucker) aligned JSON5 more closely
with ES5, wrote the official JSON5 specification, completely rewrote the JSON5
codebase from the ground up, and is actively maintaining the JSON5 project.

[Kerry Shetline](https://github.com/kshetline) branched off from JSON5,
at version 2.1.0 of that project, to create [JSON-Z](https://json-z.org/).
