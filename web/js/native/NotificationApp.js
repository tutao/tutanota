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
    if (number > 1) {
        cordova.plugins.notification.badge.configure({title: tutao.locator.languageViewModel.get('newMailsBadge_msg'), autoClear: true});
    } else {
        cordova.plugins.notification.badge.configure({title: tutao.locator.languageViewModel.get('newMailBadge_msg'), autoClear: true});
    }
    if (cordova.platformId == 'ios') {
        // on ios, the badge is always visible on the home screen
        cordova.plugins.notification.badge.set(number);
    } else {
        // on android, the badge is a part of the notification. The notification should be hidden, if the badge is zero or decreased
        if (number == 0 || number <= this.currentBadge) {
            cordova.plugins.notification.badge.clear();
        } else {
            cordova.plugins.notification.badge.set(number);
        }
    }
    this.currentBadge = number;
};
