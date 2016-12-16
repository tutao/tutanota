"use strict";

tutao.provide('tutao.native.ConfigApp');

/**
 * Access and update the device config
 * @implements {tutao.native.ConfigFacade}
 */
tutao.native.ConfigApp = function(){
    this.fileUtil = new tutao.native.device.FileUtil();
    this.configFile = cordova.file.dataDirectory + "config/tutanota.json";
};

/**
 * @param {string=} lastLoggedInMailAddress The email address that was used to login last time.
 * @return {Promise.<tutao.native.DeviceConfig>} Resolves to the current config.
 */
tutao.native.ConfigApp.prototype.read = function(lastLoggedInMailAddress) {
    return this.fileUtil.read(this.configFile).then(function (bytes) {
        return new tutao.native.DeviceConfig(JSON.parse(sjcl.codec.utf8String.fromBits(sjcl.codec.bytes.toBits(bytes))), lastLoggedInMailAddress);
    }).caught(function () {
        return new tutao.native.DeviceConfig();
    });
};

/**
 * Updates the stored config
 * @param {tutao.native.DeviceConfig} config
 * @return {Promise.<undefined, Error>} Resolves after the config has been written
 */
tutao.native.ConfigApp.prototype.write = function(config) {
    return this.fileUtil.write(this.configFile, new Uint8Array(sjcl.codec.bytes.fromBits(sjcl.codec.utf8String.toBits(JSON.stringify(config)))));
};