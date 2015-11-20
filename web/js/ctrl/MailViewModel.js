"use strict";

tutao.provide('tutao.tutanota.ctrl.MailViewModel');

/**
 * The mails in the conversation on the right.
 * @constructor
 */
tutao.tutanota.ctrl.MailViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.mail = ko.observable();
	this.showSpinner = ko.observable(false);
    this.mail.subscribe(function(){
        // Propagate a columnChange event when the mail changes (e,g. forward an email) to update the column title in the navigation bar.
        tutao.locator.mailView.getSwipeSlider().getViewSlider().notifyColumnChange();
    }, this);

    this.width = 0;

    // only contains buttons for the case that no mail is visible, otherwise the buttons of the displayed/composing mail are shown
    this.buttonBarViewModel = null;
    this._latestMailToShow = null;
    this.notificationBarViewModel = null;
};

tutao.tutanota.ctrl.MailViewModel.prototype.init = function () {
    var self = this;

    this.buttons = [
        new tutao.tutanota.ctrl.Button("newMail_action", 11, tutao.locator.navigator.newMail, function() {
            return tutao.locator.userController.isInternalUserLoggedIn();
        }, false, "newMailAction", "mail-new")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
    this.notificationBarViewModel = new tutao.tutanota.ctrl.NotificationBarViewModel();

    tutao.locator.mailView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.MailView.COLUMN_CONVERSATION, function (width) {
        self.width = width;
        if (self.mail()) {
            // we reduce the max width by 6 px which are used in our css for paddings + borders
            self.mail().buttonBarViewModel.setButtonBarWidth(self.width - 6);
            self.notificationBarViewModel.buttonBarViewModel.setButtonBarWidth( (self.width / 5)*2 - 6 ); // keep in sync with css div.notificationButtons width 40%
        }
        self.buttonBarViewModel.setButtonBarWidth(width - 6);

    });
    this.mail.subscribe(function (newMail) {
        if (newMail) {
            // we reduce the max width by 6 px which are used in our css for paddings + borders
            self.mail().buttonBarViewModel.setButtonBarWidth(self.width - 6);
            self.notificationBarViewModel.buttonBarViewModel.setButtonBarWidth( (self.width / 5)*2 - 6); // keep in sync with css div.notificationButtons width 40%
        }
    });
};

/**
 * Shows the given mail
 * @param {tutao.entity.tutanota.Mail} mail The mail to show.
 * @return Promise
 */
tutao.tutanota.ctrl.MailViewModel.prototype.showMail = function(mail) {
    var self = this;
    if (this.mail() && mail == this.mail().mail) {
        return Promise.resolve();
    }

    var currentMail = new tutao.tutanota.ctrl.DisplayedMail(mail);
    this._latestMailToShow = currentMail;

    // if the conversation column is not visible, directly show the spinner to avoid that the old email is shortly visible when switching to the conversation column
    if (tutao.locator.mailView.isConversationColumnVisible()) {
        // only show the spinner after 200ms if the conversation has not been loaded till then
        setTimeout(function() {
            if (self.mail() != currentMail && self._latestMailToShow == currentMail) {
                self.mail(null);
                self.showSpinner(true);
            }
        }, 200);
    } else {
        self.mail(null);
        self.showSpinner(true);
    }

    return currentMail.load().then(function(){
        if (self._latestMailToShow == currentMail ) {
            self.showSpinner(false);
            self.mail(currentMail);
            currentMail.mail.loadConversationEntry();
        }
    }).caught(tutao.NotFoundError, tutao.NotAuthorizedError, function() {
        // the email seems to be deleted: NotFoundError if the mail body was deleted, NotAuthorizedError if the mail body permission only exists for the sender/recipient
    }).lastly( function(){
        if (self._latestMailToShow == currentMail ) {
            self._latestMailToShow = null; // avoids that in case of an exception the spinner is started above after the timeout
            self.showSpinner(false);
        }
    });
};

