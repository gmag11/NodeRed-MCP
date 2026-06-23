---
name: nodered-jsonata
description: >-
  Comprehensive reference for the JSONata expression language (v2.2.0).
  Covers syntax, path navigation, predicates, operators, all built-in function
  categories (string, numeric, aggregation, boolean, array, object, date/time,
  higher-order), programming constructs (variables, functions, recursion),
  the processing model (sequences, flattening), and the JavaScript embedding API.
  Includes Node-RED-specific usage notes for change, switch, and inject nodes.
---

# JSONata Expression Language Reference

Comprehensive reference for JSONata — a lightweight query and transformation language for JSON data. JSONata is **Node-RED's native expression language**, used extensively in the "change" node, "switch" node, and wherever JSONata expressions are evaluated against `msg` objects.

JSONata is inspired by XPath 3.1 location path semantics. It is a **superset of JSON** — any valid JSON document is also a valid JSONata expression. This property enables using JSON as a template for output and replacing parts with expressions.

> **Version:** JSONata 2.2.0 (the version bundled with current Node-RED releases)
> **Try it:** [try.jsonata.org](http://try.jsonata.org/)
> **Docs:** [docs.jsonata.org](https://docs.jsonata.org/)

---

## Sample JSON Document

The following JSON document is used in examples throughout this reference:

```json
{
  "FirstName": "Fred",
  "Surname": "Smith",
  "Age": 28,
  "Address": {
    "Street": "Hursley Park",
    "City": "Winchester",
    "Postcode": "SO21 2JN"
  },
  "Phone": [
    { "type": "home", "number": "0203 544 1234" },
    { "type": "office", "number": "01962 001234" },
    { "type": "office", "number": "01962 001235" },
    { "type": "mobile", "number": "077 7700 1234" }
  ],
  "Email": [
    { "type": "work", "address": ["fred.smith@my-work.com", "fsmith@my-work.com"] },
    { "type": "home", "address": ["freddy@my-social.com", "frederic.smith@very-serious.com"] }
  ],
  "Other": {
    "Over 18 ?": true,
    "Misc": null,
    "Alternative.Address": {
      "Street": "Brick Lane",
      "City": "London",
      "Postcode": "E1 6RF"
    }
  }
}
```

---

## Path Navigation

### Dot Notation — Object Fields

Navigate into nested objects using dot `.` separators. If a field is not found, the expression returns nothing (JavaScript `undefined`) — **no errors are thrown**.

| Expression | Result |
|---|---|
| `Surname` | `"Smith"` |
| `Age` | `28` |
| `Address.City` | `"Winchester"` |
| `Other.Misc` | `null` |
| `Other.Nothing` | _(nothing)_ |

Fields containing whitespace or reserved tokens must be enclosed in backticks:

| Expression | Result |
|---|---|
| `` Other.`Over 18 ?` `` | `true` |
| `` Other.`Alternative.Address`.City `` | `"London"` |

### Bracket Notation — Array Indexing

Use `[index]` to access array elements. Indexes are **zero-offset**. Negative indexes count from the end of the array. Non-integer indexes are rounded down. If an index exceeds the array size, nothing is selected.

| Expression | Result |
|---|---|
| `Phone[0]` | `{ "type": "home", "number": "0203 544 1234" }` |
| `Phone[1]` | `{ "type": "office", "number": "01962 001234" }` |
| `Phone[-1]` | `{ "type": "mobile", "number": "077 7700 1234" }` |
| `Phone[-2]` | `{ "type": "office", "number": "01962 001235" }` |
| `Phone[8]` | _(nothing)_ |

**Array of indexes** selects a range:

| Expression | Result |
|---|---|
| `Phone[[0..1]]` | First two phone objects |

> **Important:** `Phone.number` selects the `number` field from ALL items → `["0203 544 1234", "01962 001234", ...]`. Use `(Phone.number)[0]` to get just the first number.

### Wildcards

| Symbol | Meaning |
|---|---|
| `*` | Selects all values of all properties in the context object |
| `**` | Descendant wildcard — recursively traverses all levels |

| Expression | Result |
|---|---|
| `Address.*` | `["Hursley Park", "Winchester", "SO21 2JN"]` |
| `*.Postcode` | `"SO21 2JN"` |
| `**.Postcode` | `["SO21 2JN", "E1 6RF"]` |

### Context and Root References

| Symbol | Meaning |
|---|---|
| `$` | The current context value at any point in the input hierarchy |
| `$$` | The root of the input JSON (breaks out of current context) |

| Expression | Result |
|---|---|
| `$[0]` | First item in top-level array (when input is an array) |
| `$$.FirstName` | `"Fred"` (access root from anywhere) |

---

## Predicates

Filter selected items using `[expr]` where `expr` evaluates to a Boolean. The expression is evaluated relative to the current context item.

| Expression | Result |
|---|---|
| `Phone[type='mobile']` | The mobile phone object |
| `Phone[type='mobile'].number` | `"077 7700 1234"` |
| `Phone[type='office'].number` | `["01962 001234", "01962 001235"]` |

**Combining predicates with Boolean operators:**

| Expression | Meaning |
|---|---|
| `Phone[type='home' or type='mobile'].number` | Home and mobile numbers |

### Singleton Array and Value Equivalence

Any non-array value and an array containing just that value are treated as equivalent. To **force an array result**, add `[]` at any step in the path:

| Expression | Result |
|---|---|
| `Address.City` | `"Winchester"` (single value) |
| `Address[].City` | `["Winchester"]` (always an array) |
| `Phone[][type='home'].number` | `["0203 544 1234"]` |

---

## Operators

### Numeric Operators

| Operator | Description | Example | Result |
|---|---|---|---|
| `+` | Addition | `5 + 2` | `7` |
| `-` | Subtraction / Negation | `5 - 2` / `-42` | `3` / `-42` |
| `*` | Multiplication | `5 * 2` | `10` |
| `/` | Division | `5 / 2` | `2.5` |
| `%` | Modulo (remainder) | `5 % 2` | `1` |
| `..` | Range generator (inside `[]`) | `[1..5]` | `[1, 2, 3, 4, 5]` |

Range examples:
- `[1..3, 7..9]` → `[1, 2, 3, 7, 8, 9]`
- `[1..$count(Items)].("Item " & $)` → dynamic numbered list
- `[1..5].($*$)` → `[1, 4, 9, 16, 25]`

### Comparison Operators

| Operator | Description | Example |
|---|---|---|
| `=` | Deep equality | `1+1 = 2` → `true` |
| `!=` | Not equals | `"Hello" != "World"` → `true` |
| `>` | Greater than | `22/7 > 3` → `true` |
| `<` | Less than | `22/7 < 3` → `false` |
| `>=` | Greater than or equals | `5 >= 5` → `true` |
| `<=` | Less than or equals | `5 <= 5` → `true` |
| `in` | Array inclusion | `"world" in ["hello", "world"]` → `true` |

> `in` treats a scalar RHS as a singleton array: `"hello" in "hello"` → `true`

### Boolean Operators

| Operator | Description | Example |
|---|---|---|
| `and` | Boolean AND | `price < 50 and section="diy"` |
| `or` | Boolean OR | `price < 10 or section="diy"` |

> Non-Boolean operands are cast using `$boolean()` rules. Boolean NOT is the `$not()` function, not an operator.

### String Concatenation

| Operator | Description | Example | Result |
|---|---|---|---|
| `&` | String concatenation | `"Hello" & " " & "World"` | `"Hello World"` |

> Non-string operands are cast using `$string()` rules.

### Conditional Operators

| Operator | Syntax | Description |
|---|---|---|
| Ternary | `test ? exprT : exprF` | If `test` is true, evaluate `exprT`; else `exprF` |
| Elvis/Default | `expr ?: default` | Returns `expr` if its effective Boolean is `true`; else `default` |
| Coalescing | `expr ?? default` | Returns `expr` if it is defined (not `undefined`); else `default` |

```jsonata
Price < 50 ? "Cheap" : "Expensive"
foo.bar ?: 'default'      -- fallback if falsy
foo.bar ?? 42              -- fallback only if undefined
0 ?: 1                     -- 0 is falsy → 1
0 ?? 1                     -- 0 is defined → 0
'' ?? 'fallback'           -- '' is defined → ''
```

### Variable Binding, Chaining, and Transform

| Operator | Syntax | Description |
|---|---|---|
| Variable binding | `$var := expr` | Binds `expr` to `$var` (block-scoped) |
| Function chaining | `value ~> func` | Passes LHS as first argument to RHS function |
| Object transform | `` head ~> \| location \| update [, delete] \| `` | Deep-copies `head`, applies `update` to matched `location`(s) |

```jsonata
-- Variable binding
$five := 5
$square := function($n) { $n * $n }

-- Function chaining
Customer.Email ~> $substringAfter("@") ~> $substringBefore(".") ~> $uppercase()

-- Function composition via chaining
$uppertrim := $trim ~> $uppercase
$uppertrim("   Hello    World   ")   -- "HELLO WORLD"

-- Object transform: increase all Product prices by 20%
payload ~> |Account.Order.Product|{'Price': Price * 1.2}|

-- Transform with property deletion
$ ~> |Account.Order.Product|{'Total': Price * Quantity}, ['Price', 'Quantity']|
```

---

## Path Operators

JSONata's path expression is a **declarative functional language** based on map/filter/reduce. Each stage in the path processes the result sequence from the previous stage.

| Stage | Syntax | Action |
|---|---|---|
| **Map** | `seq.expr` | Evaluates RHS expression in context of each item. Flattens results. |
| **Filter** | `seq[expr]` | Keeps items where predicate `expr` is `true` |
| **Order-by** | `seq^(expr)` | Sorts sequence by criteria (ascending default; `>` for descending) |
| **Reduce** | `seq{key: value, ...}` | Groups and aggregates into a single object |
| **Wildcard** | `*` | Selects all property values of context object |
| **Descendants** | `**` | Recursively selects all descendant values |
| **Parent** | `%` | Selects the enclosing object of the context value |
| **Position var** | `# $var` | Binds variable to current position (zero offset) in sequence |
| **Context var** | `@ $var` | Binds variable to current context item (only after map) |

### Order-by Examples

```jsonata
Account.Order.Product^(Price)           -- ascending by price
Account.Order.Product^(>Price)          -- descending by price
Account.Order.Product^(>Price, <Quantity)  -- desc price, then asc quantity
```

### Parent Operator

```jsonata
Account.Order.Product.{
  'Product': `Product Name`,
  'Order': %.OrderID,
  'Account': %.%.`Account Name`
}
```

### Context Variable Binding (Data Joins)

```jsonata
library.loans@$l.books@$b[$l.isbn=$b.isbn].{
  'title': $b.title,
  'customer': $l.customer
}
```

### Positional Variable Binding

```jsonata
library.books#$i['Kernighan' in authors].{
  'title': title,
  'index': $i
}
```

---

## Query Composition

In JSONata, **everything is an expression**. Expressions comprise values, functions and operators which, when evaluated, produce a resulting value. Functions and operators are applied to values which themselves can be the results of evaluating sub-expressions — the language is fully composable to any level of complexity.

### Parenthesized Expressions and Blocks

Parentheses `()` serve three purposes:

1. **Override operator precedence** — `(5 + 3) * 4` → `32`
2. **Compute complex expressions on a context value** — `Product.(Price * Quantity)` — both `Price` and `Quantity` are resolved relative to each `Product`
3. **Code blocks** — multiple expressions separated by semicolons; the last expression's result is returned:

```jsonata
(
  $pi := 3.14159;
  $r := 5;
  $pi * $r * $r    -- returned result
)
```

Blocks also define a **scope frame** for variables. Variables bound inside parentheses go out of scope when the block ends.

---

## Processing Model

### Type System

JSONata supports 7 types:
- `string`, `number`, `boolean`, `null`, `object`, `array`, `function`

### Sequence Flattening Rules

1. **Empty sequence** = "nothing" (won't appear in output, won't create object properties)
2. **Singleton sequence** = equivalent to the value itself
3. **Multi-value sequence** = represented as a JSON array in output
4. **Nested sequences** = flattened (child values pulled up to parent level)

> **Key difference:** An array from input JSON or `[...]` constructor is an **array value**, not a sequence. It won't be flattened unless it becomes context for a subsequent expression.

### Path Processing Stages

| Stage | Syntax | Precedence |
|---|---|---|
| Map | `seq.expr` | Lower than Filter |
| Filter | `seq[expr]` | Binds tighter than Map |
| Sort (Order-by) | `seq^(expr)` | Lowest precedence |
| Index | `seq#$var` | — |
| Join (Context bind) | `seq@$var` | After a Map stage only |
| Reduce | `seq{...}` | Terminates the path expression |

---

## String Functions

All string functions with signatures. Functions with `-` in their signature can be invoked without an explicit first argument, using the context value instead.

| Function | Signature | Description |
|---|---|---|
| `$string()` | `<x-:s>` | Cast to string (JSON.stringify rules) |
| `$length()` | `<s-:n>` | Character count |
| `$substring()` | `<s-n?:s>` | `$substring(str, start[, length])` |
| `$substringBefore()` | `<s-s:s>` | Substring before first occurrence of chars |
| `$substringAfter()` | `<s-s:s>` | Substring after first occurrence of chars |
| `$uppercase()` | `<s-:s>` | Convert to uppercase |
| `$lowercase()` | `<s-:s>` | Convert to lowercase |
| `$trim()` | `<s-:s>` | Normalize whitespace |
| `$pad()` | `<sn?s?:s>` | `$pad(str, width[, char])` — right pad if width>0, left if <0 |
| `$contains()` | `<s-s:s>` | `true` if `str` contains `pattern` (string or regex) |
| `$split()` | `<s-sn?:a<s>>` | `$split(str, separator[, limit])` |
| `$join()` | `<a<s>s?:s>` | Join array with optional separator |
| `$match()` | `<s-sn?:a>` | Returns array of match objects `{match, index, groups}` |
| `$replace()` | `<s-s<sf>n?:s>` | Replace `pattern` with `replacement` (string/function) |
| `$eval()` | `<ss?:x>` | Parse and evaluate string as JSONata |
| `$base64encode()` | `<s-:s>` | Base64 encode ASCII string |
| `$base64decode()` | `<s-:s>` | Base64 decode to UTF-8 string |
| `$encodeUrlComponent()` | `<s-:s>` | URL-encode component |
| `$encodeUrl()` | `<s-:s>` | URL-encode full URL |
| `$decodeUrlComponent()` | `<s-:s>` | URL-decode component |
| `$decodeUrl()` | `<s-:s>` | URL-decode full URL |

### Regex Usage with String Functions

```jsonata
-- Contains with regex
$contains("abracadabra", /a.*a/)          -- true
$contains("Hello World", /wo/i)           -- true (case-insensitive)

-- Split with regex
$split("too much, punctuation. hard; to read", /[ ,.;]+/)
-- ["too", "much", "punctuation", "hard", "to", "read"]

-- Match with regex (returns match objects)
$match("ababbabbcc", /a(b+)/)
-- [{"match":"ab","index":0,"groups":["b"]}, ...]

-- Replace with regex and captured groups
$replace("John Smith", /(\w+)\s(\w+)/, "$2, $1")
-- "Smith, John"

-- Replace with function (temperature conversion)
$replace("temperature = 68F today", /(\d+)F/, function($m) {
  ($number($m.groups[0]) - 32) * 5/9 & "C"
})
-- "temperature = 20C today"
```

---

## Regular Expressions

JSONata provides first-class support for regular expressions using the familiar slash delimiter syntax:

```
/regex/flags
```

Where `flags` can be:
- `i` — case-insensitive matching
- `m` — multiline matching (both can be combined: `/regex/im`)

> **Key insight:** `/regex/` evaluates to a **function** — a "matcher function". When invoked on a string, it returns a match object with `{match, start, end, groups, next()}`. The `next()` function advances to the next match.

### Regex-Aware Functions

Four built-in functions accept regex patterns: `$match()`, `$contains()`, `$split()`, `$replace()`.

### Regex in Query Predicates (Shortcut)

Use the chain operator `~>` for concise predicate matching:

```jsonata
Account.Order.Product[`Product Name` ~> /hat/i]
-- Matches all products with 'hat' in their name (case-insensitive)
```

The `~>` operator passes the field value to the regex matcher function, returning `true`/`false`.

### Generic Matcher Functions

Since `/regex/` is just a function generator, you can bind regexes to variables and invoke them:

```jsonata
$matcher := /[a-z]*an[a-z]*/i
$matcher('A man, a plan, a canal, Panama!')
-- {"match": "man", "start": 2, "end": 4, "groups": [], "next": <function>}
```

### Custom Matchers

The regex-aware functions work with any function conforming to the matcher contract. You can write custom matchers as JSONata lambdas or extension functions and pass them to `$match`, `$contains`, `$split`, and `$replace`.

### Other String Examples

```jsonata
$substring("Hello World", 3)        -- "lo World"
$substring("Hello World", 3, 5)     -- "lo Wo"
$substring("Hello World", -4)       -- "orld"
$pad("foo", 5)                      -- "foo  "
$pad("foo", -5, "#")                -- "##foo"
$trim(" Hello \n World ")           -- "Hello World"
$eval("[1,$string(2),3]")           -- [1, "2", 3]
$base64encode("myuser:mypass")      -- "bXl1c2VyOm15cGFzcw=="
```

---

## Numeric Functions

| Function | Signature | Description |
|---|---|---|
| `$number()` | `<x-:n>` | Cast to number (supports hex `0x`, octal `0o`, binary `0b`) |
| `$abs()` | `<n-:n>` | Absolute value |
| `$floor()` | `<n-:n>` | Round down to nearest integer |
| `$ceil()` | `<n-:n>` | Round up to nearest integer |
| `$round()` | `<nn?:n>` | Round to `precision` decimal places (default 0) |
| `$power()` | `<nn-:n>` | `base` raised to `exponent` |
| `$sqrt()` | `<n-:n>` | Square root |
| `$random()` | `<>:n` | Pseudo-random number 0 ≤ n < 1 |
| `$formatNumber()` | `<ns-:s>` | Format number using XPath picture string |
| `$formatBase()` | `<nn?:s>` | Format integer in given radix (2-36) |
| `$formatInteger()` | `<ns-:s>` | Format integer using XPath picture string |
| `$parseInteger()` | `<ss-:n>` | Parse formatted integer string to number |

### Rounding Semantics

`$round()` uses **round half to even** (banker's rounding), the default IEEE 754 mode:

```jsonata
$round(123.456)       -- 123
$round(123.456, 2)    -- 123.46
$round(123.456, -1)   -- 120 (round to tens)
$round(11.5)          -- 12 (half → even)
$round(12.5)          -- 12 (half → even)
$round(125, -1)       -- 120 (half → even)
```

### Number Formatting

```jsonata
$formatNumber(12345.6, '#,###.00')      -- "12,345.60"
$formatNumber(1234.5678, "00.000e0")     -- "12.346e2"
$formatNumber(-34.555, "#0.00;(#0.00)")  -- "(34.56)"
$formatNumber(0.14, "01%")               -- "14%"
$formatBase(100, 2)                       -- "1100100"
$formatBase(2555, 16)                     -- "9fb"
$formatInteger(2789, 'w')                 -- "two thousand, seven hundred and eighty-nine"
$formatInteger(1999, 'I')                 -- "MCMXCIX"
$parseInteger("twelve thousand, four hundred and seventy-six", 'w')  -- 12476
```

---

## Aggregation Functions

| Function | Signature | Description |
|---|---|---|
| `$sum()` | `<a<n>:n>` | Arithmetic sum of array of numbers |
| `$max()` | `<a<n>:n>` | Maximum number in array |
| `$min()` | `<a<n>:n>` | Minimum number in array |
| `$average()` | `<a<n>:n>` | Mean value of array of numbers |

```jsonata
$sum([5, 1, 3, 7, 4])      -- 20
$max([5, 1, 3, 7, 4])      -- 7
$min([5, 1, 3, 7, 4])      -- 1
$average([5, 1, 3, 7, 4])  -- 4

-- In path expressions
$sum(Account.Order.Product.(Price*Quantity))  -- total of all price×quantity
```

---

## Boolean Functions

| Function | Signature | Description |
|---|---|---|
| `$boolean()` | `<x-:b>` | Cast to Boolean |
| `$not()` | `<x-:b>` | Boolean NOT (argument cast first) |
| `$exists()` | `<x-:b>` | `true` if expression evaluates to a value |

### `$boolean()` Casting Rules

| Value | Result |
|---|---|
| Boolean | unchanged |
| string: empty `""` | `false` |
| string: non-empty | `true` |
| number: `0` | `false` |
| number: non-zero | `true` |
| `null` | `false` |
| array: empty | `false` |
| array: contains member that casts to `true` | `true` |
| array: all members cast to `false` | `false` |
| object: empty | `false` |
| object: non-empty | `true` |
| function | `false` |

---

## Array Functions

| Function | Signature | Description |
|---|---|---|
| `$count()` | `<x-:n>` | Number of items (non-arrays count as 1) |
| `$append()` | `<xx:a>` | Concatenate two arrays (or values) |
| `$sort()` | `<a<f>?:a>` | Sort array; optional comparator `function($l, $r)` |
| `$reverse()` | `<a:a>` | Reverse array order |
| `$shuffle()` | `<a:a>` | Random shuffle |
| `$distinct()` | `<a:a>` | Remove duplicates (deep equality) |
| `$zip()` | `<a+>` | Convolve arrays: `$zip([1,2,3], [4,5,6])` → `[[1,4],[2,5],[3,6]]` |

```jsonata
$count([1,2,3,1])        -- 4
$append([1,2,3], [4,5,6]) -- [1,2,3,4,5,6]
$reverse(["Hello", "World"]) -- ["World", "Hello"]
$shuffle([1..9])           -- [6, 8, 2, 3, 9, 5, 1, 4, 7] (random)
$distinct([1,2,3,3,4,3,5]) -- [1, 2, 3, 4, 5]
$zip([1,2,3], [4,5], [7,8,9]) -- [[1,4,7], [2,5,8]] (shortest array wins)

-- Custom sort comparator
$sort(Account.Order.Product, function($l, $r) {
  $l.Description.Weight > $r.Description.Weight
})
```

---

## Object Functions

| Function | Signature | Description |
|---|---|---|
| `$keys()` | `<o-:a<s>>` | Array of keys in object (de-duplicated for arrays of objects) |
| `$lookup()` | `<os-:x>` | Value for key in object(s) |
| `$spread()` | `<o-:a<o>>` | Split object into array of single-key objects |
| `$merge()` | `<a<o>:o>` | Merge array of objects (last key wins on conflict) |
| `$each()` | `<of:a>` | Apply function to each key/value pair |
| `$error()` | `<s-:>` | Throw error with message |
| `$assert()` | `<bs-:>` | Throw error if condition is `false` |
| `$type()` | `<x-:s>` | Return type string: "null", "number", "string", "boolean", "array", "object", "function" |

```jsonata
$keys(Address)                       -- ["Street", "City", "Postcode"]
$lookup(Address, "City")             -- "Winchester"
$merge([{"a":1},{"b":2},{"a":3}])    -- {"a":3, "b":2}
$each(Address, function($v, $k) { $k & ": " & $v })
-- ["Street: Hursley Park", "City: Winchester", "Postcode: SO21 2JN"]
$type("hello")                       -- "string"
$type([1,2,3])                       -- "array"
```

---

## Date/Time Functions

JSON does not have a date type. The convention is **ISO 8601 string format** (`"2018-12-10T13:45:00.000Z"`). JSONata follows this convention.

| Function | Signature | Description |
|---|---|---|
| `$now()` | `<s?s?:s>` | Current UTC timestamp (same value for all calls in one expression) |
| `$millis()` | `<>:n` | Milliseconds since Unix epoch |
| `$fromMillis()` | `<ns?s?:s>` | Format milliseconds to string using optional picture string |
| `$toMillis()` | `<ss?:n>` | Parse timestamp string to milliseconds using optional picture string |

### Picture String Notation

Uses XPath F&O 3.1 `fn:format-dateTime` picture string syntax. Common components:

| Component | Meaning | Example |
|---|---|---|
| `[Y]` / `[Y0001]` | Year | `2018` |
| `[M]` / `[M01]` | Month | `12` / `05` |
| `[D]` / `[D01]` | Day | `10` / `05` |
| `[H]` / `[H01]` / `[h#1]` | Hour (24h / 24h padded / 12h) | `13` / `13` / `1pm` |
| `[m]` / `[m01]` | Minute | `45` / `05` |
| `[s]` / `[s01]` | Second | `00` / `05` |
| `[P]` | AM/PM marker | `pm` |
| `[z]` | Timezone | `GMT-05:00` |
| `[FNn]` | Full day name | `Monday` |
| `[MNn]` | Full month name | `December` |

```jsonata
$now()                                        -- "2017-05-15T15:12:59.152Z"
$millis()                                     -- 1502700297574
$fromMillis(1510067557121)                     -- "2017-11-07T15:12:37.121Z"
$fromMillis(1510067557121, '[M01]/[D01]/[Y0001] [h#1]:[m01][P]')  -- "11/07/2017 3:12pm"
$fromMillis(1510067557121, '[H01]:[m01]:[s01] [z]', '-0500')      -- "10:12:37 GMT-05:00"
$toMillis("2017-11-07T15:07:54.972Z")          -- 1510067274972
$toMillis('10/12/2018', '[D]/[M]/[Y]')         -- parse EU format
```

---

## Higher-Order Functions

Functions that take functions as arguments.

| Function | Signature | Description |
|---|---|---|
| `$map()` | `<af<a?>?:a>` | Apply function to each array item |
| `$filter()` | `<af<a?>?:a>` | Keep items where function returns `true` |
| `$single()` | `<af<a?>?:x>` | Return the single item matching predicate; error if not exactly one |
| `$reduce()` | `<af<*?>f?:x>` | Fold/accumulate: `$reduce(array, function($acc, $v, $i, $a)[, init])` |
| `$sift()` | `<of<o?>?:o>` | Keep object key/value pairs where function returns `true` |

### Callback Signatures

All array callbacks: `function(value [, index [, array]])`

`$sift` callback: `function(value [, key [, object]])`

### Examples

```jsonata
-- Map
$map([1,2,3], function($v) { $v * 2 })         -- [2, 4, 6]

-- Filter
$filter(Account.Order.Product, function($v, $i, $a) {
  $v.Price > $average($a.Price)
})

-- Single
$single(Account.Order.Product, function($v) {
  $v.SKU = "0406654608"
})

-- Reduce (product of all numbers)
$reduce([1..5], function($i, $j){ $i * $j })   -- 120

-- Sift (keep only keys starting with "Product")
Account.Order.Product.$sift(function($v, $k) { $k ~> /^Product/ })
```

---

## Programming Constructs

### Comments

```jsonata
/* Single or multi-line comments using C-style delimiters */
```

### Conditional Logic

Three conditional forms:
- **Ternary:** `test ? exprT : exprF`
- **Elvis (Default):** `expr ?: default` — equivalent to `expr ? expr : default`
- **Coalescing:** `expr ?? default` — equivalent to `$exists(expr) ? expr : default`

```jsonata
Account.Order.Product.{
  `Product Name`: $.Price > 100 ? "Premium" : "Basic",
  `Category`: $.Category ?: "Uncategorized"
}
```

### Variables

Variable names start with `$`. Two built-in variables: `$` (context) and `$$` (root).

Variable binding uses `:=`, scoped to the current block:

```jsonata
(
  $pi := 3.14159;
  $r := 5;
  $pi * $r * $r
)
```

### Functions

**Lambda definition:**
```jsonata
function($l, $w, $h) { $l * $w * $h }
```

**Assign and invoke:**
```jsonata
(
  $volume := function($l, $w, $h) { $l * $w * $h };
  $volume(10, 10, 5)   -- 500
)
```

### Function Signatures

Optional type annotations for parameter validation:

```jsonata
<params:return>
```

| Symbol | Type |
|---|---|
| `b` | Boolean |
| `n` | number |
| `s` | string |
| `l` | null |
| `a` | array |
| `o` | object |
| `f` | function |
| `u` | (bnsl) — Boolean, number, string, null |
| `j` | (bnsloa) — any JSON type |
| `x` | (bnsloaf) — any type |
| `a<s>` | array of strings |
| `+` | one or more arguments of this type |
| `?` | optional argument |
| `-` | use context if missing |

Examples of built-in signatures:
- `$count` → `<a:n>`
- `$sum` → `<a<n>:n>`
- `$reduce` → `<fa<j>:j>` (takes function + array of JSON, returns JSON)

### Recursion and Tail Call Optimization

```jsonata
-- Standard recursive factorial
$factorial := function($x) { $x <= 1 ? 1 : $x * $factorial($x-1) }

-- Tail-recursive factorial (optimized to a loop)
$factorial := function($x) {(
  $iter := function($x, $acc) {
    $x <= 1 ? $acc : $iter($x - 1, $x * $acc)
  };
  $iter($x, 1)
)}
```

> Tail-recursive functions run in constant stack space and won't overflow.

### Closures

Functions capture their defining environment (context value + variable bindings):

```jsonata
Account.(
  $AccName := function() { $.'Account Name' };
  Order[OrderID = 'order104'].Product.{
    'Account': $AccName(),
    'SKU-' & $string(ProductID): $.'Product Name'
  }
)
```

### Partial Function Application

Replace arguments with `?` to create new functions:

```jsonata
$first5 := $substring(?, 0, 5)
$first5("Hello, World")    -- "Hello"

-- Chaining partial applications
$firstN := $substring(?, 0, ?)
$first5 := $firstN(?, 5)

-- Function composition with partials
$first5Capitalized := $substring(?, 0, 5) ~> $uppercase(?)
$first5Capitalized(Address.City)    -- "WINCH"
```

### Functions as First-Class Values

```jsonata
$twice := function($f) { function($x) { $f($f($x)) } }
$add3 := function($y) { $y + 3 }
$add6 := $twice($add3)
$add6(7)    -- 13
```

---

## Object Construction and Grouping

### Array Constructors

Use `[...]` to build arrays. Commas separate expressions:

```jsonata
[Address, Other.`Alternative.Address`].City    -- ["Winchester", "London"]
Email.[address]     -- preserves nested structure per email object
```

### Object Constructors

Use `{key: value, ...}` to build objects. Keys can be expressions that evaluate to strings:

```jsonata
Phone.{type: number}
-- [{"home":"0203 544 1234"},{"office":"01962 001234"}, ...]

Phone{type: number}
-- {"home":"0203 544 1234","office":["01962 001234","01962 001235"],"mobile":"077 7700 1234"}
```

> **Key difference:** `Phone.{type: number}` (with dot) creates one object per phone. `Phone{type: number}` (without dot) groups into a single object.

### Grouping with Object Key Expressions

The object constructor is also the **group-by** mechanism. The key expression determines grouping; value expressions aggregate:

```jsonata
-- Group products by name, collect prices
Account.Order.Product{`Product Name`: Price}
-- {"Bowler Hat":[34.45,34.45],"Trilby hat":21.67,"Cloak":107.99}

-- Group with aggregated total per product
Account.Order.Product{`Product Name`: $sum($.(Price*Quantity))}
-- {"Bowler Hat":206.7,"Trilby hat":21.67,"Cloak":107.99}
```

### JSON Literals

JSONata is a superset of JSON — you can use a JSON document as a template:

```jsonata
{"name": FirstName & " " & Surname, "age": Age, "city": Address.City}
-- {"name":"Fred Smith","age":28,"city":"Winchester"}
```

---

## JavaScript Embedding API

For embedding JSONata in Node.js applications (reference implementation).

### Installation

```bash
npm install jsonata
```

### Basic Usage

```javascript
const jsonata = require('jsonata');

const data = {
    example: [
        {value: 4},
        {value: 7},
        {value: 13}
    ]
};

(async () => {
    const expression = jsonata('$sum(example.value)');
    const result = await expression.evaluate(data);  // 24
})();
```

### API Reference

#### `jsonata(str[, options])`
Parse and compile an expression. Returns an expression object. Throws on syntax errors.

#### `expression.evaluate(input[, bindings[, callback]])`
Evaluate against `input` data. Returns a Promise resolving to the result.

```javascript
await jsonata("$a + $b()").evaluate({}, {a: 4, b: () => 78});
// 82
```

#### `expression.assign(name, value)`
Permanently bind a value to a name in the expression.

```javascript
expression.assign("a", 4);
expression.assign("b", () => 1);
await expression.evaluate({});  // 5
```

#### `expression.registerFunction(name, implementation[, signature])`
Register a custom function with optional type signature:

```javascript
expression.registerFunction("add", (a, b) => a + b, "<nn:n>");
await expression.evaluate({});  // 10066
```

### Guardrails

Protect against runaway expressions with configurable limits:

```javascript
const options = {
    stack: 500,       // max eval-apply cycle depth
    timeout: 1000,    // max execution time in ms
    sequence: 1e6,    // max sequence length
    RegexEngine: SafeRegExp  // custom regex processor for ReDoS protection
};
const expression = jsonata('<expr>', options);
```

| Guardrail | Error Code | Description |
|---|---|---|
| `stack` | `D1011` | Max depth of eval-apply cycle |
| `timeout` | `D1012` | Max milliseconds of execution |
| `sequence` | `D2015` | Max items in any sequence |
| `RegexEngine` | — | Custom regex constructor for ReDoS protection |

---

## Node-RED Integration

JSONata is the **default expression language** in Node-RED. Key usage points:

### Change Node — "Set" with JSONata Expression

The "change" node has a "JSONata" expression type. The expression receives the full `msg` object as its context (`$$` = `msg`).

```jsonata
-- Transform msg.payload
payload.temperature & "°C"

-- Access other msg properties
"Topic: " & topic & ", Value: " & payload

-- Create a new object from msg
{"sensor": topic, "value": payload, "timestamp": $now()}
```

### Switch Node — Condition Expressions

The "switch" node supports JSONata expressions for conditions. The expression must return `true`/`false`:

```jsonata
payload.temperature > 30
$contains(topic, "alarm")
$exists(payload.error)
```

### Context Access in Node-RED

The `msg` object is the root `$$`. All msg properties are directly accessible by name:
- `payload` → `msg.payload`
- `topic` → `msg.topic`
- `payload.sensor.value` → nested access within payload

### Common Node-RED JSONata Patterns

```jsonata
-- Extract and rename fields
{"device": topic, "reading": payload, "unit": "°C"}

-- Conditional transformation
payload > 100 ? "HIGH" : payload > 50 ? "MEDIUM" : "LOW"

-- Filter array within payload
payload[value > 10]

-- Aggregate array data
$sum(payload.readings)
$average(payload.*.temperature)

-- Timestamp enrichment
{"data": payload, "receivedAt": $now()}

-- Default value pattern
payload.value ?: 0

-- Check if property exists
$exists(payload.error) ? "Error: " & payload.error : "OK"

-- Merge multiple properties
$merge([payload.metadata, {"processed": true, "timestamp": $now()}])
```
