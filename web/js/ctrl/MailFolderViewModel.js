"use strict";

tutao.provide('tutao.tutanota.ctrl.MailFolderViewModel');

/**
 * A mail folder including mails.
 * @param {tutao.entity.tutanota.MailFolder} mailFolder The persistent mailFolder.
 * @param {?tutao.entity.tutanota.MailFolderListViewModel} parentFolder The parent folder. Must be null if this is a system folder.
 * @param {Array.<tutao.entity.tutanota.MailFolderListViewModel>} subFolders The subfolders.
 */
tutao.tutanota.ctrl.MailFolderViewModel = function(mailFolder, parentFolder, subFolders) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._eventTracker = null;
    this._mailFolder = mailFolder;

    this._loadedMails = ko.observableArray();
    this._lastSelectedMails = ko.observableArray();
    this._selectedMails = ko.observableArray();
    this.loading = ko.observable(false);
    this.moreAvailable = ko.observable(true);
    this.parentFolder = ko.observable(parentFolder);
    this.subFolders = ko.observableArray(subFolders);
};

tutao.tutanota.ctrl.MailFolderViewModel.prototype.loadMoreMails = function() {
    var self = this;

    if (this.loading() || !this.moreAvailable()) {
        return Promise.resolve();
    }

    var stepRangeCount = (tutao.tutanota.util.ClientDetector.isMobileDevice()) ? 25 : 200;
    var startId = (this._loadedMails().length > 0) ? this._loadedMails()[this._loadedMails().length - 1].getId()[1] : tutao.rest.EntityRestInterface.GENERATED_MAX_ID;

    this.loading(true);
    return tutao.entity.tutanota.Mail.loadRange(self._mailFolder.getMails(), startId, stepRangeCount, true).then(function(mails) {
        if (mails.length < stepRangeCount) {
            self.moreAvailable(false);
        }

        self._loadedMails.splice.apply(self._loadedMails, [self._loadedMails().length, 0].concat(mails));
        if (self._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
            self._updateNumberOfUnreadMails();
        }
    }).lastly(function() {
        self.loading(false);

        if (!self._eventTracker && tutao.locator.userController.isInternalUserLoggedIn()) {
            self._eventTracker = new tutao.event.PushListEventTracker(tutao.entity.tutanota.Mail, self._mailFolder.getMails(), "Mail");
            self._eventTracker.addObserver(self.updateOnNewMails);
            var highestMailId = (self._loadedMails().length > 0) ? self._loadedMails()[0].getId()[1] : tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            self._eventTracker.observeList(highestMailId);
        }
    });
};

