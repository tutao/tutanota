"use strict";

tutao.provide('tutao.tutanota.ctrl.DisplayedMail');

/**
 * This class represents a mail that is currently displayed.
 * @param {tutao.entity.tutanota.Mail} mail The mail.
 * @constructor
 */
tutao.tutanota.ctrl.DisplayedMail = function (mail) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.mail = mail;

    this.bodyText = ko.observable(""); // contains the sanitized body
    this.bodyTextWithoutQuotation = ko.observable("");
    this.bodyTextQuotation = ko.observable("");
    this.bodyTextQuotationVisible = ko.observable(false);

    this.attachments = ko.observableArray(); // contains Files
    this.currentlyDownloadingAttachment = ko.observable(null); // null or a File

    var self = this;
    var isExternalAnswerPossible = function () {
        return tutao.locator.userController.isExternalUserLoggedIn() && self.mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED && tutao.tutanota.util.ClientDetector.getSupportedType() != tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE && tutao.tutanota.util.ClientDetector.getSupportedType() != tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_ANDROID;
    };
    var isExternalExportPossible = function () {
        // legacy_ie does not support internally used arraybuffers, legacy_safari does not support download, legacy_android does not support download.
        // we deactivate export for mobile browsers generally because it is useless
        return tutao.tutanota.util.ClientDetector.isSupported() && !tutao.tutanota.util.ClientDetector.isMobileDevice() && tutao.locator.userController.isExternalUserLoggedIn();
    };
    var isInternalUserLoggedIn = function() {
        return tutao.locator.userController.isInternalUserLoggedIn();
    };
    var showReplyAll = function () {
        return tutao.locator.userController.isInternalUserLoggedIn() && self.mail.getToRecipients().length + self.mail.getCcRecipients().length + self.mail.getBccRecipients().length > 1;
    };
    var trashed = function () {
        return self.mail.getTrashed();
    };
    var untrashed = function () {
        return !self.mail.getTrashed();
    };
    var trashText = self.mail.getTrashed() ? "undelete_action" : "delete_action";
    // special
    this.buttons = [];
    this.buttons.push(new tutao.tutanota.ctrl.Button(null, tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, tutao.locator.mailListViewModel.selectPreviousMail, tutao.tutanota.util.ClientDetector.isMobileDevice, false, "selectPreviousMailAction", "upIndicator", null, null, tutao.locator.mailListViewModel.isFirstMailSelected));
    this.buttons.push(new tutao.tutanota.ctrl.Button(null, tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, tutao.locator.mailListViewModel.selectNextMail, tutao.tutanota.util.ClientDetector.isMobileDevice, false, "selectNextMailAction", "downIndicator", null, null, tutao.locator.mailListViewModel.isLastMailSelected));

    // external
    this.buttons.push(new tutao.tutanota.ctrl.Button("replyConfidential_action", 10, function () {
        tutao.locator.mailViewModel.replyMail(self);
    }, isExternalAnswerPossible, false, "replyConfidentialAction", "reply"));

    this.buttons.push(new tutao.tutanota.ctrl.Button("export_action", 7, function () {
        tutao.locator.mailViewModel.exportMail(self);
    }, isExternalExportPossible, false, "exportAction", "download"));

    // internal
    var replyButtons = [
        new tutao.tutanota.ctrl.Button("reply_action", 10, function () {
            tutao.locator.mailViewModel.replyMail(self);
        }, isInternalUserLoggedIn, false, "replyAction", "reply"),

        new tutao.tutanota.ctrl.Button("replyAll_action", 7, function () {
            tutao.locator.mailViewModel.replyAllMail(self);
        }, showReplyAll, false, "replayAllAction", "reply-all"),

        new tutao.tutanota.ctrl.Button("forward_action", 6, function () {
            tutao.locator.mailViewModel.forwardMail(self);
        }, isInternalUserLoggedIn, false, "forwardAction", "forward")
    ];
    if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
        this.buttons.push(new tutao.tutanota.ctrl.Button("reply_action", 10, function () {}, isInternalUserLoggedIn, false, "replyAction", "reply", null, null, null, function() { return replyButtons; }));
    } else {
        for (var i=0; i<replyButtons.length; i++) {
            this.buttons.push(replyButtons[i]);
        }
    }

    this.buttons.push(new tutao.tutanota.ctrl.Button("move_action", 6, function () {}, null, false, "moveAction", "moveToFolder", null, null, null, function() {
        var buttons = [];
        self._createMoveTargetFolderButtons(buttons, tutao.locator.mailFolderListViewModel.getMailFolders());
        return buttons;
    }));

        this.buttons.push(new tutao.tutanota.ctrl.Button("finalDelete_action", 8, function () {
        tutao.locator.mailViewModel.finallyDeleteMail(self);
    }, trashed, false, "finalDeleteMailAction", "trash"));

    // internal
    this.buttons.push(new tutao.tutanota.ctrl.Button("newMail_action", 11, tutao.locator.navigator.newMail, isInternalUserLoggedIn, false, "newMailAction", "mail-new"));

    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
};

