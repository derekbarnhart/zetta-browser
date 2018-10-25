const { src, dest, watch, series, parallel } = require('gulp');
const less = require('gulp-less');
const path = require('path');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const connect = require('gulp-connect');

const scripts = [
  './src/scripts/angular.js',
  './src/scripts/app.js',
  './src/scripts/vendor/*.js',
  './src/scripts/vendor/macgyver/*.js',
  './src/scripts/directives/*.js',
  './src/scripts/services/*.js',
  './src/scripts/filters/*.js',
  './src/scripts/siren/*.js',
  './src/scripts/controllers/*.js'
];

const zettaScripts = [
  './src/scripts/app.js',
  './src/scripts/directives/*.js',
  './src/scripts/services/*.js',
  './src/scripts/filters/*.js',
  './src/scripts/siren/*.js',
  './src/scripts/controllers/*.js'
];

function jshintTask() {
  return src(zettaScripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
}

function scriptsTask() {
  return src(scripts)
    .pipe(concat('zetta.js'))
    .pipe(uglify({ mangle: false }))
    .pipe(dest('./dist/scripts'));
}

function lessTask() {
  return src('./src/styles/styles.less')
    .pipe(less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(dest('./src/styles'));
}

function cssTask() {
  return src([
    './src/styles/pure.css',
    './src/styles/grids-responsive.css',
    './src/styles/prism.css',
    './src/styles/styles.css',
    './src/styles/macgyver.css',
    './src/scripts/vendor/macgyver/*.css'
  ])
    .pipe(concat('zetta.css'))
    .pipe(cleanCSS({ level: { 1: { specialComments: 0 } } }))
    .pipe(dest('./dist/styles'));
}

const stylesTask = series(cssTask, lessTask);

function testStylesTask() {
  return src('./src/styles/test.less')
    .pipe(less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(dest('./src/styles'));
}

function htmlTask() {
  return src('./src/partials/*.html')
    .pipe(htmlmin({
      useShortDoctype: true,
      removeRedundantAttributes: true,
      collapseWhitespace: true,
      conservativeCollapse: false
    }))
    .pipe(dest('./dist/partials'));
}

function moveTask(cb) {
  src(['./src/favicon.ico']).pipe(dest('./dist'));
  src(['./src/index.html']).pipe(dest('./dist'));
  src(['./src/images/*.*']).pipe(dest('./dist/images'));
  src(['./src/partials/fields/**']).pipe(dest('./dist/partials/fields'));
  src('./src/styles/fonts/*.*').pipe(dest('./dist/fonts'));
  cb();
}

const moveAll = series(htmlTask, moveTask);

function serveTask(cb) {
  connect.server({
    root: 'dist',
    port: 3001,
    livereload: true
  });
  cb();
}

function watchTask() {
  watch(scripts, scriptsTask);
  watch('./src/styles/*.*', stylesTask);
  watch(['./src/index.html', './src/images/*.*', './src/partials/**'], moveAll);
}

exports.jshint = jshintTask;
exports.scripts = scriptsTask;
exports.styles = stylesTask;
exports.css = cssTask;
exports.html = htmlTask;
exports.move = moveAll;
exports.serve = serveTask;

exports.default = series(
  parallel(scriptsTask, stylesTask, moveAll),
  serveTask,
  watchTask
);

exports.test = series(testStylesTask, function watchTestStyles() {
  watch('./src/styles/test.less', testStylesTask);
});

exports['heroku:production'] = parallel(scriptsTask, stylesTask, moveAll);
