"use strict";

tutao.provide('tutao.tutanota.ctrl.MailFolderViewModel');

/**
 * A mail folder including mails.
 * @param {tutao.entity.tutanota.MailFolder} mailFolder The persistent mailFolder.
 * @param {?tutao.tutanota.ctrl.MailFolderViewModel} parentFolder The parent folder. Must be null if this is a system folder.
 */
tutao.tutanota.ctrl.MailFolderViewModel = function(mailFolder, parentFolder) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._eventTracker = null;
    this._mailFolder = mailFolder;
    this._mailFolderName = ko.observable("");
    this._loadedMails = ko.observableArray();
    this._lastSelectedMails = ko.observableArray();
    this._selectedMails = ko.observableArray();
    this.loading = ko.observable(false);
    this.moreAvailable = ko.observable(true);
    this.parentFolder = ko.observable(parentFolder);
    this.subFolders = ko.observableArray([]);

    this._loadedMails.subscribe(function(){
        this._updateNumberOfUnreadMails();
    }, this);
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
    }
};

/**
 * Notifies the MailFolderListViewModel to update the total number of unread mails.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype._updateNumberOfUnreadMails = function() {
    if (this.isInboxFolder()){
        tutao.locator.mailFolderListViewModel.updateNumberOfUnreadMails();
    }
};


/**
 * Returns the number of all loaded unread mails for this folder including all subfolder.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getNumberOfUnreadMails = function() {
    var unreadMails = 0;
    for (var i=0; i<this._loadedMails().length; i++) {
        if (this._loadedMails()[i].getUnread()) {
            unreadMails++;
        }
    }
    var currentSubFolders = this.subFolders();
    for(var j=0; j<currentSubFolders.length;j++){
        unreadMails = unreadMails + currentSubFolders[j].getNumberOfUnreadMails();
    }
    return unreadMails;
};



/**
 * Selects the given mails.
 * @return Promise
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.selectMail = function(mail) {
    var self = this;
    if (mail.getUnread()) {
        mail.setUnread(false);
        mail.update().caught(tutao.NotFoundError, function(e) {
            // avoid exception for missing sync
            self.removeMails([mail]);
        });
        this._updateNumberOfUnreadMails();
    }
    this._selectedMails([mail]);
    this._lastSelectedMails([mail]);
    return tutao.locator.mailViewModel.showMail(mail);
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
        self.removeMails(mails);
    });
};

/**
 * Removes the given mails from the list and hides it if it is visible in the mail view. Selects the next mail in the list, if any.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to remove.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.removeMails = function(mails) {
    var selectedMailIndex = -1;
    for (var i=0; i<mails.length; i++) {
        if (this.isSelectedMail(mails[i])) {
            selectedMailIndex = this.getSelectedMailIndex();
            this._selectedMails.remove(mails[i]);
            tutao.locator.mailViewModel.hideMail();
        }
        this._lastSelectedMails.remove(mails[i]);
        this._loadedMails.remove(mails[i]);
    }

    // select the next mail
    if (selectedMailIndex != -1) {
        selectedMailIndex = Math.min(selectedMailIndex, this._loadedMails().length - 1);
    }
    if (selectedMailIndex != -1) {
        this.selectMail(this._loadedMails()[selectedMailIndex]);
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
tutao.tutanota.ctrl.MailFolderViewModel.prototype._getMailFolderId = function() {
    return this._mailFolder.getId();
};

/**
 * Provides the sub folder list id of this folder.
 * @return {string} The list id.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype._getSubFolderListId = function() {
    return this._mailFolder.getSubFolders();
};


/**
 * Provides the name of the given folder.
 * @return {string} The name of the folder.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getName = function() {
    if ( this._mailFolderName() == ""){
        this._updateName();
    }
    return this._mailFolderName();
};

/**
 * Provides the name of the given folder.
 * @return {string} The name of the folder.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype._updateName = function() {
    if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM) {
        this._mailFolderName(this._mailFolder.getName());
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX) {
        this._mailFolderName(tutao.lang("received_action"));
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_SENT) {
        this._mailFolderName(tutao.lang("sent_action"));
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH) {
        this._mailFolderName(tutao.lang("trash_action"));
    } else if (this._mailFolder.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE) {
        this._mailFolderName(tutao.lang("archive_action"));
    }else{
        throw new Error("No text id for tag");
    }
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
        return "folder";
    }
};


/**
 * Provides the folder names of all sub-folders of this folder.
 * @returns {Array.<string>} The folder names.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.getSubFolderNames = function() {
    var folders = this.subFolders();
    var folderNames = [];
    for (var i=0; i<folders.length; i++) {
        folderNames.push(folders[i].getName());
    }
    return folderNames;
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.createSubFolder = function() {
    var self = this;
    tutao.locator.folderNameDialogViewModel.showDialog("folderNameCreate_label", "", self.getSubFolderNames()).then(function(folderName) {
        if (folderName) {
            tutao.entity.EntityHelper.getListKey(self._getSubFolderListId()).then(function(subFolderListKey) {
                var createService = new tutao.entity.tutanota.CreateMailFolderData();
                createService.setFolderName(folderName);
                createService.setParentFolder(self._getMailFolderId());
                createService.setListEncSessionKey(tutao.locator.aesCrypter.encryptKey(subFolderListKey, createService.getEntityHelper().getSessionKey()));
                createService.setup({}, null).then(function(newFolderReturn){
                    self._loadSubFolder(newFolderReturn.getNewFolder());
                });
            });
        }
    });
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.loadSubFolders = function() {
    var self = this;
    return tutao.rest.EntityRestInterface.loadAll(tutao.entity.tutanota.MailFolder, self._getSubFolderListId(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(loadedSubFolders) {
        return Promise.map(loadedSubFolders, function(loadedSubFolder) {
            return new tutao.tutanota.ctrl.MailFolderViewModel(loadedSubFolder, self);
        }).then(function(createdSubFolders) {
            // sort the custom folders by name
            createdSubFolders.sort(tutao.tutanota.ctrl.MailFolderViewModel._compareFolders);
            self.subFolders(createdSubFolders);
        });
    });
};

tutao.tutanota.ctrl.MailFolderViewModel.prototype._loadSubFolder = function(subFolderId) {
    var self = this;
    return tutao.entity.tutanota.MailFolder.load(subFolderId).then(function(subFolder) {
        var newSubFolder = new tutao.tutanota.ctrl.MailFolderViewModel(subFolder, self);
        self.subFolders.push(newSubFolder);
        self.sortFolderNames();
    });
};


/**
 * Deletes the given subfolder.
 * @param {tutao.tutanota.ctrl.MailFolderViewModel} subFolder The subfolder.
 * @returns {Promise} When finished.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype._removeSubFolder = function(subFolder) {
    var self = this;
    var deleteService = new tutao.entity.tutanota.DeleteMailFolderData;
    deleteService.getFolders().push(subFolder._getMailFolderId());
    return deleteService.erase({}, null).then(function(){
        self.subFolders.remove(subFolder);
    });
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.rename = function() {
    var self = this;
    tutao.locator.folderNameDialogViewModel.showDialog("folderNameRename_label", self.getName(), self.parentFolder().getSubFolderNames()).then(function(newName) {
        if (newName) {
            self._mailFolder.setName(newName);
            self._mailFolder.update().then(function(){
                self._updateName();
                if (self.parentFolder()){
                    self.parentFolder().sortFolderNames();
                }
            });
        }
    });
};


/**
 * Moves a list of mails from  this folder to the given target folder.
 * @param {tutao.tutanota.ctrl.MailFolderViewModel} targetMailFolder The target folder.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to move.
 * @return {Promise} When finished.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.move = function(targetMailFolder, mails) {
    var sourceFolder = this;
    if (sourceFolder.getMailListId() == targetMailFolder.getMailListId()) {
        // source and target folder are the same
        return Promise.resolve();
    }

    var data = new tutao.entity.tutanota.MoveMailData();
    data.setTargetFolder(targetMailFolder._getMailFolderId());
    for(var i=0; i<mails.length; i++){
        data.getMails().push(mails[i].getId());
    }

    return data.setup({}, null).then(function() {
        sourceFolder.removeMails(mails);
    }).caught(tutao.NotFoundError, function(e) {
        // avoid exception for missing sync
        sourceFolder.removeMails(mails);
    });
};


/**
 * Delete this folder.
 * @param {bool} confirm True if the user has to confirm the delete, false otherwise.
 */
