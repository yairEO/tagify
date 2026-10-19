var gulp = require('gulp'),
    $ = require( "gulp-load-plugins" )({ lazy: true, pattern:['*', 'gulp-'] }),
    rollupTerser = require("@rollup/plugin-terser"),
    rollupBanner = require("rollup-plugin-banner2"),
    fs = require('fs'),
    path = require('path'),
    { execFileSync } = require('child_process'),
    semver = require('semver'),
    buffer = require('vinyl-buffer'),
    { pipeline } = require('stream/promises'),
    { Transform } = require('stream'),
    rollupStream = require("@rollup/stream"),
    pkg = require('./package.json'),
    opts = process.argv.reduce((result, item) => {
        if( item.indexOf('--') == 0 )
            result[item.replace('--','')] = 1
        return result;
    }, {});

// normalized to LF: a CRLF checkout of LICENSE would otherwise leak into the banner of the published dist files
const LICENSE = fs.readFileSync("./LICENSE", "utf8").replace(/\r\n/g, '\n');

// the only banner definition: the build (rollup) and the post-bump refresh (addBanner) must emit the same text
const makeBanner = version => `
Tagify v${version} - tags input component
By: ${pkg.author}
${pkg.homepage}

${LICENSE}
`;

// pkg.version, not npm_package_version: the latter is undefined when gulp is run directly (npx gulp build)
var banner = makeBanner(pkg.version);

var jQueryPluginWrap = [`;(function($){
    // just a jQuery wrapper for the vanilla version of this component
    $.fn.tagify = function(settings = {}){
        return this.each(function() {
            var $input = $(this),
                tagify;

            if( $input.data("tagify") ) // don't continue if already "tagified"
                return this;

            settings.isJQueryPlugin = true;
            tagify = new Tagify($input[0], settings);
            $input.data("tagify", tagify);
        });
    }

` , ` })(jQuery); `];

////////////////////////////////////////////////////
// The main CSS source is native modern CSS (nesting, custom properties) and is shipped as-is: no preprocessing or minification.
// Keep "src/tagify.css" ASCII-only (use escapes such as "\2713" in `content`), so it needs no "@charset" rule.

function css(){
    return gulp.src('src/tagify.css')
        .pipe(gulp.dest('./dist'))
}

// https://medium.com/recraftrelic/building-a-react-component-as-a-npm-module-18308d4ccde9
/**
 * DEAD CODE - kept for reference only; this task is not exported and cannot run:
 *  - it throws on its very first statement (`bundle()` returns a Promise, which has no `.on()`),
 *    so everything after that `return` is unreachable.
 *  - SWC was removed in favor of fewer 3rd-party packages (`gulp-swc`, `rollup-plugin-swc3` and `@swc/core`
 *    are no longer dependencies, and the `swcOptions` config is gone). The `swc(swcOptions)` calls below are
 *    left untouched on purpose and would throw a ReferenceError if this code were ever reached.
 *  - the React wrapper is shipped as-is, unbundled, from "src/react.tagify.js" (see "exports" in package.json).
 */
function react(done){
    return bundle({
        entry: 'src/react.tagify.jsx',
        outputName: `react.tagify.jsx`,
      })
      .on('end', done)


    // return rollupStream({
    //     input: 'src/react.tagify.jsx',
    //     output: {
    //         sourcemap: true,
    //         name: 'Tagify',
    //         format: 'es'
    //     }
    // })
    // .pipe(
    //     swc(swcOptions)
    // )
    // .pipe(headerComment(banner))
    //     .pipe($.concat('react.tagify.jsx'))
    //     .pipe($.sourcemaps.write('.'))
    //     .pipe( gulp.dest('./dist/') )
    // .on('end', done);


    return gulp.src('src/react.tagify.jsx', { sourcemaps: true })
        // .pipe($.sourcemaps.init({ loadMaps: true }))
        // DEAD: unreachable, and `swc`/`swcOptions` no longer exist (SWC was removed, see the note above react())
        .pipe(swc(swcOptions))
        // .pipe(opts.dev ? $.tap(()=>{}) : $.terser())
        .pipe(headerComment(banner))
        .pipe($.concat('react.tagify.jsx'))
        // .pipe($.sourcemaps.write('.'))
        .pipe( gulp.dest('./dist/', { sourcemaps: '.' }) )
}

function js(){
    return bundle({
        entry: 'src/tagify.js',
        outputName: 'tagify.js'
    })
}

function esm(done){
    if( opts.dev ) return done();

    return bundle({
        entry: 'src/tagify.js',
        outputName: 'tagify.esm.js',
        format: 'es'
    })
}

/**
 * DEPRECATED - as of APR 2024, i've deciced it's not worth the efforts of generating this after recent gulpfile changes.
 * wraps the output of the "js" task with "jQueryPluginWrap"
 */
