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
 * Gets the badge of the app icon.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.getBadge = function (success, error) {
    var app  = WinJS.Application,
        file = exports._cordova_badge_number;

    app.local.exists(file).then(function (exists) {
        if (exists) {
            app.local.readText(file).then(function (badge) {
                success(isNaN(badge) ? badge : Number(badge));
            });
        } else {
            success(0);
        }
    });
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
    exports.hasPermission(success, error);
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
    var notifications = Windows.UI.Notifications,
        badge         = args[0],
        type          = notifications.BadgeTemplateType.badgeNumber,
        xml           = notifications.BadgeUpdateManager.getTemplateContent(type),
        attrs         = xml.getElementsByTagName('badge'),
        notification  = new notifications.BadgeNotification(xml);

    attrs[0].setAttribute('value', badge);

    notifications.BadgeUpdateManager
        .createBadgeUpdaterForApplication()
        .update(notification);

    exports._saveBadge(badge);

    success(badge);
};


/********
 * UTIL *
 ********/

/**
 * Path to file that containes the badge number.
 * @type {String}
 */
exports._cordova_badge_number = 'cordova_badge_number';

/**
 * Persist the badge of the app icon so that `getBadge` is able to return the
 * badge number back to the client.
 *
 * @param  {Number|String} badge
 * The badge number to save for.
 *
 * @return void
 */
exports._saveBadge = function (badge) {
    WinJS.Application.local.writeText(exports._cordova_badge_number, badge);
};


cordova.commandProxy.add('Badge', exports);
