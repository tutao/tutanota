"use strict";

tutao.provide('tutao.tutanota.ctrl.MailFolderListViewModel');

/**
 * The view model for the tag list, i.e. mail folders.
 * @constructor
 */
tutao.tutanota.ctrl.MailFolderListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    var mailFolder = new tutao.entity.tutanota.MailFolder();
    mailFolder.setFolderType("1");
    var dummyMailFolder = new tutao.tutanota.ctrl.MailFolderViewModel(mailFolder, null);
    // @type function(tutao.tutanota.ctrl.MailFolderViewModel=):tutao.tutanota.ctrl.MailFolderViewModel
    this.selectedFolder = ko.observable(dummyMailFolder); // bound by MailListViewModel

    this._folders = ko.observableArray();

    this.buttonBarViewModel = null;

    this._mailListColumnContentLoader = new tutao.util.ColumnContentLoader();
};

/**
 * Creates the buttons
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.init = function() {
    var self = this;

    this._subButtons = [
        new tutao.tutanota.ctrl.Button("add_action", 1, this._createFolderInSelectedFolder, function() {
            return self.selectedFolder().getFolderType() != tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM;
        }, false, "addFolderAction", "addFolder"),
        new tutao.tutanota.ctrl.Button("rename_action", 2, this._renameSelectedFolder, function() {
            return self.selectedFolder().getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM;
        }, false, "renameFolderAction", "edit"),
        new tutao.tutanota.ctrl.Button("delete_action", 3, this._deleteSelectedFolder, null, false, "deleteFolderAction", "removeFolder")
    ];
    this.buttons = [];
    this.buttons.push(new tutao.tutanota.ctrl.Button("edit_action", 10, function(){}, function(){return self.selectedFolder() != null;}, false, "editFolderAction", "folder", null, null, null, function() {
        return self._subButtons;
    }));

    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);

    tutao.locator.mailView.getSwipeSlider().getViewSlider().addWidthObserver(tutao.tutanota.gui.MailView.COLUMN_FOLDERS, function (width) {
        // we reduce the max width by 10 px which are used in our css for paddings + borders
        self.buttonBarViewModel.setButtonBarWidth(width - 6);
    });
};

/**
 * Set the initial mail folders.
 * @param {Array.<tutao.tutanota.ctrl.MailFolderViewModel>} folders The folders.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.setMailFolders = function(folders) {
    this._folders(folders);
};

/**
 * Provides available mail folders, i.e. all system folders.
 * @return {Array.<tutao.tutanota.ctrl.MailFolderViewModel>} The folders.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.getMailFolders = function() {
    return this._folders();
};

/**
 * Returns the system folder of the given type.
 * @param {string} folderType One of tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_* except tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM.
 * @returns {tutao.tutanota.ctrl.MailFolderViewModel} The requested system folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.getSystemFolder = function(folderType) {
    var folders = this.getMailFolders();
    for (var i=0; i<folders.length; i++) {
        if (folders[i].getFolderType() == folderType) {
            return folders[i];
        }
    }
    throw new Error("system folder " + folderType + " not found");
};


/**
 * Selects the given folder.
 * @param {tutao.tutanota.ctrl.MailFolderViewModel} folder The folder to select.
 * @return {Promise} When finished.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.selectFolder = function(folder) {
    tutao.locator.mailListViewModel.disableMobileMultiSelect();
    var self = this;
    if (this.selectedFolder() == folder && this._mailListColumnContentLoader.getObjectToLoad() == null) {
        return tutao.locator.mailView.showDefaultColumns();
    } else {
        return tutao.locator.mailViewModel.tryCancelAllComposingMails(false).then(function (confirmed) {
            if (confirmed) {
                var oldFolder = self.selectedFolder();
                self._mailListColumnContentLoader.load(folder, !tutao.locator.mailView.isMailListColumnVisible(), function(instruction) {
                    if (instruction == tutao.util.ColumnContentLoader.INSTRUCTION_SLIDE_COLUMN) {
                        return tutao.locator.mailView.showDefaultColumns();
                    } else if (instruction == tutao.util.ColumnContentLoader.INSTRUCTION_LOAD_CONTENT) {
                        return folder.selected();
                    } else if (instruction == tutao.util.ColumnContentLoader.INSTRUCTION_SHOW_BUSY) {
                        tutao.locator.mailListViewModel.switchingFolders(true);
                        return Promise.resolve();
                    }
                }).then(function() {
                    self.selectedFolder(folder);
                    tutao.locator.mailListViewModel.switchingFolders(false);
                }).caught(tutao.NotAuthorizedError, function() {
                    // the folder has been deleted - should not occur if full sync is available.
                    folder.updateOnRemovedFolder();
                    self.selectedFolder(oldFolder);
                    tutao.locator.mailListViewModel.switchingFolders(false);
                });
            }
        });
    }
};

tutao.tutanota.ctrl.MailFolderListViewModel.prototype.showAsSelected = function(folder) {
	if (this._mailListColumnContentLoader.getObjectToLoad()) {
		return (this._mailListColumnContentLoader.getObjectToLoad() == folder);
	} else {
	    return (this.selectedFolder() == folder);
	}
};

/**
 * Provides the name of the selected folder.
 * @returns {string} The name of the selected folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.getSelectedFolderName = function() {
    if (this._mailListColumnContentLoader.getObjectToLoad()) {
        return this._mailListColumnContentLoader.getObjectToLoad().getName();
    } else {
        return this.selectedFolder().getName();
    }
};

/**
 * Moves the mail from the selected folder with the given element id to the given target folder. If the mail is among the selected, all selected are moved. Called when using drag&drop.
 * @param {tutao.tutanota.ctrl.MailFolderViewModel} targetMailFolder The target folder.
 * @param {tutao.entity.tutanota.Mail} mailElementId The element id of mail to move.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.drop = function(targetMailFolder, mailElementId) {
    var sourceMailFolder = tutao.locator.mailFolderListViewModel.selectedFolder();
    if (sourceMailFolder.getMailListId() == targetMailFolder.getMailListId()) {
        // source and target folder are the same
        return;
    }

    // find the mail instance
    var allMails = sourceMailFolder.getLoadedMails();
    var selectedMails = sourceMailFolder.getSelectedMails();
    for (var i=0; i<allMails.length; i++) {
        if (allMails[i].getId()[1] == mailElementId) {
            var droppedMail = allMails[i];
            if (selectedMails.indexOf(droppedMail) != -1) {
                // the dropped mail is among the selected mails, so move all selected mails
                sourceMailFolder.move(targetMailFolder, selectedMails);
            } else {
                sourceMailFolder.move(targetMailFolder, [droppedMail]);
            }
            break;
        }
    }
};

/**
 * Add a folder to the selected folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype._createFolderInSelectedFolder = function() {
    this.selectedFolder().createSubFolder();
};

/**
 * Rename the selected folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype._renameSelectedFolder = function() {
    this.selectedFolder().rename();
};

/**
 * Delete the selected folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype._deleteSelectedFolder = function() {
    var self = this;
    var folderToSelect = this.selectedFolder().isCustomFolder() ? this.selectedFolder().parentFolder(): this.selectedFolder();
    this.selectedFolder().deleteFolder(true).then(function() {
        self.selectFolder(folderToSelect);
    });
};


tutao.tutanota.ctrl.MailFolderListViewModel.prototype.updateNumberOfUnreadMails = function() {
    var unreadMails = this.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX).getNumberOfUnreadMails();
    var buttons = tutao.locator.viewManager.getButtons();
    for (var i=0; i< buttons.length; i++) {
        if (buttons[i].getId() == "menu_mail" || buttons[i].getId() == "menu_mail_new") {
            buttons[i].setBadgeNumber(unreadMails);
        }
    }
    tutao.locator.notification.updateBadge(unreadMails);
};


/**
 * Finds the folder with the provided id in the mail folder list and all sub folders and returns it. Returns null if no such folder exists.
 * @param {Array.<String>} mailFolderId of the mail folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.findFolder = function(mailFolderId) {
    var systemFolderList = this._folders();
    for (var a=0; a<systemFolderList.length; a++) {
        var systemFolder = systemFolderList[a];
        if (tutao.rest.EntityRestInterface.sameListElementIds(mailFolderId, systemFolder.getMailFolderId()) ) {
            return systemFolder;
        } else {
            var subFolderList = systemFolder.subFolders();
            for (var b=0; b<subFolderList.length; b++) {
                var subFolder = subFolderList[b];
                if (tutao.rest.EntityRestInterface.sameListElementIds(mailFolderId, subFolder.getMailFolderId()) ) {
                    return subFolder;
                }
            }
        }
    }
    return null;
};

