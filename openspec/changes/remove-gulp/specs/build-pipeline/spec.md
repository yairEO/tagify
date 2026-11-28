# Spec Delta

## Purpose

Defines what the contributor commands of this repository produce: the published bundles and stylesheet in `dist/`, the documentation pages, the development watch mode, and the limits on the tooling the build may depend on.

## ADDED Requirements

### Requirement: Production build command
`pnpm run build`, run from the project root, SHALL write every build output and exit with code 0. The outputs are `dist/tagify.js`, `dist/tagify.js.map`, `dist/tagify.esm.js`, `dist/tagify.esm.js.map`, `dist/tagify.css`, one `docs/examples/dist/<name>.html` per example folder, and `index.html`.

#### Scenario: Full build succeeds
- **WHEN** `pnpm run build` is run from the project root on a clean checkout with dependencies installed
- **THEN** the command exits with code 0
- **AND** all five `dist/` files listed above, `index.html`, and one page per directory of `docs/examples/src/` exist with a modification time later than the start of the command

#### Scenario: Build fails on a source error
- **WHEN** `src/tagify.js` contains a JavaScript syntax error and `pnpm run build` is run
- **THEN** the command exits with a non-zero code and prints the error

#### Scenario: Files the build does not own are left alone
- **WHEN** `pnpm run build` completes
- **THEN** `dist/tagify.vue` is unchanged

### Requirement: Bundle formats
The build SHALL produce two minified bundles from the entry `src/tagify.js`: `dist/tagify.js` in UMD format exposing the global name `Tagify`, and `dist/tagify.esm.js` as an ES module whose default export is the `Tagify` class.

#### Scenario: UMD bundle loaded by a script tag
- **WHEN** `dist/tagify.js` is loaded in a browser with a `<script>` tag
- **THEN** `window.Tagify` is the Tagify constructor

#### Scenario: ES module bundle imported
- **WHEN** `dist/tagify.esm.js` is imported with `import Tagify from './dist/tagify.esm.js'`
- **THEN** `Tagify` is the Tagify constructor

### Requirement: Bundle banner
Each bundle SHALL begin with one block comment containing, in this order: the line `Tagify v<version> - tags input component` where `<version>` is the `version` field of `package.json` at build time, the line `By: <author>` from the `author` field, the `homepage` field, an empty line, and the full text of the `LICENSE` file with LF line endings.

#### Scenario: Banner carries the current version
- **WHEN** `package.json` has `"version": "4.39.0"` and the build runs
- **THEN** the second line of `dist/tagify.js` and of `dist/tagify.esm.js` is `Tagify v4.39.0 - tags input component`

#### Scenario: LICENSE checked out with CRLF line endings
- **WHEN** the `LICENSE` file on disk uses CRLF line endings and the build runs
- **THEN** neither bundle contains a carriage-return character inside its banner

### Requirement: Source maps
Each bundle SHALL end with the line `//# sourceMappingURL=<bundle file name>.map` and have a sibling map file of that name. The map's `file` field SHALL equal the bundle file name, its `sources` SHALL be forward-slash paths relative to the project root, and it SHALL include `sourcesContent`.

#### Scenario: Map of the UMD bundle
- **WHEN** the build runs
- **THEN** the last line of `dist/tagify.js` is `//# sourceMappingURL=tagify.js.map`
- **AND** `dist/tagify.js.map` is valid JSON whose `file` is `tagify.js`, whose `sources` include `src/tagify.js` and `src/parts/helpers.js`, and whose `sourcesContent` has one entry per source

#### Scenario: Map of the ES module bundle
- **WHEN** the build runs
- **THEN** the last line of `dist/tagify.esm.js` is `//# sourceMappingURL=tagify.esm.js.map`
- **AND** `dist/tagify.esm.js.map` is valid JSON whose `file` is `tagify.esm.js`

### Requirement: Stylesheet shipped unprocessed
The build SHALL write `dist/tagify.css` as a byte-for-byte copy of `src/tagify.css`, with no preprocessing, prefixing or minification.

#### Scenario: Stylesheet copied
- **WHEN** the build runs
- **THEN** `dist/tagify.css` and `src/tagify.css` have identical bytes

### Requirement: Example pages
For every directory `docs/examples/src/<name>/` the build SHALL write `docs/examples/dist/<name>.html`, generated from `docs/examples/src/example-template.html` by replacing every `{{NAME}}` with `<name>` and every `<!-- include:<ext> -->` comment with the content of `docs/examples/src/<name>/<name>.<ext>`.