function jquery(){
    // do not proccess jQuery version while developeing
    // if( opts.dev )
    //     return Promise.resolve('"dev" does not compile jQuery')

    return gulp.src('dist/tagify.min.js')
        .pipe($.insert.wrap(jQueryPluginWrap[0], jQueryPluginWrap[1]))
        .pipe($.rename('jQuery.tagify.min.js'))
        .pipe(opts.dev ? $.tap(()=>{}) : $.terser())
        .pipe(headerComment(banner))
        .pipe(gulp.dest('./dist/'))
}

function bundle({ entry, outputName, dest, plugins=[], format='umd' }){
    // SWC (@swc/core, rollup-plugin-swc3, gulp-swc) was removed in favor of fewer 3rd-party packages:
    // the built bundles were byte-identical without it, since no browserslist target needed any downleveling.
    plugins = [...plugins] // copy: the push() calls below must not mutate the caller's array

    if( !opts.dev ) {
        plugins.push(rollupTerser())
    }

    plugins.push( rollupBanner(() => `/*${banner}*/\n\n`) )

    // https://github.com/rollup/stream
    const output = {
        sourcemap: true,
        format: format
    }
    if (format === 'umd') {
        output.name = 'Tagify'  // UMD only: https://rollupjs.org/configuration-options/#output-name
    }

    const rs = rollupStream({
        input: entry,
        plugins,
        output
    })

    // pipeline forwards errors from any stage; gulp sees a rejected promise
    return pipeline(
        rs,
        $.vinylSourceStream(outputName),
        buffer(),
        emitJsAndMap(outputName),
        gulp.dest('./dist')
    );
}

/** Split @rollup/stream inline data: map into JS + sibling .map vinyls (gulp-sourcemaps throws on Rollup 3). */
function parseInlineSourceMap(url) {
    if (!url.startsWith('data:')) {
        throw new Error('expected inline data: sourcemap');
    }
    const comma = url.indexOf(',');
    const payload = url.slice(comma + 1);
    const decoded = /;base64/i.test(url.slice(0, comma))
        ? Buffer.from(payload, 'base64').toString('utf8')
        : decodeURIComponent(payload);
    const start = decoded.indexOf('{');
    const end = decoded.lastIndexOf('}');
    if (start < 0 || end < 0) {
        throw new Error('inline sourcemap is not JSON');
    }
    return JSON.parse(decoded.slice(start, end + 1));
}

function emitJsAndMap(outputName) {
    const marker = '//# sourceMappingURL=';
    return new Transform({
        objectMode: true,
        transform(file, _enc, cb) {
            try {
                if (file.isNull()) return cb(null, file);
                const text = file.contents.toString('utf8');
                const last = Math.max(text.lastIndexOf(marker), text.lastIndexOf('//@ sourceMappingURL='));
                if (last < 0) {
                    return cb(new Error('bundle missing sourceMappingURL'));
                }
                const eq = text.indexOf('=', last);
                const url = text.slice(eq + 1).trim();
                const map = parseInlineSourceMap(url);
                map.file = outputName;
                if (Array.isArray(map.sources)) {
                    map.sources = map.sources.map(s => String(s).replace(/\\/g, '/'));
                }

                let body = text.slice(0, last);
                for (;;) {
                    const i = Math.max(body.lastIndexOf(marker), body.lastIndexOf('//@ sourceMappingURL='));
                    if (i < 0) break;
                    body = body.slice(0, i);
                }
                body = body.replace(/\s+$/, '');
                const mapName = outputName + '.map';
                file.contents = Buffer.from(body + '\n' + marker + mapName + '\n');

                const mapFile = file.clone({ contents: false });
                mapFile.path = file.path + '.map';
                mapFile.contents = Buffer.from(JSON.stringify(map));
                this.push(file);
                this.push(mapFile);
                cb();
            } catch (err) {
                cb(err);
            }
        }
    });
}

// a banner this gulpfile wrote earlier: a leading "/* Tagify v... */" block
const BANNER_RE = /^\/\*\s*Tagify v\d[\s\S]*?\*\/\s*/;

// replaces gulp-header-comment; unlike it, the text is NOT run through lodash templating,
// and it replaces our own earlier banner instead of stacking a second one on top (keeps sourcemap line offsets valid)
const headerComment = text => new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
        if (file.isNull()) return cb(null, file);
        if (file.isStream()) return cb(new Error('headerComment: streams not supported'));
        const body = file.contents.toString('utf8').replace(BANNER_RE, '');
        file.contents = Buffer.from(`/*${text}*/\n\n${body}`);
        cb(null, file);
    }
});


