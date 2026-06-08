# Spec: JSONata Expression Language Reference

## File
`.github/skills/jsonata/SKILL.md`

## Front-matter
```yaml
---
name: jsonata
description: >-
  Comprehensive reference for the JSONata expression language.
  Covers syntax, path navigation, predicates, operators, all built-in function
  categories (string, numeric, aggregation, boolean, array, object, date/time,
  higher-order), programming constructs (variables, functions, recursion),
  the processing model (sequences, flattening), and the JavaScript embedding API.
  Includes Node-RED-specific usage notes for change, switch, and inject nodes.
---
```

## Description
This specification dictates that `.github/skills/jsonata/SKILL.md` must be created containing a comprehensive JSONata expression language reference. The skill covers syntax, path navigation operators, predicate expressions, all operator categories, the complete built-in function library, programming constructs, the processing model, and the JavaScript embedding/extension API.

## ADDED Requirements

### Requirement: JSONata skill file
The system SHALL include a skill file at `.github/skills/jsonata/SKILL.md` with valid YAML frontmatter containing `name` and `description` fields. The skill SHALL provide LLM guidance on writing JSONata expressions for Node-RED flow nodes.

#### Scenario: Skill has required frontmatter
- **WHEN** the skill file is loaded by the skill loader
- **THEN** it SHALL be parsed successfully and its metadata SHALL be available for skill discovery

### Requirement: Skill covers JSONata overview and syntax basics
The skill SHALL document JSONata as a lightweight query and transformation language for JSON data. It SHALL explain the core concept that JSONata is a superset of JSON and that any valid JSON document is a valid JSONata expression.

#### Scenario: LLM learns JSONata fundamentals
- **WHEN** an LLM reads the skill
- **THEN** it SHALL understand that JSONata is a query/transformation language inspired by XPath 3.1 location path semantics
- **THEN** it SHALL understand the concept of result sequences and sequence flattening

### Requirement: Skill covers path navigation
The skill SHALL document JSONata path navigation syntax including dot notation for object field access and bracket notation for array indexing. It SHALL cover zero-offset array indexing, negative indexing from the end, wildcards (`*` and `**`), and the context variable `$` and root variable `$$`.

#### Scenario: LLM writes path expressions
- **WHEN** an LLM needs to extract data from a JSON structure
- **THEN** the skill SHALL show how to use dot notation (e.g., `Address.City`), array indexing (e.g., `Phone[0].number`), wildcards (`Address.*`), and descendant traversal (`**.Postcode`)

### Requirement: Skill covers predicate expressions
The skill SHALL document predicate filtering using `[expr]` syntax. It SHALL cover equality predicates, comparison predicates, Boolean combination predicates, and singleton array equivalence with `[]`.

#### Scenario: LLM writes filtered queries
- **WHEN** an LLM needs to filter array items
- **THEN** the skill SHALL show how to use predicates like `Phone[type='mobile']` and combined predicates like `Phone[type='office'].number`

### Requirement: Skill covers all operator categories
The skill SHALL document all JSONata operator categories: numeric (+, -, *, /, %, ..), comparison (=, !=, >, <, >=, <=, in), Boolean (and, or), string concatenation (&), conditional (? :), elvis/Default (?:), coalescing (??), variable binding (:=), function chaining (~>), and object transform (|...|...|).

#### Scenario: LLM uses operators correctly
- **WHEN** an LLM needs to combine or transform data
- **THEN** the skill SHALL provide the correct operator syntax and precedence information for each operator category

### Requirement: Skill covers string functions
The skill SHALL document all JSONata string functions: `$string()`, `$length()`, `$substring()`, `$substringBefore()`, `$substringAfter()`, `$uppercase()`, `$lowercase()`, `$trim()`, `$pad()`, `$contains()`, `$split()`, `$join()`, `$match()`, `$replace()`, `$eval()`, `$base64encode()`, `$base64decode()`, `$encodeUrlComponent()`, `$encodeUrl()`, `$decodeUrlComponent()`, `$decodeUrl()`.

#### Scenario: LLM uses string functions
- **WHEN** an LLM needs to manipulate strings in a JSONata expression
- **THEN** the skill SHALL provide function signatures, parameter descriptions, and examples for each string function

### Requirement: Skill covers numeric functions
The skill SHALL document all JSONata numeric functions: `$number()`, `$abs()`, `$floor()`, `$ceil()`, `$round()`, `$power()`, `$sqrt()`, `$random()`, `$formatNumber()`, `$formatBase()`, `$formatInteger()`, `$parseInteger()`.

#### Scenario: LLM uses numeric functions
- **WHEN** an LLM needs to perform numeric operations in a JSONata expression
- **THEN** the skill SHALL provide function signatures, rounding semantics (round-half-to-even), and formatting options

### Requirement: Skill covers aggregation functions
The skill SHALL document all JSONata aggregation functions: `$sum()`, `$max()`, `$min()`, `$average()`.

#### Scenario: LLM uses aggregation functions
- **WHEN** an LLM needs to aggregate numeric values
- **THEN** the skill SHALL show how to use aggregation functions on sequences produced by path expressions

