var sharedConfig = require('./karma.conf.js');

module.exports = function (config) {
    sharedConfig(config);

    config.set({
        port: 9889,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });

};