/**
 * Hides any visible conversation.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.hideMail = function() {
	this.mail(null);
};

/**
 * Removes the first mail from the conversation.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.removeFirstMailFromConversation = function() {
	this.mail(null);
};

/**
 * Provides a ContactWrapper for the given mail address or null if none was found.
 * @param {string} mailAddress The mail address.
 * @return {tutao.entity.tutanota.ContactWrapper} The contact wrapper.
 */
tutao.tutanota.ctrl.MailViewModel.prototype._findContactByMailAddress = function(mailAddress) {
	var contactWrappers = tutao.tutanota.ctrl.ComposingMail._getContacts();
	for (var i = 0; i < contactWrappers.length; i++) {
		if (contactWrappers[i].hasMailAddress(mailAddress)) {
			return contactWrappers[i];
		}
	}
	return null;
};

/**
 * @param {tutao.tutanota.ctrl.RecipientInfo=} recipientInfo Optional recipient info as recipient.
 * @return {Promise.<boolean>} True if the new mail was opened, false otherwise.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.newMail = function(recipientInfo) {
	var recipients = (recipientInfo) ? [recipientInfo] : [];
	return this._createMail(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_NEW, "", recipients, [], null, null, null);
};

/**
 * Generates newSubject, that contains only one copy of prefix at the head
 * @param {string} prefix
 * @param {string} oldSubject
 * @return {string} newSubject
 */
tutao.tutanota.ctrl.MailViewModel.prototype._createReplySubject = function(prefix, oldSubject){
   if (oldSubject.substr(0,prefix.length) == prefix)
      return oldSubject;
   else
      return prefix + oldSubject;
};

/**
 * Lets the user write a reply mail to the given displayed mail.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to reply to.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.replyMail = function(displayedMail) {
	var infoLine = tutao.tutanota.util.Formatter.formatFullDateTime(displayedMail.mail.getSentDate()) + " " + tutao.lang("by_label") + " " + displayedMail.mail.getSender().getAddress() + ":";
	var body = "<br><br>" + infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + displayedMail.bodyText() + "</blockquote>";
	var recipients = null;
	if (tutao.locator.userController.isExternalUserLoggedIn()) {
		// TODO (story: delete user) check that the recipient is actually internal (i.e. not unregistered)
		recipients = [new tutao.tutanota.ctrl.RecipientInfo(displayedMail.mail.getSender().getAddress(), displayedMail.mail.getSender().getName(), this._findContactByMailAddress(displayedMail.mail.getSender().getAddress()), false)];
	} else if (displayedMail.mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED) {
		recipients = [new tutao.tutanota.ctrl.RecipientInfo(displayedMail.mail.getSender().getAddress(), displayedMail.mail.getSender().getName(), this._findContactByMailAddress(displayedMail.mail.getSender().getAddress()))];
	} else {
        // this is a sent email, so use the to recipients as new recipients
        recipients = [];
        for (var i = 0; i < displayedMail.mail.getToRecipients().length; i++) {
            recipients.push(new tutao.tutanota.ctrl.RecipientInfo(displayedMail.mail.getToRecipients()[i].getAddress(), displayedMail.mail.getToRecipients()[i].getName(), this._findContactByMailAddress(displayedMail.mail.getToRecipients()[i].getAddress())));
        }
    }
    Promise.each(recipients, function(/*tutao.tutanota.ctrl.RecipientInfo*/recipient) {
        recipient.resolveType();
    }).caught(tutao.ConnectionError, function(e) {
        // we are offline but we want to show the dialog only when we click on send.
    });
    var senderMailAddress = this._findOwnMailAddressInMail(displayedMail.mail);
	this._createMail(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_REPLY, this._createReplySubject(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_REPLY_SUBJECT_PREFIX, displayedMail.mail.getSubject()), recipients, [], displayedMail, body, senderMailAddress);
};

