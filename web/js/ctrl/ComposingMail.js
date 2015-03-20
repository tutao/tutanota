"use strict";

tutao.provide('tutao.tutanota.ctrl.ComposingMail');

/**
 * This class represents a mail that is currently written. It contains mail, body and other editing fields.
 * @param {string} conversationType The conversationType.
 * @param {string?} previousMessageId The message id of the mail that the new mail is a reply to or that is forwarded. Null if this is a new mail.
 * @param {tutao.entity.tutanota.Mail?} previousMail The email that this is a reply to or that is forwarded. Null if this is a new mail.
 * @constructor
 * @implements {tutao.tutanota.ctrl.bubbleinput.BubbleHandler}
 */
tutao.tutanota.ctrl.ComposingMail = function(conversationType, previousMessageId, previousMail) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    var sender = tutao.locator.mailBoxController.getUserProperties().getDefaultSender();
    if (!sender) {
        sender = tutao.locator.userController.getUserGroupInfo().getMailAddress();
    }
    this.availableSenders = tutao.locator.userController.getMailAddresses();
    this.sender = ko.observable(sender);
	this.composerSubject = ko.observable("");
	this.subjectFieldFocused = ko.observable(false);
    // @type {function():Array.<tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile>
	this._attachments = ko.observableArray();
	this.currentlyDownloadingAttachment = ko.observable(null); // null or a DataFile

	this.toRecipientsViewModel = new tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel(this);
	this.ccRecipientsViewModel = new tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel(this);
	this.bccRecipientsViewModel = new tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel(this);

	this.confidentialButtonSecure = ko.observable(!tutao.locator.mailBoxController.getUserProperties().getDefaultUnconfidential());
	this.conversationType = conversationType;
	this.previousMessageId = previousMessageId;
    this._previousMail = previousMail;
	this.previousMailListColumnVisible = tutao.locator.mailView.isMailListColumnVisible();

	this.busy = ko.observable(false);
    this.busy.subscribe(function(newBusy) {
        this.toRecipientsViewModel.setEnabled(!newBusy);
        this.ccRecipientsViewModel.setEnabled(!newBusy);
        this.bccRecipientsViewModel.setEnabled(!newBusy);
    }, this);

	this.directSwitchActive = true;

	this.mailBodyLoaded = ko.observable(true);

    var self = this;
    var notBusy = function() {
        return !self.busy();
    };
	this.buttons = [
                    new tutao.tutanota.ctrl.Button("dismiss_action", tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, function () {
                        self.cancelMail(true, true);
                    }, notBusy, false, "composer_cancel", "cancel"),
			        new tutao.tutanota.ctrl.Button("attachFiles_action", 9, this.attachSelectedFiles, notBusy, true, "composer_attach", "attachment"),
			        new tutao.tutanota.ctrl.Button("send_action", 10, this.sendMail, notBusy, false, "composer_send", "send")
			        ];
	this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);

    tutao.locator.passwordChannelViewModel.init();

    this.showBccCc = ko.observable(false);

};

/**
 * The maximum attachments size for unsecure external recipients.
 */
tutao.tutanota.ctrl.ComposingMail.MAX_EXTERNAL_ATTACHMENTS_SIZE = 26214400;

