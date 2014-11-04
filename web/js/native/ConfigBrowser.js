"use strict";

tutao.provide('tutao.native.ConfigBrowser');

/**
 * Access and update the device config
 * @implements {tutao.native.ConfigFacade}
 */
tutao.native.ConfigBrowser = function(){};

/**
 * @return {Promise.<tutao.native.DeviceConfig, Error>} Resolves to the current config.
 */
tutao.native.ConfigBrowser.prototype.read = function() {
    var config = tutao.tutanota.util.LocalStore.load('config');
    try {
        return Promise.resolve(JSON.parse(config));
    } catch(e) {
        return Promise.resolve(null);
    }
};

/**
 * Updates the stored config
 * @param {tutao.native.DeviceConfig} config
 * @return {Promise.<undefined, Error>} Resolves after the config has been written
 */
tutao.native.ConfigBrowser.prototype.write = function(config) {
    return Promise.resolve(tutao.tutanota.util.LocalStore.store('config', JSON.stringify(config)));
};