/**
 * Lets the user write a reply mail to the sender and all of the recipients of the given displayed mail.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to reply to.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.replyAllMail = function(displayedMail) {
	var infoLine = tutao.tutanota.util.Formatter.formatFullDateTime(displayedMail.mail.getSentDate()) + " " + tutao.lang("by_label") + " " + displayedMail.mail.getSender().getAddress() + ":";
	var body = "<br><br>" + infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + displayedMail.bodyText() + "</blockquote>";
	var toRecipients = [];
	var ccRecipients = [];
    if (displayedMail.mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED) {
        toRecipients.push(new tutao.tutanota.ctrl.RecipientInfo(displayedMail.mail.getSender().getAddress(), displayedMail.mail.getSender().getName(), this._findContactByMailAddress(displayedMail.mail.getSender().getAddress())));
        var oldRecipients = displayedMail.mail.getToRecipients().concat(displayedMail.mail.getCcRecipients());
        for (var i = 0; i < oldRecipients.length; i++) {
            if (!tutao.util.ArrayUtils.contains(tutao.locator.userController.getMailAddresses(), oldRecipients[i].getAddress())) {
                ccRecipients.push(new tutao.tutanota.ctrl.RecipientInfo(oldRecipients[i].getAddress(), oldRecipients[i].getName(), this._findContactByMailAddress(oldRecipients[i].getAddress())));
            }
        }
    } else { // this is a sent email
        for (var i = 0; i < displayedMail.mail.getToRecipients().length; i++) {
            toRecipients.push(new tutao.tutanota.ctrl.RecipientInfo(displayedMail.mail.getToRecipients()[i].getAddress(), displayedMail.mail.getToRecipients()[i].getName(), this._findContactByMailAddress(displayedMail.mail.getToRecipients()[i].getAddress())));
        }
        for (var i = 0; i < displayedMail.mail.getCcRecipients().length; i++) {
            ccRecipients.push(new tutao.tutanota.ctrl.RecipientInfo(displayedMail.mail.getCcRecipients()[i].getAddress(), displayedMail.mail.getCcRecipients()[i].getName(), this._findContactByMailAddress(displayedMail.mail.getCcRecipients()[i].getAddress())));
        }
    }
    var allRecipients = toRecipients.concat(ccRecipients);
    Promise.each(allRecipients, function(/*tutao.tutanota.ctrl.RecipientInfo*/recipient) {
        recipient.resolveType();
    }).caught(tutao.ConnectionError, function(e) {
        // we are offline but we want to show the dialog only when we click on send.
    });
    var senderMailAddress = this._findOwnMailAddressInMail(displayedMail.mail);
	this._createMail(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_REPLY, this._createReplySubject(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_REPLY_SUBJECT_PREFIX, displayedMail.mail.getSubject()), toRecipients, ccRecipients, displayedMail, body, senderMailAddress);
};

/**
 * Lets the user write a mail forwarding the given displayed mail.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to forward.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.forwardMail = function(displayedMail) {
	var infoLine = tutao.lang("date_label") + ": " + tutao.tutanota.util.Formatter.formatFullDateTime(displayedMail.mail.getSentDate()) + "<br>";
	infoLine += tutao.lang("from_label") + ": " + displayedMail.mail.getSender().getAddress() + "<br>";
	if (displayedMail.mail.getToRecipients().length > 0) {
		infoLine += tutao.lang("to_label") + ": " + displayedMail.mail.getToRecipients()[0].getAddress();
		for (var i = 1; i < displayedMail.mail.getToRecipients().length; i++) {
			infoLine += ", " + displayedMail.mail.getToRecipients()[i].getAddress();
		}
		infoLine += "<br>";
	}
	if (displayedMail.mail.getCcRecipients().length > 0) {
		infoLine += tutao.lang("cc_label") + ": " + displayedMail.mail.getCcRecipients()[0].getAddress();
		for (i = 1; i < displayedMail.mail.getCcRecipients().length; i++) {
			infoLine += ", " + displayedMail.mail.getCcRecipients()[i].getAddress();
		}
		infoLine += "<br>";
	}
	infoLine += tutao.lang("subject_label") + ": " + tutao.tutanota.util.Formatter.urlEncodeHtmlTags(displayedMail.mail.getSubject());
	var body = "<br><br>" + infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + displayedMail.bodyText() + "</blockquote>";
    var senderMailAddress = this._findOwnMailAddressInMail(displayedMail.mail);
    var self = this;
	this._createMail(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_FORWARD, tutao.entity.tutanota.TutanotaConstants.CONVERSATION_FORWARD_SUBJECT_PREFIX + displayedMail.mail.getSubject(), [], [], displayedMail, body, senderMailAddress).then(function() {
        self.getComposingMail()._attachments(displayedMail.attachments());
    });
};

/**
 * Provides the first mail address of the users enabled mail addresses found in the given mail. Starts checking the sender, then the recipients.
 * @param mail The mail to check.
 * @return {?string} One of the users mail addresses or null if it is not available.
 */
