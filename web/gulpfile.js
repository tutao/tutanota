gulp = require('gulp');
var path = require('path');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var manifest = require('gulp-appcache');
var streamqueue = require('streamqueue');
var es = require('event-stream');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');
var inject = require("gulp-inject");
var htmlreplace = require('gulp-html-replace');
var replace = require('gulp-replace');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');
var gulpFilter = require('gulp-filter');
var insert = require('gulp-insert');
var gzip = require('gulp-gzip');
var karma = require('karma').server;
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var sort = require('gulp-sort');
var merge = require('gulp-merge');

var package = require('../package.json');

var fs = require('fs');
var request = require('request');
var async = require('async');

function getIpAddress() {
    var os = require('os');
    if (os.type() == "Darwin") {
        return "192.168.178.51"; //bed
    }
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
        var details = ifaces[dev];
        for (var i = 0; i < details.length; i++) {
            var detail = details[i];
            if (detail.family == 'IPv4') {
                if (dev == "eth0" || dev == "wlan0") {
                    return detail.address;
                }
            }
        }
    }
}

var init = fs.readFileSync("js/util/init.js", 'utf8');

var local_compiled = "if (typeof importScripts !== 'function') {\n\
    tutao.env = new tutao.Environment(tutao.Env.LOCAL_COMPILED, false, '" + getIpAddress() + "', 9000, 'http://pay.localhost:9000/build', '" + package.version + "');\n\
    tutao.tutanota.Bootstrap.init();\n\
}\n";


var prod = "if (typeof importScripts !== 'function') {\n\
    tutao.env = new tutao.Environment(tutao.Env.PROD, true, 'app.tutanota.de', null, 'https://pay.tutanota.de', '" + package.version + "');\n\
    tutao.tutanota.Bootstrap.init();\n\
}\n";

var test = "if (typeof importScripts !== 'function') {\n\
    tutao.env = new tutao.Environment(tutao.Env.TEST, true, 'test.tutanota.de', null, 'https://pay.test.tutanota.de', '" + package.version + "');\n\
    tutao.tutanota.Bootstrap.init();\n\
}\n";

var env = local_compiled;

gulp.task('clean', function () {
    mkdirp("build");
    return gulp.src(["build/*"], {read: false})
        .pipe(clean({force: true}));

});

gulp.task('minify', function () {
    return streamqueue({objectMode: true},
        gulp.src("lib/*.js")
            .pipe(sourcemaps.init())
            .pipe(concat('lib.js'))
            .pipe(insert.prepend("if (typeof importScripts !== 'function') {"))
            .pipe(insert.append("}"))
            .pipe(uglify()),

        gulp.src("lib/worker/*.js")
            .pipe(sourcemaps.init())
            .pipe(concat('lib.js'))
            .pipe(uglify()),

        gulp.src('js/generated/entity/tutanota/**/*.js')
            .pipe(sourcemaps.init())
            .pipe(concat('gen1.js'))
            .pipe(replace("\"use strict\";", ""))
            .pipe(insert.prepend("\"use strict\";"))
            .pipe(uglify()),

        gulp.src('js/generated/entity/sys/**/[A-M]*.js')
            .pipe(sourcemaps.init())
            .pipe(concat('gen2.js'))
            .pipe(replace("\"use strict\";", ""))
            .pipe(uglify()),

        gulp.src('js/generated/entity/sys/**/[O-Z]*.js')
            .pipe(sourcemaps.init())
            .pipe(concat('gen3.js'))
            .pipe(replace("\"use strict\";", ""))
            .pipe(uglify()),

        gulp.src(['js/generated/entity/base/**/*.js'])
            .pipe(sourcemaps.init())
            .pipe(concat('gen4.js'))
            .pipe(replace("\"use strict\";", ""))
            .pipe(uglify()),

        gulp.src(['js/**/*.js', '!js/generated/entity/**', '!js/util/init.js'])
            .pipe(sourcemaps.init())
            .pipe(concat('js.js'))
            .pipe(replace("\"use strict\";", ""))
            .pipe(uglify()))
        .pipe(concat("app.min.js"))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build/'));
});