/**
 * Create buttons for moving a mail to the given folders, including subfolders. If moving an email to one of the folders does not make sense, no button is created for that folder.
 * @param {Array.<tutao.tutanota.ctrl.Button>} buttons The buttons are added to this list.
 * @param {Array.<tutao.tutanota.ctrl.MailFolderViewModel>} folders The folders to add.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype._createMoveTargetFolderButtons = function(buttons, folders) {
    var self = this;
    for (var i=0; i<folders.length; i++) {
        // do not allow moving sent mails to the inbox folder or received mails to the sent folder and their sub-folders
        if ((this.mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_SENT && folders[i].getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) ||
            (this.mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED && folders[i].getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT)) {
            continue;
        }
        // skip the current folder of the mail, but allow sub-folders
        if (folders[i] != tutao.locator.mailFolderListViewModel.selectedFolder()) {
            (function () { // closure to avoid access to mutable variable i
                var folder = folders[i];
                buttons.push(new tutao.tutanota.ctrl.Button("@" + folder.getName(), i, function () {
                    tutao.locator.mailFolderListViewModel.move(folder, self.mail);
                }, null, false, "moveAction" + folder.getName(), folder.getIconId()));
            })();
        }
        // add sub-folders
        self._createMoveTargetFolderButtons(buttons, folders[i].subFolders());
    }
};

tutao.tutanota.ctrl.DisplayedMail.prototype.load = function () {
    var self = this;
    return this._loadBody().then(function(){
        // We do not wait for attachment download
        self._loadAttachments();
    });
};


tutao.tutanota.ctrl.DisplayedMail.prototype.toggleQuotationVisible = function () {
    this.bodyTextQuotationVisible(!this.bodyTextQuotationVisible());
};

/**
 * Loads the mail body.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype._loadBody = function () {
    var self = this;
    return self.mail.loadBody().then(function (body) {
        var text = tutao.locator.htmlSanitizer.sanitize(body.getText());
        text = tutao.tutanota.util.Formatter.urlify(text);
        self.bodyText(text);
        var split = tutao.locator.mailView.splitMailTextQuotation(self.bodyText());
        self.bodyTextWithoutQuotation(split.text);
        self.bodyTextQuotation(split.quotation);
		// use setTimeout here to make sure the gui is updated
        setTimeout(function() {
            tutao.locator.mailView.addSubmitCheckToMailBody();
        }, 0);
/*        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve();
            }, 1000);
        });
*/
    }).caught(function(e) {
        self.bodyText("error while loading");
        throw e;
    });
};

/**
 * Loads the attached files.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype._loadAttachments = function () {
    var self = this;
    //TODO (timely) implement loading of multiple LET instances
    for (var i = 0; i < this.mail.getAttachments().length; i++) {
        tutao.entity.tutanota.File.load(this.mail.getAttachments()[i]).then(function (file, exception) {
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
tutao.tutanota.ctrl.DisplayedMail.prototype.downloadAttachment = function (file) {
    // do not allow a new download as long as another is running
    if (this.currentlyDownloadingAttachment()) {
        return;
    }
	if (tutao.env.mode == tutao.Mode.App && cordova.platformId == 'ios' && file.getSize() > (7*1024*1024) ) {
		tutao.tutanota.gui.alert(tutao.lang("downloadAttachmentNotPossible_msg"));
	} else {
	    var self = this;
		this.currentlyDownloadingAttachment(file);
		tutao.locator.fileFacade.readFileData(file).then(function (dataFile) {
			return tutao.locator.fileFacade.open(dataFile);
		}).lastly(function (e) {
			self.currentlyDownloadingAttachment(null);
		});
	}
};

/**
 * Offers the user to download all attachments of this mail.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype.downloadAllAttachments = function () {
    return Promise.map(this.attachments(), function (file) {
        return tutao.locator.fileFacade.readFileData(file).then(function (dataFile) {
            return tutao.locator.fileFacade.open(dataFile);
        });
    });
};

/**
 * Provides the image class that shall be shown in the attachment.
 * @param {tutao.entity.tutanota.File} file The file.
 * @return {String} The name of the image.
 */
tutao.tutanota.ctrl.DisplayedMail.prototype.getAttachmentImage = function (file) {
    var busy = (file == this.currentlyDownloadingAttachment());
    return tutao.tutanota.util.FileUtils.getFileTypeImage(file.getName(), busy);
};
