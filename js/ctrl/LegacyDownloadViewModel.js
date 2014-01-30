"use strict";

goog.provide('tutao.tutanota.ctrl.LegacyDownloadViewModel');

/**
 * The ViewModel for the safari legacy download.
 * @constructor
 */
tutao.tutanota.ctrl.LegacyDownloadViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.filename = ko.observable("");
    this.blobUrl = ko.observable("");
	this.dialogVisible = ko.observable(false);
    this._callback = null;

};

tutao.tutanota.ctrl.LegacyDownloadViewModel.prototype.showDialog = function(filename, blobUrl, callback) {
	this.filename(filename);
    this.blobUrl(blobUrl);
    this._callback = callback;
    this.dialogVisible(true);
};

tutao.tutanota.ctrl.LegacyDownloadViewModel.prototype.closeDialog = function() {
	this.dialogVisible(false);
    this._callback();
};
