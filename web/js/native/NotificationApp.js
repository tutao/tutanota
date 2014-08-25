"use strict";

tutao.provide('tutao.native.NotificationApp');

/**
 * @implements {tutao.native.NotificationInterface}
 */
tutao.native.NotificationApp = function(){
    this.currentId = 0;
};

tutao.native.NotificationApp.prototype.add = function(title, message, badge) {
    window.plugin.notification.local.add({id: this.currentId++, title: title, message: message, badge: badge, autoCancel: true});
};

tutao.native.NotificationApp.prototype.updateBadge = function(number) {
    cordova.plugins.notification.badge.set(number);
};