"use strict";

tutao.provide('tutao.native.NotificationApp');

/**
 * @implements {tutao.native.NotificationInterface}
 */
tutao.native.NotificationApp = function(){
    this.currentId = 0;
    this.currentBadge = 0;
};

tutao.native.NotificationApp.prototype.add = function(message) {
	// do nothing here on mobile devices notifications are handled by push service.
};

tutao.native.NotificationApp.prototype.updateBadge = function(number) {
    if (cordova.platformId == 'ios') {
        // on ios, the badge is always visible on the home screen
        cordova.plugins.notification.badge.set(number);
    } else {
        // on android, the badge is a part of the notification. Notifications are handled by push service
    }
    this.currentBadge = number;
};