/**
 * @param {string} bodyText The unsanitized body text. May be an empty string.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.setBody = function(bodyText) {
    tutao.locator.mailView.setComposingBody(bodyText);
};

/**
 * Provides the information if this composing mail shall be switched away directly without sliding animation.
 * When sending this mail or canceling without another mail selected, this returns false.
 * @return {boolean} True if yes, false otherwise.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.isDirectSwitchActive = function() {
	return this.directSwitchActive;
};


tutao.tutanota.ctrl.ComposingMail.prototype.containsCcOrBccReceipients = function() {
	return (this.ccRecipientsViewModel.bubbles().length > 0 || this.bccRecipientsViewModel.bubbles().length > 0 );
};

tutao.tutanota.ctrl.ComposingMail.prototype.toggleCcAndBccVisibility = function() {
    this.showBccCc(!this.showBccCc());
};

/**
 * Switches the confidentiality for this mail.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.switchSecurity = function() {
	if (!this.confidentialButtonSecure() || this.containsExternalRecipients()) {
		this.confidentialButtonSecure(!this.confidentialButtonSecure());
	}
};

/**
 * Makes sure that the password channel column is visible.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.showPasswordChannelColumn = function() {
    tutao.locator.mailView.showPasswordChannelColumn();
};

/**
 * Makes sure that the password channel column is visible.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.isPasswordChannelColumnVisible = function() {
    return tutao.locator.mailView.isPasswordChannelColumnVisible();
};

/**
 * Sends the new mail.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.sendMail = function() {
	var self = this;
    // validate recipients here because fastclick on the send button does not trigger validation

	var invalidRecipients = (this.toRecipientsViewModel.inputValue() !== "") || (this.ccRecipientsViewModel.inputValue() !== "") || (this.bccRecipientsViewModel.inputValue() !== "");
	if (!invalidRecipients && this.toRecipientsViewModel.bubbles().length === 0 && this.ccRecipientsViewModel.bubbles().length === 0 && this.bccRecipientsViewModel.bubbles().length === 0) {
		// setTimeout is needed because fastClick would call the event twice otherwise
		setTimeout(function() {
			tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("noRecipients_msg"));
		}, 0);
		return;
	}
	if (invalidRecipients) {
		setTimeout(function() {
			tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("invalidRecipients_msg"));
		}, 0);
		return;
	}
    var subjectConfirmPromise = null;
	if (this.composerSubject().length === 0) {
        subjectConfirmPromise = tutao.tutanota.gui.confirm(tutao.locator.languageViewModel.get("noSubject_msg"));
	} else {
        subjectConfirmPromise = Promise.resolve(true);
    }

    return subjectConfirmPromise.then(function(confirmed) {
        if (confirmed) {
            self.busy(true);
            return self._resolveRecipients().then(function () {
                var unsecureRecipients = self._containsUnsecureRecipients();
                if (self.confidentialButtonSecure() && unsecureRecipients) {
                    setTimeout(function () {
                        var message = "noPasswordChannels_msg";
                        if (!tutao.locator.passwordChannelViewModel.isAutoTransmitPasswordAllowed()) {
                            message = "noPreSharedPassword_msg";
                        }
                        tutao.tutanota.gui.alert(tutao.lang(message)).then(function () {
                            tutao.locator.mailView.showPasswordChannelColumn();
                        });
                    }, 0);
                    return;
                }

                var secureExternalRecipients = tutao.locator.passwordChannelViewModel.getSecureExternalRecipients();

                // check if a pre-shared password is not strong enough
                var onePresharedPasswordNotStrongEnough = false;
                for (var i = 0; i < secureExternalRecipients.length; i++) {
                    var presharedPassword = secureExternalRecipients[i].getEditableContact().presharedPassword();
                    if (presharedPassword != null && tutao.locator.passwordChannelViewModel.getPasswordStrength(secureExternalRecipients[i]) < 80) {
                        onePresharedPasswordNotStrongEnough = true;
                        break;
                    }
                }

                var promise = null;
                if (onePresharedPasswordNotStrongEnough) {
                    promise = tutao.tutanota.gui.confirm(tutao.lang("presharedPasswordNotStrongEnough_msg"));
                } else {
                    promise = Promise.resolve(true);
                }

                return promise.then(function (ok) {
                    if (ok) {
                        return self._updateContactInfo(self.getAllComposerRecipients()).then(function () {
                            self._freeBubbles();

                            var senderName = "";
                            if (tutao.locator.userController.isInternalUserLoggedIn()) {
                                senderName = tutao.locator.userController.getUserGroupInfo().getName();
                            }

                            var facade = null;
                            if (tutao.locator.userController.isExternalUserLoggedIn()) {
                                facade = tutao.tutanota.ctrl.SendMailFromExternalFacade;
                            } else if (!self.confidentialButtonSecure() && self.containsExternalRecipients()) {
                                facade = tutao.tutanota.ctrl.SendUnsecureMailFacade;
                            } else {
                                facade = tutao.tutanota.ctrl.SendMailFacade;
                            }

                            // the mail is sent in the background
                            self.directSwitchActive = false;

                            var propertyLanguage = tutao.locator.mailBoxController.getUserProperties().getNotificationMailLanguage();
                            var selectedLanguage = tutao.locator.passwordChannelViewModel.getNotificationMailLanguage();
                            var promise = Promise.resolve();
                            if (selectedLanguage != propertyLanguage) {
                                tutao.locator.mailBoxController.getUserProperties().setNotificationMailLanguage(selectedLanguage);
                                promise = tutao.locator.mailBoxController.getUserProperties().update();
                            }

                            return promise.then(function () {
                                return facade.sendMail(self.composerSubject(), tutao.locator.mailView.getComposingBody(), self.sender(), senderName, self.getComposerRecipients(self.toRecipientsViewModel),
                                    self.getComposerRecipients(self.ccRecipientsViewModel), self.getComposerRecipients(self.bccRecipientsViewModel),
                                    self.conversationType, self.previousMessageId, self._attachments(), tutao.locator.passwordChannelViewModel.getNotificationMailLanguage()).then(function (senderMailElementId, exception) {
                                        return self._updatePreviousMail().lastly(function () {
                                            self._restoreViewState();
                                            if (tutao.locator.userController.isExternalUserLoggedIn()) {
                                                // external users do not download mails automatically, so download the sent email now
                                                var externalSentFolder = tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT);
                                                tutao.entity.tutanota.Mail.load([externalSentFolder.getMailListId(), senderMailElementId]).then(function (mail, exception) {
                                                    externalSentFolder.updateOnNewMails([mail]);
                                                });
                                            }
                                        });
                                    });
                            }).caught(tutao.RecipientsNotFoundError, function (exception) {
                                var notFoundRecipients = exception.getRecipients();
                                var recipientList = "";
                                for (var i = 0; i < notFoundRecipients.length; i++) {
                                    recipientList += notFoundRecipients[i] + "\n";
                                }
                                console.log("recipients not found", exception);
                                return tutao.tutanota.gui.alert(tutao.lang("invalidRecipients_msg") + "\n" + recipientList);
                            });

                        });
                    } else {
                        tutao.locator.mailView.showPasswordChannelColumn();
                        return Promise.resolve();
                    }
                });
            });
        }
    }).lastly(function () {
        self.busy(false);
    });
};

tutao.tutanota.ctrl.ComposingMail.prototype._updatePreviousMail = function() {
    if (this._previousMail) {
        if (this._previousMail.getReplyType() == tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_NONE && this.conversationType == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_REPLY) {
            this._previousMail.setReplyType(tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_REPLY);
        } else if (this._previousMail.getReplyType() == tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_NONE && this.conversationType == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_FORWARD) {
            this._previousMail.setReplyType(tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_FORWARD);
        } else  if (this._previousMail.getReplyType() == tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_FORWARD && this.conversationType == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_REPLY) {
            this._previousMail.setReplyType(tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_REPLY_FORWARD);
        } else  if (this._previousMail.getReplyType() == tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_REPLY && this.conversationType == tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_FORWARD) {
            this._previousMail.setReplyType(tutao.entity.tutanota.TutanotaConstants.MAIL_REPLY_TYPE_REPLY_FORWARD);
        } else {
            return Promise.resolve();
        }
        tutao.locator.mailListViewModel.updateMailEntry(this._previousMail);
        return this._previousMail.update().caught(tutao.NotFoundError, function(e) {
            // avoid exception for missing sync
        });
    } else {
        return Promise.resolve();
    }
};

/**
 * Try to cancel creating this new mail. The user is asked if it shall be cancelled if he has already entered text.
 * @param {boolean} restorePreviousMail True if previously visible mail shall be shown, otherwise no mail is shown.
 * @param {boolean} disableConfirm Disables confirm dialog when cancel mail.
 * @return {Promise.<boolean>} True if the mail was cancelled, false otherwise.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.cancelMail = function(restorePreviousMail, disableConfirm) {
    var self = this;
    // if the email is currently, sent, do not cancel the email.
    if (this.busy()) {
        return Promise.resolve(false);
    }
	var body = tutao.locator.mailView.getComposingBody();
	var confirm = (this.composerSubject() !== "" ||
            (body !== "" && body !== "<br>") ||
			this.toRecipientsViewModel.inputValue() !== "" ||
			this.toRecipientsViewModel.bubbles().length != 0 ||
			this.ccRecipientsViewModel.inputValue() !== "" ||
			this.ccRecipientsViewModel.bubbles().length != 0 ||
			this.bccRecipientsViewModel.inputValue() !== "" ||
			this.bccRecipientsViewModel.bubbles().length != 0);

    var cancel = function() {
        self._freeBubbles();
        if (restorePreviousMail) {
            self._restoreViewState();
        }
    };

	if (!confirm || disableConfirm) {
        cancel();
        return Promise.resolve(true);
    } else {
        return tutao.tutanota.gui.confirm(tutao.lang("deleteMail_msg")).then(function (ok) {
            if (ok) {
                cancel();
                return true;
            } else {
                return false;
            }
        });
    }
};

/**
 * if no mail was selected -> show mail list column
 * if mail was selected (if showLastSelected == true) and conversation column visible -> show last mail
 * if mail was selected and mail list column visible -> show last mail, show mail list column
 */
