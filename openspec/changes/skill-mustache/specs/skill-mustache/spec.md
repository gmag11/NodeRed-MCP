# Spec: Mustache Templating Language Reference

## File
`.github/skills/mustache/SKILL.md`

## Front-matter
```yaml
---
name: mustache
description: >-
  Comprehensive reference for the Mustache templating language (v1.3.0).
  Covers all tag types: variables (escaped and unescaped), sections, inverted sections,
  comments, partials, blocks, parents, and set delimiters. Documents dotted-name resolution,
  implicit iterator, lambdas, and the inheritance extension (blocks/parents).
  Includes Node-RED-specific usage notes for the template node.
---
```

## Description
This specification dictates that `.github/skills/mustache/SKILL.md` must be created containing a comprehensive Mustache templating language reference. The skill covers all tag types, dotted-name resolution, lambdas, inheritance, dynamic names, and practical Node-RED template node usage patterns.

## ADDED Requirements

### Requirement: Mustache skill file
The system SHALL include a skill file at `.github/skills/mustache/SKILL.md` with valid YAML frontmatter containing `name` and `description` fields. The skill SHALL provide LLM guidance on writing Mustache templates for Node-RED template nodes.

#### Scenario: Skill has required frontmatter
- **WHEN** the skill file is loaded by the skill loader
- **THEN** it SHALL be parsed successfully and its metadata SHALL be available for skill discovery

### Requirement: Skill covers Mustache overview and fundamentals
The skill SHALL document Mustache as a logic-less templating language that works by expanding tags using values from a hash or object. It SHALL explain the core concept of "logic-less" — that Mustache has no if statements, else clauses, or for loops, only tags.

#### Scenario: LLM learns Mustache fundamentals
- **WHEN** an LLM reads the skill
- **THEN** it SHALL understand that Mustache is a logic-less templating system applicable to HTML, config files, source code, and anything
- **THEN** it SHALL understand the concept of tags, context stacks, and that a missing key renders as an empty string

### Requirement: Skill covers variable tags
The skill SHALL document variable tags (`{{name}}`) for escaped output, triple mustache (`{{{name}}}`) for unescaped/raw output, and ampersand syntax (`{{&name}}`) for raw output. It SHALL document HTML escaping behavior and the default behavior for missing keys.

#### Scenario: LLM uses variable tags
- **WHEN** an LLM needs to interpolate a value into a template
- **THEN** the skill SHALL show how to use `{{name}}` for HTML-escaped output and `{{{name}}}` or `{{&name}}` for raw unescaped output
- **THEN** it SHALL document that missing keys produce an empty string by default

### Requirement: Skill covers dotted-name resolution
The skill SHALL document dotted-name resolution where dots split a key into multiple keys looked up recursively through the context. It SHALL cover that if an intermediate key is not found, nothing is rendered.

#### Scenario: LLM accesses nested values
- **WHEN** an LLM needs to access a nested object property like `client.name`
- **THEN** the skill SHALL show the dotted notation `{{client.name}}` with examples of multi-level nesting and how lookup stops if a key is not found

### Requirement: Skill covers implicit iterator
The skill SHALL document the implicit iterator (`{{.}}`) which interpolates the current context as a whole. It SHALL explain its special usefulness inside sections iterating over lists of scalars.

#### Scenario: LLM uses implicit iterator
- **WHEN** an LLM needs to render the current context value directly, especially inside a list iteration
- **THEN** the skill SHALL show `{{.}}` syntax with examples of iterating over string arrays inside sections

### Requirement: Skill covers section tags
The skill SHALL document section tags (`{{#section}}...{{/section}}`) and their behavior based on the value type: false/empty list (not rendered), non-empty list (iterated with context set to each item), non-false non-list (rendered once with new context), and lambda (invoked with literal block text).

#### Scenario: LLM uses sections for iteration
- **WHEN** an LLM needs to iterate over a list in a template
- **THEN** the skill SHALL show how to use `{{#items}}...{{/items}}` to render content for each item in a list, with the context inside the block set to the current item

#### Scenario: LLM uses sections for conditionals
- **WHEN** an LLM needs to conditionally show content based on a truthy/falsy value
- **THEN** the skill SHALL explain that sections on non-list values act as truthiness checks: if the value is falsy or empty list, the section is skipped

