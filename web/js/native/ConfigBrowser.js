"use strict";

tutao.provide('tutao.native.ConfigBrowser');

/**
 * Access and update the device config
 * @implements {tutao.native.ConfigFacade}
 */
tutao.native.ConfigBrowser = function(){};

/**
 * @param {string=} lastLoggedInMailAddress The email address that was used to login last time.
 * @return {Promise.<tutao.native.DeviceConfig>} Resolves to the current config.
 */
tutao.native.ConfigBrowser.prototype.read = function(lastLoggedInMailAddress) {
    var config = tutao.tutanota.util.LocalStore.load('config');
    try {
        return Promise.resolve(new tutao.native.DeviceConfig(JSON.parse(config), lastLoggedInMailAddress));
    } catch(e) {
        return Promise.resolve(new tutao.native.DeviceConfig());
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