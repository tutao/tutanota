"use strict";

tutao.provide('tutao.native.Phone');

/**
 * @implements {tutao.native.PhoneInterface}
 * @constructor
 */
tutao.native.Phone = function(){};

/**
 * Returns the phone number of this device, if available.
 * @return {Promise.<string, Error>} callback Called with the phone number.
 */
tutao.native.Phone.prototype.getNumber = function() {
    return new Promise(function (resolve, reject) {
        resolve("none");
    });
};