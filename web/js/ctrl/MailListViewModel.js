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

    this.deleting = ko.observable(false);

    this.showSpinner = ko.computed(function () {
        return this.deleting();
    }, this);
};


/**
 * Creates the buttons
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.init = function() {
    this.buttons = [
        new tutao.tutanota.ctrl.Button("deleteTrash_action", 10, this._deleteTrash, this.isDeleteTrashButtonVisible, false, "deleteTrashAction", "trash"),
        new tutao.tutanota.ctrl.Button("newMail_action", 10, tutao.locator.navigator.newMail, function() {
            return tutao.locator.userController.isInternalUserLoggedIn() && !tutao.locator.mailView.isConversationColumnVisible();
        }, false, "newMailAction", "mail-new")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
    var self = this;
    tutao.locator.mailView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.MailView.COLUMN_MAIL_LIST, function (width) {
        // we reduce the max width by 10 px which are used in our css for paddings + borders
        self.buttonBarViewModel.setButtonBarWidth(width - 6);
    });
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
    var folder = tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX);
    return tutao.locator.mailFolderListViewModel.selectFolder(folder).then(function() { // this also loads the initial mails
        if (tutao.locator.userController.isExternalUserLoggedIn()) {
            if (self.mailToShow) {
                return tutao.entity.tutanota.Mail.load(self.mailToShow).then(function (mail) {
                    return folder.selectMail(mail);
                });
            } else {
                if (folder.getLoadedMails().length > 0) {
                    return folder.selectMail(folder.getLoadedMails()[0]);
                } else {
                    return Promise.resolve();
                }
            }
        }
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
		if (allRecipients[0].getAddress() == tutao.locator.userController.getMailAddress()) {
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
		if (mail.getSender().getAddress() == tutao.locator.userController.getMailAddress()) {
			label = tutao.locator.languageViewModel.get("meNominative_label");
		} else if (mail.getSender().getName() != "") {
			label = mail.getSender().getName();
		} else {
			label = mail.getSender().getAddress();
		}
	}
	return label;
};

tutao.tutanota.ctrl.MailListViewModel.prototype.isDeleteTrashButtonVisible = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH && this.getMails().length > 0;
};

tutao.tutanota.ctrl.MailListViewModel.prototype.getMails = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().getLoadedMails();
};

/**
 * Shows the given mail in the mail view but does not switch to the conversation column.
 * @param mail The mail to show.
 * @return {Promise} When the mail is selected or selection was cancelled.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectMail = function(mail) {
	return this._selectMail(mail, true);
};

tutao.tutanota.ctrl.MailListViewModel.prototype.isSelectedMail = function(mail) {
    return tutao.locator.mailFolderListViewModel.selectedFolder().isSelectedMail(mail);
};

tutao.tutanota.ctrl.MailListViewModel.prototype.getSelectedMailIndex = function() {
    return tutao.locator.mailFolderListViewModel.selectedFolder().getSelectedMailIndex();
};

/**
 * Selects the given mail and shows it in the conversation column. Switches to the conversation column depending on the switchToConversationColumn param.
 * @param {tutao.entity.tutanota.Mail} mail Mail to select.
 * @param {boolean} tryCancelComposingMails True if all existing composing mails should be canceled
 * @return {Promise} When the mail is selected or selection was cancelled.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._selectMail = function(mail, tryCancelComposingMails) {
    var self = this;
    var promise = null;
    if (tryCancelComposingMails) {
        promise = tutao.locator.mailViewModel.tryCancelAllComposingMails(false);
    } else {
        promise = Promise.resolve(true);
    }
    return promise.then(function(allCancelled) {
        if (allCancelled) {
            tutao.locator.mailFolderListViewModel.selectedFolder().selectMail(mail);
            tutao.locator.mailView.showConversationColumn(function() {});
        }
        return Promise.resolve();
    });
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
};

/**
 * Shows the next mail in the list.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype.selectNextMail = function() {
    tutao.locator.mailFolderListViewModel.selectedFolder().selectNextMail();
};

/**
 * Executes the delete trash functionality.
 */
tutao.tutanota.ctrl.MailListViewModel.prototype._deleteTrash = function() {
    var trashFolder = tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH);

    if (trashFolder.loading()) {
        return Promise.resolve();
    }
	// TODO subfolders

    var self = this;
    tutao.tutanota.gui.confirm(tutao.lang('confirmDeleteTrash_msg')).then(function(ok) {
        if (ok) {
            self.deleting(true);
            // we want to delete all mails in the trash, not only the visible ones, so load them now. load reverse to avoid caching errors
            return tutao.rest.EntityRestInterface.loadAllReverse(tutao.entity.tutanota.Mail, trashFolder.getMailListId()).then(function(allMails) {
                return trashFolder.finallyDeleteMails(allMails);
            }).lastly(function() {
                self.deleting(false);
            });
        }
    });
};
