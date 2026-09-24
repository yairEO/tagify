var gulp = require('gulp'),
    $ = require( "gulp-load-plugins" )({ lazy: true, pattern:['*', 'gulp-'], rename: {
        'sass': 'xsass' // map to some other name because 'gulp-sass' already loads "sass", so avoid collusion
    } }),
    rollupTerser = require("@rollup/plugin-terser"),
    swc = require('gulp-swc'),
    // v10 is ESM-only; CJS require() returns { default }
    autoprefixer = require('gulp-autoprefixer').default,
    rollupSwc = require('rollup-plugin-swc3').swc,
    rollupBanner = require("rollup-plugin-banner2"),
    fs = require('fs'),
    path = require('path'),
    buffer = require('vinyl-buffer'),
    { pipeline } = require('stream/promises'),
    { Transform } = require('stream'),
    rollupStream = require("@rollup/stream"),
    browserslist = require('browserslist'),
    pkg = require('./package.json'),
    sass = require('gulp-sass')(require('sass')),
    opts = process.argv.reduce((result, item) => {
        if( item.indexOf('--') == 0 )
            result[item.replace('--','')] = 1
        return result;
    }, {});

const LICENSE = fs.readFileSync("./LICENSE", "utf8");

const swcOptions = {
    sourceMaps: true,
    env: {
        targets: browserslist(),
    },
    jsc: {
        parser: {
            syntax: 'ecmascript',
            jsx: true, // Enable JSX
            decorators: true, // Optionally enable decorators
        },
        transform: {
            react: {
                runtime: 'automatic', // Choose 'automatic' or 'classic'
                pragma: 'React.createElement',  // Customize if needed
                pragmaFrag: 'React.Fragment', // Customize if needed
            }
        }
    }
};

var banner = `
Tagify v${process.env.npm_package_version} - tags input component
By: ${pkg.author}
${pkg.homepage}

${LICENSE}
`;

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
// Compile main app SCSS to CSS

function scss(){
    return gulp.src('src/*.scss')
        .pipe($.cssGlobbing({
            extensions: '.scss'
        }))
        .pipe(
            sass().on('error', sass.logError)
        )
        // .pipe($.combineMq()) // combine media queries
        .pipe(autoprefixer({ overrideBrowserslist: pkg.browserslist }) )
        .pipe($.cleanCss())
        .pipe(gulp.dest('./dist'))
}

// https://medium.com/recraftrelic/building-a-react-component-as-a-npm-module-18308d4ccde9
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
    // .pipe($.headerComment(banner))
    //     .pipe($.concat('react.tagify.jsx'))
    //     .pipe($.sourcemaps.write('.'))
    //     .pipe( gulp.dest('./dist/') )
    // .on('end', done);


    return gulp.src('src/react.tagify.jsx', { sourcemaps: true })
        // .pipe($.sourcemaps.init({ loadMaps: true }))
        .pipe(swc(swcOptions))
        // .pipe(opts.dev ? $.tap(()=>{}) : $.terser())
        .pipe($.headerComment(banner))
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
        .pipe($.headerComment(banner))
        .pipe(gulp.dest('./dist/'))
}

function bundle({ entry, outputName, dest, plugins=[], format='umd' }){
    plugins = [
        rollupSwc(swcOptions),
        ...plugins
    ]

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

const inc = importance => () =>
    // get all the files to bump version in
    gulp.src('./package.json')
        // bump the version number in those files
        .pipe($.bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'))


function gitTag(){
    return gulp.src('./package.json')
        // commit the changed version number
        .pipe($.git.commit('bumps package version'))
        .pipe($.tagVersion());
}

function addBanner(){
    var packageJson = JSON.parse(fs.readFileSync('./package.json'))
    var banner = `Tagify (v${packageJson.version}) - tags input component
By ${pkg.author.name}
${pkg.homepage}
${LICENSE}`;

    return gulp.src('dist/*.js')
        .pipe($.headerComment(banner))
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
    gulp.watch('./src/*.scss', scss)
    gulp.watch(['./src/tagify.js', './src/parts/*.js'], gulp.series([js]))
    // gulp.watch('./src/react.tagify.jsx', react)
}

// remove the "react" task as it was unneeded because the react-wrapper is served unbundled
const build = gulp.series(gulp.parallel(js, scss), esm, compileAllExamples, compileHomepage) // deprecated the "react" task as i believe it's not needed to consume a pre-bundled version.

exports.default = gulp.parallel(build, watch, watchExamples, watchHomepage)
exports.js = js
exports.esm = esm
exports.build = build
// exports.react = react
exports.patch = gulp.series(inc('patch'), addBanner, gitTag)    // () => inc('patch')
exports.feature = gulp.series(inc('minor'), addBanner, gitTag)  // () => inc('minor')
exports.release = gulp.series(inc('major'), addBanner, gitTag)  // () => inc('major')
exports.compileAllExamples = compileAllExamples
