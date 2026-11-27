# Design

## Context

See `proposal.md` for the motivation. This section records only the facts the decisions below rest on. All of them were measured on commit `c6ad4f7` (branch `next`) on 2026-11-27, on Windows with Node 24.17.0 and pnpm 12.6.0.

**What `gulpfile.js` does today**

| Task | Work it performs | Still needed |
|---|---|---|
| `js` | Rollup, UMD, terser, banner, writes `dist/tagify.js` and its map | yes |
| `esm` | Rollup, ES module, terser, banner, writes `dist/tagify.esm.js` and its map; skipped with `--dev` | yes |
| `css` | copies `src/tagify.css` to `dist/tagify.css` | yes |
| `compileAllExamples` | one HTML page per folder of `docs/examples/src/` | yes |
| `compileHomepage` | renders `docs/homepage/index.html` with Nunjucks into `index.html` | yes |
| `watch`, `watchExamples`, `watchHomepage` | rebuild on change | yes |
| `patch`, `feature`, `release` | bump version, re-stamp banners, commit, tag | no: last used 2020-11-11, releases use `npm version` |
| `react`, `jquery` | nothing: `react` throws on its first statement and is not exported, `jquery` is not exported | no |

**Baseline.** `gulp build` on `c6ad4f7` reproduces the committed `dist/tagify.js`, `dist/tagify.esm.js`, `index.html` and all 18 example pages byte-for-byte. Three committed files differ from a fresh build, for reasons that predate this change: `dist/tagify.css` (the committed file is the minified output of the removed Sass pipeline) and the two `.map` files (built from a CRLF copy of `src/parts/EventDispatcher.js`). The reference for this change is therefore a fresh `gulp build`, not the committed `dist/`.

**Prototype result.** `reference/rollup.config.mjs` was run in a copy of the project that had only the six final dev dependencies installed:

- `rollup -c` output compared with a fresh `gulp build` of the same commit: all 5 `dist/` files, all 18 example pages and `index.html` byte-identical.
- `rollup -c -w`: wrote an unminified UMD bundle and no ES module bundle. Re-saving an example source, the example template, a homepage partial, the stylesheet and a library module each triggered one rebuild of 264 to 385 ms. A syntax error in a module and an include of a missing template were each printed without stopping the process, and the next valid save rebuilt.
- `reference/tests/docs.spec.js` passed against the generated page, and failed when the example's script was removed from that page.

**Existing tests.** `tests/basic.spec.js` loads `dist/tagify.js` through `docs/examples/src/example-template.html`, so the UMD bundle is already exercised by 22 tests. On the untouched branch 20 pass and 2 fail (`basic › should loose focus`, `basic › should have converted the `value` attribute into tags`); those failures predate this change.

## Goals / Non-Goals

**Goals:**

- Build output byte-identical to `gulp build` on the same commit, for every file the build writes.
- No gulp, gulp plugin, vinyl adapter or `@rollup/stream` in `package.json` or `pnpm-lock.yaml`.
- `pnpm audit` reports zero advisories at the time the change is applied.
- `pnpm start`, `pnpm run build` and `npm version` keep working with the same meaning.
- The least new code that does all of the above: one config file, no scripts, no watcher code, no new dependency other than `nunjucks`, which is already installed transitively.

**Non-Goals:**

- Switching bundler or minifier, or changing any Rollup or terser option.
- Changing anything in `src/`, in the published `exports` map, or in `dist/tagify.vue`.
- Correcting the `sources` paths in the source maps. They stay `src/...`; see decision 4.
- Rebuilding or committing `dist/`, `index.html` or `docs/examples/dist/`. Those are committed by release commits only.
- A standalone command that builds only the documentation pages, a one-off unminified build, or a minified build that keeps watching. Nobody uses them; `pnpm run build` and `pnpm start` cover the real workflows.
- Rebuilding only the outputs affected by a change in watch mode. A full rebuild takes about 0.3 seconds.
- Fixing the 2 failing Playwright tests.
- Fixing `prepublishOnly: "pjv"` (the `pjv` binary is not a declared dependency) or removing the unused `jest` block from `package.json`.
- Updating any dependency other than the transitive `serialize-javascript`.
- Touching the untracked `pnpm-workspace.yaml`. Its three build-approval placeholders (`@parcel/watcher`, `@swc/core`, `es5-ext`) name packages that are no longer installed after this change. (When the change was applied, `pnpm remove` deleted the file by itself once those entries no longer applied.)
- Editing `.cursor/plans/rollup_v3_then_v4.plan.md` (a historical plan) or `.cursor/rules/repowise.mdc` (generated), although both mention gulp.

