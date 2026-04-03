# Git Commit Message Generation Guidelines

## User Intent: Execute Commit

If the user asks to **commit** (e.g., types "commit" or "and commit" when invoking this command), then after generating the commit message you MUST run the commit:

```bash
# Messages are usually multiline (subject + body). Use multiple -m flags or pipe:
git commit -m "<subject>" -m "<body>"
# Or for complex body: pipe the full message
printf '%s' "<full generated message>" | git commit -F -
```

So the flow is: generate the message → run `git commit` → then print the commit message to the user so they can see what was committed. If the user does not ask to commit, output only the message for copy-pasting.

## Mandatory Verification Checklist

Before responding, you MUST explicitly acknowledge (internally, without any output) that you have completed each of these steps:

[ ] I have read `definity.mdc` & `system-patterns.mdc` for a better overall understanding of this project
[ ] I have checked for staged files with `git diff --staged --name-only`
[ ] I have used `git diff --staged | cat` (if files are staged) or `git diff | cat` (if no files are staged) to review all changes
[ ] I have analyzed the purpose of changes across all files
[ ] I have identified the proper type and scope for this commit
[ ] I will format my commit message according to the required template
[ ] I will Check for similar changes, and if detected, consolidate those changes, without specifying the files changes, and simply outline the changes in a broad manner. Only do step 8 if there are files with specific changes to them which weren't done similarly in other files.
[ ] I will include file-specific analysis in the commit message body
[ ] I reviewed the final output to be certain each list-item belongs to that list. if not, move it to the list of the file it belongs to

If you have not completed any of these steps, stop immediately and complete them before proceeding.

## Format Verification Steps

To ensure correct format implementation, follow these steps:

1. Implement a stricter checklist approach - read each section of rule files completely before responding
2. For format-specific instructions, extract and follow the exact template provided
3. Double-check your response against the rule specifications before submitting
4. When specific formats are required, parse those requirements first before focusing on content

Remember that correct formatting is equally important as content accuracy. The nested markdown format with triple backticks inside triple backticks is required for all commit message suggestions.


## Efficiency Guidelines

## Structure

```
<type>(<scope>): <subject>

[optional body with per-file analysis]
```

## Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `style`: Changes that do not affect the meaning of the code
- `docs`: Documentation only changes
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools
- `perf`: Performance improvements

## Best Practices

1. First line:
   - Maximum 72 characters
   - No period at the end
   - Capitalize first letter

2. When to use body:
   - Complex changes requiring explanation
   - Breaking changes
   - Major refactoring
   - Security-related changes

3. Multiple changes:
   - Use bullet points in body
   - Each point starts with a hyphen
   - Indent with 2 spaces
   - Be a bit more specific regarding changes in each file and how they are linked to each other. analyze all the files one by one AND as a whole.

4. Technical specificity:
   - Wrap function/method names, prop names, parameters, and file references in backticks (e.g., `isCompute`, `usePerformanceData`, `Tag.tsx`)
   - For parameter changes, state the change clearly: "Add `paramName` parameter with default value `true`"
   - For signature changes, specify before and after (e.g., "Change `functionName` signature from `(a, b)` to `(a, b, c?)`")
   - Describe what changed, not why or what the purpose is, unless it can be infered with over 90% accuracy
   - Avoid ambiguous phrases like "improve handling" or "for better performance"
   - Use technical language that reflects actual code changes
   - Focus on facts, not interpretation
   - **Do not speculate** about intent, business logic, or downstream effects
   - Consolidate related changes: when removing/extracting code, group associated imports/exports together (e.g., "Remove `hookName` definition and associated imports" instead of listing each import separately)

## Output Format
markdown within a codeblock, for easier copy-pasting as a commit message in GIT


## Detailed File Analysis Format

Commit messages should include a per-file breakdown of changes, following this structure:

```
refactor(UI): brief overall description of changes

FileA.tsx:
[follow previous section "Write message focusing on"]

FileB.ts:
[follow previous section "Write message focusing on"]
```

This format makes it easier to understand:
- What changed in each file
- The relationship between changes across files
- The impact of the changes
- When listing files, use only the filename (e.g., `FileA.tsx`) and not its full path.