gulp.task('concat', function () {
    return streamqueue({objectMode: true},
        gulp.src("lib/worker/*.js")
            .pipe(concat('workerLib.js')),

        gulp.src(['lib/*.js'])
            .pipe(concat("lib.js"))
            .pipe(insert.prepend("if (typeof importScripts !== 'function') {\n"))
            .pipe(insert.append("}\n")),


        gulp.src(['js/**/*.js', "!js/util/init.js"])
            .pipe(concat("app.js"))
    ).pipe(concat("app.min.js"))
        .pipe(gulp.dest('build/'));
});


// Keep in sync with tutanota-admin gulpfile.
var WORKER_LIBS = ["lib/worker/*.js", "js/crypto/SecureRandom.js", "js/crypto/Oaep.js", "js/crypto/Pss.js", "js/crypto/Utils.js", "js/util/EncodingConverter.js"];

gulp.task('minifyWorker', function () {
    gulp.src(WORKER_LIBS)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat("worker.min.js"))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build/'));
});

gulp.task('concatWorker', function () {
    gulp.src(WORKER_LIBS)
        .pipe(sourcemaps.init())
        .pipe(concat("worker.min.js"))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build/'));
});

gulp.task('concatTest', function () {
    return streamqueue({objectMode: true},
        gulp.src("lib/worker/*.js")
            .pipe(concat('workerLib.js')),

        gulp.src(['lib/*.js', 'test/lib/*.js'])
            .pipe(concat("lib.js"))
            .pipe(insert.prepend("if (typeof importScripts !== 'function') {\n"))
            .pipe(insert.append("\nmocha.setup('bdd');\n"))
            .pipe(insert.append("}\n")),


        gulp.src(['js/**/*.js', "!js/util/init.js", "!js/Bootstrap.js"])
            .pipe(concat("app.js")),

        gulp.src(['test/js/rest/EntityRestTestFunctions.js', 'test/js/**/*.js'])
            .pipe(concat("test.js"))
            .pipe(insert.prepend("if (typeof importScripts !== 'function') {\n"))
            .pipe(insert.append("}\n"))
    ).pipe(concat("app.min.js"))
        .pipe(gulp.dest('build/test/'));
});

gulp.task('index.html', function () {
    return gulp.src('./index.html')
        .pipe(inject(merge(
            gulp.src(['lib/**/*.js'], {read: false}).pipe(sort()), // base.js is included in lib, so it has to be injected before other js files
            gulp.src(["js/**/*.js", "!js/util/init.js"], {read: false}).pipe(sort())
        )))
        .pipe(gulp.dest('./'));
});


gulp.task('payment.html', function () {
    return gulp.src('./payment.html')
        .pipe(inject(merge(
            gulp.src(["lib/jquery-1.9.1.js", "lib/dev/less-1.7.0.min.js", "lib/worker/base.js", "lib/knockout-2.2.1.js"], {read: false}).pipe(sort()),
            gulp.src(["js/ctrl/LanguageViewModel.js","js/ctrl/lang/**/*.js", "js/util/StringUtils.js" ,"js/util/FunctionUtils.js","js/util/ClientDetector.js" , "js/gui/gui.js", "js/entity/TutanotaConstants.js" ], {read: false}).pipe(sort()),
            gulp.src(["pay/**/*.js", "!pay/init.js"], {read: false}).pipe(sort())
        )))
        .pipe(gulp.dest('./'));
});

gulp.task('processPaymentHtml', function () {
    return gulp.src('payment.html')
        .pipe(htmlreplace({
            'css': 'css/main.css',
            'js': ['pay/pay.min.js']
        }))
        .pipe(gulp.dest('build/'));
});

gulp.task('copyPayment', function () {
    return gulp.src( "pay/init.js" )
        .pipe(gulp.dest('build/pay/'));
});


gulp.task('minifyPayment', function () {
    return streamqueue({objectMode: true},
        gulp.src(["lib/jquery-1.9.1.js", "lib/worker/base.js", "lib/knockout-2.2.1.js", "js/ctrl/LanguageViewModel.js","js/ctrl/lang/**/*.js", "js/util/StringUtils.js" ,"js/util/FunctionUtils.js","js/util/ClientDetector.js" , "js/gui/gui.js", "js/entity/TutanotaConstants.js", "pay/**/*.js", "!pay/init.js"])
            .pipe(sourcemaps.init())
            .pipe(concat("pay.min.js"))
            .pipe(uglify())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('build/pay/')))
});

