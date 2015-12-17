"use strict";

tutao.provide('tutao.tutanota.ctrl.MailBoxController');

/**
 * The MailBoxController is responsible for caching the user's mail list id in
 * order to avoid that for accessing the mail list id the mail box has to be
 * loaded again.
 *
 * @constructor
 */
tutao.tutanota.ctrl.MailBoxController = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._mailBox = null;
	this._contactList = null;
	this._fileSystem = null;
	this._shares = null;
    this._properties = null;
};

/**
 * Initializes the MailBoxController for the logged in user. This must be called
 * whenever another user logs in. Loads the user's mail list id, contact list id
 * and file list id.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.initForUser = function() {
	var self = this;
    return this._loadMailBox().then(function(mailBox) {
        return self.loadTutanotaProperties();
    }).then(function() {
        // external users only have a mailbox
        if (tutao.locator.userController.isExternalUserLoggedIn()) {
            return Promise.resolve();
        } else {
            return Promise.join(
                self._loadFileSystem(),
                self._loadContactList(),
                self._loadShares());
        }
    });
};

/**
 * Loads the mailbox for the logged in user's user group.
 *
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadMailBox = function() {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.MailBox.ROOT_INSTANCE_ID];
	return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
        return tutao.entity.tutanota.MailBox.load(root.getReference()).then(function(mailBox) {
            self._mailBox = mailBox;
            return tutao.rest.EntityRestInterface.loadAll(tutao.entity.tutanota.MailFolder, mailBox.getSystemFolders().getFolders(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(loadedSystemFolders) {
                return Promise.map(loadedSystemFolders, function(loadedSystemFolder) {
                    var systemFolder = new tutao.tutanota.ctrl.MailFolderViewModel(loadedSystemFolder, null);
                    systemFolder.loadSubFolders();
                    return systemFolder;
                }).then(function(createdSystemFolders) {
                    createdSystemFolders.sort(function(folder1, folder2) {
                        // insert the draft folder after inbox
                        if (folder1.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_DRAFT) {
                            return 1.5 - Number(folder2.getFolderType());
                        } else  if (folder2.getFolderType() == tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_DRAFT) {
                            return Number(folder1.getFolderType()) - 1.5;
                        }
                        return Number(folder1.getFolderType()) - Number(folder2.getFolderType());
                    });
                    tutao.locator.mailFolderListViewModel.setMailFolders(createdSystemFolders);
                });
            });
        });
	});
};

/**
 * Loads the contacts list id for the logged in user's user group.
 *
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadContactList = function() {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.ContactList.ROOT_INSTANCE_ID];
	return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
        return tutao.entity.tutanota.ContactList.load(root.getReference()).then(function(contactList) {
            self._contactList = contactList;
        });
	});
};

/**
 * Loads the file list id for the logged in user's user group.
 *
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadFileSystem = function() {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.FileSystem.ROOT_INSTANCE_ID];
	return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
        return tutao.entity.tutanota.FileSystem.load(root.getReference()).then(function(fileSystem, exception) {
            self._fileSystem = fileSystem;
        });
	});
};

/**
 * Loads the shares instance for the logged in user's user group.
 *
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadShares = function() {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.sys.Shares.ROOT_INSTANCE_ID];
	return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
        return tutao.entity.sys.Shares.load(root.getReference()).then(function(shares) {
            self._shares = shares;
        });
	});
};


/**
 * Loads the TutanotaProperties instance for the logged in user's user group.
 *
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.loadTutanotaProperties = function() {
    var self = this;
    var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.TutanotaProperties.ROOT_INSTANCE_ID];
    return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
        return tutao.entity.tutanota.TutanotaProperties.load(root.getReference()).then(function(properties) {
            self._properties = properties;
        }).catch(function(error) {
            // Migrate tutanota properties
            var migrationService = new tutao.entity.tutanota.EncryptTutanotaPropertiesData();
            var sessionKey = tutao.locator.aesCrypter.generateRandomKey();
            var groupEncSessionKey = tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), sessionKey);
            migrationService.setProperties(root.getReference())
                .setSymEncSessionKey(groupEncSessionKey);
            return migrationService.setup({}, null).then(function() {
                return tutao.entity.tutanota.TutanotaProperties.load(root.getReference()).then(function(properties) {
                    self._properties = properties;
                })
            });
        });
    });
};

/**
 * Provides the mail box of the logged in user.
 *
 * @return {tutao.entity.tutanota.MailBox} The mail box.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserMailBox = function() {
	return this._mailBox;
};

/**
 * Provides the bucket data for the mailbox of the logged in user.
 *
 * @return {tutao.entity.BucketData} The bucket data.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserMailBoxBucketData = function() {
	return new tutao.entity.BucketData(this._mailBox.getShareBucketId(), tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), this._mailBox.getSymEncShareBucketKey()));
};

/**
 * Provides the contact list of the logged in user.
 *
 * @return {tutao.entity.tutanota.ContactList} The contact list.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserContactList = function() {
	return this._contactList;
};

/**
 * Provides the bucket data for the contact list of the logged in user.
 *
 * @return {tutao.entity.BucketData} The bucket data.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserContactListBucketData = function() {
	return new tutao.entity.BucketData(this._contactList.getShareBucketId(), tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), this._contactList.getSymEncShareBucketKey()));
};

/**
 * Provides the file system of the logged in user.
 *
 * @return {tutao.entity.tutanota.FileSystem} The file system.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserFileSystem = function() {
	return this._fileSystem;
};

/**
 * Provides the bucket data for the file system of the logged in user.
 *
 * @return {tutao.entity.BucketData} The bucket data.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserFileSystemBucketData = function() {
	return new tutao.entity.BucketData(this._fileSystem.getShareBucketId(), tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), this._fileSystem.getSymEncShareBucketKey()));
};

/**
 * Provides the shares instance of the logged in user.
 *
 * @return {tutao.entity.sys.Shares} The shares instance.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserShares = function() {
	return this._shares;
};
/**
 * Provides the TutanotaProperties instance of the logged in user.
 *
 * @return {tutao.entity.tutanota.TutanotaProperties} The TutanotaProperties instance.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserProperties = function() {
    return this._properties;
};

/**
 * @return {String} The signature text.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getEmailSignature = function() {
    var type = this.getUserProperties().getEmailSignatureType();
    if ( type == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT ) {
        return tutao.tutanota.ctrl.MailBoxController.getDefaultSignature();
    } else if (type == tutao.entity.tutanota.TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM) {
        return this.getUserProperties().getCustomEmailSignature();
    } else {
        return "";
    }
};

tutao.tutanota.ctrl.MailBoxController.getDefaultSignature = function() {
    return tutao.locator.htmlSanitizer.sanitize(tutao.lang(tutao.entity.tutanota.TutanotaConstants.DEFAULT_EMAIL_SIGNATURE, {"{1}": "https://tutanota.com"}), true).text;
};