tutao.tutanota.ctrl.MailViewModel.prototype._findOwnMailAddressInMail = function(mail) {
    var myMailAddresses = tutao.locator.userController.getEnabledMailAddresses();
    if (tutao.util.ArrayUtils.contains(myMailAddresses, mail.getSender().getAddress())) {
        return mail.getSender().getAddress();
    }
    for (var i = 0; i < mail.getToRecipients().length; i++) {
        if (tutao.util.ArrayUtils.contains(myMailAddresses, mail.getToRecipients()[i].getAddress())) {
            return mail.getToRecipients()[i].getAddress();
        }
    }
    for (i = 0; i < mail.getCcRecipients().length; i++) {
        if (tutao.util.ArrayUtils.contains(myMailAddresses, mail.getCcRecipients()[i].getAddress())) {
            return mail.getCcRecipients()[i].getAddress();
        }
    }
    for (i = 0; i < mail.getBccRecipients().length; i++) {
        if (tutao.util.ArrayUtils.contains(myMailAddresses, mail.getBccRecipients()[i].getAddress())) {
            return mail.getBccRecipients()[i].getAddress();
        }
    }
    // May occur if the mail has been received as bcc recipient.
    return null;
};

/**
 * Opens an export dialog that shows how the mail can be exported to Outlook, Thunderbird and the Filesystem.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to export.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.exportMail = function(displayedMail) {
    var self = this;
    displayedMail.buttonBarViewModel.visibleButtons([]);
    self.showSpinner(true);
    return tutao.tutanota.util.Exporter.toEml(displayedMail).then(function(eml) {
        var buffer = tutao.util.EncodingConverter.asciiToArrayBuffer(eml);
        var tmpFile = new tutao.entity.tutanota.File();
        var filename = displayedMail.mail.getSubject();
        if (filename.trim().length == 0) {
            filename = "unnamed";
        }
        tmpFile.setName(filename + ".eml");
        tmpFile.setMimeType("message/rfc822");
        tmpFile.setSize(String(buffer.byteLength));
        tutao.locator.fileFacade.open(new tutao.tutanota.util.DataFile(buffer, tmpFile));
    }).finally(function() {
        self.showSpinner(false);
        displayedMail.buttonBarViewModel.updateVisibleButtons();
    });
};

/**
 * Lets the user write a mail.
 * @param {string} conversationType The conversation type (REPLY or FORWARD). See TutanotaConstants.
 * @param {string} subject The subject for the mail.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipient infos that shall appear as to recipients in the mail.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipient infos that shall appear as cc recipients in the mail.
 * @param {tutao.tutanota.ctrl.DisplayedMail=} previousMail The previous mail to be visible below the new mail. Null if no previous mail shall be visible.
 * @param {?string} bodyText The text to insert into the mail body.
 * @param {?string} senderMailAddress The mail address of the sender or null if the default sender shall be used.
 * @return {Promise<boolean>} resolves to true, if the new mail has been created, to false otherwise
 */
