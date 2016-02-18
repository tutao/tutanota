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


exports = require('de.appplant.cordova.plugin.local-notification.LocalNotification.Proxy').core;

var channel = require('cordova/channel');


/***********
 * MEMBERS *
 ***********/

// True if App is running, false if suspended
exports.isInBackground = true;

// Indicates if the device is ready (to receive events)
exports.isReady = false;

// Queues all events before deviceready
exports.eventQueue = [];

/********
 * UTIL *
 ********/

/**
 * The repeating interval in milliseconds.
 *
 * @param {String} interval
 *      A number or a placeholder like `minute`.
 *
 * @return {Number}
 *      Interval in milliseconds
 */
exports.getRepeatInterval = function (every) {

    if (!every)
        return 0;

    if (every == 'minute')
        return 60000;

    if (every == 'hour')
        return 360000;

    if (!NaN(every))
        return parseInt(every) * 60000;

    return 0;
};

/**
 * If the notification is repeating.
 *
 * @param {Object} notification
 *      Local notification object
 *
 * @return Boolean
 */
exports.isRepeating = function (notification) {
    return this.getRepeatInterval(notification.every) !== 0;
};

/**
 * Parses sound file path.
 *
 * @param {String} path
 *      Relative path to sound resource
 *
 * @return {String} XML Tag for Sound-File
 */
exports.parseSound = function (path) {
	if (!path.match(/^file/))
		return '';

	var uri = this.parseUri(path),
		audio = "<audio src=" + uri + " loop='false'/>";

	return audio;
};

/**
 * Parses image file path.
 *
 * @param {String} path
 *      Relative path to image resource
 *
 * @return {String} XML-Tag for Image-File
 */
exports.parseImage = function (path) {
    if (!path.match(/^file/))
        return '';

    var uri = this.parseUri(path),
        image = "<image id='1' src=" + uri + " />";

    return image;
};

/**
 * Parses file path to URI.
 *
 * @param {String} path
 *      Relative path to a resource
 *
 * @return {String} URI to File
 */
exports.parseUri = function (path) {
    var pkg = Windows.ApplicationModel.Package.current,
        pkgId = pkg.id,
        pkgName = pkgId.name;

	var uri = "'ms-appx://" + pkgName + "/www" + path.slice(6, path.length) + "'";

	return uri;
};

/**
 * Builds the xml payload for a local notification based on its options.
 *
 * @param {Object} options
 *      Local notification properties
 *
 * @return Windows.Data.Xml.Dom.XmlDocument
 */
exports.build = function (options) {
    var template = this.buildToastTemplate(options),
        notification = new Windows.Data.Xml.Dom.XmlDocument();

    try {
        notification.loadXml(template);
    } catch (e) {
        console.error(
            'LocalNotification#schedule',
            'Error loading the xml, check for invalid characters.');
    }

    // Launch Attribute to enable onClick event
    var launchAttr = notification.createAttribute('launch'),
        toastNode = notification.selectSingleNode('/toast');

    launchAttr.value = options.id.toString();
    toastNode.attributes.setNamedItem(launchAttr);

    return notification;
};

/**
 * Builds the toast template with the right style depend on the options.
 *
 * @param {Object} options
 *      Local notification properties
 *
 * @return String
 */
exports.buildToastTemplate = function (options) {
	var title = options.title,
		message = options.text || '',
		json = JSON.stringify(options),
		sound = '';

	if (options.sound && options.sound !== '') {
		sound = this.parseSound(options.sound);
	}

	var templateName = "ToastText",
		imageNode;
	if (options.icon && options.icon !== '') {
		imageNode = this.parseImage(options.icon);
		// template with Image
		if (imageNode !== '') {
			templateName = "ToastImageAndText";
		}
	} else {
		imageNode = "";
	}

	var bindingNode;
	if (title && title !== '') {
		bindingNode = "<binding template='" + templateName + "02'>" +
							imageNode +
							"<text id='1'>" + title + "</text>" +
							"<text id='2'>" + message + "</text>" +
						"</binding>";
	} else {
		bindingNode = "<binding template='" + templateName + "01'>" +
							imageNode +
							"<text id='1'>" + message + "</text>" +
						"</binding>";
	}
	return "<toast>" +
				"<visual>" +
						bindingNode +
				"</visual>" +
				sound +
				"<json>" + json + "</json>" +
			"</toast>";
};

/**
 * Short-hand method for the toast notification history.
 */
exports.getToastHistory = function () {
    return Windows.UI.Notifications.ToastNotificationManager.history;
};

/**
 * Gets a toast notifier instance.
 *
 * @return Object
 */
