"use strict";

tutao.provide('tutao.tutanota.ctrl.FileViewModel');

/**
 * The view model for the file system.
 * The context of all methods is re-bound to this for allowing the ViewModel to be called from event Handlers that might get executed in a different context.
 * @constructor
 */
tutao.tutanota.ctrl.FileViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.buttons = ko.observableArray();
	this.sentAttachments = ko.observableArray();
	this.receivedAttachments = ko.observableArray();
	this.currentlyDownloadingFile = ko.observable(null);
};

tutao.tutanota.ctrl.FileViewModel.prototype.init = function() {
	var self = this;
	tutao.entity.tutanota.File.loadRange(tutao.locator.mailBoxController.getUserMailBox().getReceivedAttachments(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 100, false).then(function(files) {
		self.receivedAttachments(files);
		return tutao.entity.tutanota.File.loadRange(tutao.locator.mailBoxController.getUserMailBox().getSentAttachments(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID, 100, false).then(function(files) {
			self.sentAttachments(files);
		});
	});
};

tutao.tutanota.ctrl.FileViewModel.prototype.getFileTypeImage = function(file) {
	return tutao.tutanota.util.FileUtils.getFileTypeImage(file.getName(), false);
};

tutao.tutanota.ctrl.FileViewModel.prototype.newFolder = function() {
	console.log("I want a new folder");
};

tutao.tutanota.ctrl.FileViewModel.prototype.downloadFile = function(file) {
	var self = this;
	// do not allow a new download as long as another is running
	if (this.currentlyDownloadingFile()) {
		return;
	}
	this.currentlyDownloadingFile(file);
    tutao.locator.fileFacade.readFileData(file).then(function(dataFile) {
		return tutao.locator.fileFacade.open(dataFile);
	}).lastly(function() {
        self.currentlyDownloadingFile(null);
    });
};
