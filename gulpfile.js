var gulp = require('gulp'),
    $ = require( "gulp-load-plugins" )({ lazy: true, pattern:['*', 'gulp-'], rename: {
        'sass': 'xsass' // map to some other name because 'gulp-sass' already loads "sass", so avoid collusion
    } }),
    rollupTerser = require("@rollup/plugin-terser"),
    swc = require('gulp-swc'),
    rollupSwc = require('rollup-plugin-swc3').swc,
    rollupBanner = require("rollup-plugin-banner2"),
    fs = require('fs'),
    buffer = require('vinyl-buffer'),
    rollupStream = require("@rollup/stream"),
    pkg = require('./package.json'),
    sass = require('gulp-sass')(require('sass')),
    opts = process.argv.reduce((result, item) => {
        if( item.indexOf('--') == 0 )
            result[item.replace('--','')] = 1
        return result;
    }, {});

const LICENSE = fs.readFileSync("./LICENSE", "utf8");

var rollupCache = {};

const swcOptions = {
    sourceMaps: true,
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
        .pipe($.autoprefixer({ overrideBrowserslist:['> 5%'] }) )
        .pipe($.cleanCss())
        .pipe(gulp.dest('./dist'))
}

// https://medium.com/recraftrelic/building-a-react-component-as-a-npm-module-18308d4ccde9
function react(done){
    // return bundle({
    //     entry: 'src/react.tagify.jsx',
    //     outputName: `react.tagify.jsx`,
    //   })
    //   .on('end', done)


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
        .pipe(
            swc(swcOptions)
        )
        // .pipe(opts.dev ? $.tap(()=>{}) : $.terser())
        .pipe($.headerComment(banner))
        .pipe($.concat('react.tagify.jsx'))
        // .pipe($.sourcemaps.write('.'))
        .pipe( gulp.dest('./dist/', { sourcemaps: '.' }) )
}

function js(done){
    return bundle({
        entry: 'src/tagify.js',
        outputName: 'tagify.min.js'
    })
        .on('end', done)
}

function esm(done){
    if( opts.dev ) return done();

    return bundle({
        entry: 'src/tagify.js',
        outputName: 'tagify.esm.js',
        format: 'es'
    })
        .on('end', done)
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

function polyfills(done){
    return bundle({
        entry: 'src/tagify.polyfills.js',
        outputName: 'tagify.polyfills.min.js'
    })
        .on('end', done)
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
    return rollupStream({
        input: entry,
        plugins,
        cache: rollupCache[entry],
        output: {
            sourcemap: true,
            name: 'Tagify',  // used only for UMD: https://rollupjs.org/configuration-options/#output-name
            format: format
        }
    })
    .on('bundle', function(bundle) {
        rollupCache[entry] = bundle;
    })

    // give the file the name you want to output with
    .pipe( $.vinylSourceStream(outputName))
    .pipe(buffer())
    .on('error', handleError)

    // NOTE - `$.sourcemaps` only works with Rollup v2. not 3 or 4!!! I've wasted a whole day over this
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
}

function handleError(err) {
    console.log( err.toString() );
    this.emit('end');
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


function watch(){
    gulp.watch('./src/*.scss', scss)
    gulp.watch(['./src/tagify.js', './src/parts/*.js'], gulp.series([js]))
    // gulp.watch('./src/react.tagify.jsx', react)
}


const build = gulp.series(gulp.parallel(js, scss, polyfills), esm) // deprecated the "react" task as i believe it's not needed to consume a pre-bundled version.

exports.default = gulp.parallel(build, watch)
exports.js = js
exports.esm = esm
exports.build = build
exports.react = react
exports.patch = gulp.series(inc('patch'), addBanner, gitTag)    // () => inc('patch')
exports.feature = gulp.series(inc('minor'), addBanner, gitTag)  // () => inc('minor')
exports.release = gulp.series(inc('major'), addBanner, gitTag)  // () => inc('major')