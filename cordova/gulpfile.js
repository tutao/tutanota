var gulp = require('gulp');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');

var package = require('../package.json');

gulp.task('default', shell.task([
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
    'cordova run android'
]));

gulp.task('ios', shell.task([
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
   
]));

gulp.task('createWebRelease', shell.task([
    'cd ../web; gulp distCordova'
]));

gulp.task('androidProdDist', ['createWebRelease'], shell.task([
    'cordova build --release android'
]));

gulp.task('tagAndroidRelease', shell.task([
        "git tag -a " + package.name + "android-release-" + package.version + " -m ''",
        "git push origin " + package.name + "android-release-" + package.version
]));

gulp.task('releaseAndroid', ['androidProdDist', 'tagAndroidRelease'], function (cb) {
    return gulp.src('build/**')
        .pipe(gulp.dest('/opt/releases/' + package.name + '-android-' + package.version));
});