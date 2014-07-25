// Karma configuration
// Generated on Tue Jan 07 2014 22:21:37 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../',


    // frameworks to use
    frameworks: [],


    // list of files / patterns to load in the browser
    files: [
        './test/jstd-adapter.js',
        './lib/**/*.js',
        './js/**/*.js',
        './test/lib/**/*.js',
        './test/js/Bootstrap.js',
        './test/js/**/*.js'
    ],


    // list of files to exclude
    exclude: [
     // './src/test/js/crypto/**'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],
    junitReporter: {
      outputFile: 'build/test-results/js-unit-tests.xml',
      suite: 'js unit tests'
    },
    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
        'src/main/html/js/**/*.js': ['coverage']
    },
    coverageReporter: {
      type : 'html',
      dir : 'build/test-results/coverage/'
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
