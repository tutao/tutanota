"use strict";

tutao.provide('tutao.native.DeviceConfig');

/**
 * Device config for internal user auto login. Only one config per device is stored.
 * @param {tutao.native.DeviceConfig=} config The config to copy from
 * @param {string=} lastLoggedInMailAddress The email address that was used to login last time. Only used to transform between version 0 and 1 of the stored data.
 * @constructor
 */
tutao.native.DeviceConfig = function(config, lastLoggedInMailAddress) {
    this._version = 1;
    this._credentials = []; // contains objects with mailAddress, userId, encryptedPassword, deviceToken
    if (config) {
        if (config._version == 0) {
            if (config.userId && config.encryptedPassword && config.deviceToken && lastLoggedInMailAddress) {
                // bofore, we had stored the user id instead of the email address. we use the lastLoggedInMailAddress to store the new credentials
                this._credentials.push({ mailAddress: lastLoggedInMailAddress, userId: config.userId, encryptedPassword: config.encryptedPassword, deviceToken: config.deviceToken });
            }
        } else {
            this._credentials = config._credentials;
        }
    }
};

tutao.native.DeviceConfig.prototype.getAll = function() {
    // make a copy to avoid changes from outside influencing the local array
    return JSON.parse(JSON.stringify(this._credentials));
};

tutao.native.DeviceConfig.prototype.get = function(mailAddress) {
    for (var i=0; i<this._credentials.length; i++) {
        if (this._credentials[i].mailAddress == mailAddress) {
            return this._credentials[i];
        }
    }
    return null;
};

tutao.native.DeviceConfig.prototype.set = function(mailAddress, userId, encryptedPassword, deviceToken) {
    // try to find existing credentials for the given email address
    for (var i=0; i<this._credentials.length; i++) {
        if (this._credentials[i].mailAddress == mailAddress) {
            this._credentials[i].userId = userId;
            this._credentials[i].encryptedPassword = encryptedPassword;
            this._credentials[i].deviceToken = deviceToken;
            return;
        }
    }
    // add new credentials
    this._credentials.push({ mailAddress: mailAddress, userId: userId, encryptedPassword: encryptedPassword, deviceToken: deviceToken });
};

tutao.native.DeviceConfig.prototype.delete = function(mailAddress) {
    for (var i=0; i<this._credentials.length; i++) {
        if (this._credentials[i].mailAddress == mailAddress) {
            this._credentials.splice(i, 1);
            break;
        }
    }
};