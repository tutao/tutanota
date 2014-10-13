var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');


var Util = function () {};

/**
 * Switches to the Homescreen
 * @return {Promise.<undefined, Error>}.
 */
Util.prototype.switchToHomescreen = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"Util", "switchToHomescreen",[]);
    });
};

var util = Util;
module.exports = util;

