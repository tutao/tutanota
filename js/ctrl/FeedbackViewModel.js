"use strict";

goog.provide('tutao.tutanota.ctrl.FeedbackViewModel');

/**
 * The ViewModel for the feedback wizard.
 * @constructor
 */
tutao.tutanota.ctrl.FeedbackViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.message = ko.observable("");
	this.image = null;
    this.addScreenshot = ko.observable(false);
	this.showDialog = ko.observable(false);

};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.open = function() {
	var self = this;
	html2canvas($('body'), {
		onrendered: function(canvas) {
			var img = canvas.toDataURL();
			var string_base64 = img.split(',')[1];
            var binary_string = window.atob(string_base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            self.image = bytes.buffer;
            self.showDialog(true);
		},
		allowTaint: true
	});
};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.close = function() {
	this.showDialog(false);
	this.message("");
	this.image = null;
};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.sendFeedback = function() {
    var self = this;
    var attachments = [];
    if (this.addScreenshot()){
        var imageFile = new tutao.entity.tutanota.File();
        imageFile.setMimeType("image/png");
        imageFile.setName("screenshot.png");
        imageFile.setSize(this.image.byteLength);
        attachments.push(new tutao.tutanota.util.DataFile(this.image, imageFile));
    }
    var facade;
    var previousMessageId;
    if (tutao.locator.userController.isExternalUserLoggedIn()) {
        facade = tutao.tutanota.ctrl.SendMailFromExternalFacade;
        previousMessageId = ""; // dummy value for feedback mail
    } else {
        facade = tutao.tutanota.ctrl.SendMailFacade;
        previousMessageId = null;
    }
    facade.sendMail("Feedback", this.message(), "", [new tutao.tutanota.ctrl.RecipientInfo("support@tutao.de", "")], [], [], tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_NEW, previousMessageId, attachments, function(mailId, exception) {
        if (exception) {
            tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("sendFeedbackFailed_msg"));
        }
        self.close();
    });
};
