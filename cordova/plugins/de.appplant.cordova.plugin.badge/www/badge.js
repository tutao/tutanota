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

var Badge = function () {
    this._config = {
        // Titel der Meldung für Android
        title: '%d new messages',
        // Ob die Badge Zahl automatisch beim Öffnen der App gelöscht werden soll
        autoClear: false,
        // Ob und welches Icon für Android verwendet werden soll
        smallIcon: 'ic_dialog_email'
    };
};

Badge.prototype = {
    /**
     * Clears the badge of the app icon.
     */
    clear: function () {
        cordova.exec(null, null, 'Badge', 'clearBadge', []);
    },

    /**
     * Sets the badge of the app icon.
     *
     * @param {Number} badge
     *      The new badge number
     */
    set: function (badge) {
        var args = [
            parseInt(badge) || 0,
            this._config.title,
            this._config.smallIcon,
            this._config.autoClear
        ];

        cordova.exec(null, null, 'Badge', 'setBadge', args);
    },

    /**
     * Gets the badge of the app icon.
     *
     * @param {Function} callback
     *      The function to be exec as the callback
     * @param {Object?} scope
     *      The callback function's scope
     */
    get: function (callback, scope) {
        var fn = function (badge) {
            callback.call(scope || this, badge);
        };

        cordova.exec(fn, null, 'Badge', 'getBadge', []);
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

        cordova.exec(fn, null, 'Badge', 'hasPermission', []);
    },

    /**
     * Ask for permission to show badges if not already granted.
     */
    promptForPermission: function () {
        cordova.exec(null, null, 'Badge', 'promptForPermission', []);
    },

    /**
     * Configures the plugin's platform options.
     *
     * @param {Hash?} object
     *      The new configuration settings
     *
     * @return {Hash}
     *      The current configuration settings
     */
    configure: function (config) {
        for (var key in config) {
            if (this._config.hasOwnProperty(key)) {
                this._config[key] = config[key];
            }
        }

        return this._config;
    },

    /**
     * @deprecated
     *
     * Sets the custom notification title for Android.
     *
     * @param {String} title
     *      The title of the notification
     */
    setTitle: function (title) {
        console.warn('badge.setTitle(title) is deprecated! Please use badge.configure({ title:title }) instead.');

        this._config.title = title;
    },

    /**
     * @deprecated
     *
     * Tells the plugin if the badge needs to be cleared when the user taps
     * the icon.
     *
     * @param {Boolean} clearOnTap
     *      Either true or false
     */
    setClearOnTap: function (clearOnTap) {
        console.warn('badge.clearOnTap(bool) is deprecated! Please use badge.configure({ autoClear:bool }) instead.');

        this._config.autoClear = clearOnTap;
    }
};

var plugin  = new Badge(),
    channel = require('cordova/channel');

channel.onCordovaReady.subscribe( function () {
    if (plugin._config.autoClear) { plugin.clear(); }
});

channel.onResume.subscribe( function () {
    if (plugin._config.autoClear) { plugin.clear(); }
});

module.exports = plugin;
