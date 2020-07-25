var gulp = require('gulp'),
    $ = require( "gulp-load-plugins" )({ pattern:['*', 'gulp-'] }),
    terser = require("rollup-plugin-terser").terser,
    rollupBanner = require("rollup-plugin-banner").default,
    babel = require("@rollup/plugin-babel").babel,
    rollupStream = require("@rollup/stream"),
    pkg = require('./package.json'),
    opts = process.argv.reduce((result, item) => {
        if( item.indexOf('--') == 0 )
            result[item.replace('--','')] = 1
        return result;
    }, {});


var rollupCache = {};

var banner = `Tagify (v ${pkg.version})- tags input component
By ${pkg.author.name}
Don't sell this code. (c)
${pkg.homepage}`;

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
            $.sass().on('error', $.sass.logError)
        )
        // .pipe($.combineMq()) // combine media queries
        .pipe($.autoprefixer({ overrideBrowserslist:['> 5%'] }) )
        .pipe($.cleanCss())
        .pipe(gulp.dest('./dist'))
}

// https://medium.com/recraftrelic/building-a-react-component-as-a-npm-module-18308d4ccde9
function react(){
    const umdConf = {
        exports: function(file) {
            return 'Tags';
        }
    }

    return gulp.src('src/react.tagify.js')
        .pipe( $.babel({ ...babelConfig, presets:[...babelConfig.presets, '@babel/preset-react'] }))
        .pipe( $.umd(umdConf) )
        .pipe(opts.dev ? $.tap(()=>{}) : $.uglify())
        .pipe($.headerComment(banner))
        .pipe( gulp.dest('./dist/') )
}


function js(done){
    return rollup({
        entry: 'src/tagify.js',
        outputName: 'tagify.min.js'
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
        // .pipe($.uglify())
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

function rollup({ entry, outputName, dest, plugins = [] }){
    plugins = [babel({...babelConfig, babelHelpers: 'bundled'}), rollupBanner(banner), ...plugins]

    if( !opts.dev )
        plugins.push(terser())

    return rollupStream({
        input: entry,
        plugins,
        // sourcemap: true,
        cache: rollupCache[entry],
        output: {
            name: 'Tagify',
            format: 'umd',
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

function inc(importance) {
    // get all the files to bump version in
    return gulp.src('./package.json')
        // bump the version number in those files
        .pipe($.bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'))
        // commit the changed version number
        //.pipe($.git.commit('bumps package version'))

        // read only one file to get the version number
        .pipe($.filter('package.json'))
        // **tag it in the repository**
        .pipe($.tagVersion());
}


function watch(){
    gulp.watch('./src/*.scss', scss)
    gulp.watch(['./src/tagify.js', './src/parts/*.js'], gulp.series([js, jquery]))
    gulp.watch('./src/react.tagify.js', react)
}


// const build = gulp.series(gulp.parallel(build_js, scss, polyfills), build_jquery_version, react)
const build = gulp.series(gulp.parallel(js, scss, polyfills), jquery, react)

exports.default = gulp.parallel(build, watch)
exports.js = js
exports.react = react
exports.jquery = jquery
exports.patch = () => inc('patch')
exports.feature = () => inc('minor')
exports.release = () => inc('major')