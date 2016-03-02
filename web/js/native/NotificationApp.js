"use strict";

tutao.provide('tutao.native.NotificationApp');

/**
 * @implements {tutao.native.NotificationInterface}
 */
tutao.native.NotificationApp = function(){
};

tutao.native.NotificationApp.prototype.add = function(message) {
	// do nothing here on mobile devices notifications are handled by push service.
};


