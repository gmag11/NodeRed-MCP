## 1. Skill file scaffolding

- [x] 1.1 Create `.github/skills/mustache/` directory
- [x] 1.2 Create `SKILL.md` with valid YAML frontmatter (`name: mustache`, `description`, no `tools` field)
- [x] 1.3 Add introduction section explaining Mustache as a logic-less templating language and its relevance to Node-RED

## 2. Variable tags

- [x] 2.1 Document `{{name}}` escaped variable syntax with HTML escaping behavior
- [x] 2.2 Document `{{{name}}}` triple mustache syntax for unescaped/raw output
- [x] 2.3 Document `{{&name}}` ampersand syntax for raw output
- [x] 2.4 Document default behavior for missing keys (empty string)
- [x] 2.5 Document dotted-name resolution (`{{client.name}}`) with examples
- [x] 2.6 Document implicit iterator (`{{.}}`) for current context interpolation

## 3. Section tags

- [x] 3.1 Document `{{#section}}...{{/section}}` syntax and basic behavior
- [x] 3.2 Document false value / empty list behavior (block not rendered)
- [x] 3.3 Document non-empty list iteration with context switching
- [x] 3.4 Document non-false non-list behavior (single render with new context)
- [x] 3.5 Document section lambdas (function receives literal block text)
- [x] 3.6 Include examples for each section behavior

## 4. Inverted section tags

- [x] 4.1 Document `{{^section}}...{{/section}}` syntax
- [x] 4.2 Document inverted section behavior: renders when key doesn't exist, is false, or is empty list
- [x] 4.3 Include combined section/inverted-section example showing list vs. empty fallback

## 5. Comment tags

- [x] 5.1 Document `{{! comment }}` syntax
- [x] 5.2 Note that comments may contain newlines and are stripped from output

## 6. Partial tags

- [x] 6.1 Document `{{> partial}}` syntax and render-time inclusion behavior
- [x] 6.2 Explain that partials inherit the calling context
- [x] 6.3 Document dynamic names (`{{>*dynamic}}`) for runtime partial selection
- [x] 6.4 Include examples of partial usage and the conceptual expansion model

## 7. Block and parent tags (inheritance)

- [x] 7.1 Document `{{$block}}default{{/block}}` syntax for overridable blocks
- [x] 7.2 Document `{{<parent}}...{{/parent}}` syntax for template inheritance
- [x] 7.3 Explain block overriding behavior and default content fallback
- [x] 7.4 Document dynamic names in parent tags (`{{<*dynamic}}`)
- [x] 7.5 Include practical inheritance examples

## 8. Set delimiter tags

- [x] 8.1 Document `{{=...=}}` syntax for changing delimiters
- [x] 8.2 Note that custom delimiters may not contain whitespace or equals sign
- [x] 8.3 Include example switching to ERB-style delimiters and back

## 9. Lambda support

- [x] 9.1 Document variable lambdas: callable objects invoked with zero arguments
- [x] 9.2 Document that variable lambdas returning a string render it as a Mustache template
- [x] 9.3 Document section lambdas: invoked with literal block text
- [x] 9.4 Include examples for both variable and section lambdas

## 10. Node-RED context and usage notes

- [x] 10.1 Document how Mustache is used in Node-RED's template node (format: mustache)
- [x] 10.2 Explain that templates are evaluated against the `msg` object as the context
- [x] 10.3 Show examples accessing `msg.payload`, `msg.topic`, and nested properties
- [x] 10.4 Note the relationship with other template node formats (plain text, JSONata)

## 11. Final review

- [x] 11.1 Verify all Mustache spec v1.3.0 tag types are covered
- [x] 11.2 Verify all examples are syntactically correct
- [x] 11.3 Verify YAML frontmatter is valid
- [x] 11.4 Verify skill is discoverable via `list-skills` tool
