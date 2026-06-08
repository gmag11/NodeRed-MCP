---
name: mustache
description: >-
  Comprehensive reference for the Mustache templating language (v1.3.0).
  Covers all tag types: variables (escaped and unescaped), sections, inverted sections,
  comments, partials, blocks, parents, and set delimiters. Documents dotted-name resolution,
  implicit iterator, lambdas, and the inheritance extension (blocks/parents).
  Includes Node-RED-specific usage notes for the template node.
---

# Mustache Templating Language Reference

Comprehensive reference for Mustache — a **logic-less templating language** that works by expanding tags in a template using values provided in a hash or object. Mustache is one of the supported formats in Node-RED's "template" node.

Mustache can be used for HTML, config files, source code — anything. It is called "logic-less" because there are no if statements, else clauses, or for loops. Instead there are only **tags**. Some tags are replaced with a value, some nothing, and others a series of values.

> **Version:** Mustache spec v1.3.0 (including optional extensions for lambdas and inheritance)
> **Try it:** [mustache.github.io](http://mustache.github.io/)
> **Docs:** [mustache(5) man page](https://mustache.github.io/mustache.5.html)

---

## Quick Example

A typical Mustache template:

```mustache
Hello {{name}}
You have just won {{value}} dollars!
{{#in_ca}}
Well, {{taxed_value}} dollars, after taxes.
{{/in_ca}}
```

Given the following hash:

```json
{
  "name": "Chris",
  "value": 10000,
  "taxed_value": 6000,
  "in_ca": true
}
```

Will produce:

```
Hello Chris
You have just won 10000 dollars!
Well, 6000 dollars, after taxes.
```

---

## Tag Types

Tags are indicated by double mustaches. `{{person}}` is a tag, as is `{{#person}}`. In both examples, `person` is the key or tag key.

### Variables

The most basic tag type. A `{{name}}` tag will try to find the `name` key in the current context. If there is no `name` key, parent contexts are checked recursively. If the top context is reached and the key is still not found, nothing is rendered (empty string).

**HTML Escaping:** All variables are HTML escaped by default. Use triple mustache `{{{name}}}` or ampersand syntax `{{&name}}` for raw unescaped output.

```mustache
* {{name}}
* {{age}}
* {{company}}
* {{{company}}}
```

```json
{
  "name": "Chris",
  "company": "<b>GitHub</b>"
}
```

Output:
```
* Chris
*
* &lt;b&gt;GitHub&lt;/b&gt;
* <b>GitHub</b>
```

> **Note:** The `age` key is missing, so nothing is rendered for `{{age}}`.

#### Dotted Names

If the key contains dots, it is split on the dots to obtain multiple keys. Each key is looked up in sequence through nested contexts. If any intermediate key is not found, nothing is rendered.

```mustache
* {{client.name}}
* {{age}}
* {{client.company.name}}
* {{{company.name}}}
```

```json
{
  "client": {
    "name": "Chris & Friends",
    "age": 50
  },
  "company": {
    "name": "<b>GitHub</b>"
  }
}
```

Output:
```
* Chris &amp; Friends
*
*
* <b>GitHub</b>
```

#### Implicit Iterator (`{{.}}`)

If the name consists of only a dot (`.`), the current context value is interpolated as a whole. This is especially useful inside sections iterating over lists of scalars (see Sections below).

```mustache
* {{.}}
```

Current context:
```
"Hello!"
```

Output:
```
* Hello!
```

#### Variable Lambdas

If any value found during lookup is a callable object (function/lambda), it is invoked with zero arguments. If the lambda returns a string, that string is rendered as a Mustache template before interpolation (using default delimiters against the current context).

```mustache
* {{time.hour}}
* {{today}}
```

```json
{
  "time": {
    "hour": 0,
    "minute": 0,
    "second": 0
  },
  "today": "{{year}}-{{month}}-{{day}}",
  "year": 1970,
  "month": 1,
  "day": 1
}
```

Output:
```
* 0
* 1970-1-1
```

---

### Sections

Sections render blocks of text zero or more times, depending on the value of the key in the current context. A section begins with a pound (`#`) and ends with a slash (`/`): `{{#person}}...{{/person}}`.

The behavior is determined by the value of the key lookup:

#### False Values or Empty Lists

If the key exists and has a value of `false` or an empty list, the content between the tags is **not displayed**.

```mustache
Shown.
{{#person}}
  Never shown!
{{/person}}
```

```json
{ "person": false }
```

Output:
```
Shown.
```

#### Non-Empty Lists

If the key value is a non-empty list, the block is rendered **once for each item**. The context inside the block is set to the current item. This is how you loop over collections.

```mustache
{{#repo}}
  <b>{{name}}</b>
{{/repo}}
```

```json
{
  "repo": [
    { "name": "resque" },
    { "name": "hub" },
    { "name": "rip" }
  ]
}
```

Output:
```
  <b>resque</b>
  <b>hub</b>
  <b>rip</b>
```

Using the implicit iterator with a list of scalars:

```mustache
{{#repo}}
  <b>{{.}}</b>
{{/repo}}
```

```json
{ "repo": ["resque", "hub", "rip"] }
```

Output:
```
  <b>resque</b>
  <b>hub</b>
  <b>rip</b>
```

#### Non-False Values (Not a List)

When the value is non-false but not a list, the block is rendered **once** with the value used as the context.

```mustache
{{#person?}}
  Hi {{name}}!
{{/person?}}
```

```json
{ "person?": { "name": "Jon" } }
```

Output:
```
  Hi Jon!
```

#### Section Lambdas

When the key value is a callable object (function/lambda), the function is invoked and passed the **literal block text** (unrendered — `{{tags}}` are not expanded). The return value replaces the section content. If the lambda returns a string, it is rendered using the same delimiters as the original section.

```mustache
{{#wrapped}}{{name}} is awesome.{{/wrapped}}
```

```json
{
  "name": "Willy",
  "wrapped": "&lt;b&gt;{{name}} is awesome.&lt;/b&gt;"
}
```

Output:
```
<b>Willy is awesome.</b>
```

---

### Inverted Sections

An inverted section begins with a caret (`^`) and ends with a slash (`/`): `{{^person}}...{{/person}}`. Inverted sections render their content **once** when the key doesn't exist, is `false`, or is an empty list — the inverse of regular sections.

```mustache
{{#repo}}
  <b>{{name}}</b>
{{/repo}}
{{^repo}}
  No repos :(
{{/repo}}
```

```json
{ "repo": [] }
```

Output:
```
  No repos :(
```

---

### Comments

Comments begin with a bang (`!`) and are **ignored** in output. Comments may contain newlines.

```mustache
<h1>Today{{! ignore me }}.</h1>
```

Output:
```
<h1>Today.</h1>
```

---

### Partials

Partials begin with a greater than sign (`>`): `{{> box}}`. Partials are rendered at **runtime** (not compile time), so recursive partials are possible (just avoid infinite loops).

Partials **inherit the calling context**. You don't need to pass data explicitly — any key available in the parent template is also available inside the partial.

```
base.mustache:
<h2>Names</h2>
{{#names}}
  {{> user}}
{{/names}}

user.mustache:
<strong>{{name}}</strong>
```

This can be thought of as a single, expanded template:

```mustache
<h2>Names</h2>
{{#names}}
  <strong>{{name}}</strong>
{{/names}}
```

#### Dynamic Names

Partials can be loaded dynamically at runtime using an asterisk followed by a dotted name: `{{>*dynamic}}`. The dotted name resolves to a string that names the partial to include.

```
main.mustache:
Hello {{>*dynamic}}

world.template:
everyone!
```

```json
{ "dynamic": "world" }
```

Output:
```
Hello everyone!
```

---

### Blocks and Parents (Template Inheritance)

Blocks and parents are part of the **optional inheritance extension**. They enable template inheritance patterns where a base template defines overridable sections.

#### Blocks

A block begins with a dollar sign (`$`) and ends with a slash: `{{$title}}...{{/title}}`. Blocks mark parts of a template that may be overridden by a parent template. If not overridden, the block's default content is rendered.

```
article.mustache:
<h1>{{$title}}The News of Today{{/title}}</h1>
{{$body}}
<p>Nothing special happened.</p>
{{/body}}
```

Rendered directly:
```
<h1>The News of Today</h1>
<p>Nothing special happened.</p>
```

#### Parents

A parent begins with a less than sign (`<`) and ends with a slash: `{{<article}}...{{/article}}`. Like a partial, a parent lets you include another template. **Unlike** a partial, a parent also lets you **override blocks** from the included template.

Content inside a parent that is not within a block override is ignored (acts like a comment).

```mustache
{{<article}}
  Never shown
  {{$body}}
    {{#headlines}}
    <p>{{.}}</p>
    {{/headlines}}
  {{/body}}
{{/article}}
```

```json
{
  "headlines": [
    "A pug's handler grew mustaches.",
    "What an exciting day!"
  ]
}
```

Output (using article.mustache from above):
```
<h1>The News of Today</h1>
<p>A pug's handler grew mustaches.</p>
<p>What an exciting day!</p>
```

#### Dynamic Names in Parents

Parent templates can also use dynamic names with `{{<*dynamic}}...{{/*dynamic}}`:

```
{{!normal.mustache}}
{{$text}}Here goes nothing.{{/text}}

{{!bold.mustache}}
<b>{{$text}}Here also goes nothing but it's bold.{{/text}}</b>

{{!dynamic.mustache}}
{{<*dynamic}}
  {{$text}}Hello World!{{/text}}
{{/*dynamic}}
```

```json
{ "dynamic": "bold" }
```

Output:
```
<b>Hello World!</b>
```

---

### Set Delimiter

Set Delimiter tags start with an equals sign and change the tag delimiters from `{{` and `}}` to custom strings. Custom delimiters **may not contain whitespace or the equals sign**.

This is useful for languages like TeX where double-braces may occur in the text and are awkward to use for markup.

```mustache
* {{default_tags}}
{{=<% %>=}}
* <% erb_style_tags %>
<%={{ }}=%>
* {{ default_tags_again }}
```

Output:
```
* default_tags_value
* erb_style_tags_value
* default_tags_again_value
```

---

## Lambda Functions Deep Dive

Lambdas (callable objects) are an optional extension in the Mustache spec v1.3.0. They behave differently depending on context:

| Context | Lambda behavior |
|---------|----------------|
| **Variable** `{{lambda}}` | Invoked with zero args. If it returns a string, that string is rendered as a Mustache template (with default delimiters) against the current context. |
| **Section** `{{#lambda}}...{{/lambda}}` | Invoked with the **literal block text** (unrendered). Return value replaces the section. If a string, rendered with the same delimiters as the section. |

**Variable lambda example** — template-generating function:

```mustache
{{#items}}
  <li>{{name}}: {{display}}</li>
{{/items}}
```

```json
{
  "items": [
    { "name": "Alice", "value": 5 },
    { "name": "Bob", "value": 0 }
  ],
  "display": "{{#value}}{{.}}{{/value}}{{^value}}N/A{{/value}}"
}
```

**Section lambda example** — wrapping/filtering:

If `wrapped` is a function that takes text and returns `<b>${text}</b>`, then `{{#wrapped}}{{name}}{{/wrapped}}` effectively wraps the name in bold tags.

---

## Summary: Tag Reference Table

| Tag | Syntax | Purpose |
|-----|--------|---------|
| Variable (escaped) | `{{name}}` | Interpolate with HTML escaping |
| Variable (unescaped) | `{{{name}}}` or `{{&name}}` | Interpolate raw, no escaping |
| Dotted name | `{{a.b.c}}` | Traverse nested objects |
| Implicit iterator | `{{.}}` | Interpolate current context |
| Section | `{{#key}}...{{/key}}` | Loop / conditional / context switch |
| Inverted section | `{{^key}}...{{/key}}` | Render when false/empty/missing |
| Comment | `{{! text }}` | Ignored, may span lines |
| Partial | `{{> name}}` | Include another template |
| Dynamic partial | `{{>*name}}` | Include template by name resolution |
| Block | `{{$key}}...{{/key}}` | Overridable default content |
| Parent | `{{<name}}...{{/name}}` | Include template with block overrides |
| Dynamic parent | `{{<*name}}...{{/*name}}` | Parent by name resolution |
| Set delimiter | `{{=...=}}` | Change tag delimiters |

---

## Node-RED Template Node Usage

In Node-RED, the **template** node supports Mustache as one of its output formats. When the template node's **Format** is set to **Mustache template**, the template is evaluated against the `msg` object as the context hash.

### Accessing Message Properties

| Mustache expression | Accesses |
|---------------------|----------|
| `{{payload}}` | `msg.payload` |
| `{{topic}}` | `msg.topic` |
| `{{payload.temperature}}` | `msg.payload.temperature` (nested) |
| `{{payload.sensor.name}}` | `msg.payload.sensor.name` (deeply nested) |
| `{{{payload}}}` | `msg.payload` (raw, unescaped) |

### Common Patterns

**Conditional rendering with sections:**
```mustache
{{#payload.active}}
  Sensor is active.
{{/payload.active}}
```

**Iterating over an array in payload:**
```mustache
{{#payload}}
  <li>{{name}}: {{value}}</li>
{{/payload}}
```

**Fallback with inverted sections:**
```mustache
{{#payload}}
  Data: {{.}}
{{/payload}}
{{^payload}}
  No data received.
{{/payload}}
```

**Comments for template documentation:**
```mustache
{{! This template formats sensor readings as HTML }}
<h2>Sensor: {{topic}}</h2>
```

### Relationship to Other Template Formats

Node-RED's template node supports multiple formats:

| Format | Behavior |
|--------|----------|
| **Mustache template** | Evaluated against `msg` as Mustache (this skill) |
| **Plain text** | Literal text, no substitution |
| **JSONata** | Evaluated as a JSONata expression against `msg` |

When using Mustache format, the entire template is processed by the Mustache engine before being assigned to `msg.payload`. Use Mustache when you need simple variable substitution with HTML escaping and section-based iteration, without the complexity of a full expression language.

> **Note:** Mustache is logic-less. For complex data transformations, filtering, or calculations, use the **change** node with JSONata expressions instead.