tutao.tutanota.ctrl.MailViewModel.prototype._createMail = function(conversationType, subject, toRecipients, ccRecipients, previousMail, bodyText, senderMailAddress) {
	var self = this;

    var sendAllowed = null;
    if (tutao.locator.userController.isInternalUserLoggedIn()) {
        sendAllowed = tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
            if (customer.getApprovalStatus() == tutao.entity.tutanota.TutanotaConstants.APPROVAL_STATUS_REGISTRATION_APPROVAL_NEEDED) {
                return tutao.tutanota.gui.alert(tutao.lang("waitingForApproval_msg")).then(function () {
                    return false;
                });
            } else {
                return true;
            }
        });
    } else {
        sendAllowed = Promise.resolve(true);
    }
    return sendAllowed.then(function(allowed) {
        if (!allowed) {
            return false;
        } else {
            return self.tryCancelAllComposingMails(false).then(function(confirmed) {
                if (confirmed) {
                    // any selected mails in the mail list shall be deselected
                    tutao.locator.mailFolderListViewModel.selectedFolder().unselectAllMails();

                    var emailSignature = "";
                    if (tutao.locator.userController.isInternalUserLoggedIn()) {
                        emailSignature = tutao.locator.mailBoxController.getEmailSignature();
                    }
                    var mailCreatedPromise;
                    if (previousMail) {
                        var previousMessageId = null;
                        mailCreatedPromise = previousMail.mail.loadConversationEntry().then(function(ce) {
                            previousMessageId = ce.getMessageId();
                        }).caught(tutao.NotFoundError, function(e) {
                            console.log("could not load conversation entry", e);
                        }).then(function() {
                            // the conversation key may be null if the mail was e.g. received from an external via smtp
                            self.mail(new tutao.tutanota.ctrl.ComposingMail(conversationType, previousMessageId, previousMail.mail));
                            self.mail().confidentialButtonSecure(previousMail.mail.getConfidential());
                            self.mail().setBody(emailSignature + bodyText);
                        });
                    } else {
                        mailCreatedPromise = Promise.resolve();
                        self.mail(new tutao.tutanota.ctrl.ComposingMail(conversationType, null, null));
                        self.mail().setBody(emailSignature);
                    }

                    return mailCreatedPromise.then(function() {
                        if (senderMailAddress) {
                            self.getComposingMail().sender(senderMailAddress);
                        }
                        self.getComposingMail().composerSubject(subject);
                        for (var i = 0; i < toRecipients.length; i++) {
                            self.getComposingMail().addToRecipient(toRecipients[i]);
                        }
                        for (i = 0; i < ccRecipients.length; i++) {
                            self.getComposingMail().addCcRecipient(ccRecipients[i]);
                        }

                        self.getComposingMail().showBccCc(self.getComposingMail().containsCcOrBccReceipients());
                        //	not needed currently as we scroll the complete window when editing a mail
                        tutao.locator.mailView.showConversationColumn();


                        // uncomment for test sending html emails (also switch to composeBodyTextArea in index.html)
                        //self.editor = new Quill('div.composeBody', {theme: 'snow'});
                        //self.editor.addModule('toolbar', {
                        //    container: '#toolbar-toolbar'     // Selector for toolbar container
                        //});
                        ////TODO (story send html email): test on mobiles and move to view
                        //	this.editor = new wysihtml5.Editor("composeBodyTextArea", { // id of textarea element
                        //		toolbar:      null, // id of toolbar element
                        //		parserRules:  wysihtml5ParserRules // defined in parser rules set
                        //	});
                        //	var onChange = function() {
                        //		self.conversation()[0].composerBody($("#composeBodyTextArea").val());
                        //	};
                        //	this.editor.on("change", onChange);

                        return true;
                    });
                } else {
                    return false;
                }
            });
        }
    });
};

