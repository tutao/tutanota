"use strict";

tutao.provide('tutao.native.PushServiceBrowser');

/**
 * Register or unregister for push notifications
 * @interface
 */
tutao.native.PushServiceBrowser = function() {};

/**
 * @return {Promise.<undefined, Error>} Resolves if the registration of this device has been started.
 */
tutao.native.PushServiceBrowser.prototype.register = function() {};


/**
 * @param {string} pushIdentifier The push identifier to check.
 * @return {boolean} Returns true if the push identifier is assigned to the current device.
 */
tutao.native.PushServiceBrowser.prototype.isCurrentPushIdentifier = function(pushIdentifier) {return false};

tutao.native.PushServiceBrowser.prototype.updateBadge = function(number) {
    // no badge available
};