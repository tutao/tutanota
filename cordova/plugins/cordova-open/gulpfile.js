var gulp = require('gulp');
var eslint = require('gulp-eslint');

var src = [
  './gulpfile.js',
  './www/*.js',
  './tests/tests.js'
];

gulp.task('lint', function () {
  return gulp.src(src)
      .pipe(eslint())
      .pipe(eslint.format());
});

gulp.task('watch', function() {
  gulp.watch(src, ['lint']);
});
