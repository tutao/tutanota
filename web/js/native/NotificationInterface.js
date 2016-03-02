"use strict";

tutao.provide('tutao.native.NotificationInterface');

/**
 * All notification functions
 * @interface
 */
tutao.native.NotificationInterface = function(){};

/**
 * Creates a new notification for the user
 * @param {string} message
 * @return {Promise.<string, Error>} A result is passed, when the user has clicked on the message.
 */
tutao.native.NotificationInterface.prototype.add = function(message) {};