tutao.tutanota.ctrl.ComposingMail.prototype._restoreViewState = function() {
    tutao.locator.mailFolderListViewModel.selectedFolder().selectPreviouslySelectedMails();
	if (this.previousMailListColumnVisible) {
		tutao.locator.mailView.showDefaultColumns();
	}
};

/**
 * Calles deleted() on each bubble in each bubble input field to free the contained editable contact.
 */
tutao.tutanota.ctrl.ComposingMail.prototype._freeBubbles = function() {
	for (var i = 0; i < this.toRecipientsViewModel.bubbles().length; i++) {
		this.bubbleDeleted(this.toRecipientsViewModel.bubbles()[i]);
	}
	for (i = 0; i < this.ccRecipientsViewModel.bubbles().length; i++) {
		this.bubbleDeleted(this.ccRecipientsViewModel.bubbles()[i]);
	}
	for (i = 0; i < this.bccRecipientsViewModel.bubbles().length; i++) {
		this.bubbleDeleted(this.bccRecipientsViewModel.bubbles()[i]);
	}
};

/**
 * Returns an array of RecipientInfos from the given BubbleInputViewModel.
 * @param {tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel} recipientsViewModel The view model to get the recipients from.
 * @return {Array.<tutao.tutanota.ctrl.RecipientInfo>} The recipient infos.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.getComposerRecipients = function(recipientsViewModel) {
	var r = [];
	for (var i = 0; i < recipientsViewModel.bubbles().length; i++) {
		r.push(recipientsViewModel.bubbles()[i].entity);
	}
	return r;
};

/**
 * Returns an array of RecipientInfos containing all to, cc and bcc recipientsInfos.
 * @return {Array.<tutao.tutanota.ctrl.RecipientInfo>} The recipient infos.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.getAllComposerRecipients = function() {
	return this.getComposerRecipients(this.toRecipientsViewModel)
		.concat(this.getComposerRecipients(this.ccRecipientsViewModel))
		.concat(this.getComposerRecipients(this.bccRecipientsViewModel));
};

/**
 * Add a recipient to the "to" recipients.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipient info.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.addToRecipient = function(recipientInfo) {
	this.toRecipientsViewModel.addBubble(this._createBubbleFromRecipientInfo(recipientInfo));
};

/**
 * Add a recipient to the "cc" recipients.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipient info.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.addCcRecipient = function(recipientInfo) {
	this.ccRecipientsViewModel.addBubble(this._createBubbleFromRecipientInfo(recipientInfo));
};

/**
 * Returns if there are unsecure recipients among the current recipients.
 * @return {boolean} True if there are unsecure recipients among the given recipients, false otherwise.
 */