#### Scenario: LLM uses sections with lambdas
- **WHEN** an LLM needs to transform section content using a function
- **THEN** the skill SHALL show how lambda functions receive the literal block text, process it, and return transformed content

### Requirement: Skill covers inverted section tags
The skill SHALL document inverted section tags (`{{^section}}...{{/section}}`) which render their content when the key does not exist, is false, or is an empty list.

#### Scenario: LLM uses inverted sections
- **WHEN** an LLM needs to show a fallback message when data is missing or empty
- **THEN** the skill SHALL show how to use `{{^items}}No items found{{/items}}` to render content only when the list is empty or the key is missing/false

### Requirement: Skill covers comment tags
The skill SHALL document comment tags (`{{! comment }}`) which are ignored in output and may contain newlines.

#### Scenario: LLM adds comments to templates
- **WHEN** an LLM needs to add explanatory comments to a Mustache template
- **THEN** the skill SHALL show `{{! This is a comment }}` syntax and explain that comments are stripped from output and may span multiple lines

### Requirement: Skill covers partial tags
The skill SHALL document partial tags (`{{> partial}}`) which include external templates at render time, inheriting the calling context. It SHALL cover dynamic names (`{{>*dynamic}}`) for runtime partial selection.

#### Scenario: LLM uses partials
- **WHEN** an LLM needs to include a reusable template fragment
- **THEN** the skill SHALL show `{{> header}}` syntax and explain that partials inherit the calling context

#### Scenario: LLM uses dynamic partials
- **WHEN** an LLM needs to select a partial dynamically at runtime
- **THEN** the skill SHALL show `{{>*dynamicName}}` syntax where `dynamicName` resolves to a string naming the partial to include

### Requirement: Skill covers block and parent tags (inheritance)
The skill SHALL document block tags (`{{$block}}default{{/block}}`) and parent tags (`{{<parent}}...{{/parent}}`) for the optional template inheritance extension. Blocks mark overridable sections; parents include another template and override its blocks.

#### Scenario: LLM uses template inheritance
- **WHEN** an LLM needs to define a base template with overridable sections
- **THEN** the skill SHALL show how blocks define default content and parents can override specific blocks while inheriting others

#### Scenario: LLM uses dynamic parent names
- **WHEN** an LLM needs to select a parent template dynamically
- **THEN** the skill SHALL show `{{<*dynamic}}...{{/*dynamic}}` syntax for dynamic parent template selection

### Requirement: Skill covers set delimiter tags
The skill SHALL document set delimiter tags (`{{=...=}}`) which allow changing the opening and closing delimiters from `{{` and `}}` to custom strings. It SHALL note that custom delimiters may not contain whitespace or the equals sign.

#### Scenario: LLM changes delimiters
- **WHEN** an LLM needs to avoid conflicts with double-braces in the output content (e.g., TeX, Vue, Angular templates)
- **THEN** the skill SHALL show `{{=<% %>=}}` syntax to switch to ERB-style delimiters and how to restore the defaults

### Requirement: Skill covers lambda support
The skill SHALL document that callable objects (functions/lambdas) found during key lookup are invoked. For variable lambdas returning a string, that string SHALL be rendered as a Mustache template. For section lambdas, the literal block text SHALL be passed to the function.

#### Scenario: LLM uses variable lambdas
- **WHEN** an LLM needs a computed value that generates a template string
- **THEN** the skill SHALL show how a variable lambda returns a string that is itself rendered as a Mustache template against the current context

#### Scenario: LLM uses section lambdas
- **WHEN** an LLM needs to wrap or transform section content
- **THEN** the skill SHALL show how a section lambda receives the unrendered block text and returns the transformed result

### Requirement: Skill includes Node-RED usage notes
The skill SHALL include a section documenting how Mustache is used within Node-RED, specifically the "template" node when its format is set to Mustache. It SHALL explain that the template node evaluates Mustache templates against the `msg` object as the context hash.

#### Scenario: LLM applies Mustache in Node-RED context
- **WHEN** an LLM configures a Node-RED template node with Mustache format
- **THEN** the skill SHALL provide guidance on accessing `msg.payload`, `msg.topic`, and other message properties using Mustache tags
- **THEN** the skill SHALL note that `{{payload}}` renders the message payload and dotted names like `{{payload.temperature}}` access nested properties
