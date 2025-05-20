## JSON-Z Grammar

Features which exceed the JSON specification are flagged with the minimal feature set required for parsing them, in a hierarchy from least to most permissive: JSONC, JSON5, JSON-Z.

### Overview

```plantuml
@startebnf

value = inert-content, ( primitive | array | object | extended-type (* JSON-Z *) ), inert-content ;

inert-content = { whitespace | comment (* JSONC *) } ;

primitive = "null" | "undefined" (* JSON-Z *) | "true" | "false" | number | string ;

array = "[", ( inert-content | ( (simple-array-content | sparse-array-content (* JSON-Z *) ), [ "," (* JSON5 *) ] ) ), "]";

simple-array-content = value, { ",", value } ;

sparse-array-content (* JSON-Z *) = value, { { "," }, value };

(* Note: The experimental hidden array properties feature is not diagrammed above. *)

object = "{", ( inert-content | ( object-content, [ "," (* JSON5 *) ] ) ), "}" ;

object-content = key-value-pair, { ",", key-value-pair } ;

key-value-pair = ( string | identifier (* JSON5 *) ), inert-content, ":", value ;

identifier = identifier-start, { identifier-character };

(* Indentiers are in accord with the ECMAScript 5.1 specification:
    https://262.ecma-international.org/5.1/#sec-7.6

Note: Identifiers can also use \uXXXX-style escapes with codepoints corresponding
to valid identifier characters. For example:

{\u0061: 200} is the same as {a: 200} *)

@endebnf
```

### Basic character classes

```plantuml
@startebnf

whitespace = { "\t" (* tab *) | "\n" (* newline *) | "\f" (* form-feed / JSON5 *) | "\r" (* return *) | " " (* space *) | "\v" (* vertical tab / JSON5 *) | ? Unicode whitespace character ? (* JSON5 *) }- ;

(* Unicode whitespace: https://www.compart.com/en/unicode/category/Zs *)

sign = "+" | "-" ;

binary-digit = 0-1 ;

octal-digit = 0-7 ;

decimal-digit = 0-9 ;

non-zero-digit = 1-9;

non-octal-digit = 8-9 ;

hex-digit = 0-9A-Fa-f ;

safe-string-character = ? All Unicode matching /[^\x00\x0A\x0D\x22\x27\x5C\x60\u2028\u2029]/ ? ;

(* Note: The above regex matches all characters other than NUL, LF, CR, quote,
single-quote, backslash, backtick, LINE SEPARATOR, and PARAGRAPH SEPARATOR. *)

identifier-start = A-Za-z | "_" | "$" | ? Unicode letter ? ;

(* Unicode letter (comprised of five categories):
    https://www.compart.com/en/unicode/category/Ll
    https://www.compart.com/en/unicode/category/Lm
    https://www.compart.com/en/unicode/category/Lo
    https://www.compart.com/en/unicode/category/Lt
    https://www.compart.com/en/unicode/category/Lu
*)

identifier-character = identifier-start | decimal-digit | "\u200C" (* ZERO WIDTH NON-JOINER *) | "\u200D" (* ZERO WIDTH JOINER *) | ? Unicode spacing combining mark ? | ? Unicode non-spacing mark ? | ? Unicode decimal digit number ? | ? Unicode connector punctuation ? ;

(* Unicode spacing combining mark: https://www.compart.com/en/unicode/category/Mc
Unicode non-spacing mark: https://www.compart.com/en/unicode/category/Mc
Unicode decimal digit number: hhttps://www.compart.com/en/unicode/category/Nd
Unicode connector punctuation: https://www.compart.com/en/unicode/category/Pc *)

@endebnf
```

### Numbers

