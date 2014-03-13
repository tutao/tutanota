"use strict";

goog.provide('tutao.tutanota.ctrl.LogViewModel');

/**
 * Provides a viewer showing all elements in the database by app, type and id.
 * @constructor
 */
tutao.tutanota.ctrl.LogViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	
	this.maxCount = ko.observable(250);
	this.maxCount.subscribe(function(newValue) {
		if (newValue > 1000) {
			this.maxCount(1000);
			return;
		}
		this.logEntries([]);
		this.showSelected();
	}, this);
	
	this.untilDate = ko.observable(tutao.tutanota.util.Formatter.dateToDashString(new Date()));
	this.untilTime = ko.observable(tutao.tutanota.util.Formatter.formatLocalTime(new Date()));
	this.showCurrent = ko.observable(true);
	this.showCurrent.subscribe(function(showCurrent) {
		// reset the log entries as we switched "show current logs"
		this.logEntries([]); 
	}, this);
	this._untilDate = ko.computed(function() {
		if (this.showCurrent()) {
			return new Date();
		} else {
			return new Date(tutao.tutanota.util.Formatter.dashStringToDate(this.untilDate()).getTime() + tutao.tutanota.util.Formatter.parseLocalTime(this.untilTime()));
		}
	}, this);
	this._untilDate.subscribe(function(newValue) {
		this.showSelected();
	}, this);

	var mobileDevice = tutao.tutanota.util.ClientDetector.isMobileDevice();
	this.showLevel = ko.observable(true);
	this.showDate = ko.observable(true);
	this.showServer = ko.observable(false);
	this.showUserId = ko.observable(false);
	this.showUrl = ko.observable(false);
	this.showAgent = ko.observable(false);
	this.showLogger = ko.observable(!mobileDevice);
	this.showSource = ko.observable(!mobileDevice);
	this.showThread = ko.observable(false);
	this.showMessage = ko.observable(true);

	this.logEntries = ko.observableArray([]);
	this._interval = null;
};

tutao.tutanota.ctrl.LogViewModel.prototype.start = function() {
	var self = this;
	this._interval = setInterval(function() {
		if (self.showCurrent()) {
			self.showSelected();
		}
	}, 5000);
};

tutao.tutanota.ctrl.LogViewModel.prototype.stop = function() {
	if (this._interval) {
		clearInterval(this._interval);
		this._interval = null;
	}
};

/**
 * Provides the currently shown instance, resp. list of instances.
 */
tutao.tutanota.ctrl.LogViewModel.prototype.showSelected = function() {
	var upperBoundId = null;
	if (this.showCurrent()) {
		upperBoundId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
		this.untilDate(tutao.tutanota.util.Formatter.dateToDashString(new Date()));
		this.untilTime(tutao.tutanota.util.Formatter.formatLocalTime(new Date()));
	} else {
		upperBoundId = tutao.util.EncodingConverter.base64ToBase64Ext(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.timestampToHexGeneratedId(this._untilDate().getTime())));
		// reset the log entries as the date is changed manually
		this.logEntries([]); 
	}
	var self = this;
	this._loadLogEntries(upperBoundId, true, function(logEntryList) {
		if (self.logEntries().length == 0) {
			self.logEntries(logEntryList);
		} else {
			// add only new entries into the existing list to avoid html re-rendering
			var firstExistingId = self.logEntries()[0].getId()[1];
			for (var i=0; i< logEntryList.length; i++) {
				if (logEntryList[i].getId()[1] == firstExistingId) {
					break;
				}
				self.logEntries.splice(i, 0, logEntryList[i]);
				self.logEntries.pop();
			}
		}
	});
};

tutao.tutanota.ctrl.LogViewModel.prototype._removeTime = function(date) {
	var millisInDay = 60 * 60 * 24 * 1000;
	var currentTime = date.getTime();
	var rest = currentTime % millisInDay;
	return currentTime - rest;
};

/**
 * Returns true if currently a list is shown and the clicked on next at least once.
 */
tutao.tutanota.ctrl.LogViewModel.prototype.showNewerPossible = function() {
	return !this.showCurrent();
};

/**
 * Shows the instance that was loaded before the current one.
 */
tutao.tutanota.ctrl.LogViewModel.prototype.showNewer = function() {
	var self = this;
	this._loadLogEntries(this.logEntries()[0].getId()[1], false, function(logEntryList) {
		if (logEntryList.length == self.maxCount()) {					
			self.logEntries(logEntryList);
		} else {
			for (var i=logEntryList.length-1; i>=0; i--) {						
				self.logEntries.unshift(logEntryList[i]);
				self.logEntries.pop();
			}
		}
	});
};

/**
 * Returns true if currently a list is shown and more elements can be loaded.
 */
tutao.tutanota.ctrl.LogViewModel.prototype.showOlderPossible = function() {
	return !this.showCurrent();
};

/**
 * Loads the next elements from the currently shown list.
 */
tutao.tutanota.ctrl.LogViewModel.prototype.showOlder = function() {
	var self = this;
	
	var nextStartId = this.logEntries()[this.logEntries().length - 1].getId()[1];
	this._loadLogEntries(nextStartId, true, function(logEntryList) {
		if (logEntryList.length > 0) {
			self.logEntries(logEntryList);
		}
	});
};

/**
 * Loads the next elements from the currently shown list.
 */
tutao.tutanota.ctrl.LogViewModel.prototype.showMore = function() {
	var self = this;
	this._loadLogEntries(this.logEntries()[this.logEntries().length - 1].getId()[1], true, function(logEntryList) {
		for ( var i = 0; i < logEntryList.length; i++) {
			self.logEntries.push(logEntryList[i]);
		}
	});
};

/**
 * Loads a maximum of maxCount() entries beginning with the entry with a smaller id than upperBoundId 
 * @param {string} upperBoundId The id of upper limit (base64 encoded)
 * @param {boolean} reverse If the entries shall be loaded reverse.
 * @param {function(Array.<tutao.entity.monitor.LogEntry>)} callback Will be called with the list of new log entries. 
 */
tutao.tutanota.ctrl.LogViewModel.prototype._loadLogEntries = function(upperBoundId, reverse, callback) {
	var listId = tutao.util.EncodingConverter.base64ToBase64Ext(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.timestampToHexGeneratedId(this._removeTime(this._untilDate()))));
	
	tutao.entity.monitor.LogEntry.loadRange(listId, upperBoundId, this.maxCount(), reverse, function(logEntryList, exception) {
		if (!reverse) {
			logEntryList.reverse();
		}
		if (exception) {
			console.log(exception);
		} else {
			callback(logEntryList);
			tutao.locator.logView.logEntriesUpdated();
		}
	});
};

