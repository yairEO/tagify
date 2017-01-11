var gulp         = require('gulp'),
    gutil        = require('gulp-util'),
    watch        = require('gulp-watch'),
    cache        = require('gulp-cached'),
    gulp_if      = require('gulp-if'),

    sourcemaps   = require('gulp-sourcemaps'),
    //debug      = require('gulp-debug'),
    sass         = require('gulp-sass'),
    combineMq    = require('gulp-combine-mq'),
    cssGlobbing  = require('gulp-css-globbing'),
    autoprefixer = require('gulp-autoprefixer'),

    csso         = require('gulp-csso'),
    uglify       = require('gulp-uglify'),
    rename       = require('gulp-rename'),
    concat       = require('gulp-concat'),
    eslint       = require('gulp-eslint'),

    replace      = require('gulp-replace'),
    insert       = require('gulp-insert'),
    beep         = require('beepbeep');


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
 * Tagify - jQuery tags input plugin
 * By Yair Even-Or (2016)
 * Don't sell this code. (c)
 * https://github.com/yairEO/tagify
 */
`;

var jQueryPluginWrap = [`;(function($){
    // just a jQuery wrapper for the vanilla version of this component
    $.fn.tagify = function(settings){
        var $input = this,
            tagify;

        if( $input.data("tagify") ) // don't continue if already "tagified"
            return this;

        tagify = new Tagify(this[0], settings);
        $input.data("tagify", tagify);

        return this;
    }

`
,
`
})(jQuery);
`];

////////////////////////////////////////////////////
// Compile main app SCSS to CSS
gulp.task('scss', function() {
    return gulp.src('src/*.scss')
        .pipe(cssGlobbing({
            extensions: '.scss'
        }))
        .pipe(
            sass().on('error', sass.logError)
        )
        .pipe(combineMq()) // combine media queries
        .pipe( autoprefixer({ browsers:['last 7 versions'] }) )
        .pipe(gulp.dest('./dist'))
});


gulp.task('build-js', function() {
    var jsStream = gulp.src('src/tagify.js');

    lint(jsStream);

    // create a jQuery version
    gulp.src('src/tagify.js')
        .pipe(insert.prepend(banner + jQueryPluginWrap[0]))
        .pipe(insert.append(jQueryPluginWrap[1]))
        .pipe(rename('jQuery.tagify.js'))
        .pipe(gulp.dest('./dist/'))

    return jsStream
        .pipe(insert.prepend(banner))
        .pipe(gulp.dest('./dist/'))

});



function lint( stream ){
    return stream
        // eslint() attaches the lint output to the eslint property
        // of the file object so it can be used by other modules.
        .pipe(cache('linting'))
        .pipe(eslint(eslint_settings))
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError())
        .on('error', beep);
}



gulp.task('default', ['build-js', 'scss', 'watch']);

gulp.task('watch', function(){
    //gulp.watch('./images/sprite/**/*.png', ['sprite']);
    gulp.watch('./src/*.scss', ['scss']);
    gulp.watch('./src/tagify.js', ['build-js']);
});
