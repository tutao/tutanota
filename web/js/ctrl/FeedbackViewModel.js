"use strict";

tutao.provide('tutao.tutanota.ctrl.FeedbackViewModel');

/**
 * The ViewModel for the feedback wizard.
 * @constructor
 */
tutao.tutanota.ctrl.FeedbackViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.message = ko.observable("");
    this.error = null;
	this._timestamp = null;
	this.showDialog = ko.observable(false);
};

/**
 * @param {Error=} error The error that occurred.
 */
tutao.tutanota.ctrl.FeedbackViewModel.prototype.open = function(error) {
    this.error = error;
    this.message("");
	this._timestamp = new Date().toUTCString();
    this.showDialog(true);
};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.close = function() {
    this.showDialog(false);
};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.sendFeedback = function() {
    var self = this;
    tutao.tutanota.ctrl.FeedbackViewModel.sendFeedbackMail(this.message(), this._timestamp, this.error).catch(function(e) {
        console.log("could not send feedback", e);
    }).finally(function() {
        self.close();
    });
};

/**
 * Sends a feedback mail to support@tutao.de.
 * @param {string} message The message to add to the mail.
 * @param {string} timestamp The time of the error.
 * @param {Error=} error The error that occurred.
 * @returns {Promise} When finished.
 */
tutao.tutanota.ctrl.FeedbackViewModel.sendFeedbackMail = function(message, timestamp, error) {
    message += "\n\n Client: " + (tutao.env.mode == tutao.Mode.App ? cordova.platformId + " app": "Browser");

	var type = tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES[Number(tutao.locator.userController.getLoggedInUser().getAccountType())];
    message += "\n Type: " + type;

    message += "\n Tutanota version: " + tutao.env.versionNumber;

    message += "\n Timestamp (UTC): " +  timestamp;

    message  += "\n User agent: \n" + navigator.userAgent;

    if (error && error.stack) {
        message += "\n\n Stacktrace: \n" + error.stack;
    }

    message = message.split("\n").join("<br>");
    var subject = ((error && error.name) ? "Feedback - " + error.name : "Feedback - ?") + " " + type;
    var recipient = new tutao.tutanota.ctrl.RecipientInfo("support@tutao.de", "");
    return recipient.resolveType().then(function() {
        return tutao.tutanota.ctrl.DraftFacade.createDraft(subject, message, tutao.locator.userController.getUserGroupInfo().getMailAddress(), "", [recipient], [], [], tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_NEW, null, [], true).then(function (draft) {
            return tutao.tutanota.ctrl.DraftFacade.sendDraft(draft, [recipient], "de");
        });
    });
};
