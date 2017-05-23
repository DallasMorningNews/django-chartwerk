var gulp = require('./gulp')([
  'sass',
  'browserify',
  'watch',
  'img',
]);

gulp.task('build', ['sass', 'browserify', 'watch']);
gulp.task('default', ['build']);