#### Scenario: Example with HTML, JS and CSS sources
- **WHEN** `docs/examples/src/RTL/` contains `RTL.html`, `RTL.js` and `RTL.css` and the build runs
- **THEN** `docs/examples/dist/RTL.html` has the title `RTL` and contains the content of each of the three files at the position of the matching include comment

#### Scenario: Example without a CSS source
- **WHEN** `docs/examples/src/basic/` contains `basic.html` and `basic.js` but no `basic.css` and the build runs
- **THEN** `docs/examples/dist/basic.html` is written, with the `<!-- include:css -->` comment replaced by an empty string

#### Scenario: Files directly inside the examples source folder
- **WHEN** the build runs
- **THEN** no page is generated for `example-template.html` or for any other file that is a direct child of `docs/examples/src/`

### Requirement: Demo homepage
The build SHALL write `index.html` at the project root as the rendering of `docs/homepage/index.html` as a Nunjucks template, with `docs/` as the root for template paths and a rendering context whose only variable is `version`, the `version` field of `package.json` at build time.

#### Scenario: Homepage header carries the current version
- **WHEN** `package.json` has `"version": "4.39.0"` and the build runs
- **THEN** the header of `index.html` contains `<span class='version'>v4.39.0</span>`

#### Scenario: Homepage rendered
- **WHEN** the build runs
- **THEN** `index.html` contains no `{%` sequence
- **AND** the number of `<section id='section-` elements in `index.html` equals the number of `{% call section(` statements in `docs/homepage/index.html`

#### Scenario: Homepage references a missing file
- **WHEN** a template under `docs/homepage/` includes a path that does not exist and `pnpm run build` is run
- **THEN** the command exits with a non-zero code and prints the missing template path

### Requirement: Development mode
`pnpm start` SHALL build the UMD bundle unminified with its source map, the stylesheet, every example page and the homepage, then keep running and repeat that whole build whenever a source changes. The sources are `src/tagify.js`, every module it imports, `src/tagify.css`, and every file under `docs/examples/src/` and `docs/homepage/`. It SHALL NOT write `dist/tagify.esm.js`. A failed rebuild SHALL be printed and SHALL NOT stop the process.

#### Scenario: Startup
- **WHEN** `pnpm start` is run
- **THEN** `dist/tagify.js` is written unminified, `dist/tagify.css`, all example pages and `index.html` are written, `dist/tagify.esm.js` is not written, and the process keeps running

#### Scenario: A library source changes
- **WHEN** `src/tagify.js`, a module it imports, or `src/tagify.css` is saved while `pnpm start` is running
- **THEN** `dist/tagify.js`, `dist/tagify.js.map` and `dist/tagify.css` are rewritten

#### Scenario: A documentation source changes
- **WHEN** a file inside `docs/examples/src/basic/`, the file `docs/examples/src/example-template.html`, or a file under `docs/homepage/` is saved while `pnpm start` is running
- **THEN** every example page and `index.html` are rewritten

#### Scenario: A rebuild fails
- **WHEN** a syntax error is saved into a module of the library, or a template under `docs/homepage/` is saved with an include of a missing file, while `pnpm start` is running
- **THEN** the error is printed, the process keeps running, and saving a corrected file produces a successful rebuild

### Requirement: Version lifecycle hook
The `version` script of `package.json` SHALL run the production build and then stage every modified tracked file, so that `npm version <patch|minor|major>` produces a release commit whose bundles carry the new version in their banner.

#### Scenario: Releasing a patch version
- **WHEN** `npm version patch` is run on version `4.39.0`
- **THEN** the banners of `dist/tagify.js` and `dist/tagify.esm.js` read `Tagify v4.39.1`
- **AND** the commit created by `npm version` contains `package.json` and the rebuilt files

### Requirement: Build tooling restrictions
The project SHALL NOT depend, directly or transitively, on `gulp`, on any package named `gulp-*` or `vinyl-*`, or on `@rollup/stream`, and SHALL NOT contain a gulpfile.

#### Scenario: Lockfile is free of gulp
- **WHEN** `pnpm-lock.yaml` is searched for package names starting with `gulp`, `vinyl` or `@rollup/stream`
- **THEN** there is no match

#### Scenario: Repository is free of gulp files
- **WHEN** the project root is listed
- **THEN** there is no `gulpfile.js`, `gulpfile.mjs` or `gulpfile.cjs`