tutao.tutanota.ctrl.ComposingMail.prototype._containsUnsecureRecipients = function() {
	var r = this.getAllComposerRecipients();
	for (var i = 0; i < r.length; i++) {
		if (!r[i].isSecure()) {
			return true;
		}
	}
	return false;
};

/**
 * Tries to resolve unknown recipients if there are any
 * @return {Promise.<>} Resolves, if all unknown recipients have been resolved.
 */
tutao.tutanota.ctrl.ComposingMail.prototype._resolveRecipients = function() {
    return Promise.each(this.getAllComposerRecipients(), function(/* tutao.tutanota.ctrl.RecipientInfo */recipientInfo) {
        return recipientInfo.resolveType();
    });
};

/**
 * Returns true if this mail shall (also) be sent to external recipients in a secure way. Returns false if not yet known for some recipients.
 * @return {boolean}
 */
tutao.tutanota.ctrl.ComposingMail.prototype.composeForSecureExternalRecipients = function() {
	if (this.confidentialButtonSecure()) {
		return this.containsExternalRecipients();
	} else {
		return false;
	}
};


/**
 * Returns true if this mail contains external recipients.
 * @return {boolean}
 */
tutao.tutanota.ctrl.ComposingMail.prototype.containsExternalRecipients = function() {
	var r = this.getAllComposerRecipients();
	for (var i = 0; i < r.length; i++) {
		if (r[i].isExternal()) {
			return true;
		}
	}
	return false;
};