/**
 * Finally deletes this mail.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to delete finally.
 * @return {window.Promise} The promise.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.finallyDeleteMail = function(displayedMail) {
    return tutao.locator.mailFolderListViewModel.selectedFolder().finallyDeleteMails([displayedMail.mail]);
};

/**
 * Moves the given mail to the trash.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to move to the trash.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.deleteMail = function(displayedMail) {
    tutao.locator.mailFolderListViewModel.selectedFolder().move(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH), [displayedMail.mail]);
};

/**
 * If a composing mail is open, asks the user to cancel that mail.
 * @param {bool} restorePreviousMail True if the previously visible mail shall be shown, false otherwise.
 * @return {Promise.<boolean>} True if no composing mail is open any more, false otherwise.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.tryCancelAllComposingMails = function(restorePreviousMail) {
	if (!this.mail) {
		return Promise.resolve(true);
	} else if (this.isComposingState()) {
		return (this.getComposingMail().cancelMail(restorePreviousMail, false));
	} else {
        return Promise.resolve(true);
	}
};

/**
 * Provides the information if a composing mail is open.
 * @return {Boolean} True, if we are composing an E-Mail right now.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.isComposingState = function() {
    var mail = this.mail();
    return mail && mail instanceof tutao.tutanota.ctrl.ComposingMail;
};

/**
 * Provides the composing mail, if existing in the conversation.
 * @return {tutao.tutanota.ComposingMail} The composing mail.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.getComposingMail = function() {
	if (!this.isComposingState()) {
		throw new Error("Not in composing state");
	}
	return this.mail();
};

/**
 * Provides the information if a composing mail is open and secure external recipients have been selected.
 * @return {Boolean} True if secure external recipients have been selected, false otherwise.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.isComposingMailToSecureExternals = function() {
	return (this.isComposingState() && this.getComposingMail().composeForSecureExternalRecipients());
};

/**
 * Returns true if no conversation (i.e. no mail) is shown.
 * @return {Boolean} True if no conversation is shown, false otherwise.
 */
tutao.tutanota.ctrl.MailViewModel.prototype.isConversationEmpty = function() {
	return this.mail() == null;
};

/**
 * @param {tutao.entity.tutanota.MailAddress} mailAddress The MailAddress
 * @param {string} meId The id of the text that should be used if the mailAddress is the current user
 * @returns {string} The label for this MailAddress
 */
tutao.tutanota.ctrl.MailViewModel.prototype.getLabel = function(mailAddress, meId) {
    var name = mailAddress.getName();
    if (tutao.util.ArrayUtils.contains(tutao.locator.userController.getMailAddresses(), mailAddress.getAddress())) {
        name = tutao.locator.languageViewModel.get(meId);
    }
    if (name == "") {
        return mailAddress.getAddress();
    } else if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
        return name;
    } else {
        return name + " <" + mailAddress.getAddress() + ">";
    }
};

/**
 * Retuns a textId for the current conversation type.
 * @returns {string} The textId
 */
tutao.tutanota.ctrl.MailViewModel.prototype.getColumnTitleText = function(){
    var text = "";
    if(!this.isConversationEmpty()){
        if (this.isComposingState()){
            var type = this.mail().conversationType;
            if ( type == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_NEW){
                text = tutao.lang("newMail_action");
            }else if ( type == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_REPLY){
                text = tutao.lang("reply_action");
            }else if ( type == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_FORWARD){
                text = tutao.lang("forward_action");
            }
        } else {
            text = (tutao.locator.mailListViewModel.getSelectedMailIndex() + 1) + "/" + tutao.locator.mailListViewModel.getMails().length;
        }
    }
    return text;
};

tutao.tutanota.ctrl.MailViewModel.prototype.showNotification = function(descriptionTextid, actionButton){
    this.notificationBarVisible(true);

};

tutao.tutanota.ctrl.MailViewModel.prototype.hideNotification = function(){
    this.notificationBarVisible(false);
};


