// Verifies the development watch mode (`pnpm start`, which is `rollup -c -w`). Used by task 3.1; not copied into the project.
// Run from the project root:  node openspec/changes/remove-gulp/reference/verify-watch.mjs
// Prints one line per check, then PASS (exit code 0) or FAIL (exit code 1).
// It edits two source files temporarily and always restores them.

import { spawn } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const MODULE = 'src/parts/texts.js';
const HOMEPAGE = 'docs/homepage/index.html';
const original = { [MODULE]: readFileSync(MODULE), [HOMEPAGE]: readFileSync(HOMEPAGE) };

const child = spawn(process.execPath, ['node_modules/rollup/dist/bin/rollup', '-c', '-w'], { stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
const collect = data => log += String(data).replace(/\x1b\[[0-9;]*m/g, ''); // rollup colors its output
child.stdout.on('data', collect);
child.stderr.on('data', collect);

const mtime = file => statSync(file).mtimeMs;
const sleep = ms => new Promise(done => setTimeout(done, ms));
const failures = [];

// runs `action`, waits for rollup to finish the build it triggers, returns what rollup printed for that build
async function build(action) {
    const from = log.length;
    await sleep(1000); // lets the file watcher settle, so the next write is not missed
    action();
    for (let waited = 0; !log.slice(from).includes('waiting for changes'); waited += 100) {
        if (waited > 30000 || child.exitCode !== null) return null;
        await sleep(100);
    }
    return log.slice(from);
}

function check(label, ok) {
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}`);
    if (!ok) failures.push(label);
}

try {
    const esmBefore = mtime('dist/tagify.esm.js');

    const startup = await build(() => {});
    check('startup: builds dist/tagify.js', !!startup?.includes('created dist/tagify.js in'));
    check('startup: bundle is unminified', readFileSync('dist/tagify.js', 'utf8').split('\n').length > 1000);
    if (failures.length) throw new Error(`watch mode did not start. Rollup printed:\n${log}`);

    // each source, and an output that must be rewritten when it changes
    for (const [source, output] of [
        [MODULE, 'dist/tagify.js'],
        ['src/tagify.css', 'dist/tagify.css'],
        ['docs/examples/src/basic/basic.js', 'docs/examples/dist/basic.html'],
        ['docs/examples/src/example-template.html', 'docs/examples/dist/basic.html'],
        ['docs/homepage/head.html', 'index.html'],
    ]) {
        const before = mtime(output);
        const out = await build(() => writeFileSync(source, readFileSync(source)));
        check(`saving ${source} rewrites ${output}`, !!out?.includes('created dist/tagify.js in') && mtime(output) > before);
    }

    for (const [file, broken, label] of [
        [MODULE, '\nconst = ;\n', 'a syntax error in a module'],
        [HOMEPAGE, '\n{% include "homepage/missing-file.html" %}\n', 'an include of a missing template'],
    ]) {
        const failed = await build(() => writeFileSync(file, original[file] + broken));
        check(`${label} is reported and watching continues`, !!failed?.includes('[!]') && child.exitCode === null);
        const fixed = await build(() => writeFileSync(file, original[file]));
        check(`${label}, once fixed, rebuilds`, !!fixed?.includes('created dist/tagify.js in'));
    }

    check('dist/tagify.esm.js is not written in watch mode', mtime('dist/tagify.esm.js') === esmBefore);
} catch (error) {
    console.log(error.message);
} finally {
    for (const [file, content] of Object.entries(original)) writeFileSync(file, content);
    child.kill();
}

console.log(failures.length ? `FAIL (${failures.length} check(s) failed)` : 'PASS');
process.exit(failures.length ? 1 : 0);
