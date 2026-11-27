# Tasks

## Rules for whoever applies these tasks

Read all of these before starting. They apply to every task.

1. **Where.** Run every command from the project root. The branch `build/remove-gulp` already exists and is checked out. Do not create, switch or delete branches.
2. **Do only what a task says.** Everything needed is written here, in `design.md` (decision 9), or in the `reference/` folder of this change. Do not add files, options, dependencies, scripts or improvements that no task lists. In particular: do not create a `scripts/` folder; do not edit anything under `src/`, `test/`, `docs/`, `.cursor/` or `openspec/changes/remove-gulp/reference/`; do not edit `tests/basic.spec.js`, `playwright.config.js` or `pnpm-workspace.yaml`; do not try to fix failing tests.
3. **Copy, do not retype.** New files are copied byte-for-byte from `openspec/changes/remove-gulp/reference/` with a file-copy command (`cp` in bash, `Copy-Item` in PowerShell). Do not paste or rewrite their content.
4. **One command at a time.** Run each command on its own. Do not join commands with `&&` or `;`.
5. **Exit codes.** "Exits 0" and "exits 1" mean the exit code of that command (`$?` in bash, `$LASTEXITCODE` in PowerShell). Judge by the exit code, not by whether a blank line is printed.
6. **Verification.** Each task ends with "Verify". The task is done only when every condition listed there holds. Mark the checkbox `[x]` only then.
7. **If anything does not match, stop.** If a command fails, asks a question, or a verification condition does not hold: do not retry with a different approach, do not change the plan, do not undo earlier tasks. Leave the working tree as it is and report the task number, the command, and its complete output. The only exceptions are the ones a task states explicitly.
8. **Never** commit, push, tag, stash, run `npm version`, or archive this change. The maintainer does that after reviewing the result.

Two warnings in command output are expected and are not failures: pnpm's `deprecated subdependencies found: sourcemap-codec@1.4.8`, and git's messages about line endings (`LF will be replaced by CRLF` or the reverse).

**The output check** is the command below. It passes when it exits 0.

```sh
git diff --exit-code -- dist index.html docs/examples/dist
```

It compares the build output on disk with the git index. Task 1.1 puts a fresh gulp build into the index, so from then on a passing output check means "byte-identical to what gulp produced".

## 1. Capture the gulp baseline

- [x] 1.1 Verify the starting state first: `git rev-parse --abbrev-ref HEAD` prints `build/remove-gulp`, and `git status --short --untracked-files=no` prints nothing. Then run `pnpm install --frozen-lockfile`, then `pnpm run build` (this is still the gulp build; it ends with a line containing `Finished 'build'`), then `git add dist`. Verify: `git diff --cached --name-only` prints exactly the three lines `dist/tagify.css`, `dist/tagify.esm.js.map` and `dist/tagify.js.map`, and the output check passes.

## 2. Replace the toolchain

- [x] 2.1 Run these three commands in this order. The order matters; see design decision 7.

  ```sh
  pnpm remove @rollup/stream gulp gulp-concat gulp-insert gulp-load-plugins gulp-nunjucks gulp-rename gulp-replace gulp-tap gulp-terser semver vinyl-buffer vinyl-source-stream
  pnpm add -D nunjucks@3.2.4
  pnpm update serialize-javascript
  ```

  Verify all three:
  - `node -p "JSON.stringify(require('./package.json').devDependencies)"` prints exactly `{"@playwright/test":"^1.64.1","@rollup/plugin-terser":"^1.0.0","@types/node":"^26.6.5","nunjucks":"3.2.4","rollup":"4.64.7","rollup-plugin-banner2":"^1.3.1"}`
  - `git grep -c -F -e gulp -e vinyl -e "chokidar@" -e "@rollup/stream" -e "serialize-javascript@7.1.2" -- pnpm-lock.yaml` prints nothing and exits 1 (exit code 1 means "no match", which is the wanted result)
  - `pnpm audit` exits 0. If it reports an advisory, stop and report it (rule 7); do not update other packages to make it pass.

- [x] 2.2 Do these three things:
  1. Copy `openspec/changes/remove-gulp/reference/rollup.config.mjs` to `rollup.config.mjs` in the project root.
  2. Delete `gulpfile.js`.
  3. In `package.json`, change the values of the `start`, `build` and `version` scripts to `rollup -c -w`, `rollup -c` and `rollup -c && git add -u`. Change nothing else in the file.

  Verify all four:
  - `git diff --no-index --quiet openspec/changes/remove-gulp/reference/rollup.config.mjs rollup.config.mjs` exits 0
  - `node -p "JSON.stringify(require('./package.json').scripts)"` prints exactly `{"start":"rollup -c -w","build":"rollup -c","version":"rollup -c && git add -u","prepublishOnly":"pjv","test":"pnpm exec playwright test","serve":"npx http-server -o index.html -c-1"}`
  - `pnpm run build` exits 0 and its output contains `created dist/tagify.js, dist/tagify.esm.js in`
  - the output check passes

- [x] 2.3 Copy `openspec/changes/remove-gulp/reference/tests/docs.spec.js` to `tests/docs.spec.js`. Verify: `git diff --no-index --quiet openspec/changes/remove-gulp/reference/tests/docs.spec.js tests/docs.spec.js` exits 0, and `pnpm exec playwright test tests/docs.spec.js --reporter=list` exits 0 with `1 passed` in its output. Stated exception to rule 7: if that command fails with a message that a browser executable does not exist, run `pnpm exec playwright install chromium` once and run the test again.

- [x] 2.4 In `README.md`, replace line 187 and line 193, each as a whole line, with the new lines given in design decision 9 under "README.md". Before editing, confirm that the two current lines are exactly the "current line" texts given there; if they are not, stop (rule 7). Verify both:
  - `git diff --numstat -- README.md` prints one line starting with `2` then `2` (2 lines added, 2 removed)
  - `git grep -n -i -E "gulp|vinyl" -- . ":!openspec" ":!.cursor"` prints nothing and exits 1

## 3. Watch mode and wrap-up

- [x] 3.1 Run `node openspec/changes/remove-gulp/reference/verify-watch.mjs`. It starts `rollup -c -w`, saves source files, checks what gets rebuilt, and stops the watcher by itself; it takes up to two minutes and needs no input. Verify: its last output line is `PASS` and it exits 0, and afterwards `git status --short -- src docs/examples/src docs/homepage` prints nothing. (This leaves an unminified `dist/tagify.js` on disk. That is expected; task 3.2 rebuilds it.)

- [x] 3.2 Run `pnpm install --frozen-lockfile`, then `pnpm run build`. Verify both exit 0 and the output check passes. Then run `git restore --staged --worktree dist`. Verify: `git status --short`, ignoring any line whose path starts with `openspec/` and the line `?? pnpm-workspace.yaml`, prints exactly these six lines (in any order):

  ```
   M README.md
   D gulpfile.js
   M package.json
   M pnpm-lock.yaml
  ?? rollup.config.mjs
  ?? tests/docs.spec.js
  ```

  Then stop and report that all tasks are complete. Do not commit (rule 8).

## Workflow follow-up

These are for the maintainer, not for whoever applies the tasks above.

- Commit the six entries from task 3.2 as a single commit titled `build!: Replace gulp with a Rollup config`. Do not include `dist/`, `index.html` or `docs/examples/dist/`.
- Archive this change after that commit is merged into `next`.