gulp.task('distPayment', function (cb) {
    return runSequence(['copyPayment', 'minifyPayment', 'processPaymentHtml'], cb)
});



gulp.task('test.html', function () {
    return gulp.src('./test/index.html')
        .pipe(inject(gulp.src(['lib/**/*.js', 'test/lib/*.js'], {read: false}).pipe(sort()), {starttag: '<!-- inject:lib:{{ext}} -->'}))
        .pipe(inject(gulp.src([
            'js/**/*.js', "!js/util/init.js", "!js/Bootstrap.js",
            'test/js/rest/EntityRestTestFunctions.js', 'test/js/**/*.js'
        ], {read: false}).pipe(sort())))
        .pipe(gulp.dest('./test'));
});

gulp.task('processHtml', function () {
    return gulp.src('./index.html')
        .pipe(htmlreplace({
            'css': 'css/main.css',
            'js': ['app.min.js', 'init.js'] // 'cordova.js'
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('processHtmlCordova', function () {
    return gulp.src('./index.html')
        .pipe(htmlreplace({
            'css': 'css/main.css',
            'js': ['cordova.js', 'app.min.js', 'init.js'] //
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('processTestHtml', function () {
    return gulp.src('./test/index.html')
        .pipe(htmlreplace({
            'js': ['../cordova.js', 'app.min.js', '../init.js'],
            'css': ['mocha.css']
        }))
        .pipe(gulp.dest('./build/test'));
});

gulp.task('less', function () {
    return gulp.src('less/main.less')
        //.pipe(sourcemaps.init())
        .pipe(less())
        .pipe(minifyCSS())
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/css/'));
});

gulp.task('copyMessages', function () {
    return gulp.src('messages.html')
        .pipe(gulp.dest('./build/'));
});

gulp.task('copyOperative', function () {
    return gulp.src('lib/operative-0.3.1.js')
        .pipe(gulp.dest('./build/'));
});

gulp.task('copyFonts', function () {
    return gulp.src('fonts/**')
        .pipe(gulpFilter(['icomoon.*', 'ionicons/*']))
        .pipe(gulp.dest('./build/fonts'));
});

gulp.task('copyGraphics', function () {
    return gulp.src('graphics/*')
        .pipe(gulp.dest('./build/graphics'));
});

gulp.task('copyMochaStylesheet', function () {
    return gulp.src('test/lib/mocha.css')
        .pipe(gulp.dest('./build/test/'));
});

gulp.task('copyFirefoxManifest', function () {
    return gulp.src('manifest.webapp')
        .pipe(gulp.dest('./build/'));
});

gulp.task('copy', ['copyMessages', 'copyOperative', 'copyFonts', 'copyGraphics', 'copyMochaStylesheet', 'copyFirefoxManifest'], function () {
});

gulp.task('manifest', function () {
    return gulp.src(['./build/**/*', '!build/fonts/ionicons/ionicons.+(eot|svg|ttf)', '!build/*.map', "!build/test/**", "!build/pay/**", "!build/payment.html"])
        .pipe(manifest({
            timestamp: true,
            network: ['*'],
            filename: 'tutanota.appcache',
            exclude: ['build/tutanota.appcache']
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('test', function (done) {
    karma.start({configFile: path.resolve('test/karma-ci.conf.js')}, function (error) {
        done(error);
    });
});

gulp.task('gzip', function () {
    return gulp.src(['./build/**', '!./build/*.map', '!./build/fonts/**', '!./build/graphics/**'])
        .pipe(gzip())
        .pipe(gulp.dest('build'));
});

gulp.task('distCordova', ['clean'], function (cb) {
    // does not minify and is therefore faster, used for app builds
    env = prod;
    fs.writeFileSync("build/init.js", env);
    return runSequence(['copy', 'less', 'concat', 'concatWorker', 'processHtmlCordova'], 'manifest', cb); // 'gzip'
});

gulp.task('distCordovaTest', ['clean'], function (cb) {
    // does not minify and is therefore faster, used for app builds
    env = test;
    fs.writeFileSync("build/init.js", env);
    return runSequence(['copy', 'less', 'concat', 'concatWorker', 'processHtmlCordova'], 'manifest', cb); // 'gzip'
});

gulp.task('distCordovaLocal', ['clean'], function (cb) {
    // does not minify and is therefore faster, used for app builds
    env = local_compiled;
    fs.writeFileSync("build/init.js", env);
    return runSequence(['copy', 'less', 'concat', 'concatWorker', 'processHtmlCordova', 'concatTest', 'processTestHtml'], 'manifest', cb); // 'gzip'
});

gulp.task('distLocal', ['clean'], function (cb) {
    env = local_compiled;
    fs.writeFileSync("build/init.js", env);
    return runSequence(['copy', 'less', 'minify', 'minifyWorker', 'processHtml', 'distPayment'], 'manifest', 'gzip', cb);
});

gulp.task('dist', ['clean'], function (cb) {
    env = prod;
    fs.writeFileSync("build/init.js", env);
    return runSequence(['copy', 'less', 'minify', 'minifyWorker', 'processHtml', 'distPayment'], 'manifest', 'gzip', cb);
});

gulp.task('copyRelease', function() {
    return gulp.src('build/**')
        .pipe(gulp.dest('/opt/releases/' + package.name + '-' + package.version));
});

gulp.task('release', ['dist'], function (cb) {
    return runSequence('tagRelease', 'copyRelease', cb);
});

gulp.task('tagRelease', shell.task([
    "git tag -a " + package.name + "-release-" + package.version + " -m ''",
    "git push origin " + package.name + "-release-" + package.version
]));

gulp.task('default', ['clean', 'distCordovaLocal'], function () {
    gulp.watch('graphics/**/*', ['copyGraphics']);
    gulp.watch('fonts/**', ['copyFonts']);
    gulp.watch(['lib/**', 'js/**'], ['concat']);
    gulp.watch(['lib/**', 'js/**', 'test/**'], ['concatTest']);
    gulp.watch('./index.html', ['processHtmlCordova']);
    gulp.watch("less/*", ['less']);
});


gulp.task('translation', function (cb) {    
	// get all languages from phraseapp
    request({
        url: 'https://api.phraseapp.com/v2/projects/a2c77a2fc05d8803eb1e83f51b396d6d/locales/',
        headers: {
            'User-Agent': 'tutanota (hello@tutao.de)',
            'Authorization': 'token 83c96102984021e90af37983e5212eb79eb8bebbd4744ad341bf367963a032fb'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
			var languages = JSON.parse(body); 
			// download each language
			return async.eachSeries(languages, function(lang, callback) {				
				// lang is an object eg. {"id": 122, "name": "german",  "code": "de-DE",  "country_code": "de",  "writing_direction": "ltr"}
                request({
                    url: 'https://api.phraseapp.com/v2/projects/a2c77a2fc05d8803eb1e83f51b396d6d/locales/' + lang.name + '/download?file_format=simple_json',
                    headers: {
                        'User-Agent': 'tutanota (hello@tutao.de)',
                        'Authorization': 'token 83c96102984021e90af37983e5212eb79eb8bebbd4744ad341bf367963a032fb'
                    }
                }, function(error, response, body) {
					if (!error && response.statusCode == 200) {
						var code = lang.code.replace("-","_").toLowerCase();						
					    var translation = "tutao.provide('tutao.tutanota.ctrl.lang." + code + "');\n";
					    translation += "tutao.tutanota.ctrl.lang." + code + ".writing_direction = \"" + lang.writing_direction + "\";\n";
					    translation += "tutao.tutanota.ctrl.lang." + code + ".id = \"" + code + "\";\n";
					    translation += "tutao.tutanota.ctrl.lang." + code + ".keys = ";					
					    translation += body + ";";					    
					    fs.writeFileSync("js/ctrl/lang/" + code + ".js", translation);
						console.log(code);
					    callback();
					} else {
					    callback(JSON.stringify({e: error, status: response.statusCode, body: body}));
					}
				});
			},cb);			
        } 
    });
});
