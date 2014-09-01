"use strict";

tutao.provide('tutao.native.NotificationInterface');

/**
 * All notification functions
 * @interface
 */
tutao.native.NotificationInterface = function(){};

/**
 * Creates a new notification for the user
 * @param {string} title
 * @param {string} message
 * @param {number} badge
 * @return {Promise.<string, Error>} A result is passed, when the user has clicked on the message.
 */
tutao.native.NotificationInterface.prototype.add = function(title, message, badge) {};

/**
 * Updates the bade number on the app icon (only for ios and windows phone).
 * @param {number} number
 */
tutao.native.NotificationInterface.prototype.updateBadge = function(number) {};