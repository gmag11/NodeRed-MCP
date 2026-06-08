## 1. Skill file scaffolding

- [ ] 1.1 Create `.github/skills/jsonata/` directory
- [ ] 1.2 Create `SKILL.md` with valid YAML frontmatter (`name: jsonata`, `description`, no `tools` field)
- [ ] 1.3 Add introduction section explaining JSONata as a lightweight query/transformation language and its relevance to Node-RED

## 2. Core syntax and path navigation

- [ ] 2.1 Document dot notation for object field access with examples
- [ ] 2.2 Document bracket notation for array indexing (zero-offset, negative indexing)
- [ ] 2.3 Document wildcards (`*` for single-level, `**` for descendants)
- [ ] 2.4 Document context variable `$` and root variable `$$`
- [ ] 2.5 Document predicate expressions with equality, comparison, and Boolean combinations
- [ ] 2.6 Document singleton array equivalence and the `[]` array-forcing syntax

## 3. Operators reference

- [ ] 3.1 Document numeric operators (+, -, *, /, %, .. range)
- [ ] 3.2 Document comparison operators (=, !=, >, <, >=, <=, in)
- [ ] 3.3 Document Boolean operators (and, or)
- [ ] 3.4 Document string concatenation operator (&)
- [ ] 3.5 Document conditional ternary (? :), elvis/Default (?:), and coalescing (??) operators
- [ ] 3.6 Document variable binding (:=), function chaining (~>), and object transform (|...|...|) operators

## 4. Path operators

- [ ] 4.1 Document Map (`.`), Filter (`[...]`), Order-by (`^(...)`), and Reduce (`{...}`) operators
- [ ] 4.2 Document Parent (`%`), Positional variable binding (`#`), and Context variable binding (`@`) operators
- [ ] 4.3 Include examples for cross-referencing/joining data with `@`

## 5. String functions

- [ ] 5.1 Document all 21 string functions with signatures, parameters, and examples
- [ ] 5.2 Include regex usage examples for `$contains`, `$split`, `$match`, `$replace`

## 6. Numeric functions

- [ ] 6.1 Document all 12 numeric functions with signatures and examples
- [ ] 6.2 Explain round-half-to-even semantics for `$round()`
- [ ] 6.3 Document `$formatNumber()` picture string syntax
- [ ] 6.4 Document `$formatInteger()` / `$parseInteger()` for word/integer conversions

## 7. Aggregation and Boolean functions

- [ ] 7.1 Document `$sum()`, `$max()`, `$min()`, `$average()` with examples
- [ ] 7.2 Document `$boolean()` casting rules table, `$not()`, `$exists()`

## 8. Array functions

- [ ] 8.1 Document `$count()`, `$append()`, `$sort()`, `$reverse()`, `$shuffle()`, `$distinct()`, `$zip()`
- [ ] 8.2 Include custom comparator example for `$sort()`

## 9. Object functions

- [ ] 9.1 Document `$keys()`, `$lookup()`, `$spread()`, `$merge()`, `$each()`, `$error()`, `$assert()`, `$type()`

## 10. Date/time functions

- [ ] 10.1 Document `$now()`, `$millis()`, `$fromMillis()`, `$toMillis()`
- [ ] 10.2 Document ISO 8601 conventions and picture string notation for date/time formatting

## 11. Higher-order functions

- [ ] 11.1 Document `$map()`, `$filter()`, `$single()`, `$reduce()`, `$sift()` with callback signatures
- [ ] 11.2 Include practical examples for each function

## 12. Programming constructs

- [ ] 12.1 Document comment syntax (/* */)
- [ ] 12.2 Document variable binding and block expressions
- [ ] 12.3 Document lambda function definition and invocation
- [ ] 12.4 Document function signatures and type symbols
- [ ] 12.5 Document recursion and tail call optimization
- [ ] 12.6 Document closures, partial function application, and function composition
- [ ] 12.7 Document functions as first-class values

## 13. Processing model

- [ ] 13.1 Document the JSONata type system (7 types)
- [ ] 13.2 Document sequence flattening rules (4 rules)
- [ ] 13.3 Document path processing stages (Map, Filter, Sort, Index, Join, Reduce)

## 14. Object construction and grouping

- [ ] 14.1 Document array constructors `[...]` with examples
- [ ] 14.2 Document object constructors `{...}` with key/value expression syntax
- [ ] 14.3 Document grouping with object key expressions
- [ ] 14.4 Document JSON literals and JSONata as a JSON superset

## 15. JavaScript embedding API

- [ ] 15.1 Document `jsonata(str[, options])` for expression compilation
- [ ] 15.2 Document `expression.evaluate(input[, bindings[, callback]])`
- [ ] 15.3 Document `expression.assign(name, value)` and `expression.registerFunction(name, implementation[, signature])`
- [ ] 15.4 Document function signature syntax for custom functions
- [ ] 15.5 Document guardrails: stack, timeout, sequence length, and RegexEngine

## 16. Node-RED integration notes

- [ ] 16.1 Document JSONata usage in the "change" node (Set expression type)
- [ ] 16.2 Document JSONata usage in the "switch" node (condition expressions)
- [ ] 16.3 Document how `msg` object maps to JSONata context in Node-RED
- [ ] 16.4 Provide common Node-RED JSONata patterns and examples

## 17. Validation

- [ ] 17.1 Verify YAML frontmatter parses correctly
- [ ] 17.2 Verify all function signatures match official JSONata 2.2.0 docs
- [ ] 17.3 Verify example expressions are syntactically valid JSONata
- [ ] 17.4 Verify the skill is discoverable by the skill loader
