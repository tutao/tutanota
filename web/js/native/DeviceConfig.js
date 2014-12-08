"use strict";

tutao.provide('tutao.native.DeviceConfig');

/**
 * Device config for internal user auto login. Only one config per device is stored.
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