//"use strict";

tutao.provide('tutao.tutanota.ctrl.MailListViewModel');

/**
 * The list of mail headers on the left.
 * The context of all methods is re-bound to this for allowing the ViewModel to be called from event Handlers that might get executed in a different context.
 * @constructor
  */
tutao.tutanota.ctrl.MailListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	// the mail id (Array.<string>) of the email that shall be shown when init() is called
	this.mailToShow = null;

    this.buttonBarViewModel = null;

    this._deleting = ko.observable(false);
    this.switchingFolders = ko.observable(true);

    this.showSpinner = ko.computed(function () {
        return this._deleting() || this.switchingFolders();
    }, this);

    this._mobileMultiSelectActive = ko.observable(false);
};


/**
 * Creates the buttons
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.init = function() {
    var self = this;
    this.buttons = [
        new tutao.tutanota.ctrl.Button(null, tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, function () {
            self.disableMobileMultiSelect();
        }, function() {
            return self._mobileMultiSelectActive() && tutao.tutanota.util.ClientDetector.isMobileDevice();
        }, false, "stopMultiSelection", "cancelMultiSelect"),
        new tutao.tutanota.ctrl.Button(null, tutao.tutanota.ctrl.Button.ALWAYS_VISIBLE_PRIO, function () {
            self._mobileMultiSelectActive(true);
        }, function() {
            // run through the mails existing check in any case to update the knockout binding
            var mailsExisting = tutao.locator.mailFolderListViewModel.selectedFolder().getLoadedMails().length > 0;
            return mailsExisting && !self.showSpinner() && !self._mobileMultiSelectActive() && tutao.tutanota.util.ClientDetector.isMobileDevice();
        }, false, "startMultiSelection", "multiSelect"),
        new tutao.tutanota.ctrl.Button("move_action", 9, function() {}, function() {
            return (tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMails().length > 0) && !self.showSpinner() && !tutao.locator.mailView.isConversationColumnVisible();
        }, false, "moveAction", "moveToFolder", null, null, null, function() {
            var buttons = [];
            tutao.tutanota.ctrl.DisplayedMail.createMoveTargetFolderButtons(buttons, tutao.locator.mailFolderListViewModel.getMailFolders(), tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMails());
            return buttons;
        }),
        new tutao.tutanota.ctrl.Button("delete_action", 8, this.deleteSelectedMails, function() {
            return (tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMails().length > 0) && !self.showSpinner() && !tutao.locator.mailView.isConversationColumnVisible() && !tutao.tutanota.util.ClientDetector.isMobileDevice();
        }, false, "trashMultipleAction", "trash"),
        new tutao.tutanota.ctrl.Button("deleteTrash_action", 10, this._deleteFinally, this._isDeleteAllButtonVisible, false, "deleteTrashAction", "trash"),
        new tutao.tutanota.ctrl.Button("newMail_action", 10, tutao.locator.navigator.newMail, function() {
            return tutao.locator.userController.isInternalUserLoggedIn() && !tutao.locator.mailView.isConversationColumnVisible();
        }, false, "newMailAction", "mail-new")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
    tutao.locator.mailView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST, function (width) {
        // we reduce the max width by 10 px which are used in our css for paddings + borders
        self.buttonBarViewModel.setButtonBarWidth(width - 6);
    });
};

tutao.tutanota.ctrl.MailListViewModel.prototype.disableMobileMultiSelect = function() {
    if (this._mobileMultiSelectActive()) {
        this._mobileMultiSelectActive(false);
        if (tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMails().length > 1) {
            tutao.locator.mailFolderListViewModel.selectedFolder().unselectAllMails(false);
        }
    }
};

/**
 * Initialize the MailListViewModel:
 * <ul>
 *   <li>Selects the inbox.
 *   <li>Loads the initial mails.
 *   <li>Displays the first mail.
 * </ul>
 * @return {Promise} When loading is finished.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.loadInitial = function() {
    var self = this;
    var folder = tutao.locator.mailFolderListViewModel.selectedFolder();
    return folder.selected().then(function() { // this also loads the initial mails
        self.switchingFolders(false);
        if (tutao.locator.userController.isExternalUserLoggedIn()) {
            if (self.mailToShow) {
                return tutao.entity.tutanota.Mail.load(self.mailToShow).then(function (mail) {
                    return folder.selectMail(mail, false);
                });
            } else {
                if (folder.getLoadedMails().length > 0) {
                    return folder.selectMail(folder.getLoadedMails()[0], false);
                } else {
                    return Promise.resolve();
                }
            }
        }
    });
};

tutao.tutanota.ctrl.MailListViewModel.prototype.deleteSelectedMails = function() {
    var folder = tutao.locator.mailFolderListViewModel.selectedFolder();

    if (folder.loading()) {
        return Promise.resolve();
    }
    var self = this;
    self._deleting(true);
    var promise = null;
    var mailsToDelete = tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMails();
    if (folder.isTrashFolder() || folder.isSpamFolder()) {
        promise = folder.finallyDeleteMails(mailsToDelete);
    } else {
        // move content to trash
        promise = folder.move(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH), mailsToDelete);
    }
    return promise.lastly(function() {
        self.disableMobileMultiSelect();
        self._deleting(false);
    });
};

/**
 * Provides the string to show in the mail list of the given mail for the sender/recipient field.
 * @param {tutao.entity.tutanota.Mail} mail The mail.
 * @return {string} The string.
 */
