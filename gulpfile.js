var gulp = require('gulp'),
    $ = require( "gulp-load-plugins" )({ lazy: true, pattern:['*', 'gulp-'], rename: {
        'sass': 'xsass' // map to some other name because 'gulp-sass' already loads "sass", so avoid collusion
    } }),
    terser = require("rollup-plugin-terser").terser,
    rollupBanner = require("rollup-plugin-banner").default,
    babel = require("@rollup/plugin-babel").babel,
    fs = require('fs'),
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

var banner = `Tagify (v ${process.env.npm_package_version}) - tags input component
By ${pkg.author.name}
${pkg.homepage}
${LICENSE}`;

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

const babelConfig = {
    presets: ['@babel/env'],
    plugins: ['@babel/proposal-object-rest-spread', '@babel/plugin-transform-destructuring']
}


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
    const umdConf = {
        exports: function(file) {
            return 'exports';
        }
    }

    return gulp.src('src/react.tagify.jsx')
        .pipe( $.babel({ ...babelConfig, presets:[...babelConfig.presets, '@babel/preset-react'] }))
        .pipe( $.umd(umdConf) )
        .pipe(opts.dev ? $.tap(()=>{}) : $.terser())
        .pipe($.headerComment(banner))
        .pipe( gulp.dest('./dist/') )
}

function js_minified(done){
    return rollup({
        entry: 'src/tagify.js',
        outputName: 'tagify.min.js',
        plugins: opts.dev ? [] : [terser()]
    })
        .on('end', done)
}

function js(done){
    if( opts.dev ) return done();

    return rollup({
        entry: 'src/tagify.js',
        outputName: 'tagify.js'
    })
        .on('end', done)
}

function esm(done){
    if( opts.dev ) return done();

    return rollup({
        entry: 'src/tagify.js',
        outputName: 'tagify.esm.js',
        format: 'es'
    })
        .on('end', done)
}

function jquery(){
    // do not proccess jQuery version while developeing
    if( opts.dev )
        return Promise.resolve('"dev" does not compile jQuery')

    return gulp.src('dist/tagify.min.js')
        .pipe($.insert.wrap(jQueryPluginWrap[0], jQueryPluginWrap[1]))
        .pipe($.rename('jQuery.tagify.min.js'))
        // .pipe($.terser())
        .pipe($.headerComment(banner))
        .pipe(gulp.dest('./dist/'))
}

function handleError(err) {
    $.util.log( err.toString() );
    this.emit('end');
}

function polyfills(done){
    return rollup({
        entry: 'src/tagify.polyfills.js',
        outputName: 'tagify.polyfills.min.js'
    })
        .on('end', done)
}

function rollup({ entry, outputName, dest, plugins=[], babelConf={}, format='umd' }){
    plugins = [
        babel({...babelConfig, babelHelpers: 'bundled', ...babelConf}),
        ...plugins
    ]

    plugins.push( rollupBanner(banner) )

    return rollupStream({
        input: entry,
        plugins,
        // sourcemap: true,
        cache: rollupCache[entry],
        output: {
            name: 'Tagify',
            format: format,
        }
    })
        .on('bundle', function(bundle) {
            rollupCache[entry] = bundle;
        })

        // give the file the name you want to output with
        .pipe( $.vinylSourceStream(outputName))
        // .on('error', handleError)
        .pipe(gulp.dest('./dist'));
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
    gulp.watch(['./src/tagify.js', './src/parts/*.js'], gulp.series([js_minified, jquery]))
    gulp.watch('./src/react.tagify.jsx', react)
}


// const build = gulp.series(gulp.parallel(build_js, scss, polyfills), build_jquery_version, react)
const build = gulp.series(gulp.parallel(js, scss, polyfills), js_minified, esm, jquery, react)

exports.default = gulp.parallel(build, watch)
exports.js = js
exports.js_minified = js_minified
exports.esm = esm
exports.build = build
exports.react = react
exports.jquery = jquery
exports.patch = gulp.series(inc('patch'), addBanner, gitTag)    // () => inc('patch')
exports.feature = gulp.series(inc('minor'), addBanner, gitTag)  // () => inc('minor')
exports.release = gulp.series(inc('major'), addBanner, gitTag)  // () => inc('major')