exports.getToastNotifier = function () {
    return Windows.UI.Notifications.ToastNotificationManager
            .createToastNotifier();
};

/**
 * List of all scheduled toast notifiers.
 *
 * @return Array
 */
exports.getScheduledToasts = function () {
    return this.getToastNotifier().getScheduledToastNotifications();
};

/**
 * Gets the Id from the toast notifier.
 *
 * @param {Object} toast
 *      A toast notifier object
 *
 * @return String
 */
exports.getToastId = function (toast) {
    var id = toast.id;

    if (id.match(/-2$/))
        return id.match(/^[^-]+/)[0];

    return id;
};

/**
 * Gets the notification life cycle type
 * (scheduled or triggered)
 *
 * @param {Object} toast
 *      A toast notifier object
 *
 * @return String
 */
exports.getToastType = function (toast) {
    return this.isToastTriggered(toast) ? 'triggered' : 'scheduled';
};

/**
 * If the toast is already scheduled.
 *
 * @param {Object} toast
 *      A toast notifier object
 *
 * @return Boolean
 */
exports.isToastScheduled = function (toast) {
    return !this.isToastTriggered(toast);
};

/**
 * If the toast is already triggered.
 *
 * @param {Object} toast
 *      A toast notifier object
 *
 * @return Boolean
 */
exports.isToastTriggered = function (toast) {
    var id = this.getToastId(toast),
        notification = this.getAll([id])[0],
        fireDate = new Date((notification.at) * 1000);

    if (this.isRepeating(notification))
        return false;

    return fireDate <= new Date();
};

/**
 * Finds the toast by it's ID.
 *
 * @param {String} id
 *      Local notification ID
 *
 * @param Object
 */
exports.findToastById = function (id) {
    var toasts = this.getScheduledToasts();

    for (var i = 0; i < toasts.length; i++) {
        var toast = toasts[i];

        if (this.getToastId(toast) == id)
            return toast;
    }

    return null;
};

/**
 * Sets trigger event for local notification.
 *
 * @param {Object} notification
 *      Local notification object
 * @param {Function} callback
 *      Callback function
 */
exports.callOnTrigger = function (notification, callback) {
    var triggerTime = new Date((notification.at * 1000)),
        interval = triggerTime - new Date();

    if (interval <= 0) {
        callback.call(this, notification);
        return;
    }

    WinJS.Promise.timeout(interval).then(function () {
        if (exports.isPresent(notification.id)) {
            callback.call(exports, notification);
        }
    });
};

/**
 * Sets trigger event for all scheduled local notification.
 *
 * @param {Function} callback
 *      Callback function
 */
exports.callOnTriggerForScheduled = function (callback) {
    var notifications = this.getScheduled();

    for (var i = 0; i < notifications.length; i++) {
        this.callOnTrigger(notifications[i], callback);
    }
};

/**
 * The application state - background or foreground.
 *
 * @return String
 */
exports.getApplicationState = function () {
    return this.isInBackground ? 'background' : 'foreground';
};

/**
 * Fires the event about a local notification.
 *
 * @param {String} event
 *      The event
 * @param {Object} notification
 *      The notification
 */
exports.fireEvent = function (event, notification) {
    var plugin = cordova.plugins.notification.local.core,
        state = this.getApplicationState(),
        args;

    if (notification) {
        args = [event, notification, state];
    } else {
        args = [event, state];
    }

    if (this.isReady && plugin) {
        plugin.fireEvent.apply(plugin, args);
    } else {
        this.eventQueue.push(args);
    }
};


/**************
 * LIFE CYCLE *
 **************/

// Called before 'deviceready' event
channel.onCordovaReady.subscribe(function () {
    // Register trigger handler for each scheduled notification
    exports.callOnTriggerForScheduled(function (notification) {
        this.updateBadge(notification.badge);
        this.fireEvent('trigger', notification);
    });
});

// Handle onclick event
document.addEventListener('activated', function (e) {
    var id = e.args,
        notification = exports.getAll([id])[0];

    if (!notification)
        return;

    exports.clearLocalNotification(id);

    var repeating = exports.isRepeating(notification);

    exports.fireEvent('click', notification);
    exports.fireEvent(repeating ? 'clear' : 'cancel', notification);
}, false);

// App is running in background
document.addEventListener('pause', function () {
    exports.isInBackground = true;
}, false);

// App is running in foreground
document.addEventListener('resume', function () {
    exports.isInBackground = false;
}, false);

// App is running in foreground
document.addEventListener('deviceready', function () {
    exports.isInBackground = false;
}, false);