tutao.tutanota.ctrl.ComposingMail.prototype.getConfidentialStateMessageId = function() {
    if (this.containsExternalRecipients() && !this.confidentialButtonSecure()) {
        return 'nonConfidentialStatus_msg';
    } else {
        return 'confidentialStatus_msg';
    }
};

/**
 * Offers the user to download the given data file which was added to this mail.
 * @param {tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile} dataFile The file to download.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.downloadNewAttachment = function(dataFile) {
    if (this.busy()) {
        return;
    }
	var self = this;
	// do not allow a new download as long as another is running
	if (this.currentlyDownloadingAttachment()) {
		return;
	}
	this.currentlyDownloadingAttachment(dataFile);

    var promise = Promise.resolve(dataFile);
    if (dataFile instanceof tutao.entity.tutanota.File){
        promise = tutao.locator.fileFacade.readFileData(dataFile);
    }
    promise.then(function (dataFile) {
        return tutao.locator.fileFacade.open(dataFile);
    }).lastly(function () {
        self.currentlyDownloadingAttachment(null);
    });

};

/**
 * Removes the given data file from the attachments.
 * @param {tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile} dataFile The file to remove.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.removeAttachment = function(dataFile) {
    if (this.busy()) {
        return;
    }
	this._attachments.remove(dataFile);
};

/**
 * Called when local files are dragged across the composed mail.
 * @param {tutao.tutanota.ctrl.ComposingMail} data The mail.
 * @param {Event} e The event.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.handleDragOver = function(data, e) {
    if (this.busy()) {
        return;
    }
    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'copy';
};

/**
 * Called when local files are dropped onto the composed mail.
 * @param {tutao.tutanota.ctrl.ComposingMail} data The mail.
 * @param {Event} e The event.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.attachDroppedFiles = function(data, e) {
    var self = this;

    if (this.busy()) {
        return;
    }
    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    var files = tutao.tutanota.util.FileUtils.fileListToArray(e.originalEvent.dataTransfer.files);
    Promise.map(files, tutao.locator.fileFacade.readLocalFile).then(function(files) {
        return self.attachFiles(files);
    });
};

/**
 * Called when the user shall choose a file from the file system.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.attachSelectedFiles = function() {
	var self = this;
	tutao.locator.fileFacade.showFileChooser().then(function(fileList) {
		return self.attachFiles(fileList);
	}).caught(function(error) {
        tutao.tutanota.gui.alert(tutao.lang("couldNotAttachFile_msg"));
        console.log(error);
    });
};

/**
 * Attaches the files to this mail.
 * @param {Array.<tutao.tutanota.util.DataFile|tutao.native.AndroidFile>} fileList The files to attach.
 * @return {Promise} When finished.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.attachFiles = function(fileList) {
	var tooBigFiles = [];
	var self = this;
    var size = 0;
    for (var i=0; i<this._attachments().length; i++) {
        size += Number(this._attachments()[i].getSize());  // cast to number because File.getSize() returns a string
    }
	for (var i = 0; i < fileList.length; i++) {
		if (size + fileList[i].getSize() > tutao.entity.tutanota.TutanotaConstants.MAX_ATTACHMENT_SIZE) {
			tooBigFiles.push(fileList[i].getName());
		} else {
            size += fileList[i].getSize();
            self._attachments.push(fileList[i]);
        }
	}
	if (tooBigFiles.length > 0) {
		return tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("tooBigAttachment_msg") + tooBigFiles.join(", "));
	} else {
        return Promise.resolve();
    }
};

/**
 * Provides the image class that shall be shown in the attachment.
 * @param {tutao.tutanota.util.DataFile|tutao.native.AndroidFile} dataFile The file.
 * @return {String} The name of the image.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.getAttachmentImage = function(dataFile) {
	var busy = (dataFile == this.currentlyDownloadingAttachment());
	return tutao.tutanota.util.FileUtils.getFileTypeImage(dataFile.getName(), busy);
};

/************** implementation of tutao.tutanota.ctrl.bubbleinput.BubbleHandler **************/

