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
