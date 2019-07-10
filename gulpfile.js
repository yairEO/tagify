var gulp = require('gulp'),
    $ = require( "gulp-load-plugins" )({ pattern:['*', 'gulp-'] }),
    pkg = require('./package.json');


var uglifyOptions = {
    compress: {
        sequences    : true,
        conditionals : true,
        booleans     : true,
        unused       : true,
        if_return    : true,
        join_vars    : true,
        properties   : true,
        dead_code    : true
    },
    mangle      : true,
    "screw-ie8" : true
};

var eslint_settings = {
    rulePaths: [],
    rules: {
        "no-mixed-spaces-and-tabs" : [2, "smart-tabs"],
        "block-spacing"            : [2, "always"],
        "comma-style"              : [2, "last"],
        "no-debugger"              : [1],
        "no-alert"                 : [1],
        "indent"                   : [1, 4, {"SwitchCase":1}],
        'strict'                   : 0,
        'no-undef'                 : 1
    },
    ecmaFeatures : {
        modules: true,
        sourceType: "module"
    },
    "parserOptions": {
        "ecmaVersion" : 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": false,
            "experimentalObjectRestSpread": true
        }
    },
    globals : [
        'FB',
        'ga',
        'jQuery',
        '$',
        '_',
        'd3',
        'Router',
        'ttip',
        'Cookies',
        'fastdom',
        'describe',
        'beforeEach',
        'it',
        'expect',
        'assert',
        'done',
        'dataLayer',
        'validator'
    ],
    baseConfig: {
        //parser: 'babel-eslint',
    },
    envs: [
        'browser', 'es6'
    ]
};

var banner = `/**
 * Tagify (v ${pkg.version})- tags input component
 * By ${pkg.author.name}
 * Don't sell this code. (c)
 * ${pkg.homepage}
 */
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

`
,
`
})(jQuery);
`];

const babelConfig = {
    presets: ['@babel/env'],
    plugins: ['@babel/proposal-object-rest-spread', '@babel/plugin-transform-destructuring']
}
////////////////////////////////////////////////////
// Compile main app SCSS to CSS

gulp.task('scss', () => {
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
});



gulp.task('build_js', () => {
    return gulp.src('src/tagify.js')
        .pipe( $.babel(babelConfig))
        .pipe( $.umd() )
        .pipe( $.insert.prepend(banner) )
        .pipe( gulp.dest('./dist/') )
        .pipe($.rename('tagify.min.js'))
        .pipe($.uglify())
        .pipe( $.insert.prepend(banner) )
        .pipe( gulp.dest('./dist/') )
});



gulp.task('build_jquery_version', () => {
    return gulp.src('src/tagify.js')
        .pipe($.insert.wrap(jQueryPluginWrap[0], jQueryPluginWrap[1]))
        .pipe( $.babel(babelConfig))
        .pipe($.rename('jQuery.tagify.min.js'))
        .pipe($.uglify())
        .pipe($.insert.prepend(banner))
        .pipe(gulp.dest('./dist/'))
});


gulp.task('minify', () => {
    // gulp.src('dist/tagify.js')
    //     .pipe($.uglify())
    //     .on('error', handleError)
    //     .pipe($.rename('tagify.min.js'))
    //     .pipe(gulp.dest('./dist/'))

    // gulp.src('dist/jQuery.tagify.js')
    //     .pipe($.uglify())
    //     .on('error', handleError)
    //     .pipe($.rename('jQuery.tagify.min.js'))
    //     .pipe(gulp.dest('./dist/'))

    gulp.src('src/tagify.polyfills.js')
        .pipe($.uglify())
        .on('error', handleError)
        .pipe($.rename('tagify.polyfills.min.js'))
        .pipe(gulp.dest('./dist/'))
});

function handleError(err) {
  $.util.log( err.toString() );
  this.emit('end');
}

/**
 * lints the javscript source code using "eslint"
 */
gulp.task('lint_js', () => {
    return gulp.src('src/tagify.js')
        // eslint() attaches the lint output to the eslint property
        // of the file object so it can be used by other modules.
        .pipe($.cached('linting'))
        .pipe($.eslint(eslint_settings))
        // $.eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe($.eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe($.eslint.failAfterError())
        .on('error', $.beepbeep)
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

function inc(importance) {
    // get all the files to bump version in
    return gulp.src('./package.json')
        // bump the version number in those files
        .pipe($.bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'))
        // commit the changed version number
        .pipe($.git.commit('bumps package version'))

        // read only one file to get the version number
        .pipe($.filter('package.json'))
        // **tag it in the repository**
        .pipe($.tagVersion());
}


gulp.task('watch', () => {
    //gulp.watch('./images/sprite/**/*.png', ['sprite']);
    gulp.watch('./src/*.scss', ['scss']);
    gulp.watch('./src/tagify.js').on('change', ()=>{ $.runSequence('build_js', 'build_jquery_version', 'minify') });
});


gulp.task('default', ( done ) => {
    $.runSequence(['build_js', 'scss'], 'build_jquery_version', 'minify', 'watch', done);
});


gulp.task('patch', () => inc('patch'))
gulp.task('feature', () => inc('minor'))
gulp.task('release', () => inc('major'))