/** @inheritDoc */
tutao.tutanota.ctrl.ComposingMail.prototype.getSuggestions = function(text, callback) {
	var MAX_NBR_OF_SUGGESTIONS = 10;

	var self = this;
	text = text.trim().toLowerCase();
	var contactWrappers = tutao.tutanota.ctrl.ComposingMail._getContacts();
	var sugs = [];
	if (text === "") { // do not display any suggestions when nothing has been entered
        callback(sugs);
		return;
	}
	for (var i = 0; i < contactWrappers.length; i++) {
		this._addSuggetionsFromContact(text, MAX_NBR_OF_SUGGESTIONS, sugs, contactWrappers[i]);
		if (sugs.length >= MAX_NBR_OF_SUGGESTIONS){
			break;
		}
	}

	if (sugs.length < MAX_NBR_OF_SUGGESTIONS) {
		tutao.locator.contacts.findRecipients(text, MAX_NBR_OF_SUGGESTIONS, sugs).lastly(function() {
			callback(sugs);
		});
	} else {
		callback(sugs);
	}
};

tutao.tutanota.ctrl.ComposingMail.prototype._addSuggetionsFromContact = function(text, maxNumberOfSuggestions, suggestions, contactWrapper) {
	var contact = contactWrapper.getContact();
	var addAllMailAddresses = (text == "" ||
			tutao.util.StringUtils.startsWith(contact.getFirstName().toLowerCase(), text) ||
			tutao.util.StringUtils.startsWith(contact.getLastName().toLowerCase(), text) ||
			tutao.util.StringUtils.startsWith(contactWrapper.getFullName().toLowerCase(), text));
	for (var a = 0; a < contact.getMailAddresses().length; a++) {
		var mailAddress = contact.getMailAddresses()[a].getAddress().toLowerCase();
		if ((addAllMailAddresses || tutao.util.StringUtils.startsWith(mailAddress, text)) && !this._containsSuggestionForMailAddress(suggestions, mailAddress)) {
			var suggestionText = contactWrapper.getFullName();
            var additionalText = mailAddress;
			suggestions.push(new tutao.tutanota.ctrl.bubbleinput.Suggestion({ contactWrapper: contactWrapper, mailAddress: mailAddress }, suggestionText, additionalText));
			if (suggestions.length >= maxNumberOfSuggestions){
				break;
			}
		}
	}
};

tutao.tutanota.ctrl.ComposingMail.prototype._containsSuggestionForMailAddress = function(suggestions, mailAddress) {
	for( var i=0; i<suggestions.length; i++){
		if(suggestions[i].id.mailAddress == mailAddress){
			return true;
		}
	}
	return false;
};

/** @inheritDoc */
tutao.tutanota.ctrl.ComposingMail.prototype.createBubbleFromSuggestion = function(suggestion) {
	var recipientInfo = new tutao.tutanota.ctrl.RecipientInfo(suggestion.id.mailAddress, suggestion.id.contactWrapper.getFullName(), suggestion.id.contactWrapper);
    recipientInfo.resolveType().caught(tutao.ConnectionError, function(e) {
        // we are offline but we want to show the dialog only when we click on send.
    });
	return this._createBubbleFromRecipientInfo(recipientInfo);
};

/** @inheritDoc */
tutao.tutanota.ctrl.ComposingMail.prototype.createBubblesFromText = function(text) {
    var bubbles = [];
    var separator = (text.indexOf(";") != -1) ? ";" : ",";
    var textParts = text.split(separator);
    for (var i=0; i<textParts.length; i++) {
        var part = textParts[i].trim();
        if (part.length == 0) {
            continue;
        }
        var recipientInfo = this.getRecipientInfoFromText(part);
        if (!recipientInfo) {
            // if one recipient is invalid, we do not return any valid ones because all invalid text would be deleted
            return [];
        }
        recipientInfo.resolveType().caught(tutao.ConnectionError, function(e) {
            // we are offline but we want to show the dialog only when we click on send.
        });
        bubbles.push(this._createBubbleFromRecipientInfo(recipientInfo));
    }
	return bubbles;
};

/**
 * Creates a bubble from a recipient info.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipientInfo.
 * @return {tutao.tutanota.ctrl.bubbleinput.Bubble} The bubble.
 */
