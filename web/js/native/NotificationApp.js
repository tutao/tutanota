"use strict";

tutao.provide('tutao.native.NotificationApp');

/**
 * @implements {tutao.native.NotificationInterface}
 */
tutao.native.NotificationApp = function(){
    this.currentId = 0;
};

tutao.native.NotificationApp.prototype.add = function(message) {
    window.plugin.notification.local.add({ message: message, autoCancel: true});
    navigator.notification.beep(1);
    navigator.notification.vibrate(300);
};

tutao.native.NotificationApp.prototype.updateBadge = function(number) {
    cordova.plugins.notification.badge.set(number);
}