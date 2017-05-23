var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var es = require('event-stream');
var path = require('path');
var glob = require('glob');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var watchify = require('watchify');
var gutil = require('gulp-util');
var babelify = require('babelify');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');

module.exports = function(done){

  glob('./src/js/main-**.{js,jsx}', function(err, files) {
      if(err) done(err);

      var tasks = files.map(function(entry){

        var props = {
            entries: [entry],
            extensions: ['.js','.jsx'],
            cache: {},
            packageCache: {},
            debug: true
        };

        var bundler = browserify(props)
                        .transform(babelify, {
                          presets: ["es2015", "react"]
                        });

        bundler.on('log', gutil.log);
        bundler.on('update', bundle);

        function bundle() {
          return bundler.bundle()
          .on('error', gutil.log.bind(gutil, 'Browserify Error'))
          .pipe(source(path.basename(entry)))
          .pipe(buffer())
          .pipe(gulpif(argv.production, jshint()))
          .pipe(gulpif(argv.production, jshint.reporter(stylish)))
          .pipe(gulpif(argv.production, sourcemaps.init({loadMaps: true})))
          .pipe(gulpif(argv.production, uglify()))
          .pipe(rename({
                  extname: '.bundle.js'
              }))
          .pipe(gulpif(argv.production, sourcemaps.write('./')))
          .pipe(gulp.dest('./../static/chartwerk/js/'));
        }


        return bundle();
      });

      es.merge(tasks).on('end', done);

  });
};
