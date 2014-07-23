"use strict";

goog.provide('tutao.tutanota.ctrl.ConfigViewModel');

/**
 * Allows showing and modifying the server configuration.
 * @constructor
 */
tutao.tutanota.ctrl.ConfigViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.config = ko.observable(null); // contains a ConfigDataReturn
	this.configName = ko.observable("");
	this.configValue = ko.observable("");
	this.configStart = ko.observable("");
	this.configEnd = ko.observable("");
	
	this.submitStatus = ko.observable("");
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
	this.config().getLongValues().sort(function(v1, v2) {
		return (v1.getName() < v2.getName()) ? -1 : 1;
	});
	return this.config().getLongValues();
};

/**
 * Provides the string values sorted by value name.
 * @return {Array.<tutao.entity.sys.StringConfigValueEditable>} The sorted values.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.getSortedStringValues = function() {
	this.config().getStringValues().sort(function(v1, v2) {
		return (v1.getName() < v2.getName()) ? -1 : 1;
	});
	return this.config().getStringValues();
};

/**
 * Provides the time range list values sorted by value name.
 * @return {Array.<tutao.entity.sys.StringConfigValueEditable>} The sorted values.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.getSortedTimeRangeLists = function() {
	this.config().getTimeRangeLists().sort(function(v1, v2) {
		return (v1.getName() < v2.getName()) ? -1 : 1;
	});
	return this.config().getTimeRangeLists();
};

/**
 * Loads the config from the server.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.loadConfig = function() {
	var self = this;
	tutao.entity.sys.ConfigDataReturn.load({}, null).then(function(c) {
		self.config(c);
	});
};

tutao.tutanota.ctrl.ConfigViewModel.prototype.editValue = function(name, value, start, end) {
	this.configName(name);
	this.configValue(value);
	this.configStart((start) ? tutao.tutanota.util.Formatter.dateToDashString(start) : "");
	this.configEnd((end) ? tutao.tutanota.util.Formatter.dateToDashString(end) : "");
};


/**
 * Stores the config on the server.
 */
tutao.tutanota.ctrl.ConfigViewModel.prototype.storeConfig = function() {
	var data = new tutao.entity.sys.ConfigDataReturn();
	if (this.isLongConfigName()) {
		if (this.configValue() == "" || isNaN(this.configValue())) {
			this.submitStatus("error: not a value");
			return;
		}
		var v = new tutao.entity.sys.LongConfigValue(data);
		v.setName(this.configName());
		v.setValue(this.configValue());
		data.getLongValues().push(v);
	} else  if (this.isStringConfigName()) {
		var v = new tutao.entity.sys.StringConfigValue(data);
		v.setName(this.configName());
		v.setValue(this.configValue());
		data.getStringValues().push(v);
	} else  if (this.isTimeRangeConfigName()) {
		var list = new tutao.entity.sys.TimeRangeListConfigValue(data);
		list.setName(this.configName());
		var v = new tutao.entity.sys.TimeRangeConfigValue(list);
		v.setIdentifier(this.configValue());
		if (this.configStart() != "") {
			v.setStart(new Date(this.configStart()));
		}
		if (this.configEnd() != "") {
			v.setEnd(new Date(this.configEnd()));
		}
		list.getTimeRanges().push(v);
		data.getTimeRangeLists().push(list);
	} else {
		this.submitStatus("error: unknown config name");
		return;
	}
	var self = this;
	return data.update({}, null).then(function(ret, exception) {
		self.submitStatus("success");
		self.configValue("");
		self.loadConfig();
	}).caught(function(exception) {
        self.submitStatus("error: " + exception.message);
    });
};

tutao.tutanota.ctrl.ConfigViewModel.prototype.isLongConfigName = function() {
	for (var i=0; i<this.config().getLongValues().length; i++) {
		if (this.config().getLongValues()[i].getName() == this.configName()) {
			return true;
		}
	}
	return false;	
};

tutao.tutanota.ctrl.ConfigViewModel.prototype.isStringConfigName = function() {
	for (var i=0; i<this.config().getStringValues().length; i++) {
		if (this.config().getStringValues()[i].getName() == this.configName()) {
			return true;
		}
	}
	return false;	
};

tutao.tutanota.ctrl.ConfigViewModel.prototype.isTimeRangeConfigName = function() {
	for (var i=0; i<this.config().getTimeRangeLists().length; i++) {
		if (this.config().getTimeRangeLists()[i].getName() == this.configName()) {
			return true;
		}
	}
	return false;	
};

tutao.tutanota.ctrl.ConfigViewModel.prototype.isConfigName = function() {
	return this.isLongConfigName() || this.isStringConfigName() || this.isTimeRangeConfigName();
};