tutao.tutanota.ctrl.MailListViewModel.getListSenderOrRecipientString = function(mail) {
	var label = null;
	if (mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_SENT) {
		var allRecipients = mail.getToRecipients().concat(mail.getCcRecipients()).concat(mail.getBccRecipients());
		if (tutao.util.ArrayUtils.contains(tutao.locator.userController.getMailAddresses(), allRecipients[0].getAddress())) {
			label = tutao.locator.languageViewModel.get("meNominative_label");
		} else if (allRecipients[0].getName() != "") {
			label = allRecipients[0].getName();
		} else {
			label = allRecipients[0].getAddress();
		}
		if (allRecipients.length > 1) {
			label += ", ...";
		}
	} else if (mail.getState() == tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED) {
		if (tutao.util.ArrayUtils.contains(tutao.locator.userController.getMailAddresses(), mail.getSender().getAddress())) {
			label = tutao.locator.languageViewModel.get("meNominative_label");
		} else if (mail.getSender().getName() != "") {
			label = mail.getSender().getName();
		} else {
			label = mail.getSender().getAddress();
		}
	}
	return label;
};

tutao.tutanota.ctrl.MailListViewModel.prototype._isDeleteAllButtonVisible = function() {
    return !this.showSpinner() && (tutao.locator.mailFolderListViewModel.selectedFolder().isTrashFolder() || tutao.locator.mailFolderListViewModel.selectedFolder().isSpamFolder()) && this.getMails().length > 0;
};

tutao.tutanota.ctrl.MailListViewModel.prototype.getMails = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().getLoadedMails();
};

