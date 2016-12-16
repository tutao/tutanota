"use strict";

tutao.provide('tutao.native.ConfigFacade');

/**
 * Access and update the device config
 * @interface
 */
tutao.native.ConfigFacade = function(){};

/**
 * @param {string=} lastLoggedInMailAddress The email address that was used to login last time.
 * @return {Promise.<tutao.native.DeviceConfig>} Resolves to the current config.
 */
tutao.native.ConfigFacade.prototype.read = function(lastLoggedInMailAddress) {};

/**
 * Updates the stored config
 * @param {tutao.native.DeviceConfig} config
 * @return {Promise.<undefined, Error>} Resolves after the config has been written
 */
tutao.native.ConfigFacade.prototype.write = function(config) {};