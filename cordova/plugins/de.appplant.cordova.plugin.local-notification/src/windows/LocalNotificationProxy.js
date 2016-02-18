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

/**
 * Executes all queued events.
 */
exports.deviceready  = function () {
    exports.core.deviceready();
};

/**
 * Schedule a new local notification.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {Object[]} notifications
 *      Array of local notifications
 */
exports.schedule = function (success, error, notifications) {
    exports.core.schedule(notifications, 'schedule');

    success();
};

/**
 * Update existing notifications specified by IDs in options.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {Object[]} notifications
 *      Array of local notifications
 */
exports.update = function (success, error, notifications) {
    exports.core.update(notifications);

    success();
};

/**
 * Clear the specified notification.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.clear = function (success, error, ids) {
    exports.core.clear(ids, true);

    success();
};

/**
 * Clear all previously sheduled notifications.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.clearAll = function (success, error) {
    exports.core.clearAll();

    success();
};

/**
 * Cancel the specified notifications.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.cancel = function (success, error, ids) {
    exports.core.cancel(ids, true);

    success();
};

/**
 * Remove all previously registered notifications.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.cancelAll = function (success, error) {
    exports.core.cancelAll();

    success();
};

/**
 * Check if a notification with an ID is present.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int} id
 *      Local notification ID
 */
exports.isPresent = function (success, error, args) {
    var found = exports.core.isPresent(args[0]);

    success(found);
};

/**
 * Check if a notification with an ID is scheduled.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int} id
 *      Local notification ID
 */
exports.isScheduled = function (success, error, args) {
    var found = exports.core.isScheduled(args[0]);

    success(found);
};

/**
 * Check if a notification with an ID was triggered.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int} id
 *      Local notification ID
 */
exports.isTriggered = function (success, error, args) {
    var found = exports.core.isTriggered(args[0]);

    success(found);
};

/**
 * List all local notification IDs.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.getAllIds = function (success, error) {
    var ids = exports.core.getAllIds();

    success(ids);
};

/**
 * List all scheduled notification IDs.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.getScheduledIds = function (success, error) {
    var ids = exports.core.getScheduledIds();

    success(ids);
};

/**
 * List all triggered notification IDs.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 */
exports.getTriggeredIds = function (success, error) {
    var ids = exports.core.getTriggeredIds();

    success(ids);
};

/**
 * Propertys for given notification.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.getSingle = function (success, error, ids) {
    var notification = exports.core.getAll(ids)[0];

    success(notification);
};

/**
 * Propertys for given scheduled notification.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.getSingleScheduled = function (success, error, ids) {
    var notification = exports.core.getScheduled(ids)[0];

    success(notification);
};

/**
 * Propertys for given triggered notification.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.getSingleTriggered = function (success, error, ids) {
    var notification = exports.core.getTriggered(ids)[0];

    success(notification);
};

/**
 * Property list for given notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.getAll = function (success, error, ids) {
    var notifications = exports.core.getAll(ids);

    success(notifications);
};

/**
 * Property list for given triggered notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.getScheduled = function (success, error, ids) {
    var notifications = exports.core.getScheduled(ids);

    success(notifications);
};

/**
 * Property list for given triggered notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Function} success
 *      Success callback
 * @param {Function} error
 *      Error callback
 * @param {int[]} ids
 *      List of local notification IDs
 */
exports.getTriggered = function (success, error, ids) {
    var notifications = exports.core.getTriggered(ids);

    success(notifications);
};


cordova.commandProxy.add('LocalNotification', exports);
