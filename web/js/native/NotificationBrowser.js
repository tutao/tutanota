"use strict";

tutao.provide('tutao.native.NotificationBrowser');

/**
 * @implements {tutao.native.NotificationInterface}
 */
tutao.native.NotificationBrowser = function(){};

tutao.native.NotificationBrowser.prototype.add = function(message) {
    var self = this;
    return new Promise(function (resolve, reject) {
        if ("Notification" in window) {
            if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
                Notification.requestPermission(function (permission) {
                    // Whatever the user answers, we make sure we store the information
                    if (!('permission' in Notification)) {
                        Notification.permission = permission;
                    }
                    self._showIfGranted(message, resolve);
                });
            } else {
                self._showIfGranted(message, resolve);
            }
        }
    });
};

tutao.native.NotificationBrowser.prototype.updateBadge = function(number) {
    // no badge available
};

tutao.native.NotificationBrowser.prototype._showIfGranted = function(message, resolve) {
    if (Notification.permission === "granted") {
        try {
            var notification = new Notification("Tutanota", {body: message, icon: 'graphics/apple-touch-icon-114x114-precomposed.png'});
            notification.onshow = function () {
                setTimeout(function() { notification.close(); }, 5000);
            };
            notification.onclick = function () {
                notification.close();
                resolve();
            };
        } catch (e) {
            // new Notification() throws an error in new chrome browsers on android devices.
            // According to the error message ServiceWorkerRegistration.showNotification() should be used instead.
            // This is currently not available on our test devices, so ignore notification errors.
            // Setails: http://stackoverflow.com/questions/29774836/failed-to-construct-notification-illegal-constructor
            console.log("notificaiton error");
            resolve();
        }
    }
};

