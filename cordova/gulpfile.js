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

gulp.task('tagAndroidRelease', ['androidProdDist'], shell.task([
        "git tag -a " + package.name + "android-release-" + package.version + " -m ''",
        "git push origin " + package.name + "android-release-" + package.version
]));

gulp.task('releaseAndroid', ['tagAndroidRelease'], function (cb) {
    return gulp.src('platforms/android/ant-build/Tutanota-release.apk')
        .pipe(gulp.dest('/opt/releases/' + package.name + '-android-' + package.version));
});
