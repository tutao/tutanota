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
 * @return {Promise.<tutao.native.DeviceConfig, Error>} Resolves to the current config.
 */
tutao.native.ConfigApp.prototype.read = function() {
    return this.fileUtil.read(this.configFile).then(function (bytes) {
        return new tutao.native.DeviceConfig(JSON.parse(sjcl.codec.utf8String.fromBits(sjcl.codec.bytes.toBits(bytes))));
    }).caught(function () {
        return null;
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