## Examples of Bad & Good Specificity

Bad:
```
refactor(TimeChart): improve time units handling

- Update function parameters to be more flexible
- Fix conditional logic for better compatibility
- Enhance tests to cover more scenarios
- Add helpful TODO comment for future maintainers
```

Good (concise, factual):
```
refactor(TimeChart): replace boolean flag with string parameter for time units

- Change `getOptimalStepAndLines` signature from `(range, targetLines, isTimeUnits: boolean)` to `(range, targetLines, units?: string)`
- Update conditional in `getOptimalStepAndLines` to check `if units === "seconds"` instead of boolean flag
- Remove `isTimeUnits` variable in `getGridYValues` function, directly pass `units` parameter
- Update test cases to use string parameter instead of boolean
```

Excellent (per-file, concise, factual):
```
refactor(UI): centralize component types and styling

TasksTableTaskTypeCell.tsx:
- Replace `{ value: string }` type with `GridRenderCellParams<Task, string>`
- Improved type safety

ComparativeChangeCount.tsx:
- Remove component-specific chip styling from `CHIP_SX` constant
- Keep only fontWeight property in local styling

theme.ts:
- Create global `MuiChip` style configuration in theme
- Move chip background styling and color variant rules from component to theme
- Implement class selectors using `chipClasses` constants
```

## Avoiding Implementation Noise

Focus on **semantic changes** and **functional impact**, not implementation details:

**DO NOT include:**
- Specific CSS class names or Tailwind utilities (e.g., "added `flex items-center gap-1`")
- Styling property details (e.g., "positioned inline with icon and styled with text-xs -ml-0.5")
- Intermediate value transformations (e.g., "via `count={withCount ? count : undefined}`")
- Layout mechanics that don't affect logic (e.g., "update sizing to accommodate badge")
- Individual className modifications that are styling concerns only (unless the git-staged changes are mainly about that)
- Every single code change (e.g., each `?.` operator or type annotation)
- Cosmetic details that don't affect functionality
- `import` statements

**DO include:**
- Prop additions/modifications and their types
- Data flow through component hierarchy
- Conditional logic at a high level (e.g., "when count > 1")
- Component behavior changes that are semantically important
- New elements/components being rendered
- The cohesive idea binding all changes together

**Anti-Pattern (speculative, verbose):**
```
ComponentName.tsx:
- Imported "foo.constants" file
- Add `data-test-id="compare-runs--swap-groups-btn"` attribute for test selector targeting
- Add size constraint to LightBulbIcon with `className="w-5! h-5!"`
- Update className to use flexbox layout (added `flex items-center gap-1`, `min-w-5!`, `min-h-5!`, `w-fit!`)
- Add conditional padding `{ "pr-1.5": count > 1 }` when badge is present
- Render count badge positioned inline with icon and styled with `text-xs -ml-0.5`
```
No need to specifically mention new or modified imports. that is considered "noise" in a good git-commit message.
Also, no need to be overly verbos and mention each added attribute or property and it's value. it's enough to shortly mentioned it was added or modified without specifying from which value to which new value.

**Better Pattern:**
```
ComponentName.tsx:
- Add `data-test-id` attribute to `ComponentName`
- Style adjustments
- Add `count` parameter with default value of 1 to InsightIcon
- Render count badge as `<span>` element only when count is greater than 1
```

"Style adjustments" encompass all layout-reletaed changes such as classnames or `style` values related to layout/colors or any MUI `sx` prop changes.

**Principle:**
From a code reviewer's perspective: what do they need to understand the **functional change**? CSS and styling mechanics are lower-level concerns that obscure the actual feature changes.


## Semantic Commit Messages (Recommended Approach)

Write commit messages that describe the **cohesive idea** behind changes, not implementation details.

### Think Conceptually, Not Line-by-Line

The goal is to answer: "What does this change accomplish?" not "What code lines changed?"

**Bad (lists implementation details):**
```
refactor(SparkInsight): improve component typing and handle undefined data

- Add undefined to insights prop type
- Apply optional chaining to insight property accesses
- Add early return guard when insight is undefined
- Conditionally render dependent components
- Update return types accordingly
```

