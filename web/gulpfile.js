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
	//return "10.0.2.2"; // use when running in android simulator
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
				if (dev == "eth0" || dev == "wlan0" || dev == "wlp3s0") {
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

var prodGeneric = "if (typeof importScripts !== 'function') {\n\
    tutao.env = new tutao.Environment(tutao.Env.PROD, true, location.hostname, null, 'https://' + location.hostname.replace('app', 'pay'), '" + package.version + "');\n\
    tutao.tutanota.Bootstrap.init();\n\
}\n";

var prodCom = "if (typeof importScripts !== 'function') {\n\
    tutao.env = new tutao.Environment(tutao.Env.PROD, true, 'app.tutanota.com', null, 'https://pay.tutanota.com', '" + package.version + "');\n\
    tutao.tutanota.Bootstrap.init();\n\
}\n";

var testCom = "if (typeof importScripts !== 'function') {\n\
    tutao.env = new tutao.Environment(tutao.Env.TEST, true, 'test.tutanota.com', null, 'https://pay.test.tutanota.com', '" + package.version + "');\n\
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

		gulp.src(['js/generated/entity/monitor/**/*.js'])
			.pipe(sourcemaps.init())
			.pipe(concat('gen5.js'))
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
var WORKER_LIBS = ["lib/worker/*.js", "js/crypto/SecureRandom.js", "js/crypto/Oaep.js", "js/crypto/Pss.js", "js/crypto/Utils.js", "js/util/EncodingConverter.js", "js/crypto/AesInterface.js", "js/crypto/SjclAes128CbcAsync.js", "js/crypto/SjclAes256GcmAsync.js"];

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
		), {
			transform: function (filepath) {
				// locally, the old client is reachable at /old
				return inject.transform.apply(inject.transform, ["/old" + filepath]);
			}
		}))
		.pipe(gulp.dest('./'));
});


