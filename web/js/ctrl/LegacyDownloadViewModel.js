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
    this.textId = ko.observable(null);
	this.dialogVisible = ko.observable(false);
    this._resolve = null;

};

tutao.tutanota.ctrl.LegacyDownloadViewModel.prototype.showDialog = function(filename, blobUrl, textId) {
	this.filename(filename);
    this.blobUrl(blobUrl);
    this.textId(textId);
    this.dialogVisible(true);

    var self = this;
    return new Promise(function(resolve, reject) {
        self._resolve = resolve;
    })
};

tutao.tutanota.ctrl.LegacyDownloadViewModel.prototype.closeDialog = function() {
	this.dialogVisible(false);
    this._resolve();
};