/**
 * This method gets invoked if new mails have been received from the server.
 * @param {Array.<Mail>} mails The mails that are new.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.updateOnNewMails = function(mails) {
    var unread = false;
    for (var i = 0; i < mails.length; i++) {
        // find the correct position for the email in the list
        var found = false;
        for (var a=0; a<this._loadedMails().length; a++) {
            if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(mails[i].getId()[1], this._loadedMails()[a].getId()[1])) {
                this._loadedMails.splice(a, 0, mails[i]);
                found = true;
                break;
            }
        }
        if (!found) {
            this._loadedMails.push(mails[i]);
        }
        if (mails[i].getUnread()) {
            unread = true;
        }
    }
    if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX && unread) {
        tutao.locator.notification.add(tutao.lang("newMails_msg"));
        this._updateNumberOfUnreadMails(); // TODO subscribe on _loadedMails instead
    }
};

tutao.tutanota.ctrl.MailFolderViewModel.prototype._updateNumberOfUnreadMails = function() {
    var unreadMails = 0;
    for (var i=0; i<this._loadedMails().length; i++) {
        if (this._loadedMails()[i].getUnread()) {
            unreadMails++;
        }
    }
    var buttons = tutao.locator.viewManager.getButtons();
    for (i=0; i< buttons.length; i++) {
        if (buttons[i].getId() == "menu_mail" || buttons[i].getId() == "menu_mail_new") {
            buttons[i].setBadgeNumber(unreadMails);
        }
    }
    tutao.locator.notification.updateBadge(unreadMails);
};

/**
 * Selects the given mails.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.selectMail = function(mail) {
    if (mail.getUnread()) {
        mail.setUnread(false);
        mail.update();
        if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
            this._updateNumberOfUnreadMails();
        }
    }
    this._selectedMails([mail]);
    this._lastSelectedMails([mail]);
    tutao.locator.mailViewModel.showMail(mail);
};

/**
 * Selects the last selected mails if any. If there are no last selected mails, all mails are unselected.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.selectPreviouslySelectedMails = function() {
    if (this._lastSelectedMails().length > 0) {
        this._selectedMails(this._lastSelectedMails());
        tutao.locator.mailViewModel.showMail(this._selectedMails()[0]);
    } else {
        this.unselectAllMails();
    }
};

/**
 * Provides the information if a mail is selected.
 * @return {boolean} True if a mail is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.isMailSelected = function() {
    return (this._selectedMails().length != 0);
};

/**
 * Shows the previous mail in the list.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.selectPreviousMail = function() {
    if (!this.isMailSelected()) {
        return;
    }

    for (var i=1; i<this._loadedMails().length; i++) {
        if (this._loadedMails()[i] == this._selectedMails()[0]) {
            this.selectMail(this._loadedMails()[i - 1]);
            break;
        }
    }
};

/**
 * Shows the next mail in the list.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.selectNextMail = function() {
    if (!this.isMailSelected()) {
        return;
    }

    for (var i=0; i<this._loadedMails().length - 1; i++) {
        if (this._loadedMails()[i] == this._selectedMails()[0]) {
            this.selectMail(this._loadedMails()[i + 1]);
            break;
        }
    }
};

/**
 * Returns true if the first mail in the list is selected, false otherwise.
 * @return {bool} True if the last first in the list is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.isFirstMailSelected = function() {
    return this.isMailSelected() && this._loadedMails()[0] == this._selectedMails()[0];
};


/**
 * Returns true if the last mail in the list is selected, false otherwise.
 * @return {bool} True if the last mail in the list is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.isLastMailSelected = function() {
    return this.isMailSelected() && this._loadedMails()[this._loadedMails().length - 1] == this._selectedMails()[0];
};

tutao.tutanota.ctrl.MailFolderViewModel.prototype.getSelectedMailIndex = function() {
    if (!this.isMailSelected()) {
        return 0;
    }

    for (var i=0; i<this._loadedMails().length; i++) {
        if (this._loadedMails()[i] == this._selectedMails()[0]) {
            return i;
        }
    }

    return 0;
};

tutao.tutanota.ctrl.MailFolderViewModel.prototype.getLoadedMails = function() {
    return this._loadedMails();
};

/**
 * Called when the folder was selected to show its mails.
 * @return {Promise} When finished.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.selected = function() {
    if (this._loadedMails().length == 0) {
        tutao.locator.mailViewModel.hideMail();
        return this.loadMoreMails();
    } else {
        if (this._selectedMails().length > 0) {
            tutao.locator.mailViewModel.showMail(this._selectedMails()[0]);
        } else {
            this.selectPreviouslySelectedMails();
        }
        return Promise.resolve();
    }
};

/**
 * Provides the information if the given mail is selected.
 * @param {tutao.entity.tutanota.Mail} mail The mail to check
 * @return {bool} True if the mail is selected, false otherwise.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.isSelectedMail = function(mail) {
    return this._selectedMails.indexOf(mail) >= 0;
};

/**
 * Unselects all mails.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.unselectAllMails = function() {
    tutao.locator.mailViewModel.hideMail();
    this._selectedMails([]);
    // do not clear _lastSelectedMails here
};

/**
 * Deltes all the given mails. Updates the mail list view accordingly.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to delete finally.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.finallyDeleteMails = function(mails) {
    var self = this;
    var service = new tutao.entity.tutanota.DeleteMailData();
    for (var i=0; i<mails.length; i++) {
        service.getMails().push(mails[i].getId());
    }
    return service.erase({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(deleteMailReturn) {
        for (var i=0; i<mails.length; i++) {
            self.removeMail(mails[i]);
        }
    });
};

/**
 * Removes the given mail from the list and hides it if it is visible in the mail view.
 * @param {tutao.entity.tutanota.Mail} mail The mail to remove.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.removeMail = function(mail) {
    if (this.isSelectedMail(mail)) {
        this._selectedMails.remove(mail);
        tutao.locator.mailViewModel.hideMail();
    }
    this._lastSelectedMails.remove(mail);
    this._loadedMails.remove(mail);
    if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
        this._updateNumberOfUnreadMails();
    }
};

/**
 * Provides the folder type of this folder.
 * @return {string} One of tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_*.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getFolderType = function() {
    return this._mailFolder.getFolderType();
};

/**
 * Provides the mail list id of this folder.
 * @return {string} The list id.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getMailListId = function() {
    return this._mailFolder.getMails();
};

/**
 * Provides the mail folder id.
 * @return {Array.<string, string>} The mail folder id.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getMailFolderId = function() {
    return this._mailFolder.getId();
};

/**
 * Provides the name of the given folder.
 * @return {string} The name of the folder.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getName = function() {
    if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM) {
        return this._mailFolder.getName();
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
        return  tutao.lang("received_action");
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT) {
        return  tutao.lang("sent_action");
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH) {
        return  tutao.lang("trash_action");
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE) {
        return  tutao.lang("archive_action");
    }
    throw new Error("No text id for tag");
};

/**
 * Provides the tooltip for the given folder.
 * @return {string} The tooltip for the folder.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getTooltipTextId = function() {
    if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
        return  "receivedMails_alt";
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT) {
        return  "sentMails_alt";
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH) {
        return  "trashedMails_alt";
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE) {
        return  "archivedMails_alt";
    } else {
        return null;
    }
};

/**
 * Provides the icon id for the given folder.
 * @return {string} The icon id for the folder.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getIconId = function() {
    if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
        return  "inbox";
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT) {
        return  "send";
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH) {
        return  "trash";
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE) {
        return  "file";
    } else {
        return null;
    }
};