tutao.tutanota.ctrl.MailFolderViewModel.prototype.deleteFolder = function(confirm) {
    var promise = null;
    if (confirm && this.isTrashFolder()) {
        var message = null;
        if (this.isCustomFolder()) {
            message = "confirmDeleteTrashCustomFolder_msg";
        } else {
            message = "confirmDeleteTrashFolder_msg";
        }
        promise = tutao.tutanota.gui.confirm(tutao.lang(message, { "{1}": this.getName() }));
    } else {
        promise = Promise.resolve(true);
    }

    var self = this;
    return promise.then(function(confirmed) {
        if (confirmed) {
            // we want to delete all mails in the trash, not only the visible ones, so load them now. load reverse to avoid caching errors
            return tutao.rest.EntityRestInterface.loadAllReverse(tutao.entity.tutanota.Mail, self.getMailListId()).then(function(allMails) {
                if (self.isTrashFolder()){
                    return self.finallyDeleteMails(allMails);
                } else {
                    // move content to trash
                    return self.move(tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH), allMails);
                }
            }).then(function(){
                // Delete subfolders
                var subFolderList = self.subFolders();
                return Promise.each(subFolderList, function(subFolder) {
                    return subFolder.deleteFolder(false);
                }).then(function() {
                    // Delete folder instance and remove from parent
                    if (self.isCustomFolder()){
                        return self.parentFolder()._removeSubFolder(self);
                    } else {
                        return Promise.resolve();
                    }
                });
            });
        } else {
            return Promise.resolve();
        }
    });
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.sortFolderNames = function() {
    this.subFolders.sort(tutao.tutanota.ctrl.MailFolderViewModel._compareFolders);
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.isTrashFolder = function(){
    if ( this.parentFolder() ){
        return this.parentFolder().isTrashFolder();
    }else{
        return this.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_TRASH;
    }
};

tutao.tutanota.ctrl.MailFolderViewModel.prototype.isInboxFolder = function(){
    if ( this.parentFolder() ){
        return this.parentFolder().isInboxFolder();
    }else{
        return this.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX;
    }
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.isArchiveFolder = function(){
    if (this.parentFolder()){
        return this.parentFolder().isArchiveFolder();
    }else{
        return this.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_ARCHIVE;
    }
};


tutao.tutanota.ctrl.MailFolderViewModel.prototype.isCustomFolder = function(){
    return this.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM;
};


tutao.tutanota.ctrl.MailFolderViewModel._compareFolders = function(a, b){
    return a.getName().localeCompare(b.getName());
};










