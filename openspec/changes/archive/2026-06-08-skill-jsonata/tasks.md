## 1. Skill file scaffolding

- [x] 1.1 Create `.github/skills/jsonata/` directory
- [x] 1.2 Create `SKILL.md` with valid YAML frontmatter (`name: jsonata`, `description`, no `tools` field)
- [x] 1.3 Add introduction section explaining JSONata as a lightweight query/transformation language and its relevance to Node-RED

## 2. Core syntax and path navigation

- [x] 2.1 Document dot notation for object field access with examples
- [x] 2.2 Document bracket notation for array indexing (zero-offset, negative indexing)
- [x] 2.3 Document wildcards (`*` for single-level, `**` for descendants)
- [x] 2.4 Document context variable `$` and root variable `$$`
- [x] 2.5 Document predicate expressions with equality, comparison, and Boolean combinations
- [x] 2.6 Document singleton array equivalence and the `[]` array-forcing syntax

## 3. Operators reference

- [x] 3.1 Document numeric operators (+, -, *, /, %, .. range)
- [x] 3.2 Document comparison operators (=, !=, >, <, >=, <=, in)
- [x] 3.3 Document Boolean operators (and, or)
- [x] 3.4 Document string concatenation operator (&)
- [x] 3.5 Document conditional ternary (? :), elvis/Default (?:), and coalescing (??) operators
- [x] 3.6 Document variable binding (:=), function chaining (~>), and object transform (|...|...|) operators

## 4. Path operators

- [x] 4.1 Document Map (`.`), Filter (`[...]`), Order-by (`^(...)`), and Reduce (`{...}`) operators
- [x] 4.2 Document Parent (`%`), Positional variable binding (`#`), and Context variable binding (`@`) operators
- [x] 4.3 Include examples for cross-referencing/joining data with `@`

## 5. String functions

- [x] 5.1 Document all 21 string functions with signatures, parameters, and examples
- [x] 5.2 Include regex usage examples for `$contains`, `$split`, `$match`, `$replace`

## 6. Numeric functions

- [x] 6.1 Document all 12 numeric functions with signatures and examples
- [x] 6.2 Explain round-half-to-even semantics for `$round()`
- [x] 6.3 Document `$formatNumber()` picture string syntax
- [x] 6.4 Document `$formatInteger()` / `$parseInteger()` for word/integer conversions

## 7. Aggregation and Boolean functions

- [x] 7.1 Document `$sum()`, `$max()`, `$min()`, `$average()` with examples
- [x] 7.2 Document `$boolean()` casting rules table, `$not()`, `$exists()`

## 8. Array functions

- [x] 8.1 Document `$count()`, `$append()`, `$sort()`, `$reverse()`, `$shuffle()`, `$distinct()`, `$zip()`
- [x] 8.2 Include custom comparator example for `$sort()`

## 9. Object functions

- [x] 9.1 Document `$keys()`, `$lookup()`, `$spread()`, `$merge()`, `$each()`, `$error()`, `$assert()`, `$type()`

## 10. Date/time functions

- [x] 10.1 Document `$now()`, `$millis()`, `$fromMillis()`, `$toMillis()`
- [x] 10.2 Document ISO 8601 conventions and picture string notation for date/time formatting

## 11. Higher-order functions

- [x] 11.1 Document `$map()`, `$filter()`, `$single()`, `$reduce()`, `$sift()` with callback signatures
- [x] 11.2 Include practical examples for each function

## 12. Programming constructs

- [x] 12.1 Document comment syntax (/* */)
- [x] 12.2 Document variable binding and block expressions
- [x] 12.3 Document lambda function definition and invocation
- [x] 12.4 Document function signatures and type symbols
- [x] 12.5 Document recursion and tail call optimization
- [x] 12.6 Document closures, partial function application, and function composition
- [x] 12.7 Document functions as first-class values

## 13. Processing model

- [x] 13.1 Document the JSONata type system (7 types)
- [x] 13.2 Document sequence flattening rules (4 rules)
- [x] 13.3 Document path processing stages (Map, Filter, Sort, Index, Join, Reduce)

## 14. Object construction and grouping

- [x] 14.1 Document array constructors `[...]` with examples
- [x] 14.2 Document object constructors `{...}` with key/value expression syntax
- [x] 14.3 Document grouping with object key expressions
- [x] 14.4 Document JSON literals and JSONata as a JSON superset

## 15. JavaScript embedding API

- [x] 15.1 Document `jsonata(str[, options])` for expression compilation
- [x] 15.2 Document `expression.evaluate(input[, bindings[, callback]])`
- [x] 15.3 Document `expression.assign(name, value)` and `expression.registerFunction(name, implementation[, signature])`
- [x] 15.4 Document function signature syntax for custom functions
- [x] 15.5 Document guardrails: stack, timeout, sequence length, and RegexEngine

## 16. Node-RED integration notes

- [x] 16.1 Document JSONata usage in the "change" node (Set expression type)
- [x] 16.2 Document JSONata usage in the "switch" node (condition expressions)
- [x] 16.3 Document how `msg` object maps to JSONata context in Node-RED
- [x] 16.4 Provide common Node-RED JSONata patterns and examples

## 17. Validation

- [x] 17.1 Verify YAML frontmatter parses correctly
- [x] 17.2 Verify all function signatures match official JSONata 2.2.0 docs
- [x] 17.3 Verify example expressions are syntactically valid JSONata
- [x] 17.4 Verify the skill is discoverable by the skill loader
