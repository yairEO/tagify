Create `{filename}.context.md` documenting session learnings:

## Structure
1. **Decisions** - choices made + rationale (why > what)
2. **Code Changes** - file:line refs, before→after patterns
3. **Domain Model** - entities, relationships, constraints discovered
4. **Unresolved** - open questions, ambiguities, edge cases deferred
5. **Dependencies** - what relies on what (directed graph)

## Format Rules
- Use YAML/structured blocks over prose
- File paths as anchors: `path/file.ts:L10-25`
- Abbreviate obvious context (e.g., `cfg` not `configuration`)
- Omit articles, filler words
- Prefer enums/lists over sentences
- Include decision trees for conditional logic

## Graph (if complex relationships exist)
graph:
  nodes: [A, B, C]
  edges:
    - [A, B, {type: depends, weight: high}]
    - [B, C, {type: triggers, condition: "X"}]