/**
 * Bumping version number and tagging the repository with it.
 * Please read http://semver.org/
 *
 * You can use the commands
 *
 *     gulp patch     # makes v0.1.0 → v0.1.1
 *     gulp feature   # makes v0.1.1 → v0.2.0
 *     gulp release   # makes v0.2.1 → v1.0.0
 *
 * To bump the version numbers accordingly after you did a patch,
 * introduced a feature or made a backwards-incompatible release.
 */

const inc = importance => done => {
    const file = './package.json';
    const text = fs.readFileSync(file, 'utf8');
    const next = semver.inc(JSON.parse(text).version, importance);
    if (!next) return done(new Error(`cannot bump version by "${importance}"`));
    // raw-text replace keeps formatting/line endings; JSON.stringify would rewrite the whole file
    const out = text.replace(/("version"\s*:\s*")[^"]+/, (_m, prefix) => prefix + next);
    // the regex hits the first "version" key: refuse to write if that wasn't the top-level one
    if (JSON.parse(out).version !== next) return done(new Error('bump hit the wrong "version" key'));
    fs.writeFileSync(file, out);
    done();
};


function gitTag(done){
    const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    // same two git calls gulp-git + gulp-tag-version made; an args array avoids shell escaping
    try {
        execFileSync('git', ['commit', '-m', 'bumps package version', '--', 'package.json'], { stdio: 'inherit' });
        execFileSync('git', ['tag', '-a', `v${version}`, '-m', `Tagging as v${version}`], { stdio: 'inherit' });
    } catch (err) {
        return done(err);
    }
    done();
}

function addBanner(){
    // read from disk: `pkg` was loaded before `inc` bumped the version
    const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

    return gulp.src('dist/*.js')
        .pipe(headerComment(makeBanner(version)))
        .pipe(gulp.dest('./dist/'))
}

function compileAllExamples(done) {
    // iterate all folders at ".\docs\examples\src"
    fs.readdir('docs/examples/src', { withFileTypes: true }, (err, examples) => {
        const subfolders = examples
            .filter(file => file.isDirectory())
            .map(folder => folder.name);

        // generate an example html file from each subfolder
        subfolders.forEach(compileExample)
    })

    typeof done == 'function' && done()
}

// compiles a specific example demo
function compileExample(exampleName) {
    gulp.src('docs/examples/src/example-template.html')
        .pipe($.replace('{{NAME}}', exampleName))
        .pipe($.replace(/<!--\s*include:(.*?)\s*-->/g, (match, type) => {
            try {
                // Read the contents of the file specified in the comment
                const fileContent = fs.readFileSync(`docs/examples/src/${exampleName}/${exampleName.replace(' ', '-')}.${type}`, 'utf8')
                return fileContent;
            } catch (err) {
                return ''
            }
        }))
        .pipe($.rename(exampleName + '.html'))
        .pipe(gulp.dest('docs/examples/dist/'))
}

function onExampleFileChange(path) {
    const normalizedPath = path.replace(/\\/g, '/')
    const lastFolderName = normalizedPath.match(/\/([^\/]+)\/[^\/]+$/)[1]

    compileExample(lastFolderName)
}

// creates the main `index.html` page which showcases all the examples
async function compileHomepage() {
    const { nunjucksCompile } = await import('gulp-nunjucks');

    // https://github.com/sindresorhus/gulp-nunjucks/issues/14
    return gulp.src('./docs/homepage/index.html', {base: './docs'})
		.pipe(nunjucksCompile())  // null, {path: [path.join(__dirname, '..')]}
        .pipe($.rename('index.html'))
		.pipe(gulp.dest('.'))
}

function watchExamples() {
    gulp.watch(['./docs/examples/src/**/*.*', '!./docs/examples/src/*.*']).on('change', onExampleFileChange)
    gulp.watch(['./docs/examples/src/*.*']).on('change', compileAllExamples)
}

function watchHomepage() {
    gulp.watch('./docs/homepage/**/*.*').on('change', compileHomepage)
}

function watch(){
    gulp.watch('./src/*.css', css)
    gulp.watch(['./src/tagify.js', './src/parts/*.js'], gulp.series([js]))
    // gulp.watch('./src/react.tagify.jsx', react)
}

// remove the "react" task as it was unneeded because the react-wrapper is served unbundled
const build = gulp.series(gulp.parallel(js, css), esm, compileAllExamples, compileHomepage) // deprecated the "react" task as i believe it's not needed to consume a pre-bundled version.

exports.default = gulp.parallel(build, watch, watchExamples, watchHomepage)
exports.js = js
exports.esm = esm
exports.build = build
// exports.react = react
exports.patch = gulp.series(inc('patch'), addBanner, gitTag)    // () => inc('patch')
exports.feature = gulp.series(inc('minor'), addBanner, gitTag)  // () => inc('minor')
exports.release = gulp.series(inc('major'), addBanner, gitTag)  // () => inc('major')
exports.compileAllExamples = compileAllExamples
