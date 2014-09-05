cordova.define("de.tutanota.native.fileUtil", function(require, exports, module) { var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');


var FileUtil = function () {};

/**
 * @return {Promise.<undefined, Error>}.
 */
FileUtil.prototype.open = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"FileUtil", "open",[file]);
    });
};

var fileUtil = FileUtil;
module.exports = fileUtil;


});
