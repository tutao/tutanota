/*
    Copyright 2013-2015 appPlant UG

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


var proxy = require('de.appplant.cordova.plugin.local-notification.LocalNotification.Proxy');

var Notifications = Windows.UI.Notifications;


proxy.core = {

    /**
     * Executes all queued events.
     */
    deviceready: function () {
        var plugin = cordova.plugins.notification.local,
            events = this.eventQueue;

        this.isReady = true;

        for (var i = 0; i < events.length; i++) {
            plugin.fireEvent.apply(plugin, events[i]);
        }

        this.eventQueue = [];
    },

    /**
     * Schedules new local notifications.
     *
     * @param {Object[]} notifications
     *      Array of local notifications
     * @param {String} event
     *      'schedule' or 'update'
     */
    schedule: function (notifications) {
        var triggerFn = function (notification) {
            this.updateBadge(notification.badge);
            this.fireEvent('trigger', notification);
        };

        for (var i = 0; i < notifications.length; i++) {
            var options = notifications[i],
                notification = this.build(options);

            this.cancelLocalNotification(options.id);
            this.scheduleLocalNotification(notification, options);
            this.scheduleBackupNotification(notification, options);
            this.fireEvent('schedule', options);
            this.callOnTrigger(options, triggerFn);
        }
    },

    /**
     * Schedules a single local notification.
     *
     * @param {Windows.Data.Xml.Dom.XmlDocument} notification
     *      The local notification
     * @param {Object} options
     *      Local notification properties
     */
    scheduleLocalNotification: function (notification, options) {
        var interval = this.getRepeatInterval(options.every),
            triggerTime = new Date((options.at * 1000)),
            now = new Date().getTime(),
            toast;

        if (triggerTime <= now) {
            triggerTime = new Date(now + 10);
        }

        try {
            if (interval !== 0 && interval < 360001 && interval > 59999) {
                toast = new Notifications.ScheduledToastNotification(
                    notification, triggerTime, interval, 5);
            } else {
                toast = new Notifications.ScheduledToastNotification(
                    notification, triggerTime);
            }
        } catch (e) {
            console.error(e);
            return;
        }

        toast.id = options.id;
        toast.tag = 'Toast' + toast.id;

        this.getToastNotifier().addToSchedule(toast);
    },

    /**
     * Schedules a backup local notification 10 years later.
     *
     * @param {Object} notification
     *      The local notification
     */
    scheduleBackupNotification: function (notification, options) {
        var properties = Object.create(options);

        properties.id = options.id + '-2';
        properties.at = options.at + 315360000; // 10 years later

        this.scheduleLocalNotification(notification, properties);
    },

    /**
     * Updates the badge number of the active tile.
     *
     * @param {Number} badge
     *      The badge number. Zero will clean the badge.
     */
    updateBadge: function (badge) {
        var notifications = Windows.UI.Notifications,
            type = notifications.BadgeTemplateType.badgeNumber,
            xml = notifications.BadgeUpdateManager.getTemplateContent(type),
            attrs = xml.getElementsByTagName('badge'),
            notification = new notifications.BadgeNotification(xml);

        attrs[0].setAttribute('value', badge);

        notifications.BadgeUpdateManager.createBadgeUpdaterForApplication()
            .update(notification);
    },

    /**
     * Updates existing notifications specified by IDs in options.
     *
     * @param {Object[]} notifications
     *      Array of local notifications
     */
    update: function (notifications) {
        for (var i = 0; i < notifications.length; i++) {
            var updates = notifications[i],
                options = getAll(updates.id || '0')[0];

            this.updateLocalNotification(options, updates);
            this.fireEvent('update', options);
        }
    },

    /**
     * Updates a single local notification.
     *
     * @param {Object} notification
     *      The local notification
     * @param {Object} updates
     *      Updated properties
     */
    updateLocalNotification: function (notification, updates) {
        for (var key in updates) {
            notification[key] = updates[key];
        }

        this.cancelLocalNotification(notification.id);
        this.scheduleLocalNotification(notification);
    },

    /**
     * Clears the specified notifications.
     *
     * @param {int[]} ids
     *      List of local notification IDs
     */
    clear: function (ids) {
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i],
                notification = this.getAll([id])[0];

            this.clearLocalNotification(id);
            this.fireEvent('clear', notification);
        }
    },

    /**
     * Clears the local notification with the given ID.
     *
     * @param {String} id
     *      Local notification ID
     */
    clearLocalNotification: function (id) {
        var notification = this.getAll([id])[0];

        try {
            this.getToastHistory().remove('Toast' + id);
        } catch (e) {/*Only Phones support the NotificationHistory*/ }

        if (this.isRepeating(notification))
            return;

        if (this.isTriggered(id) && !this.isScheduled(id)) {
            this.cancelLocalNotification(id);
        }
    },

    /**
     * Clears all notifications.
     */
    clearAll: function () {
        var ids = this.getTriggeredIds();

        for (var i = 0; i < ids.length; i++) {
            this.clearLocalNotification(ids[i]);
        }

        try {
            this.getToastHistory().clear();
        } catch (e) {/*Only Phones support the NotificationHistory*/ }
        this.fireEvent('clearall');
    },

    /**
     * Cancels all specified notifications.
     *
     * @param {int[]} ids
     *      List of local notification IDs
     */
    cancel: function (ids) {
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i],
                notification = this.getAll([id])[0];

            this.cancelLocalNotification(ids[i]);
            this.fireEvent('cancel', notification);
        }
    },

    /**
     * Cancels the local notification with the given ID.
     *
     * @param {String} id
     *      Local notification ID
     */
    cancelLocalNotification: function (id) {
        var notifier = this.getToastNotifier(),
            history = this.getToastHistory(),
            toasts = this.getScheduledToasts();

        try {
            history.remove('Toast' + id);
        } catch (e) {/*Only Phones support the NotificationHistory*/ }

        for (var i = 0; i < toasts.length; i++) {
            var toast = toasts[i];

            if (toast.id == id || toast.id == id + '-2') {
                notifier.removeFromSchedule(toast);
            }
        }
    },

    /**
     * Cancels all notifications.
     */
    cancelAll: function () {
        var ids = this.getAllIds();

        for (var i = 0; i < ids.length; i++) {
            this.cancelLocalNotification(ids[i]);
        }

        try {
            this.getToastHistory().clear();
        } catch (e) {/*Only Phones support the NotificationHistory*/ }
        this.fireEvent('cancelall');
    },

    /**
     * Checks if a notification with an ID is present.
     *
     * @param {int} id
     *      Local notification ID
     */
    isPresent: function (id) {
        return !!this.findToastById(id);
    },

    /**
     * Checks if a notification with an ID was scheduled.
     *
     * @param {int} id
     *      Local notification ID
     */
    isScheduled: function (id) {
        var toast = this.findToastById(id);

        return toast && this.isToastScheduled(toast);
    },

    /**
     * Checks if a notification with an ID was triggered.
     *
     * @param {int} id
     *      Local notification ID
     */
    isTriggered: function (id) {
        var toast = this.findToastById(id);

        return toast && this.isToastTriggered(toast);
    },

    /**
     * Lists all local notification IDs.
     */
    getAllIds: function () {
        var toasts = this.getScheduledToasts(),
            ids = [];

        for (var i = 0; i < toasts.length; i++) {
            var toast   = toasts[i],
                toastId = this.getToastId(toast);

            if (ids.indexOf(toastId) == -1) {
                ids.push(toastId);
            }
        }

        return ids;
    },

    /**
     * Lists all scheduled notification IDs.
     */
    getScheduledIds: function () {
        var toasts = this.getScheduledToasts(),
            ids = [];

        for (var i = 0; i < toasts.length; i++) {
            var toast = toasts[i];

            if (!this.isToastScheduled(toast))
                continue;

            ids.push(this.getToastId(toast));
        }

        return ids;
    },

    /**
     * Lists all scheduled notification IDs.
     */
    getTriggeredIds: function () {
        var toasts = this.getScheduledToasts(),
            ids = [];

        for (var i = 0; i < toasts.length; i++) {
            var toast = toasts[i];

            if (!this.isToastTriggered(toast))
                continue;

            ids.push(this.getToastId(toast));
        }

        return ids;
    },

    /**
     * Property list for given notifications.
     * If called without IDs, all notification will be returned.
     *
     * @param {int[]} ids
     *      List of local notification IDs.
     * @param {String?} type
     *      Local notification life cycle type
     */
    getAll: function (ids, type) {
        var toasts = this.getScheduledToasts(),
            notifications = [];

        if (!ids || ids.length === 0) {
            ids = this.getAllIds();
        }

        for (var index = 0; index < ids.length; index++) {
            var id = ids[index],
                toast = this.findToastById(id);

            if (!toast || type && this.getToastType(toast) != type)
                continue;

            var json = toast.content.lastChild.lastChild.innerText;

            notifications.push(JSON.parse(json));
        }

        return notifications;
    },

    /**
     * Property list for given notifications.
     * If called without IDs, all notification will be returned.
     *
     * @param {int[]} ids
     *      List of local notification IDs
     */
    getScheduled: function (ids) {
        if (!ids || ids.length === 0) {
            ids = this.getAllIds();
        }

        return this.getAll(ids, 'scheduled');
    },

    /**
     * Property list for given notifications.
     * If called without IDs, all notification will be returned.
     *
     * @param {int[]} ids
     *      List of local notification IDs
     */
    getTriggered: function (ids) {
        if (!ids || ids.length === 0) {
            ids = this.getAllIds();
        }

        return this.getAll(ids, 'triggered');
    },
};
