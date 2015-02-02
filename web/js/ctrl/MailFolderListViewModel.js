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
    //@type function(tutao.tutanota.ctrl.MailFolderViewModel=):tutao.tutanota.ctrl.MailFolderViewModel
    this.selectedFolder = ko.observable(dummyMailFolder); // bound by MailListViewModel

    this._folders = ko.observableArray();

    this.buttonBarViewModel = null;
};

/**
 * Creates the buttons
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.init = function() {
    var self = this;
    this.buttons = [
        new tutao.tutanota.ctrl.Button("delete_action", -1, this._deleteSelectedFolder, null, false, "deleteFolderAction", "trash"),
        new tutao.tutanota.ctrl.Button("rename_action", -1, this._renameSelectedFolder, function() {
            return self.selectedFolder().getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM;
        }, false, "renameFolderAction", "edit"),
        new tutao.tutanota.ctrl.Button("add_action", -1, this._createFolderInSelectedFolder, function() {
            return self.selectedFolder().getFolderType() != tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_CUSTOM;
        }, false, "addFolderAction", "add")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry, tutao.tutanota.ctrl.ButtonBarViewModel.TYPE_ACTION);
};

/**
 * Set the initial mail folders.
 * @param {Array.<tutao.tutanota.ctrl.MailFolderViewModel>} folders The folders.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.setMailFolders = function(folders) {
    this._folders(folders);
};

/**
 * Provides available mail folders.
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
    var self = this;
    if (this.selectedFolder() == folder) {
        return Promise.resolve();
    } else {
        return tutao.locator.mailViewModel.tryCancelAllComposingMails(false).then(function (confirmed) {
            if (confirmed) {
                self.selectedFolder(folder);
                return folder.selected().then(function () {
                    tutao.locator.mailView.showDefaultColumns();
                });
            }
        });
    }
};


/**
 * Moves the mail from the selected folder to the given target folder.
 * @param {tutao.tutanota.ctrl.MailFolderViewModel} targetMailFolder The target folder.
 * @param {Array.<tutao.entity.tutanota.Mail>} mails The mails to move.
 * @param {tutao.tutanota.ctrl.MailFolderViewModel=} sourceMailFolder The source folder, if not set the source folder is the selected folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.move = function(targetMailFolder, mails, sourceMailFolder) {
    var sourceFolder = sourceMailFolder;
    if(!sourceFolder){
        sourceFolder = tutao.locator.mailFolderListViewModel.selectedFolder();
    }
    if (sourceFolder.getMailListId() == targetMailFolder.getMailListId()) {
        // source and target folder are the same
        return;
    }

    var data = new tutao.entity.tutanota.MoveMailData();
    data.setTargetFolder(targetMailFolder.getMailFolderId());
    for(var i=0; i<mails.length; i++){
        data.getMails().push(mails[i].getId());
    }

    data.setup({}, null).then(function() {
        for (var i=0; i<mails.length; i++) {
            sourceFolder.removeMail(mails[i]);
        }
    });
};

/**
 * Moves the mail from the selected folder with the given element id to the given target folder. Called when using drag&drop.
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
    for (var i=0; i<allMails.length; i++) {
        if (allMails[i].getId()[1] == mailElementId) {
            this.move(targetMailFolder, allMails[i]);
            break;
        }
    }
};


/**
 * Provides the name of the selected folder.
 * @returns {string} The name of the selected folder.
 */
tutao.tutanota.ctrl.MailFolderListViewModel.prototype.getSelectedFolderName = function() {
    return this.selectedFolder().getName();
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
    this.selectedFolder().deleteFolder();
};