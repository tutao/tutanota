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

var exec    = require('cordova/exec'),
    channel = require('cordova/channel');


/*************
 * INTERFACE *
 *************/

/**
 * Clears the badge of the app icon.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.clear = function (callback, scope) {
    this.exec('clearBadge', null, callback, scope);
};

/**
 * Sets the badge of the app icon.
 *
 * @param {Number} badge
 *      The new badge number
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.set = function (badge, callback, scope) {
    var args = [parseInt(badge) || 0];

    this.registerPermission(function (granted) {
        if (granted) {
            this.exec('setBadge', args, callback, scope);
        }
    }, this);
};

/**
 * Gets the badge of the app icon.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.get = function (callback, scope) {
    this.exec('getBadge', null, callback, scope);
};

/**
 * Increases the badge number.
 *
 * @param {Number} count
 *      Count to add to the current badge number
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.increase = function (count, callback, scope) {
    this.get(function (badge) {
        this.set(badge + (count || 1), callback, scope);
    }, this);
};

/**
 * Decreases the badge number.
 *
 * @param {Number} count
 *      Count to subtract from the current badge number
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.decrease = function (count, callback, scope) {
    this.get(function (badge) {
        this.set(Math.max(0, badge - (count || 1)), callback, scope);
    }, this);
};

/**
 * Informs if the app has the permission to show badges.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.hasPermission = function (callback, scope) {
    this.exec('hasPermission', null, callback, scope);
};

/**
 * Register permission to show badges if not already granted.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.registerPermission = function (callback, scope) {
    this.exec('registerPermission', null, callback, scope);
};

/**
 * Configures the plugin's platform options.
 *
 * @param {Hash?} object
 *      The new configuration settings
 *
 * @return {Hash}
 *      The current configuration settings
 */
exports.configure = function (config) {
    for (var key in config) {
        if (this._config.hasOwnProperty(key)) {
            this._config[key] = config[key];
        }
    }

    return this._config;
};


/***********
 * MEMBERS *
 ***********/

exports._config = {
    autoClear: false
};


/********
 * UTIL *
 ********/

/**
 * Create callback, which will be executed within a specific scope.
 *
 * @param {Function} callbackFn
 *      The callback function
 * @param {Object} scope
 *      The scope for the function
 *
 * @return {Function}
 *      The new callback function
 */
exports.createCallbackFn = function (callbackFn, scope) {
    if (typeof callbackFn != 'function')
        return;

    return function () {
        callbackFn.apply(scope || this, arguments);
    };
};

/**
 * Execute the native counterpart.
 *
 * @param {String} action
 *      The name of the action
 * @param args[]
 *      Array of arguments
 * @param {Function} callback
 *      The callback function
 * @param {Object} scope
 *      The scope for the function
 */
exports.exec = function (action, args, callback, scope) {
    var fn = this.createCallbackFn(callback, scope),
        params = [];

    if (Array.isArray(args)) {
        params = args;
    } else if (args) {
        params.push(args);
    }

    exec(fn, null, 'Badge', action, params);
};


/*********
 * HOOKS *
 *********/

channel.onCordovaReady.subscribe(function () {
    if (exports._config.autoClear) { exports.clear(); }
});

channel.onResume.subscribe(function () {
    if (exports._config.autoClear) { exports.clear(); }
});
