var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');

gulp.task('lint', function() {
    return gulp.src('./lib/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jscs());
});

gulp.task('test', function(cb) {
    gulp.src('lib/**/*.js')
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', function() {
            gulp.src('./test/**/*-spec.js', {
                read: false
            })
            .pipe(mocha({
                reporter: 'dot'
            }))
            .pipe(istanbul.writeReports({
                dir: './coverage',
                reporters: ['text', 'lcov']
            }))
            .on('end', cb);
        });
});

gulp.task('default', ['test']);
