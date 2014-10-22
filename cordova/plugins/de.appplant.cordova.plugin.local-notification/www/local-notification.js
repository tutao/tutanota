/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var LocalNotification = function () {
    this._defaults = {
        message:    '',
        title:      '',
        autoCancel: false,
        badge:      0,
        id:         '0',
        json:       '',
        repeat:     ''
    };
};

LocalNotification.prototype = {
    /**
     * Returns the default settings
     *
     * @return {Object}
     */
    getDefaults: function () {
        return this._defaults;
    },

    /**
     * Overwrite default settings
     *
     * @param {Object} defaults
     */
    setDefaults: function (newDefaults) {
        var defaults = this.getDefaults();

        for (var key in defaults) {
            if (newDefaults[key] !== undefined) {
                defaults[key] = newDefaults[key];
            }
        }
    },

    /**
     * @private
     * Merge settings with default values
     *
     * @param {Object} options
     * @retrun {Object}
     */
    mergeWithDefaults: function (options) {
        var defaults = this.getDefaults();

        for (var key in defaults) {
            if (options[key] === undefined) {
                options[key] = defaults[key];
            }
        }

        return options;
    },

    /**
     * @private
     */
    applyPlatformSpecificOptions: function () {
        var defaults = this._defaults;

        switch (device.platform) {
        case 'Android':
            defaults.icon       = 'icon';
            defaults.smallIcon  = null;
            defaults.ongoing    = false;
            defaults.sound      = 'TYPE_NOTIFICATION'; break;
        case 'iOS':
            defaults.sound      = ''; break;
        case 'WinCE': case 'Win32NT':
            defaults.smallImage = null;
            defaults.image      = null;
            defaults.wideImage  = null;
        };
    },

    /**
     * Add a new entry to the registry
     *
     * @param {Object} options
     * @return {Number} The notification's ID
     */
    add: function (options) {
        var options    = this.mergeWithDefaults(options),
            callbackFn = null;

        if (options.id) {
            options.id = options.id.toString();
        }

        if (options.date === undefined) {
            options.date = new Date();
        }

        if (typeof options.date == 'object') {
            options.date = Math.round(options.date.getTime()/1000);
        }

        if (['WinCE', 'Win32NT'].indexOf(device.platform)) {
            callbackFn = function (cmd) {
                eval(cmd);
            };
        }

        cordova.exec(callbackFn, null, 'LocalNotification', 'add', [options]);

        return options.id;
    },

    /**
     * Cancels the specified notification
     *
     * @param {String} id of the notification
     */
    cancel: function (id) {
        cordova.exec(null, null, 'LocalNotification', 'cancel', [id.toString()]);
    },

    /**
     * Removes all previously registered notifications
     */
    cancelAll: function () {
        cordova.exec(null, null, 'LocalNotification', 'cancelAll', []);
    },

    /**
     * @async
     *
     * Retrieves a list with all currently pending notifications.
     *
     * @param {Function} callback
     */
    getScheduledIds: function (callback) {
        cordova.exec(callback, null, 'LocalNotification', 'getScheduledIds', []);
    },

    /**
     * @async
     *
     * Checks wether a notification with an ID is scheduled.
     *
     * @param {String}   id
     * @param {Function} callback
     */
    isScheduled: function (id, callback) {
        cordova.exec(callback, null, 'LocalNotification', 'isScheduled', [id.toString()]);
    },

    /**
     * Informs if the app has the permission to show badges.
     *
     * @param {Function} callback
     *      The function to be exec as the callback
     * @param {Object?} scope
     *      The callback function's scope
     */
    hasPermission: function (callback, scope) {
        var fn = function (badge) {
            callback.call(scope || this, badge);
        };

        cordova.exec(fn, null, 'LocalNotification', 'hasPermission', []);
    },

    /**
     * Ask for permission to show badges if not already granted.
     */
    promptForPermission: function () {
        cordova.exec(null, null, 'LocalNotification', 'promptForPermission', []);
    },

    /**
     * Occurs when a notification was added.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    onadd: function (id, state, json) {},

    /**
     * Occurs when the notification is triggered.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    ontrigger: function (id, state, json) {},

    /**
     * Fires after the notification was clicked.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    onclick: function (id, state, json) {},

    /**
     * Fires if the notification was canceled.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    oncancel: function (id, state, json) {}
};

var plugin  = new LocalNotification(),
    channel = require('cordova/channel');

channel.deviceready.subscribe( function () {
    cordova.exec(null, null, 'LocalNotification', 'deviceready', []);
});

channel.onCordovaReady.subscribe( function () {
    channel.onCordovaInfoReady.subscribe( function () {
        if (device.platform == 'Android') {
            channel.onPause.subscribe( function () {
                cordova.exec(null, null, 'LocalNotification', 'pause', []);
            });

            channel.onResume.subscribe( function () {
                cordova.exec(null, null, 'LocalNotification', 'resume', []);
            });

            cordova.exec(null, null, 'LocalNotification', 'resume', []);
        }

        plugin.applyPlatformSpecificOptions();
    });
});

module.exports = plugin;
