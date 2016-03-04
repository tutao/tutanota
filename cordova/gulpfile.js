var gulp = require('gulp');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');

var androidVersion = "2.9.3";

gulp.task('default', shell.task([
    // we need to remove and add the native plugin, because changes are not copied from the plugins to the platform folder during build. re-create the link from the plugins native folder to the native project afterwards
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
    'rm -r ./plugins/de.tutanota.native',
    'ln -s ../../native/ ./plugins/de.tutanota.native',
    // attention: do not use platforms/android/cordova/run because it does not copy the www content
    'cordova run android'
]));

gulp.task('updateAndroidPlatformAndTutanotaPlugin', shell.task([
    'cordova platform remove android',
    'cordova platform add android@5.1.0',
    // we need to remove and add the native plugin, because changes are not copied from the plugins to the platform folder during build. re-create the link from the plugins native folder to the native project afterwards
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
    'rm -r ./plugins/de.tutanota.native',
    'ln -s ../../native/ ./plugins/de.tutanota.native'
]));

gulp.task('createWebRelease',shell.task([
    'cd ../web; gulp distCordova'
]));

gulp.task('createWebReleaseTest', shell.task([
    'cd ../web; gulp distCordovaTest'
]));

gulp.task('androidProdDistUnsigned', ['createWebRelease', 'updateAndroidPlatformAndTutanotaPlugin'], shell.task([
    // attention: platforms/android/cordova/build does not copy the www content itself, but it was cleared and copied because of platform add/remove
    'platforms/android/cordova/build --release android'
]));

gulp.task('androidProdDist', ['createWebRelease', 'updateAndroidPlatformAndTutanotaPlugin'], shell.task([
    // attention: platforms/android/cordova/build does not copy the www content itself, but it was cleared and copied because of platform add/remove
    // attention: do not use "cordova build" here because it does not respect the --buildConfig
    'platforms/android/cordova/build --buildConfig /opt/next-config/android-keystore/build.json --release android'
]));

gulp.task('androidTestDist', ['createWebReleaseTest', 'updateAndroidPlatformAndTutanotaPlugin'], shell.task([
    // attention: platforms/android/cordova/build does not copy the www content itself, but it was cleared and copied because of platform add/remove
    // attention: do not use "cordova build" here because it does not respect the --buildConfig
    'platforms/android/cordova/build --buildConfig /opt/next-config/android-keystore/build.json --release android'
]));


gulp.task('prepareiOSProdDist', ['createWebRelease'], shell.task([
    'cordova platform remove ios',
	'cordova platform add https://github.com/apache/cordova-ios.git#4.1.0',
	'cordova prepare ios'
]));

gulp.task('prepareiOSTestDist', ['createWebReleaseTest'], shell.task([
    'cordova platform remove ios',
	'cordova platform add https://github.com/apache/cordova-ios.git#4.1.0',
	'cordova prepare ios'
]));



gulp.task('tagAndroidRelease', ['androidProdDist'], shell.task([
        "git tag -a tutanota-android-release-" + androidVersion + " -m ''",
        "git push origin tutanota-android-release-" + androidVersion
]));

gulp.task('releaseAndroid', ['tagAndroidRelease'], function (cb) {
    return gulp.src('platforms/android/ant-build/Tutanota-release.apk')
        .pipe(gulp.dest('/opt/releases/tutanota-android-' + androidVersion));
});
