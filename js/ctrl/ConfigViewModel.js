"use strict";

goog.provide('tutao.tutanota.ctrl.ConfigViewModel');

/**
 * Allows showing and modifying the server configuration.
 * @constructor
 */
tutao.tutanota.ctrl.ConfigViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.config = ko.observable(null);
};

/**
 * Must be called before showing the config view the first time.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.init = function() {
	this.loadConfig();
};

/**
 * Provides the long values sorted by value name.
 * @return {Array.<tutao.entity.sys.LongConfigValueEditable>} The sorted values.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.getSortedLongValues = function() {
	this.config().longValues().sort(function(v1, v2) {
		return (v1.name() < v2.name()) ? -1 : 1;
	});
	return this.config().longValues();
};

/**
 * Provides the string values sorted by value name.
 * @return {Array.<tutao.entity.sys.StringConfigValueEditable>} The sorted values.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.getSortedStringValues = function() {
	this.config().stringValues().sort(function(v1, v2) {
		return (v1.name() < v2.name()) ? -1 : 1;
	});
	return this.config().stringValues();
};

/**
 * Provides the user list values sorted by value name.
 * @return {Array.<tutao.entity.sys.StringConfigValueEditable>} The sorted values.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.getSortedUserLists = function() {
	this.config().userLists().sort(function(v1, v2) {
		return (v1.name() < v2.name()) ? -1 : 1;
	});
	return this.config().userLists();
};

/**
 * Loads the config from the server.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.loadConfig = function() {
	var self = this;
	tutao.entity.sys.ConfigService.load({}, null, function(c, exception) {
		if (exception) {
			console.log(exception);
			return;
		}
		self.config(new tutao.entity.sys.ConfigServiceEditable(c));
	});
};

/**
 * Stores the config on the server.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.storeConfig = function() {
	this.config().update();
	this.config().getConfigService().update({}, null, function(exception) {
		if (exception) {
			console.log(exception);
			return;
		}
	});
};