**Good (describes the unified concept):**
```
refactor(SparkInsight): handle undefined insights data

Component now gracefully handles cases where insights prop is undefined, applying
defensive checks throughout the data flow with early return when no data exists.
```

### When to Use Per-File Format

Only break down by file when **different files solve fundamentally different problems**:

```
refactor(UI): improve error handling and add loading states

ComponentA.tsx:
- Add error boundary wrapper for graceful error display

ComponentB.tsx:
- Add loading spinner during data fetch

utils/errorHandler.ts:
- Extract common error handling logic for reuse
```

**NOT** for thematically unified changes (e.g., adding null safety across a component hierarchy).

### Rule of Thumb

**Single semantic message**: If you can describe the commit in one clear sentence without listing files individually, do that.

**Per-file format**: If changes solve distinct problems across different files, break it down.

Use per-file format sparingly—most changes are unified in purpose.

## Follow these instructions (STRICT - NO EXCEPTIONS):

### STEP 1: DETERMINE SCOPE (MANDATORY FIRST STEP)

```bash
git diff --staged --name-only
```

**CRITICAL DECISION POINT - Choose ONE path only:**

- **IF OUTPUT IS NOT EMPTY** (staged files exist):
  - ✅ Use ONLY `git diff --staged` for ALL analysis
  - ❌ NEVER analyze or mention unstaged files
  - ❌ NEVER look at working tree changes
  - ONLY commit the staged files

- **IF OUTPUT IS EMPTY** (no staged files):
  - ✅ Use ONLY `git diff` for ALL analysis
  - ✅ Analyze ALL working tree changes
  - ❌ NEVER use `--staged` flag
  - ONLY commit all working tree changes

**ABORT if you're unsure which mode applies. Ask the user to clarify.**

### STEP 2: REVIEW CHANGES (APPLY ONLY THE RELEVANT COMMAND)

**IF STAGED FILES EXIST:**
```bash
git diff --staged | cat
```

**IF NO STAGED FILES:**
```bash
git diff | cat
```

**NEVER MIX BOTH COMMANDS. NEVER ANALYZE BOTH STAGED AND UNSTAGED FILES TOGETHER.**

### STEP 3: ANALYZE CHANGES

After reviewing, focus on:
- Primary purpose (determines type)
- Scope of changes (ONLY the files you reviewed in Step 2)
- Breaking changes
- Security implications
- Performance impact

### STEP 4: WRITE MESSAGE FOCUSING ON:
- What changed (in the files you reviewed)
- Why it changed (if not obvious)
- Impact of change
- Avoid implementation details unless crucial
- If a new component was added, mention its name and the fact it was added
- If a component was moved or renamed, mention its old name and new name/path
- If "debug mode" was used, specify for what JSX section or for which purpose it is used for
- For typescript-related changes in a file, simply write the filename and mention shorty if types were added or improved/modified
- For function signature changes, explicitly state the old and new parameters

### STEP 5: EXCLUDE FROM COMMIT MESSAGE
- Code comments or their changes
- "TODO" comments
- Individual import changes (unless they were missing, or consolidate related import removals/additions as "and associated imports" when part of code extraction/refactoring)

## Platform-Specific Notes

### Windows Git Bash Users
When using Git Bash on Windows, paths must use Unix-style format:
- ✅ **Correct**: `/c/projects/definity-app` (forward slashes, drive letter as /c/)
- ❌ **Incorrect**: `c:\projects\definity-app` (backslashes, Windows path format)

**Example command for Windows Git Bash:**
```bash
cd /c/projects/definity-app && git diff --staged --name-only
```

### macOS / Linux Users
Standard Unix paths work as expected:
```bash
cd ~/projects/definity-app && git diff --staged --name-only
```

### Windows PowerShell / CMD Users
Use native Windows paths:
```powershell
cd C:\projects\definity-app; git diff --staged --name-only
```

If using an IDE terminal (like Cursor's built-in terminal), it typically auto-detects and handles these conversions. If commands fail with "No such file or directory" errors, verify:
1. You're using the correct path format for your shell
2. Your shell supports Unix-style paths (Git Bash, WSL) or Windows paths (PowerShell, CMD)
3. Consider running these commands directly in your IDE's terminal which usually handles path translation