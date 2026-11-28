import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import terser from '@rollup/plugin-terser';
import nunjucks from 'nunjucks';
import banner2 from 'rollup-plugin-banner2';

// `rollup -c` is the production build. `rollup -c -w` (pnpm start) is the development build: unminified, UMD only
const dev = !!process.env.ROLLUP_WATCH;

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

// normalized to LF: a CRLF checkout of LICENSE would otherwise leak into the banner of the published dist files
const LICENSE = readFileSync('LICENSE', 'utf8').replace(/\r\n/g, '\n');

const banner = `
Tagify v${pkg.version} - tags input component
By: ${pkg.author}
${pkg.homepage}

${LICENSE}
`;

const EXAMPLES = 'docs/examples/src';

// everything the build writes that is not a bundle: the stylesheet and the documentation pages
const staticFiles = () => ({
    name: 'static-files',
    buildStart() {
        // not part of the module graph, so watch mode has to be told about them
        ['src/tagify.css', EXAMPLES, 'docs/homepage'].forEach(path => this.addWatchFile(resolve(path)));

        // native modern CSS, shipped as-is. Keep it ASCII-only (escapes such as "\2713"), so it needs no "@charset" rule
        this.emitFile({ type: 'asset', fileName: 'tagify.css', source: readFileSync('src/tagify.css') });

        // docs/examples/dist/<name>.html: one page per example folder
        const template = readFileSync(`${EXAMPLES}/example-template.html`, 'utf8');
        for (const { name } of readdirSync(EXAMPLES, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
            writeFileSync(`docs/examples/dist/${name}.html`, template
                .replaceAll('{{NAME}}', name)
                .replace(/<!--\s*include:(.*?)\s*-->/g, (_match, type) => {
                    // an example may lack a file of some type (most have no css)
                    try { return readFileSync(`${EXAMPLES}/${name}/${name}.${type}`, 'utf8') } catch { return '' }
                }));
        }

        // index.html: the demo page, which embeds every example. `np` bumps package.json before it runs the "version"
        // script (this build), so a release commit carries a homepage that shows the version being released
        const env = new nunjucks.Environment(new nunjucks.FileSystemLoader('docs'));
        writeFileSync('index.html', env.renderString(readFileSync('docs/homepage/index.html', 'utf8'), { version: pkg.version }));
    }
});

// keeps the "sources" of the emitted maps as "src/..." (rollup makes them relative to dist/)
const sourcemapPathTransform = path => path.replace(/^\.\.[\\/]/, '');

export default {
    input: 'src/tagify.js',
    plugins: [
        !dev && terser(),
        // after terser, which would otherwise strip the comment
        banner2(() => `/*${banner}*/\n\n`),
        staticFiles(),
    ],
    output: [
        { file: 'dist/tagify.js', format: 'umd', name: 'Tagify', sourcemap: true, sourcemapPathTransform },
        !dev && { file: 'dist/tagify.esm.js', format: 'es', sourcemap: true, sourcemapPathTransform },
    ].filter(Boolean),
};
