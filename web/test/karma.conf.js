"use strict";

module.exports = function(config) {
    config.set({
        basePath: '../',

        frameworks: ['mocha', 'chai', 'chai-as-promised'],

        files: [
            './test/lib/sinon-1.4.2.js',
            './test/lib/jsmockito-1.0.4.js',
            './test/lib/jshamcrest-0.6.7.js',
            './lib/*.js',
            './lib/worker/*.js',
            './test/js/Bootstrap.js',
            './js/**/*.js',
            './test/js/generated/**',
            './test/js/rest/EntityRestTestFunctions.js',
            './test/js/util/BucketTestUtils.js',
            './test/js/**/*.js',
        ],

        exclude: [
            './js/Bootstrap.js',
            //'./js/util/init.js',
            './lib/dev/**',
            //'test/js/crypto/**',
        ],

        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['progress', 'junit'],
        junitReporter: {
            outputFile: 'build/test-results/js-unit-tests.xml',
            suite: 'js unit tests'
        },
        htmlReporter: {
            outputFile: 'build/test-results/karma.html'
        },

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,

        browserNoActivityTimeout: 30000, // increased for our long running crypto tests

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera (has to be installed with `npm install karma-opera-launcher`)
        // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
        // - PhantomJS
        // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        port: 9888
    });
};