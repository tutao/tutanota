"use strict";

goog.provide('tutao.tutanota.ctrl.DisplayedMail');

/**
 * This class represents a mail that is currently displayed.
 * @param {tutao.entity.tutanota.Mail} mail The mail.
 * @constructor
 */
tutao.tutanota.ctrl.DisplayedMail = function(mail) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.mail = mail;


	this.bodyText = ko.observable("");
	this.bodyTextWithoutQuotation = ko.observable("");
	this.bodyTextQuotation = ko.observable("");
	this.bodyTextQuotationVisible = ko.observable(false);
	this.mailBodyLoaded = ko.observable(false);

	this.attachments = ko.observableArray(); // contains Files
	this.currentlyDownloadingAttachment = ko.observable(); // null or a File

	this._loadBody();
	this._loadAttachments();

	var self = this;
	this.buttons = ko.computed(function() {
		var trashText = (this.mail.getTrashed()) ? tutao.locator.languageViewModel.get("undelete_action") : tutao.locator.languageViewModel.get("delete_action");
        var buttons = [];
		if (tutao.locator.userController.isExternalUserLoggedIn()) {
			if (this.mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED && tutao.tutanota.util.ClientDetector.getSupportedType() != tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE) {
				buttons.push(new tutao.tutanota.ctrl.Button(tutao.locator.languageViewModel.get("replyConfidential_action"), 10, function() { tutao.locator.mailViewModel.replyMail(self); }));
			}
            // legacy_ie does not support internally used arraybuffers, legacy_safari does not support download
            if (tutao.tutanota.util.ClientDetector.isSupported()) {
                buttons.push(new tutao.tutanota.ctrl.Button(tutao.locator.languageViewModel.get("export_action"), 9, function() { tutao.locator.mailViewModel.exportMail(self); }))
            }
            buttons.push(new tutao.tutanota.ctrl.Button(trashText, 8, function() { tutao.locator.mailViewModel.deleteMail(self); }));
		} else {
            buttons.push(new tutao.tutanota.ctrl.Button(tutao.locator.languageViewModel.get("reply_action"), 10, function() { tutao.locator.mailViewModel.replyMail(self); }));
            if (this.mail.getToRecipients().length + this.mail.getCcRecipients().length + this.mail.getBccRecipients().length > 1) {
                buttons.push(new tutao.tutanota.ctrl.Button(tutao.locator.languageViewModel.get("replyAll_action"), 8, function() { tutao.locator.mailViewModel.replyAllMail(self); }));
            }
            buttons.push(new tutao.tutanota.ctrl.Button(tutao.locator.languageViewModel.get("forward_action"), 7, function() { tutao.locator.mailViewModel.forwardMail(self); }));
            buttons.push(new tutao.tutanota.ctrl.Button(trashText, 9, function() { tutao.locator.mailViewModel.deleteMail(self); }));
		}
        return buttons;
	}, this);
	this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons);
};

tutao.tutanota.ctrl.DisplayedMail.prototype.toggleQuotationVisible = function() {
	this.bodyTextQuotationVisible(!this.bodyTextQuotationVisible());
};

/**
 * Loads the mail body.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype._loadBody = function() {
	var self = this;
//	setTimeout(function() {
	self.mail.loadBody(function(body, exception) {
		if (exception) {
			self.bodyText("error while loading");
			console.log("error");
		} else {
			self.bodyText(tutao.locator.htmlSanitizer.sanitize(body.getText()));
			var split = tutao.locator.mailView.splitMailTextQuotation(self.bodyText());
			self.bodyTextWithoutQuotation(split.text);
			self.mailBodyLoaded(true);
			self.bodyTextQuotation(split.quotation);
		}
	});
//	},1000);
};

/**
 * Loads the attached files.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype._loadAttachments = function() {
	var self = this;
	//TODO (timely) implement loading of multiple LET instances
	for (var i = 0; i < this.mail.getAttachments().length; i++) {
		tutao.entity.tutanota.File.load(this.mail.getAttachments()[i], function(file, exception) {
			if (!exception) {
				self.attachments.push(file);
			} else {
				console.log(exception);
			}
		});
	}
};

/**
 * Offers the user to download the given attachment.
 * @param {tutao.entity.tutanota.File} file The file to download.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype.downloadAttachment = function(file) {
	// do not allow a new download as long as another is running
	if (this.currentlyDownloadingAttachment()) {
		return;
	}
	var self = this;
	this.currentlyDownloadingAttachment(file);
	tutao.tutanota.ctrl.FileFacade.readFileData(file, function(dataFile, exception) {
		if (exception) {
			console.log(exception);
			self.currentlyDownloadingAttachment(null);
			return;
		}
		tutao.tutanota.util.FileUtils.provideDownload(dataFile, function() {
			self.currentlyDownloadingAttachment(null);
		});
	});
};

/**
 * Provides the image that shall be shown in the attachment.
 * @param {tutao.entity.tutanota.File} file The file.
 * @return {String} The name of the image.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype.getAttachmentImage = function(file) {
	var busy = (file == this.currentlyDownloadingAttachment());
	return tutao.tutanota.util.FileUtils.getFileTypeImage(file.getName(), busy);
};
