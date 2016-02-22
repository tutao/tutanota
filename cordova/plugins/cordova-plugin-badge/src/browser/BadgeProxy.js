/*
 * Copyright (c) 2013-2016 by appPlant UG. All rights reserved.
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


/**
 * Instance of the Favico.js libary.
 * @type {Favico}
 */
exports.favico = new cordova.plugins.notification.badge.Favico({
    animation: 'none'
});

/**
 * Holds the current badge number value.
 * @type {Number}
 */
exports.badgeNumber = 0;


/**
 * Clears the badge of the app icon.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.clearBadge = function (success, error) {
    exports.setBadge(success, error, [0]);
};

/**
 * Sets the badge of the app icon.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {Number} badge
 *      The new badge number
 */
exports.setBadge = function (success, error, args) {
    var badge = args[0];

    exports.badgeNumber = badge;

    exports.favico.badge(badge);
    success(badge);
};

/**
 * Gets the badge of the app icon.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.getBadge = function (success, error) {
    success(exports.badgeNumber);
};

/**
 * Informs if the app has the permission to show badges.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.hasPermission = function (success, error) {
    success(true);
};

/**
 * Register permission to show badges if not already granted.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.registerPermission = function (success, error) {
    success(true);
};


cordova.commandProxy.add('Badge', exports);
