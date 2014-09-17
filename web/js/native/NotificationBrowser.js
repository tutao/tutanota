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
        var notification = new Notification("Tutanota", {body: message, icon: 'graphics/apple-touch-icon-114x114-precomposed.png'});
        notification.onshow = function () {
            setTimeout(function() { notification.close(); }, 5000);
        };
        notification.onclick = function () {
            notification.close();
            resolve();
        };
    }
};

