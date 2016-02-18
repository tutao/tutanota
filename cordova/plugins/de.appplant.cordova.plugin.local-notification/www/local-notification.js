/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */


/*************
 * INTERFACE *
 *************/

/**
 * Returns the default settings.
 *
 * @return {Object}
 */
exports.getDefaults = function () {
    return this.core.getDefaults();
};

/**
 * Overwrite default settings.
 *
 * @param {Object} defaults
 */
exports.setDefaults = function (defaults) {
    this.core.setDefaults(defaults);
};

/**
 * Schedule a new local notification.
 *
 * @param {Object} notifications
 *      The notification properties
 * @param {Function} callback
 *      A function to be called after the notification has been canceled
 * @param {Object?} scope
 *      The scope for the callback function
 * @param {Object?} args
 *      skipPermission:true schedules the notifications immediatly without
 *                          registering or checking for permission
 */
exports.schedule = function (notifications, callback, scope, args) {
    this.core.schedule(notifications, callback, scope, args);
};

/**
 * Update existing notifications specified by IDs in options.
 *
 * @param {Object} notifications
 *      The notification properties to update
 * @param {Function} callback
 *      A function to be called after the notification has been updated
 * @param {Object?} scope
 *      The scope for the callback function
 * @param {Object?} args
 *      skipPermission:true schedules the notifications immediatly without
 *                          registering or checking for permission
 */
exports.update = function (notifications, callback, scope, args) {
    this.core.update(notifications, callback, scope, args);
};

/**
 * Clear the specified notification.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A function to be called after the notification has been cleared
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.clear = function (ids, callback, scope) {
    this.core.clear(ids, callback, scope);
};

/**
 * Clear all previously sheduled notifications.
 *
 * @param {Function} callback
 *      A function to be called after all notifications have been cleared
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.clearAll = function (callback, scope) {
    this.core.clearAll(callback, scope);
};

/**
 * Cancel the specified notifications.
 *
 * @param {String[]} ids
 *      The IDs of the notifications
 * @param {Function} callback
 *      A function to be called after the notifications has been canceled
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.cancel = function (ids, callback, scope) {
    this.core.cancel(ids, callback, scope);
};

/**
 * Remove all previously registered notifications.
 *
 * @param {Function} callback
 *      A function to be called after all notifications have been canceled
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.cancelAll = function (callback, scope) {
    this.core.cancelAll(callback, scope);
};

/**
 * Check if a notification with an ID is present.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.isPresent = function (id, callback, scope) {
    this.core.isPresent(id, callback, scope);
};

/**
 * Check if a notification with an ID is scheduled.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.isScheduled = function (id, callback, scope) {
    this.core.isScheduled(id, callback, scope);
};

/**
 * Check if a notification with an ID was triggered.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.isTriggered = function (id, callback, scope) {
    this.core.isTriggered(id, callback, scope);
};

/**
 * List all local notification IDs.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAllIds = function (callback, scope) {
    this.core.getAllIds(callback, scope);
};

/**
 * Alias for `getAllIds`.
 */
exports.getIds = function () {
    this.getAllIds.apply(this, arguments);
};

/**
 * List all scheduled notification IDs.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getScheduledIds = function (callback, scope) {
    this.core.getScheduledIds(callback, scope);
};

/**
 * List all triggered notification IDs.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getTriggeredIds = function (callback, scope) {
    this.core.getTriggeredIds(callback, scope);
};

/**
 * Property list for given local notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Number[]?} ids
 *      Set of notification IDs
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.get = function () {
    this.core.get.apply(this.core, arguments);
};

/**
 * Property list for all local notifications.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAll = function (callback, scope) {
    this.core.getAll(callback, scope);
};

/**
 * Property list for given scheduled notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Number[]?} ids
 *      Set of notification IDs
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getScheduled = function () {
    this.core.getScheduled.apply(this.core, arguments);
};

/**
 * Property list for all scheduled notifications.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAllScheduled = function (callback, scope) {
    this.core.getAllScheduled(callback, scope);
};

/**
 * Property list for given triggered notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Number[]?} ids
 *      Set of notification IDs
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getTriggered = function () {
    this.core.getTriggered.apply(this.core, arguments);
};

/**
 * Property list for all triggered notifications.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAllTriggered = function (callback, scope) {
    this.core.getAllTriggered(callback, scope);
};

/**
 * Informs if the app has the permission to show notifications.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.hasPermission = function (callback, scope) {
    this.core.hasPermission(callback, scope);
};

/**
 * Register permission to show notifications if not already granted.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.registerPermission = function (callback, scope) {
    this.core.registerPermission(callback, scope);
};


/****************
 * DEPRECATIONS *
 ****************/

/**
 * Schedule a new local notification.
 */
exports.add = function () {
    console.warn('Depreated: Please use `notification.local.schedule` instead.');

    this.schedule.apply(this, arguments);
};

/**
 * Register permission to show notifications
 * if not already granted.
 */
exports.promptForPermission = function () {
    console.warn('Depreated: Please use `notification.local.registerPermission` instead.');

    this.registerPermission.apply(this, arguments);
};


/**********
 * EVENTS *
 **********/

/**
 * Register callback for given event.
 *
 * @param {String} event
 *      The event's name
 * @param {Function} callback
 *      The function to be exec as callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.on = function (event, callback, scope) {
    this.core.on(event, callback, scope);
};

/**
 * Unregister callback for given event.
 *
 * @param {String} event
 *      The event's name
 * @param {Function} callback
 *      The function to be exec as callback
 */
exports.un = function (event, callback) {
    this.core.un(event, callback, scope);
};
