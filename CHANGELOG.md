### 5.1.0

* JSON-Z will now honor an object’s `toJSON5()` method, if present, at higher priority than `toJSON()`, and lower priority than `toJSONZ()`.
* Update allowed CLI arguments to match JSON5 CLI.

### 5.0.1

* Eliminated `minimist` dependency. (Package is now dependency-free.)

### 5.0.0

* JSON-Z can now be used as an ESM module. There are no functional changes, but a possible breaking change with how the package is imported:

`import JSONZ from 'json-z';` instead of `import * as JSONZ from 'json-z';`
* Updated grammar documentation.

### 4.2.1-4.2.6

* Fixed assorted replacer/reviver bugs.

### 4.2.0

* Provide reviver callbacks with the source text of primitive values.
* Make sure reviver callbacks are not called for the internal components of decimal or big decimal objects.

### 4.1.1

* Fix NPE when reviver function encounters a null value.

### 4.1.0

* Added a new replacer function feature, `JSONZ.LITERALLY_AS`, allowing a replacer function to explicitly determine how a value will be rendered when stringified.

### 4.0.1

Minor documentation tweak.

### 4.0.0

* Added complete grammar documentation.
* Support for older versions of JavaScript which do not handle BigInt dropped.
* Related API for setting an external BigInt handler removed.
* Fixed-precision decimal numbers are now explicitly IEEE 754 Decimal128 numbers.
* Nomenclature to distinguish between fixed-precision and arbitrary-precision decimals has changed. It's now simply Decimal or BigDecimal rather than FixedBigDecimal or BigDecimal.
* Replaced tap testing with mocha/chai test suite.
* Testing for fixed-precision decimals is now done using `proposal-decimal` package from [ECMA TC39 JavaScript Decimal proposal](https://github.com/tc39/proposal-decimal).
* Backtick-quoted strings must escape the `{` character when it follows the `$` to prevent confusion with template literals (`` `${` ➜ `$\{` ``).

### 3.2.1

* Minor documentation cleanup.

### 3.2.0

* `stringify()` will now accept an `OptionSet` value as well as explicit options.
* Added the `removeGlobalizedTypeHandlers()` function.

### 3.1.0

* Add built-in extended type handler for regular expressions.
* Add "big decimal"-specific keywords `NaN_m`, `Infinity_m`, and `-Infinity_m`.
* Fix bug where negative non-integer values starting with 0 (e.g. `-0.2`) had double negative sign.

### 3.0.0

* First release of JSON-Z, following a fork from JSON5 2.1.0. 