## Decisions

### 1. One file: `rollup.config.mjs` builds everything

`rollup -c` writes the bundles and, through one small plugin inside the config file (decision 5), the stylesheet and the documentation pages. There is no build script and no `scripts/` folder.

*Alternative rejected.* A first draft of this change used the config for the bundles plus `scripts/docs.mjs` for the pages and `scripts/dev.mjs` for watching: 164 lines in three files, with hand-written `fs.watch` handling and debouncing. It produced the same output. The single file is 67 lines and leaves all watching to Rollup.

*Alternatives rejected.* Vite, tsup or esbuild: a different bundler or minifier changes the emitted bytes, which would turn a tooling change into a release-risk change.

### 2. Development mode is Rollup's watch mode

`rollup -c -w` is `pnpm start`. The Rollup CLI sets the environment variable `ROLLUP_WATCH` when it watches; the config reads it and, when set, leaves out terser and the ES module output. That reproduces `gulp --dev` (unminified, UMD only) without a custom flag.

The plugin of decision 5 registers three extra paths with Rollup's watcher: `src/tagify.css`, `docs/examples/src` and `docs/homepage`. Rollup watches directories recursively. None of the files the build writes is inside a watched path, so a rebuild cannot trigger itself.

Two differences from gulp's watchers, both accepted:

- Any change rebuilds everything, where gulp rebuilt one target. Cost: about 0.3 seconds per save.
- Because everything is rebuilt, `index.html` now picks up a change to an example's source. Under gulp it did not, although the homepage embeds those sources.

### 3. Keep `rollup-plugin-banner2`, placed after terser

The banner must be added after minification or terser removes it. `rollup-plugin-banner2` listed after `terser()` does that today and stays. Its only dependency is `magic-string`.

*Alternative rejected.* Rollup's `output.banner` is added before plugins post-process the chunk, so terser would strip it; working around that needs a terser `format` option in production and a different mechanism in development.

### 4. Keep source map `sources` as `src/...`

With file output, Rollup writes `sources` relative to the map file (`../src/tagify.js`). The current maps contain `src/tagify.js`, because `@rollup/stream` has no output file to be relative to. Both outputs use a one-line `sourcemapPathTransform` that drops the leading `../`, which keeps the maps byte-identical.

*Alternative rejected.* Emitting `../src/...` is the more accurate path, but it changes published files. That belongs in a separate change. It has no practical effect today because the maps embed `sourcesContent`.

### 5. Stylesheet and documentation pages come from one inline plugin

The plugin has a single `buildStart` hook, which Rollup runs once per build, before bundling. It does four things:

- **Watch paths**: registers the three paths of decision 2.
- **Stylesheet**: emits `src/tagify.css` as the asset `tagify.css`. Rollup writes it next to the bundles and creates `dist/` if needed.
- **Example pages**: for each directory in `docs/examples/src/`, takes `example-template.html`, replaces `{{NAME}}` with the directory name and each `<!-- include:<ext> -->` with the content of `<name>/<name>.<ext>` (an empty string if that file does not exist), and writes `docs/examples/dist/<name>.html`.
- **Homepage**: `new nunjucks.Environment(new nunjucks.FileSystemLoader('docs'))`, `renderString` of `docs/homepage/index.html` with an empty context, written to `index.html`. This is what `gulp-nunjucks` does internally.

Details that are deliberate:

- A new Nunjucks environment is created on every build. Its loader caches templates, and a reused environment would serve stale includes in watch mode.
- `nunjucks` is pinned to exactly `3.2.4`, the version `gulp-nunjucks` resolves today. `index.html` is committed output of that renderer, so it is pinned for the same reason `rollup` is.
- The gulpfile turned the first space of an example folder name into a dash when looking for its files. No example folder has a space in its name, so that is not carried over.
- The plugin does not create `docs/examples/dist/`. The directory is tracked and holds 18 files.
- A failing page build fails the whole build with a non-zero exit code, as it did under gulp.

*Alternative rejected.* `rollup-plugin-copy` for the stylesheet: a new dependency, with its own glob dependencies, to copy one file.

### 6. Gulp release tasks are removed, not ported

