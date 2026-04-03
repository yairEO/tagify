# PR Description Generation Rules

## Purpose
Rules for generating high-quality PR descriptions by analyzing branch changes.

## User Intent: Update vs Print Only

- **If user asks to update** (e.g., "update", "update the pr"): Print the title + description, then run `gh pr edit --title "..." --body "..."` to update the PR. If `gh` is not available or not authenticated, inform the user that [GitHub CLI](https://cli.github.com/) (`gh`) is required for automatic updates—still print the content for manual copy-paste.
- **If user does NOT ask to update**: Only print the title + description in a code block. Do not run any `gh` commands.

## Key Insights

1. **Information Gathering Is Critical**
   - Branch names often reveal intent and scope
   - **Full commit messages are essential** - they contain complete rationale and implementation details, not just subject lines
   - Component relationships reveal the broader impact of changes
   - Code search provides deeper context than git commands alone

2. **Structured Organization Matters**
   - Categorize changes into logical groups
   - Use nested bullet points for hierarchy
   - Present information in order of importance
   - Balance completeness with conciseness

3. **Output Format Is Important**
   - Always provide markdown in a code block for easy copying
   - Avoid explanatory text around the description
   - Use consistent formatting for predictability
   - Include proper headings and emphasis

4. **Context Matters Most**
   - Explain not just what changed but why **only when explicitly stated in commit messages**
   - **Avoid speculative reasoning** - do not guess why changes were made with "for..." explanations unless the commit message clearly states the reason
   - Connect technical changes to functional outcomes when evident from the code/commits
   - Highlight relationships between components
   - Provide the broader purpose of changes to aid reviewers

## Key Steps

1. **Gather Information EFFICIENTLY**
   - **Use parallel tool calls** - gather all basic information at once:
     - `git branch --show-current`
     - `git log --no-merges --format="%H|%s|%b" origin/[base_branch]..HEAD | cat` ("base_branch" default is "main")
     - `git diff --name-only origin/main..HEAD | cat`
   - **Trust commit messages first** - they contain the complete rationale from developers who made the changes
   - **Stop digging when you have enough** - don't over-investigate obvious changes
   - Only read specific files if the commit messages are unclear or you need to understand complex component relationships

2. **Analyze Changes EFFICIENTLY**
   - **Start with commit message patterns** - they usually reveal the main categories
   - **Use the file list strategically** - group files by type/purpose to identify change categories
   - **Don't investigate version diffs** unless the commit message is unclear about what changed
   - **Avoid redundant git commands** - if you have the commit message and file list, that's usually sufficient

3. **Format Description**
   - Use proper markdown inside a code block for easy copying
   - Start with a clear title reflecting the branch purpose
   - Group changes in logical categories with nested bullet points
   - Highlight what was changed and why **only when explicitly stated in commit messages**
   - **Do not add speculative "for..." explanations** unless the reason is clearly documented in commits
   - Keep descriptions concise but informative
   - wrap technical terms, such as file/function/component names, with backticks

4. **Structure Template**
```markdown
# [Brief Title Based on Branch Name/Purpose]

## What's Changed

- **[Category of Change]**: [High-level description]
  - [Specific detail 1]
  - [Specific detail 2]

- **[Another Category]**:
  - [Details]

[Optional: Brief concluding statement about overall purpose/impact]
```

5. **Response Format**
   - Always wrap the final PR description in a markdown code block for easy copying
   - Avoid explanatory text around the description itself
   - Ensure the description stands on its own without requiring additional context

## Common Categories
- Component Creation/Refactoring
- UI/UX Enhancements
- Performance Improvements
- Architecture/Structure Changes
- Bug Fixes
- Documentation Updates
- Testing Improvements

## Anti-Patterns to Avoid

### Information Gathering Anti-Patterns
- **Sequential git commands** - Use parallel tool calls for basic information gathering
- **Over-investigating version changes** - Don't spend multiple commands figuring out exact version diffs unless critical
- **Ignoring commit messages** - They contain the developer's intent; don't second-guess them
- **Redundant file analysis** - If commit message + file list tells the story, stop there
- **Avoid changes which weren't made in this branch** - some changes might have been merged into this branch. ignore such by identifying them using git.

### Analysis Anti-Patterns
- **Speculative reasoning** - Don't add "for..." explanations unless explicitly stated in commits
- **Deep-diving obvious changes** - Package updates, lint fixes, and configuration changes are usually straightforward
- **Perfectionism** - A good PR description doesn't need to explain every technical detail

### Efficiency Guidelines
- **6 git commands maximum** for most PR descriptions
- **Parallel > Sequential** - Gather all basic info at once, then analyze
- **Trust the obvious** - If branch name + commit messages are clear, don't over-analyze
- **Commit messages are authoritative** - They're written by people who know exactly what they changed and why
