// Karma configuration
// Generated on Tue Jan 07 2014 22:21:37 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../',


    // frameworks to use
    frameworks: ['mocha', 'chai'],


    // list of files / patterns to load in the browser
    files: [
        './test/lib/sinon-1.4.2.js',
        './test/lib/jsmockito-1.0.4.js',
        './test/lib/jshamcrest-0.6.7.js',
        './lib/**/*.js',
        './js/**/*.js',
        './test/js/Bootstrap.js',
        './test/js/generated/**',
        './test/js/karma/**/*.js',
    ],


    // list of files to exclude
    exclude: [
        './test/js/old/**'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],
    junitReporter: {
      outputFile: 'build/test-results/js-unit-tests.xml',
      suite: 'js unit tests'
    },


    // web server port
    port: 9888,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
