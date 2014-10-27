"use strict";

tutao.provide('tutao.native.DeviceConfig');

/**
 * An android file contains the file name, the URI to the unencrypted file and the session key.
 * @param {tutao.native.DeviceConfig=} config The config to copy from
 * @constructor
 */
tutao.native.DeviceConfig = function(config) {
    this._version = 0;
    this.deviceToken = null;
    this.encryptedPassword = null;
    this.userId = null;
    if (config) {
        this.deviceToken = config.deviceToken;
        this.encryptedPassword = config.encryptedPassword;
        this.userId = config.userId;
    }
};