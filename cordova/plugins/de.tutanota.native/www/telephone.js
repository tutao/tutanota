var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');


var Telephone = function () {};

/**
 * Returns the phone number of this device, if available.
 * @return {Promise.<string, Error>} callback Called with the phone number.
 */
Telephone.prototype.getNumber = function() {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"Telephone", "getNumber",[]);
    });
};

var telephone = Telephone;
module.exports = telephone;

