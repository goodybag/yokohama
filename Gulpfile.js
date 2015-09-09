'use strict';

var gulp = require('gulp');
var smaps = require('gulp-sourcemaps');

gulp.task('default', ['build']);

gulp.task('build', function() {
    var babel = require('gulp-babel');

    return gulp.src('src/**/*.js')
        .pipe(smaps.init())
        .pipe(babel())
        .pipe(smaps.write('.'))
        .pipe(gulp.dest('lib'));
});
