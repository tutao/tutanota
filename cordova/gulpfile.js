var gulp = require('gulp');
var shell = require('gulp-shell')

gulp.task('default', shell.task([
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
    'cordova run android'
]));

gulp.task('ios', shell.task([
    'cordova plugins remove de.tutanota.native',
    'cordova plugins add ../native/',
    'cordova run ios'
]));