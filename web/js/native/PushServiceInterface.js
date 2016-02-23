"use strict";

tutao.provide('tutao.native.PushServiceInterface');

/**
 * Register or unregister for push notifications
 * @interface
 */
tutao.native.PushServiceInterface = function() {};

/**
 * @return {Promise.<undefined, Error>} Resolves if the registration of this device has been started.
 */
tutao.native.PushServiceInterface.prototype.register = function() {};


/**
 * @param {string} pushIdentifier The push identifier to check.
 * @return {boolean} Returns true if the push identifier is assigned to the current device.
 */
tutao.native.PushServiceInterface.prototype.isCurrentPushIdentifier = function(pushIdentifier) {return false};
