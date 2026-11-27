# Proposal

## Why

Gulp no longer does any real work in this build. Rollup bundles the JavaScript, the stylesheet is a plain file copy, and the documentation pages need one string substitution and one Nunjucks render; yet `gulpfile.js` is 381 lines, much of it adapter code that pipes Rollup through gulp streams and tasks that can no longer run, and the gulp toolchain is what keeps `pnpm-lock.yaml` at 263 packages instead of 64. Rollup can do the whole job alone from one 67-line config file, which also clears the last advisory `pnpm audit` reports.

## What Changes

- Add `rollup.config.mjs`. `rollup -c` writes everything the build produces: the two bundles and their source maps, `dist/tagify.css`, `docs/examples/dist/*.html` and `index.html`. `rollup -c -w` is the development watch mode.
- Change three `package.json` scripts:
  - `start`: `gulp --dev` becomes `rollup -c -w`
  - `build`: `gulp build` becomes `rollup -c`
  - `version`: `gulp build && git add -u` becomes `rollup -c && git add -u`
- Delete `gulpfile.js`.
- Remove 13 dev dependencies: `@rollup/stream`, `gulp`, `gulp-concat`, `gulp-insert`, `gulp-load-plugins`, `gulp-nunjucks`, `gulp-rename`, `gulp-replace`, `gulp-tap`, `gulp-terser`, `semver`, `vinyl-buffer`, `vinyl-source-stream`.
- Add 1 dev dependency: `nunjucks` pinned to `3.2.4`, the version `gulp-nunjucks` resolves today.
- Update the transitive `serialize-javascript` from 7.1.2 to a patched release (7.1.3 or later).
- Add one Playwright test, `tests/docs.spec.js` (8 lines), which opens a generated example page and expects Tagify to run on it.
- Update the two sentences in `README.md` that mention Gulp.
- Watch mode now rebuilds everything on any change (about 0.3 seconds), instead of only the output that depends on the changed file.
- **BREAKING** (contributors only): every `gulp <task>` command stops existing. Replacements:

  | Removed command | Replacement |
  |---|---|
  | `gulp build`, `gulp js`, `gulp esm`, `gulp compileAllExamples` | `pnpm run build` |
  | `gulp --dev` | `pnpm start` |
  | `gulp patch`, `gulp feature`, `gulp release` | `npm version patch`, `npm version minor`, `npm version major` |
  | `gulp` (minified build that keeps watching) | none; `pnpm start` is the only watch mode |

Nothing changes for people who install `@yaireo/tagify`: the published files are byte-identical to what the current build produces.

## Capabilities

### New Capabilities

- `build-pipeline`: what the contributor commands (`pnpm run build`, `pnpm start`, the `version` lifecycle script) produce, and which tooling the build is not allowed to depend on.

### Modified Capabilities

None. `openspec/specs/` is empty; this is the first spec in the project.

## Impact

- **Published package**: none. `dist/tagify.js`, `dist/tagify.js.map`, `dist/tagify.esm.js`, `dist/tagify.esm.js.map` and `dist/tagify.css` are byte-identical to the output of `gulp build` on the same commit. This was confirmed with a prototype of the new build on commit `c6ad4f7`.
- **Documentation output**: none. All 18 pages in `docs/examples/dist/` and `index.html` are byte-identical (same prototype).
- **Dependencies**: `devDependencies` go from 18 entries to 6. `pnpm-lock.yaml` goes from 263 packages to 64. `pnpm audit` goes from 1 advisory (low severity, `serialize-javascript` through `@rollup/plugin-terser`) to 0.
- **Files**: `gulpfile.js` (381 lines) deleted; `rollup.config.mjs` (67 lines) and `tests/docs.spec.js` (8 lines) added; `package.json`, `pnpm-lock.yaml`, `README.md` edited.
- **Release flow**: unchanged. Releases already go through `npm version`, which runs the `version` script. The gulp release tasks (`patch`, `feature`, `release`) were last used on 2020-11-11.
- **Tests**: one test added. The existing Playwright suite is not touched; because the build output is byte-identical, its results cannot change.
- **Not affected**: `src/`, `dist/tagify.vue`, `tests/basic.spec.js`, `test/`, `playwright.config.js`, `.eslintrc`.
