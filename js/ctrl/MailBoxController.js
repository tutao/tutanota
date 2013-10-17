"use strict";

goog.provide('tutao.tutanota.ctrl.MailBoxController');

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
};

/**
 * Initializes the MailBoxController for the logged in user. This must be called
 * whenever another user logs in. Loads the user's mail list id, contact list id
 * and file list id.
 *
 * @param {function(tutao.rest.EntityRestException=)}
 *            callback Called when finished.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.initForUser = function(callback) {
	var self = this;
	this._loadMailBox(function(exception) {
		if (exception) {
			callback(exception);
		} else {
			self._loadFileSystem(function(exception) {
				if (exception) {
					callback(exception);
				} else {
					self._loadContactList(function(exception) {
						if (exception) {
							callback(exception);
						} else {
							self._loadShares(callback);
						}
					});
				}
			});
		}
	});
};

/**
 * Loads the mailbox for the logged in user's user group.
 *
 * @param {function(tutao.rest.EntityRestException=)}
 *            callback Called when finished.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadMailBox = function(callback) {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.MailBox.ROOT_INSTANCE_ID];
	tutao.entity.sys.RootInstance.load(rootId, function(root, exception) {
		if (exception) {
			callback(exception);
		} else {
			tutao.entity.tutanota.MailBox.load(root.getReference(), function(mailBox, exception) {
				self._mailBox = mailBox;
				callback();
			});
		}
	});
};

/**
 *
 * @param {function(tutao.rest.EntityRestException=)}
 *            callback Called when finished.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.deleteMailBox = function(callback) {
	var self = this;
	this._loadMailBox(function(exception) {
		if (exception) {
			callback(exception);
			return;
		}
		tutao.entity.tutanota.Mail.loadRange(self.getUserMailBox().getMails(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, function(mails, ex) {
			if (ex) {
				callback(ex);
				return;
			}
			for (var i = 0; i < mails.length; i++) {
				mails[i].erase(function() {});
			}
			callback();
		});
	});
};

/**
 * Loads the contacts list id for the logged in user's user group.
 *
 * @param {function(tutao.rest.EntityRestException=)}
 *            callback Called when finished.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadContactList = function(callback) {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.ContactList.ROOT_INSTANCE_ID];
	tutao.entity.sys.RootInstance.load(rootId, function(root, exception) {
		if (exception) {
			callback(exception);
		} else {
			tutao.entity.tutanota.ContactList.load(root.getReference(), function(contactList, exception) {
				self._contactList = contactList;
				callback();
			});
		}
	});
};

/**
 * Loads the file list id for the logged in user's user group.
 *
 * @param {function(tutao.rest.EntityRestException=)}
 *            callback Called when finished.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadFileSystem = function(callback) {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.FileSystem.ROOT_INSTANCE_ID];
	tutao.entity.sys.RootInstance.load(rootId, function(root, exception) {
		if (exception) {
			callback(exception);
		} else {
			tutao.entity.tutanota.FileSystem.load(root.getReference(), function(fileSystem, exception) {
				self._fileSystem = fileSystem;
				callback();
			});
		}
	});
};

/**
 * Loads the shares instance for the logged in user's user group.
 *
 * @param {function(tutao.rest.EntityRestException=)}
 *            callback Called when finished.
 */
tutao.tutanota.ctrl.MailBoxController.prototype._loadShares = function(callback) {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.sys.Shares.ROOT_INSTANCE_ID];
	tutao.entity.sys.RootInstance.load(rootId, function(root, exception) {
		if (exception) {
			callback(exception);
		} else {
			tutao.entity.sys.Shares.load(root.getReference(), function(shares, exception) {
				self._shares = shares;
				callback();
			});
		}
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
 * @return {tutao.entity.tutanota.Shares} The shares instance.
 */
tutao.tutanota.ctrl.MailBoxController.prototype.getUserShares = function() {
	return this._shares;
};
