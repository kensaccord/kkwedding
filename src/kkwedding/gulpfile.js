/// <binding Clean='clean' />

var gulp = require("gulp"),
    rimraf = require("rimraf"),
    concat = require("gulp-concat"),
    cssmin = require("gulp-cssmin"),
    uglify = require("gulp-uglify"),
    project = require("./project.json");

// Include Gulp & Tools We'll Use
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var ngAnnotate = require('gulp-ng-annotate');
var templateCache = require('gulp-angular-templatecache');
var ts = require('gulp-typescript');
var pagespeed = require('psi');
var merge = require('merge2');
var sourcemaps = require('gulp-sourcemaps');

var reload = browserSync.reload;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var paths = {
    webroot: "./" + project.webroot + "/"
};

paths.js = paths.webroot + "js/**/*.js";
paths.minJs = paths.webroot + "js/**/*.min.js";
paths.css = paths.webroot + "css/**/*.css";
paths.minCss = paths.webroot + "css/**/*.min.css";
paths.concatJsDest = paths.webroot + "js/site.min.js";
paths.concatCssDest = paths.webroot + "css/site.min.css";

gulp.task("clean:js", function (cb) {
    rimraf(paths.concatJsDest, cb);
});

gulp.task("clean:css", function (cb) {
    rimraf(paths.concatCssDest, cb);
});

gulp.task("clean", ["clean:js", "clean:css"]);

gulp.task("min:js", function () {
    gulp.src([paths.js, "!" + paths.minJs], { base: "." })
        .pipe(concat(paths.concatJsDest))
        .pipe(uglify())
        .pipe(gulp.dest("."));
});

gulp.task("min:css", function () {
    gulp.src([paths.css, "!" + paths.minCss])
        .pipe(concat(paths.concatCssDest))
        .pipe(cssmin())
        .pipe(gulp.dest("."));
});

gulp.task("min", ["min:js", "min:css"]);

// Copy All Files At The Root Level (app)
gulp.task('copy', function () {
    return gulp.src([
      'app/*',
      '!app/*.html',
      'node_modules/apache-server-configs/dist/.htaccess'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'))
      .pipe($.size({ title: 'copy' }));
});

gulp.task('images', function () {
    return gulp.src([
        'app/images/**'
    ], {
        dot: true
    }).pipe(gulp.dest('dist/images'))
        .pipe($.size({ title: 'images' }));
});

// Copy Web Fonts To Dist
gulp.task('fonts', function () {
    return gulp.src(['app/fonts/**'])
      .pipe(gulp.dest('dist/fonts'))
      .pipe($.size({ title: 'fonts' }));
});

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
    // For best performance, don't add Sass partials to `gulp.src`
    return gulp.src([
      'app/styles/**/*.scss',
      'app/styles/***/**/*.scss',
      'app/styles/**/*.css',
      'app/styles/components/_components.scss'
    ])
      .pipe($.sourcemaps.init())
      .pipe($.changed('.tmp/styles', { extension: '.css' }))
      .pipe($.sass({
          precision: 10,
          onError: console.error.bind(console, 'Sass error:')
      }))
      .pipe($.autoprefixer({ browsers: AUTOPREFIXER_BROWSERS }))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest('.tmp/styles'))
      // Concatenate And Minify Styles
      .pipe($.if('*.css', $.csso()))
      .pipe(gulp.dest('dist/styles'))
      .pipe($.size({ title: 'styles' }));
});

gulp.task('templates', function () {
    gulp.src('app/templates/**/*.html')
      .pipe(templateCache({ standalone: true }))
      .pipe(gulp.dest('app/scripts'))
      .pipe($.size());
});

gulp.task('tsc', function () {
    var result = gulp.src([
      'app/typescript/**/*.ts',
      'app/typescript_definitions/**/*.ts'])
        .pipe(sourcemaps.init())
        .pipe(ts({
            declarationFiles: true,
            noExternalResolve: true,
            sortOutput: true
        }));
    return result.js
        //.pipe(concat('output.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/scripts'));
});

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', ['tsc', 'templates'], function () {
    var assets = $.useref.assets({ searchPath: '{.tmp,app}' });

    return gulp.src([
        'app/**/*.html',
        'app/***/**/*.html'
    ])
      .pipe(assets)
      // Concatenate And Minify JavaScript
      .pipe($.if('*.js', ngAnnotate()))
      .pipe($.if('*.js', $.uglify({ preserveComments: 'some' })))
      // Concatenate And Minify Styles
      // In case you are still using useref build blocks
      .pipe($.if('*.css', $.csso()))
      .pipe(assets.restore())
      .pipe($.useref())
      // Minify Any HTML
      //.pipe($.if('*.html', $.minifyHtml())) -- breaks on some node versions
      // Output Files
      .pipe(gulp.dest('dist'))
      .pipe($.size({ title: 'html' }));
});

// Clean Output Directory
//gulp.task('clean', del.bind(null, ['.tmp', 'dist/*', '!dist/.git'], { dot: true }));

// Watch Files For Changes & Reload
gulp.task('serve', ['styles', 'tsc'], function () {
    browserSync({
        notify: false,
        // Customize the BrowserSync console logging prefix
        logPrefix: 'WSK',
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: ['.tmp', 'app']
    });

    gulp.watch(['app/**/*.html'], reload);
    gulp.watch(['app/templates/**/*.html'], ['templates', reload]);
    gulp.watch(['app/typescript/**/*.ts'], ['tsc', reload]);
    gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
    gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
    browserSync({
        notify: false,
        logPrefix: 'WSK',
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: 'dist'
    });
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
    /*runSequence('styles', ['jshint', 'html', 'images', 'fonts', 'copy'], cb);*/
    runSequence('styles', ['html', 'fonts', 'images', 'copy'], cb);
});

// Run PageSpeed Insights
gulp.task('pagespeed', function (cb) {
    // Update the below URL to the public URL of your site
    pagespeed.output('example.com', {
        strategy: 'mobile'
        // By default we use the PageSpeed Insights free (no API key) tier.
        // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
        // key: 'YOUR_API_KEY'
    }, cb);
});

// Load custom tasks from the `tasks` directory
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }