"use strict";

tutao.provide('tutao.native.ConfigFacade');

/**
 * Access and update the device config
 * @interface
 */
tutao.native.ConfigFacade = function(){};

/**
 * @return {Promise.<tutao.native.DeviceConfig, Error>} Resolves to the current config.
 */
tutao.native.ConfigFacade.prototype.read = function() {};

/**
 * Updates the stored config
 * @param {tutao.native.DeviceConfig} config
 * @return {Promise.<undefined, Error>} Resolves after the config has been written
 */
tutao.native.ConfigFacade.prototype.write = function(config) {};