tutao.tutanota.ctrl.ComposingMail.prototype._createBubbleFromRecipientInfo = function(recipientInfo) {
    var state = ko.computed(function() {
        if (recipientInfo.getRecipientType() == tutao.tutanota.ctrl.RecipientInfo.TYPE_UNKNOWN) {
            return "unknownRecipient";
        } else if (this.confidentialButtonSecure() || recipientInfo.getRecipientType() == tutao.tutanota.ctrl.RecipientInfo.TYPE_INTERNAL) {
            return "secureRecipient";
        } else {
            return "displayRecipient";
        }
    }, this);
	return new tutao.tutanota.ctrl.bubbleinput.Bubble(recipientInfo, ko.observable(recipientInfo.getDisplayText()), ko.observable(recipientInfo.getMailAddress()), state, true);
};

/**
 * Retrieves a RecipientInfo instance from a text. The text may be a contact name, contact mail address or other mail address.
 * @param {string} text The text to create a RecipientInfo from.
 * @return {?tutao.tutanota.ctrl.RecipientInfo} The recipient info or null if the text is not valid data.
 */
tutao.tutanota.ctrl.ComposingMail.prototype.getRecipientInfoFromText = function(text) {
	text = text.trim();
	if (text == "") {
		return null;
	}
	var nameAndMailAddress = tutao.tutanota.util.Formatter.stringToNameAndMailAddress(text);

	var contactWrappers = tutao.tutanota.ctrl.ComposingMail._getContacts();
	for (var i = 0; i < contactWrappers.length; i++) {
		if (nameAndMailAddress) {
			if (contactWrappers[i].hasMailAddress(nameAndMailAddress.mailAddress)) {
				var name = (nameAndMailAddress.name != "") ? nameAndMailAddress.name : contactWrappers[i].getFullName();
                return new tutao.tutanota.ctrl.RecipientInfo(nameAndMailAddress.mailAddress, name, contactWrappers[i]);
			}
		} else {
			if (contactWrappers[i].getFullName() == text && contactWrappers[i].getContact().getMailAddresses().length == 1) {
                return new tutao.tutanota.ctrl.RecipientInfo(contactWrappers[i].getContact().getMailAddresses()[0].getAddress(), text, contactWrappers[i]);
			}
		}
	}
	if (!nameAndMailAddress) {
		return null;
	} else {
        return new tutao.tutanota.ctrl.RecipientInfo(nameAndMailAddress.mailAddress, nameAndMailAddress.name, null);
	}
};

/**
 * Provides all contacts of the logged in user.
 * @return {Array.<tutao.entity.tutanota.ContactWrapper>} All contacts of the logged in user.
 */
tutao.tutanota.ctrl.ComposingMail._getContacts = function() {
	return tutao.locator.contactListViewModel.getRawContacts();
};

/** @inheritDoc */
tutao.tutanota.ctrl.ComposingMail.prototype.bubbleDeleted = function(bubble) {
	// notify the recipient info to stop editing the contact
	bubble.entity.setDeleted();
};

/** @inheritDoc */
tutao.tutanota.ctrl.ComposingMail.prototype.buttonClick = function() {
	// we do not show a button
};

/** @inheritDoc */
tutao.tutanota.ctrl.ComposingMail.prototype.buttonCss = function() {
	// we do not show a button
	return null;
};


/**
 * Updates the contact informations of all recipients if they have been modified.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} recipients List of recipients.
 * @private
 * @return {Promise} Resolves when all contacts have been updated
 */
tutao.tutanota.ctrl.ComposingMail.prototype._updateContactInfo = function (recipients) {
    return Promise.each(recipients, function(/*tutao.tutanota.ctrl.RecipientInfo*/currentRecipient) {
        // Changes of contact data must be checked before calling EditableContact.update(),
        var contactDataChanged = currentRecipient.hasPasswordChanged() || currentRecipient.hasPhoneNumberChanged();
        currentRecipient.getEditableContact().update();
        if (currentRecipient.isExistingContact()) {
            //only update if phone numbers or passwords have changed
            if ( contactDataChanged ){
                return currentRecipient.getEditableContact().getContact().update();
            }
        } else {
            // external users have no contact list.
            if (tutao.locator.mailBoxController.getUserContactList() != null) {
                return currentRecipient.getEditableContact().getContact().setup(tutao.locator.mailBoxController.getUserContactList().getContacts());
            }
        }
    })
};



