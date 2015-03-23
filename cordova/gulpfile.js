var gulp = require('gulp');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');

var androidVersion = "1.9.0";

gulp.task('default', shell.task([
    // we need to remove and add the native plugin, because changes are not copied from the plugins to the platform folder during build. re-create the link from the plugins native folder to the native project afterwards
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
    'rm -r ./plugins/de.tutanota.native',
    'ln -s ../../native/ ./plugins/de.tutanota.native',
    'cordova run android'
]));

gulp.task('createWebRelease', shell.task([
    'cd ../web; gulp distCordova'
]));



gulp.task('createWebReleaseTest', shell.task([
    'cd ../web; gulp distCordovaTest'
]));

gulp.task('androidProdDistUnsigned', ['createWebRelease'], shell.task([
    'cordova platform remove android',
    'cordova platform add android',
    'cordova build --release android'
]));

gulp.task('androidProdDist', ['createWebRelease'], shell.task([
    'cordova platform remove android',
    'cordova platform add android',
    'ln -sf /opt/next-config/android-keystore/ant.properties ./platforms/android/',
    'cordova build --release android'
]));

gulp.task('androidTestDist', ['createWebReleaseTest'], shell.task([
    'cordova platform remove android',
    'cordova platform add android',
    'ln -sf /opt/next-config/android-keystore/ant.properties ./platforms/android/',
    'cordova build --release android'
]));


gulp.task('prepareiOSProdDist', ['createWebRelease'], shell.task([
    'cordova platform remove ios',
	'cordova platform add ios'
]));

gulp.task('prepareiOSTestDist', ['createWebReleaseTest'], shell.task([
    'cordova platform remove ios',
	'cordova platform add ios'
]));



gulp.task('tagAndroidRelease', ['androidProdDist'], shell.task([
        "git tag -a tutanota-android-release-" + androidVersion + " -m ''",
        "git push origin tutanota-android-release-" + androidVersion
]));

gulp.task('releaseAndroid', ['tagAndroidRelease'], function (cb) {
    return gulp.src('platforms/android/ant-build/Tutanota-release.apk')
        .pipe(gulp.dest('/opt/releases/tutanota-android-' + androidVersion));
});
