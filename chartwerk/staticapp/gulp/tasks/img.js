var gulp = require('gulp');
var imageResize = require('gulp-image-resize');
var imagemin = require('gulp-imagemin');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var rename = require('gulp-rename');
var merge = require('merge-stream');


module.exports = function() {

    function png(size){
        return gulp.src('./src/img/**/*.png')
          .pipe(imageResize({ width : size, upscale : false, imageMagick : true }))
          .pipe(imagemin({
                optimizationLevel: 4,
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
            }))
          .pipe(rename(function (path)  {
                                          path.basename += ('-' + size.toString());
                                          path.extname = path.extname.toLowerCase();
                                          return path;
                                        }))
          .pipe(gulp.dest('./../static/chartwerk/img'));
    }

    function jpg(size){
        return gulp.src('./src/img/**/*.{jpg,JPG}')
          .pipe(imageResize({ width : size, upscale : false, imageMagick : true }))
          .pipe(imageminJpegRecompress({
            loops: 3,
            min: 50,
            max: 75,
            target: 0.9999
          })())
          .pipe(rename(function (path)  {
                                          path.basename += ('-' + size.toString());
                                          path.extname = path.extname.toLowerCase();
                                          return path;
                                        }))
          .pipe(gulp.dest('./../static/chartwerk/img'));
    }


    return merge(
        png(3000),
        png(2400),
        png(1800),
        png(1200),
        png(600),
        jpg(3000),
        jpg(2400),
        jpg(1800),
        jpg(1200),
        jpg(600)
    );

};
