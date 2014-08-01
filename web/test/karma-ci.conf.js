var sharedConfig = require('./karma.conf.js');

module.exports = function (config) {
    sharedConfig(config);

    config.set({
        port: 9889,

        browsers: ['Firefox'],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });

};
