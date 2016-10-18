/**
 * Created by JasonD on 16/10/17.
 */
const gulp = require('gulp');
const loadPlugins = require('gulp-load-plugins');

const $ = loadPlugins();
gulp.task("compress",()=>{
    gulp.src('src/*.js')
        .pipe($.uglify({
            compress: true
        }))
        .pipe(gulp.dest('dist'));
});