gulp.task('payment.html', function () {
	return gulp.src('./payment.html')
		.pipe(inject(merge(
			gulp.src(["lib/jquery-2.2.1.js", "lib/velocity.min.js", "lib/dev/less-1.7.0.min.js", "lib/worker/base.js", "lib/knockout-2.2.1.js"], {read: false}).pipe(sort()),
			gulp.src(["js/ctrl/LanguageViewModel.js", "js/ctrl/lang/**/*.js", "js/util/StringUtils.js", "js/util/FunctionUtils.js", "js/util/ClientDetector.js", "js/gui/gui.js", "js/entity/TutanotaConstants.js"], {read: false}).pipe(sort()),
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
	return gulp.src("pay/init.js")
		.pipe(gulp.dest('build/pay/'));
});


gulp.task('copyTerms', function () {
	return gulp.src('terms.html')
		.pipe(gulp.dest('build/'));
});


gulp.task('minifyPayment', function () {
	return streamqueue({objectMode: true},
		gulp.src(["lib/jquery-2.2.1.js", "lib/velocity.min.js", "lib/worker/base.js", "lib/knockout-2.2.1.js", "js/ctrl/LanguageViewModel.js", "js/ctrl/lang/**/*.js", "js/util/StringUtils.js", "js/util/FunctionUtils.js", "js/util/ClientDetector.js", "js/gui/gui.js", "js/entity/TutanotaConstants.js", "pay/**/*.js", "!pay/init.js"])
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
	return gulp.src('graphics/**')
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
	return gulp.src(['./build/**/*', '!build/fonts/ionicons/ionicons.+(eot|svg|ttf)', '!build/*.map', "!build/test/**", "!build/pay/**", "!build/payment.html", "!build/terms.html"])
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
	env = prodCom;
	fs.writeFileSync("build/init.js", env);
	return runSequence(['copy', 'less', 'concat', 'concatWorker', 'processHtmlCordova'], 'manifest', cb); // 'gzip'
});

gulp.task('distCordovaTest', ['clean'], function (cb) {
	// does not minify and is therefore faster, used for app builds
	env = testCom;
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
	return runSequence(['copy', 'less', 'minify', 'minifyWorker', 'processHtml', 'distPayment'], 'copyTerms', 'manifest', 'gzip', cb);
});

// used for building local release running against production system
gulp.task('dist', ['clean'], function (cb) {
	env = prodCom;
	fs.writeFileSync("build/init.js", env);
	return runSequence(['copy', 'less', 'minify', 'minifyWorker', 'processHtml', 'distPayment'], 'copyTerms', 'manifest', 'gzip', cb);
});

// used for building the release running in the browser
gulp.task('distBrowser', ['clean'], function (cb) {
	env = prodGeneric;
	fs.writeFileSync("build/init.js", env);
	return runSequence(['copy', 'less', 'minify', 'minifyWorker', 'processHtml', 'distPayment'], 'copyTerms', 'manifest', 'gzip', cb);
});

gulp.task('copyRelease', function () {
	return gulp.src('build/**')
		.pipe(gulp.dest('/opt/releases/' + package.name + '-' + package.version));
});

gulp.task('release', ['distBrowser'], function (cb) {
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
		url: 'https://api.phraseapp.com/v2/projects/c524b42d3bcffd79c69528cb70ca2118/locales?per_page=100',
		headers: {
			'User-Agent': 'tutanota (hello@tutao.de)',
			'Authorization': 'token 83c96102984021e90af37983e5212eb79eb8bebbd4744ad341bf367963a032fb'
		}
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var languages = JSON.parse(body);
			// download each language
			return async.eachSeries(languages, function (lang, callback) {
				// lang is an object eg. {"id": 122, "name": "german",  "code": "de-DE",  "country_code": "de",  "rtl": "false"}
				request({
					url: 'https://api.phraseapp.com/v2/projects/c524b42d3bcffd79c69528cb70ca2118/locales/' + lang.name + '/download?file_format=simple_json',
					headers: {
						'User-Agent': 'tutanota (hello@tutao.de)',
						'Authorization': 'token 83c96102984021e90af37983e5212eb79eb8bebbd4744ad341bf367963a032fb'
					}
				}, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						var code = lang.code.replace("-", "_").toLowerCase();
						var translation = "tutao.provide('tutao.tutanota.ctrl.lang." + code + "');\n";
						translation += "tutao.tutanota.ctrl.lang." + code + ".writing_direction = \"" + (lang.rtl ? 'rtl' : 'ltr') + "\";\n";
						translation += "tutao.tutanota.ctrl.lang." + code + ".id = \"" + code + "\";\n";
						translation += "tutao.tutanota.ctrl.lang." + code + ".keys = ";
						translation += body + ";";
						fs.writeFileSync("js/ctrl/lang/" + code + ".js", translation);

						var iosLangDir = "../native/res/ios/lang/" + code + ".lproj";
						if (!fs.existsSync(iosLangDir)) {
							fs.mkdirSync(iosLangDir);
						}
						var iosTranslations = "";
						var keys = JSON.parse(body);
						iosTranslations += keys.cameraUsageDescription_msg ? ("NSCameraUsageDescription = \"" + keys.cameraUsageDescription_msg + "\";\n") : "";
						iosTranslations += keys.photoLibraryUsageDescription_msg ? ("NSPhotoLibraryUsageDescription = \"" + keys.photoLibraryUsageDescription_msg + "\";\n") : "";
						iosTranslations += keys.microphoneUsageDescription_msg ? ("NSMicrophoneUsageDescription = \"" + keys.microphoneUsageDescription_msg + "\";\n") : "";
						iosTranslations += keys.contactsUsageDescription_msg ? ("NSContactsUsageDescription = \"" + keys.contactsUsageDescription_msg + "\";\n") : "";
						iosTranslations += keys.remindersUsageDescription_msg ? ("NSRemindersUsageDescription = \"" + keys.remindersUsageDescription_msg + "\";\n") : "";
						iosTranslations += keys.openCamera_action ? ("TutaoShowCameraAction = \"" + keys.openCamera_action + "\";\n") : "";
						iosTranslations += keys.choosePhotos_action ? ("TutaoChoosePhotosAction = \"" + keys.choosePhotos_action + "\";\n") : "";


						fs.writeFileSync(iosLangDir + "/InfoPlist.strings", iosTranslations);
						console.log(code);
						callback();
					} else {
						callback(JSON.stringify({e: error, status: response.statusCode, body: body}));
					}
				});
			}, cb);
		}
	});
});