`gulp patch|feature|release` bumped the version, re-stamped the banner on existing bundles without rebuilding, committed `package.json` alone and tagged. They were last used on 2020-11-11. Every release since has been an `npm version` commit, which runs the `version` script (build, then `git add -u`) and tags. The `version` script keeps that role with `rollup -c`. Removing the tasks also removes the need for `semver` and for the `headerComment` helper.

### 7. The lockfile is pruned, not regenerated

Deleting `pnpm-lock.yaml` and reinstalling was tested and rejected: it moves `react` and `react-dom` from 18.2.0 to 19.3.1 and `@playwright/test` from 1.64.1 to 1.65.1, none of which belongs in this change.

The exact sequence, tested on a copy of the current lockfile:

1. `pnpm remove` the 13 packages: 263 packages become 60.
2. `pnpm add -D nunjucks@3.2.4`: 64 packages.
3. `pnpm update serialize-javascript`: 7.1.2 becomes 7.1.4, `pnpm audit` reports 0.

The order matters. `nunjucks` declares `chokidar` as an optional peer dependency. If `nunjucks` is added while gulp's `chokidar` is still in the lockfile, pnpm attaches it and 14 packages stay for no reason (78 instead of 64).

The version is written without a caret on purpose: it is an exact pin (decision 5), and `^` is an escape character in Windows `cmd`, so `nunjucks@^3.2.4` silently becomes `nunjucks@3.2.4` there anyway.

### 8. One new test, for the one part no test covers

The bundle is already covered by the existing suite (see Context). The page generator is new logic with no test, so it gets one: `tests/docs.spec.js` opens the generated `docs/examples/dist/basic.html` and expects two tags. A passing run proves the template substitution, both includes and the bundle the page loads.

The test reads a committed, generated file, so it needs no build step and no change to `playwright.config.js`.

### 9. Exact end state

`package.json` `scripts` (the three changed entries; the others are untouched):

```json
"start": "rollup -c -w",
"build": "rollup -c",
"version": "rollup -c && git add -u",
```

`package.json` `devDependencies` (complete):

```json
"devDependencies": {
  "@playwright/test": "^1.64.1",
  "@rollup/plugin-terser": "^1.0.0",
  "@types/node": "^26.6.5",
  "nunjucks": "3.2.4",
  "rollup": "4.64.7",
  "rollup-plugin-banner2": "^1.3.1"
}
```

New files, copied verbatim from this change's `reference/` folder:

| Source | Destination |
|---|---|
| `reference/rollup.config.mjs` | `rollup.config.mjs` |
| `reference/tests/docs.spec.js` | `tests/docs.spec.js` |

The config is `.mjs` because `package.json` has no `"type"` field, so a `.js` file would be CommonJS.

Deleted: `gulpfile.js`.

**README.md.** Two whole lines of the section "Building the project" are replaced. Each block below holds exactly one line of the file.

Line 187, current line:

```text
For local development with watch mode, use `pnpm start` (runs Gulp with `--dev`). [Gulp](https://gulpjs.com) is used under the hood; you do not need a global Gulp install if you use the pnpm scripts above.
```

Line 187, new line:

```text
For local development with watch mode, use `pnpm start`: it builds an unminified bundle and the documentation pages, then rebuilds them whenever a source file changes. Everything is built by [Rollup](https://rollupjs.org) from `rollup.config.mjs`; no global installs are needed.
```

Line 193, current line:

```text
Output files, which are automatically generated using Gulp, are in: `/dist/`
```

Line 193, new line:

```text
Output files, which are automatically generated by the build, are in: `/dist/`
```

## Risks / Trade-offs

- **Output drift between prototype and implementation** → The first task stages a fresh gulp build in the git index, and every later build is compared against it with `git diff`.
- **A broken documentation template now stops the bundle from building in watch mode** (the page build runs first) → The error is printed with the template path, and the next valid save rebuilds everything.
- **Contributors with `gulp <task>` in their habits or notes** → The replacement table in `proposal.md` and the updated README section. There is no CI configuration in the repository to update.
- **`pnpm audit` is a point-in-time result** → The zero-advisory criterion is checked when the change is applied. A new advisory published later is not a regression of this change.
- **`nunjucks` is pinned exactly and will not receive patch updates automatically** → Accepted; an update is a deliberate change that must be checked against `index.html`.

## Migration Plan

One commit on a branch created from `next`. Nothing is deployed and no published file changes, so there is no rollout step.

Rollback: revert the commit and run `pnpm install`. The lockfile in the reverted commit restores the gulp toolchain exactly.

## Open Questions

None.