/**
 * Shows the given mail in the mail view and switches to the conversation column if the mail was shown.
 * @param mail The mail to show.
 * @return {Promise} When the mail is selected or selection was cancelled.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.mailClicked = function(mail) {
    var self = this;
    return tutao.locator.mailViewModel.tryCancelAllComposingMails(false).then(function(allCancelled) {
        if (allCancelled) {
            tutao.locator.mailFolderListViewModel.selectedFolder().mailClicked(mail, self._mobileMultiSelectActive());
        }
        return Promise.resolve();
    });
};

tutao.tutanota.ctrl.MailListViewModel.prototype.isSelectedMail = function(mail) {
    return tutao.locator.mailFolderListViewModel.selectedFolder().isSelectedMail(mail);
};

tutao.tutanota.ctrl.MailListViewModel.prototype.getSelectedMailIndex = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMailIndex();
};

/**
 * Returns true if the last mail in the list is selected, false otherwise.
 * @return {bool} True if the last mail in the list is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.isLastMailSelected = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().isLastMailSelected();
};


/**
 * Returns true if the first mail in the list is selected, false otherwise.
 * @return {bool} True if the last first in the list is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.isFirstMailSelected = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().isFirstMailSelected();
};

/**
 * Shows the previous mail in the list.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectPreviousMail = function() {
    tutao.locator.mailFolderListViewModel.selectedFolder().selectPreviousMail();
    this.disableMobileMultiSelect();
};

/**
 * Shows the next mail in the list.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectNextMail = function() {
    tutao.locator.mailFolderListViewModel.selectedFolder().selectNextMail();
    this.disableMobileMultiSelect();
};

/**
 * Executes the delete trash functionality.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._deleteFinally = function() {
    var folder = tutao.locator.mailFolderListViewModel.selectedFolder();

    if (folder.loading() || (!folder.isTrashFolder() && !folder.isSpamFolder())) {
        return Promise.resolve();
    }
    var self = this;
    return tutao.tutanota.gui.confirm(tutao.lang('confirmDeleteTrash_msg')).then(function(ok) {
        if (ok) {
            self._deleting(true);
            // we want to delete all mails in the trash, not only the visible ones, so load them now. load reverse to avoid caching errors
            return tutao.rest.EntityRestInterface.loadAllReverse(tutao.entity.tutanota.Mail, folder.getMailListId()).then(function(allMails) {
                return folder.finallyDeleteMails(allMails);
            }).lastly(function() {
                self._deleting(false);
                tutao.locator.mailListViewModel.disableMobileMultiSelect();
            });
        }
    });
};


/**
 * Handles the swipe gesture on the given element.
 * @param {tutao.entity.tutanota.Mail} mail The mail on which the swipe gesture has been recognized.
 * @param {boolean} swipeLeft True if the swipe left gesture has been executed, False on swipe right.
 * @returns {*}
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.handleSwipeOnElement = function(mail, swipeLeft) {
    var folder = tutao.locator.mailFolderListViewModel.selectedFolder();
    var mails = [mail];
    if (swipeLeft) {
        if (folder.isTrashFolder() || folder.isSpamFolder()) {
            // remove the mail directly to avoid delay
            folder.removeMails([mail]);
            return folder.finallyDeleteMails(mails);
        } else {
            // remove the mail directly to avoid delay
            folder.removeMails([mail]);
            // move content to trash
            return folder.move(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH), mails);
        }
    } else if (this.isSwipeRightPosssible()) {
        // remove the mail directly to avoid delay
        folder.removeMails([mail]);
        return folder.move(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE), mails);
    }
};


tutao.tutanota.ctrl.MailListViewModel.prototype.isSwipeRightPosssible = function() {
    return !tutao.locator.mailFolderListViewModel.selectedFolder().isArchiveFolder();
};

tutao.tutanota.ctrl.MailListViewModel.prototype.getSwipeRightLabel = function() {
    return { iconId: "file", textId: "archive_action" };
};

tutao.tutanota.ctrl.MailListViewModel.prototype.getSwipeLeftLabel = function() {
    var folder = tutao.locator.mailFolderListViewModel.selectedFolder();
    if (folder.isTrashFolder() || folder.isSpamFolder()) {
        return { iconId: "trash", textId: "finalDelete_action" };
    } else {
        return { iconId: "trash", textId: "trash_action" };
    }
};

tutao.tutanota.ctrl.MailListViewModel.prototype.updateMailEntry = function(mail) {
    var mailObservableArray = tutao.locator.mailFolderListViewModel.selectedFolder()._loadedMails;
    var index = mailObservableArray.indexOf(mail);
    if (index != -1) {
        mailObservableArray.splice(index, 1);
        mailObservableArray.splice(index, 0, mail);
    }
};


