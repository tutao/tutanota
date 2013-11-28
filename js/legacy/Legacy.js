"use strict";

goog.provide('tutao.tutanota.legacy.Legacy');

/**
 * @param {Object.<string, Object>} singletons
 */
tutao.tutanota.legacy.Legacy.setup = function(singletons) {
	if (!tutao.tutanota.util.ClientDetector.isSupported()) {
		delete singletons.clientWorkerProxy;
		delete singletons.rsaCrypter;
		delete singletons.eventBus;
		singletons.aesCrypter = tutao.crypto.SjclAes;
	}

	if (typeof Object.getPrototypeOf !== "function") {
		Object.getPrototypeOf = function(object) {
			return object.constructor.prototype; // only for ie8
		};
	}

	if (typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function() {
		    return this.replace(/^\s+|\s+$/g, '');
		};
	}
};
