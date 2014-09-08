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
     *
     * Merges custom properties with the default values.
     *
     * @param {Object} options
     *      Set of custom values
     *
     * @retrun {Object}
     *      The merged property list
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
     *
     * Merges the platform specific properties into the default properties.
     *
     * @return {Object}
     *      The default properties for the platform
     */
    applyPlatformSpecificOptions: function () {
        var defaults = this._defaults;

        switch (device.platform) {
        case 'Android':
            defaults.icon       = 'icon';
            defaults.smallIcon  = null;
            defaults.ongoing    = false;
            defaults.led        = 'FFFFFF'; /*RRGGBB*/
            defaults.sound      = 'TYPE_NOTIFICATION'; break;
        case 'iOS':
            defaults.sound      = ''; break;
        case 'WinCE': case 'Win32NT':
            defaults.smallImage = null;
            defaults.image      = null;
            defaults.wideImage  = null;
        }

        return defaults;
    },

    /**
     * @private
     *
     * Creates a callback, which will be executed within a specific scope.
     *
     * @param {Function} callbackFn
     *      The callback function
     * @param {Object} scope
     *      The scope for the function
     *
     * @return {Function}
     *      The new callback function
     */
    createCallbackFn: function (callbackFn, scope) {
        if (typeof callbackFn != 'function')
            return;

        return function () {
            callbackFn.apply(scope || this, arguments);
        };
    },

    /**
     * Add a new entry to the registry
     *
     * @param {Object} options
     *      The notification properties
     * @param {Function} callback
     *      A function to be called after the notification has been canceled
     * @param {Object} scope
     *      The scope for the callback function
     *
     * @return {Number}
     *      The notification's ID
     */
    add: function (options, callback, scope) {
        var options    = this.mergeWithDefaults(options),
            callbackFn = this.createCallbackFn(callback, scope);

        if (options.id) {
            options.id = options.id.toString();
        }

        if (options.date === undefined) {
            options.date = new Date();
        }

        if (options.title) {
            options.title = options.title.toString();
        }

        if (options.message) {
            options.message = options.message.toString();
        }

        if (typeof options.date == 'object') {
            options.date = Math.round(options.date.getTime()/1000);
        }

        if (['WinCE', 'Win32NT'].indexOf(device.platform) > -1) {
            callbackFn = function (cmd) {
                eval(cmd);
            };
        }

        cordova.exec(callbackFn, null, 'LocalNotification', 'add', [options]);

        return options.id;
    },

    /**
     * Cancels the specified notification.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {Function} callback
     *      A function to be called after the notification has been canceled
     * @param {Object} scope
     *      The scope for the callback function
     */
    cancel: function (id, callback, scope) {
        var id         = id.toString(),
            callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'LocalNotification', 'cancel', [id]);
    },

    /**
     * Removes all previously registered notifications.
     *
     * @param {Function} callback
     *      A function to be called after all notifications have been canceled
     * @param {Object} scope
     *      The scope for the callback function
     */
    cancelAll: function (callback, scope) {
        var callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'LocalNotification', 'cancelAll', []);
    },

    /**
     * Retrieves a list with all currently pending notifications.
     *
     * @param {Function} callback
     *      A callback function to be called with the list
     * @param {Object} scope
     *      The scope for the callback function
     */
    getScheduledIds: function (callback, scope) {
        var callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'LocalNotification', 'getScheduledIds', []);
    },

    /**
     * Checks wether a notification with an ID is scheduled.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {Function} callback
     *      A callback function to be called with the list
     * @param {Object} scope
     *      The scope for the callback function
     */
    isScheduled: function (id, callback, scope) {
        var id         = id.toString(),
            callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'LocalNotification', 'isScheduled', [id]);
    },

    /**
     * Retrieves a list with all triggered notifications.
     *
     * @param {Function} callback
     *      A callback function to be called with the list
     * @param {Object} scope
     *      The scope for the callback function
     */
    getTriggeredIds: function (callback, scope) {
        var callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'LocalNotification', 'getTriggeredIds', []);
    },

    /**
     * Checks wether a notification with an ID was triggered.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {Function} callback
     *      A callback function to be called with the list
     * @param {Object} scope
     *      The scope for the callback function
     */
    isTriggered: function (id, callback, scope) {
        var id         = id.toString(),
            callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'LocalNotification', 'isTriggered', [id]);
    },

    /**
     * Occurs when a notification was added.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {String} state
     *      Either "foreground" or "background"
     * @param {String} json
     *      A custom (JSON) string
     */
    onadd: function (id, state, json) {},

    /**
     * Occurs when the notification is triggered.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {String} state
     *      Either "foreground" or "background"
     * @param {String} json
     *      A custom (JSON) string
     */
    ontrigger: function (id, state, json) {},

    /**
     * Fires after the notification was clicked.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {String} state
     *      Either "foreground" or "background"
     * @param {String} json
     *      A custom (JSON) string
     */
    onclick: function (id, state, json) {},

    /**
     * Fires if the notification was canceled.
     *
     * @param {String} id
     *      The ID of the notification
     * @param {String} state
     *      Either "foreground" or "background"
     * @param {String} json
     *      A custom (JSON) string
     */
    oncancel: function (id, state, json) {}
};

var plugin  = new LocalNotification(),
    channel = require('cordova/channel');

// Called after all 'deviceready' listener are called
channel.deviceready.subscribe( function () {
    // Device is ready now, the listeners are registered and all queued events
    // can be executed now.
    cordova.exec(null, null, 'LocalNotification', 'deviceready', []);
});

channel.onCordovaReady.subscribe( function () {
    // The cordova device plugin is ready now
    channel.onCordovaInfoReady.subscribe( function () {
        if (device.platform == 'Android') {
            channel.onPause.subscribe( function () {
                // Necessary to set the state to `background`
                cordova.exec(null, null, 'LocalNotification', 'pause', []);
            });

            channel.onResume.subscribe( function () {
                // Necessary to set the state to `foreground`
                cordova.exec(null, null, 'LocalNotification', 'resume', []);
            });

            // Necessary to set the state to `foreground`
            cordova.exec(null, null, 'LocalNotification', 'resume', []);
        }

        // Merges the platform specific properties into the default properties
        plugin.applyPlatformSpecificOptions();
    });
});

module.exports = plugin;