### Requirement: Skill covers Boolean functions
The skill SHALL document all JSONata Boolean functions: `$boolean()`, `$not()`, `$exists()`.

#### Scenario: LLM uses Boolean functions
- **WHEN** an LLM needs to evaluate truthiness or existence
- **THEN** the skill SHALL provide casting rules for `$boolean()` and the distinction between `$not()` and `$exists()`

### Requirement: Skill covers array functions
The skill SHALL document all JSONata array functions: `$count()`, `$append()`, `$sort()`, `$reverse()`, `$shuffle()`, `$distinct()`, `$zip()`.

#### Scenario: LLM uses array functions
- **WHEN** an LLM needs to manipulate arrays
- **THEN** the skill SHALL show how to count items, append arrays, sort with custom comparators, and zip arrays

### Requirement: Skill covers object functions
The skill SHALL document all JSONata object functions: `$keys()`, `$lookup()`, `$spread()`, `$merge()`, `$each()`, `$error()`, `$assert()`, `$type()`.

#### Scenario: LLM uses object functions
- **WHEN** an LLM needs to inspect or manipulate objects
- **THEN** the skill SHALL provide function signatures and examples for each object function

### Requirement: Skill covers date/time functions
The skill SHALL document all JSONata date/time functions: `$now()`, `$millis()`, `$fromMillis()`, `$toMillis()`. It SHALL cover ISO 8601 format conventions and the picture string notation from XPath F&O 3.1.

#### Scenario: LLM uses date/time functions
- **WHEN** an LLM needs to format or parse timestamps
- **THEN** the skill SHALL show how to use `$now()` for current timestamps, `$fromMillis()` with picture strings, and `$toMillis()` for parsing

### Requirement: Skill covers higher-order functions
The skill SHALL document all JSONata higher-order functions: `$map()`, `$filter()`, `$single()`, `$reduce()`, `$sift()`. It SHALL cover function signatures for callback parameters and common patterns.

#### Scenario: LLM uses higher-order functions
- **WHEN** an LLM needs to apply functional programming patterns
- **THEN** the skill SHALL show how to map, filter, reduce, and sift with lambda functions

### Requirement: Skill covers programming constructs
The skill SHALL document JSONata programming constructs: comments (/* */), conditional logic (?:, ?:, ??), variable binding (:=), function definition (lambda syntax), function signatures, recursion, tail call optimization, higher-order functions, closures, partial function application, and function chaining.

#### Scenario: LLM writes complex expressions
- **WHEN** an LLM needs to write multi-step transformations
- **THEN** the skill SHALL show how to use variable binding with blocks, define and invoke lambda functions, and chain operations with ~>

### Requirement: Skill covers the JSONata processing model
The skill SHALL document the JSONata type system (string, number, Boolean, null, object, array, function), sequence flattening rules, and the path processing stages (Map, Filter, Sort, Index, Join, Reduce).

#### Scenario: LLM understands expression evaluation
- **WHEN** an LLM needs to predict expression results
- **THEN** the skill SHALL explain how sequences are flattened, how singleton values are equivalent to their contained value, and how path stages compose

### Requirement: Skill covers path operators
The skill SHALL document all JSONata path operators: `.` (Map), `[...]` (Filter), `^(...)` (Order-by), `{...}` (Reduce), `*` (Wildcard), `**` (Descendants), `%` (Parent), `#` (Positional variable binding), `@` (Context variable binding).

#### Scenario: LLM uses advanced path operators
- **WHEN** an LLM needs to sort, join, or access parent objects
- **THEN** the skill SHALL show how to use order-by, context binding for cross-referencing, and the parent operator

### Requirement: Skill covers JavaScript embedding API
The skill SHALL document the JSONata JavaScript API: `jsonata(str[, options])`, `expression.evaluate(input[, bindings[, callback]])`, `expression.assign(name, value)`, `expression.registerFunction(name, implementation[, signature])`. It SHALL cover function signature syntax and guardrails configuration (stack, timeout, sequence, RegexEngine).

#### Scenario: LLM understands embedding JSONata
- **WHEN** an LLM needs to explain how JSONata can be embedded in Node.js applications
- **THEN** the skill SHALL provide the API reference, function signature syntax, and guardrails configuration examples

### Requirement: Skill includes Node-RED usage notes
The skill SHALL include a section documenting how JSONata is used within Node-RED nodes, specifically the "change" node (Set with JSONata expression type), the "switch" node (condition expressions), and general expression evaluation contexts.

#### Scenario: LLM applies JSONata in Node-RED context
- **WHEN** an LLM configures a Node-RED node that uses JSONata expressions
- **THEN** the skill SHALL provide guidance on which JSONata subset is most relevant and how expressions interact with the `msg` object context

### Requirement: Skill covers object construction and result formatting
The skill SHALL document JSONata array constructors `[...]`, object constructors `{...}`, JSON literals, and the grouping/aggregation pattern with object key expressions.

#### Scenario: LLM formats query results
- **WHEN** an LLM needs to transform query results into a specific JSON structure
- **THEN** the skill SHALL show how to use array and object constructors to shape output, and how to group data using object key expressions