```plantuml
@startebnf

number = [sign], unsigned-number ;

unsigned-number = integer | floating | symbolic-number (* JSON5 *) ;

integer = ( binary (* JSON-Z *) | octal (* JSON-Z *) | decimal | hex ), [ "n" ] (* JSON-Z *) ;

binary = "0b", binary-digit, { [ "_" ], binary-digit } ;

octal = explicit-octal | implied-octal ;

explicit-octal = "0o", octal-digit, { [ "_" ], octal-digit } ;

implied-octal = "0", octal-digit, { [ "_" ], octal-digit } ;

decimal = "0", [ decimal-sequence, [ "_" ] ], { non-octal-sequence }-, [ "_" ], [ decimal-sequence ] | non-zero-digit, [ [ "_" ], decimal-sequence ] ;

decimal-sequence = decimal-digit, { [ "_" ], decimal-digit } ;

non-octal-sequence = non-octal-digit, { [ "_" ], non-octal-digit } ;

hex = "0x", hex-digit, { [ "_" ], hex-digit } ;

floating = ( ( ( decimal-sequence, ".", [ decimal-sequence ] | ".", decimal-sequence ), [ exponent ] ) | decimal-sequence, exponent ), [ "d" (* JSON-Z *) | "n" (* JSON-Z / integer only *) | "m" (* JSON-Z *) ] ;

(* "n" suffix only allowed if the preceding value resolves to an integer, e.g. 1.2e10n *)

(* Note: leading or trailing decimal point requires JSON5 or JSON-Z *)

exponent = ("E" | 'e'), [ sign ], { decimal-digit }- ;

symbolic-number = ("NaN" | "Infinity"), [ "_d" (* JSON-Z *) | "_m" (* JSON-Z *) ] ;

@endebnf
```

### Simplified numbers

_This is what the number productions look like when the complications of underscore separators, leading/trailing decimal points, and implicit octal numbers are removed._

```plantuml
@startebnf

binary (* JSON-Z *) = "0b", { binary-digit}- ;

octal (* JSON-Z *) = "0o", { octal-digit }- ;

decimal = { decimal-digit }- ;

hex = "0x", { hex-digit }- ;

floating = { decimal-digit }-, ( ( ".", { decimal-digit }-, [ exponent ]) | ( exponent ) ), [ "d" (* JSON-Z *) | "n" (* JSON-Z / integer only *) | "m" (* JSON-Z *) ] ;

exponent = ("E" | 'e'), [ sign ], { decimal-digit }- ;

@endebnf
```

### Strings

```plantuml
@startebnf

string = double-quoted-string | single-quoted-string | backtick-quoted-string (* JSON-Z *) ;

double-quoted-string = '"', { safe-string-character | "'" | "`" | escape }, '"';

single-quoted-string = "'", { safe-string-character | '"' | "`" | escape }, "'";

backtick-quoted-string = "`", { safe-string-character (* Note: the sequence ${ must be escaped as $\{ *) | "'" | '"' | escape }, "`";

escape = "\", ( simple-escape | short-escape (* JSON5 *) | unicode-escape ) ;

simple-escape = '"' | "'" | "`" | "0" | "b" | "f" | "n" | "r" | "t" | "v" | "\" | "\n" | "\r\n" | "\r" ;

(* quote, single-quote, backtick, null, backspace, form feed, newline, return, tab,
vertical tab, backslash, LF, CRLF, CR *)

(* Note: \0 cannot precede a 0-9 digit in a string. Use \x00 or \u0000 instead. *)

short-escape = "x", 2 * hex-digit ;

unicode-escape = "u", 4 * hex-digit ;
@endebnf
```

### Comments

```plantuml
@startebnf

comment (* JSONC *) = block-comment | line-comment ;

block-comment = "/*", ? any characters not containing the sequence "*/" ?, "*/";

line-comment = "//", ? any characters other than \n or \r ?, ( "\n" | "\r\n" | "\r" ) ;

@endebnf
```

### Extended types

The form of an extended type mirrors that of a JavaScript function call, allowing these values to be parsed as JSONP, via the JavaScript `eval` function, or via the safer JavaScript `new Function(...)` technique, so long as evaluation takes place in a context where the named functions are defined.

The `JSONZ.globalizeTypeHandlers()` function can be used to establish such a context.

```plantuml
@startebnf

extended-type (* JSON-Z *) = type-prefix, (built-in | identifier), inert-content, "(", value, ")";

type-prefix = "_" ;

(* Note: A single underscore is the default type-prefix, but this can be customized. *)

custom-type-prefix = "_", { "_" | "$" | 0-9A-Za-z }, "_" ;

built-in = "BigDecimal" | "BigInt" | "Date" | "Decimal" | "Map" | "RegExp" | "Set" | "Uint8Array" ;

@endebnf
```
