"use strict";

goog.provide('tutao.tutanota.ctrl.ShareFacade');

/**
 * Share a functional area with someone else.
 * @param {String} shareType One of tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_*;.
 * @param {String} shareholderMailAddress The mail address of the user that shall get the data shared (i.e. the shareholder).
 * @param {boolean} writePermission True if the shareholder shall get write permissions, false if he shall only get read permissions.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished, receives an exception if an error occurred.
 */
tutao.tutanota.ctrl.ShareFacade.share = function(shareType, shareholderMailAddress, writePermission, callback) {
	var shareService = new tutao.entity.sys.ShareService();
	shareService.setApp("tutanota");
	shareService.setShareType(shareType);
	shareService.setShareholderMailAddress(shareholderMailAddress);
	shareService.setWritePermission(writePermission);

	var instancePermissionList;
	var bucketId;
	var shareBucketKey;
	if (shareType == tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_MAIL_BOX) {
		instancePermissionList = tutao.locator.mailBoxController.getUserMailBox().getPermissions();
		bucketId = tutao.locator.mailBoxController.getUserMailBox().getShareBucketId();
		shareBucketKey = tutao.locator.mailBoxController.getUserMailBoxBucketData().getBucketKey();
	} else if (shareType == tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_CONTACT_LIST) {
		instancePermissionList = tutao.locator.mailBoxController.getUserContactList().getPermissions();
		bucketId = tutao.locator.mailBoxController.getUserContactList().getShareBucketId();
		shareBucketKey = tutao.locator.mailBoxController.getUserContactListBucketData().getBucketKey();
	} else if (shareType == tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_FILE_SYSTEM) {
		instancePermissionList = tutao.locator.mailBoxController.getUserFileSystem().getPermissions();
		bucketId = tutao.locator.mailBoxController.getUserFileSystem().getShareBucketId();
		shareBucketKey = tutao.locator.mailBoxController.getUserFileSystemBucketData().getBucketKey();
	} else {
		callback(new tutao.rest.EntityRestException(new Error("invalid share type: " + shareType)));
		return;
	}

	shareService.setInstancePermissions(instancePermissionList);
	shareService.setBucket(bucketId);

	tutao.tutanota.ctrl.ShareFacade.encryptKeyForGroup(shareholderMailAddress, shareBucketKey, function(keyData, exception) {
		if (exception) {
			callback(exception);
			return;
		}
		shareService.setPubEncBucketKey(keyData.pubEncKey);
		shareService.setPubKeyVersion(keyData.pubKeyVersion);

		var headers = tutao.entity.EntityHelper.createAuthHeaders();
		var postParams = {};
		postParams[tutao.rest.ResourceConstants.GROUP_ID] = tutao.locator.userController.getUserGroupId();
		shareService.setup(postParams, headers, function(fileDataId, exception) {
			if (exception) {
				callback(new tutao.rest.EntityRestException(exception));
				return;
			}
			callback();
		});
	});
};

/**
 * Encrypts a symmetric key with the public key of the group with the given mail address (internal user).
 * @param {String} mailAddress The mail address for which we want to get the key info.
 * @param {Object} keyToEncrypt The symmetric key to encrypt.
 * @param {function(?{pubEncKey:String,pubKeyVersion:Number}, tutao.rest.EntityRestException|tutao.tutanota.ctrl.RecipientsNotFoundException=)}
 */
tutao.tutanota.ctrl.ShareFacade.encryptKeyForGroup = function(mailAddress, keyToEncrypt, callback) {
	//load recipient key information
	var parameters = {};
	parameters[tutao.rest.ResourceConstants.MAIL_ADDRESS] = mailAddress;
	tutao.entity.sys.PublicKeyService.load(parameters, null, function(publicKeyData, exception) {
		if (exception) {
			if (exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 404) {
				callback(null, tutao.tutanota.ctrl.RecipientsNotFoundException([mailAddress]));
			} else {
				callback(null, exception);
			}
		} else {
			var publicKey = tutao.locator.rsaCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(publicKeyData.getPubKey()));
			var hexBucketKey = tutao.locator.aesCrypter.keyToHex(keyToEncrypt);
			tutao.locator.rsaCrypter.encryptAesKey(publicKey, hexBucketKey, function(encrypted, exception) {
				if (exception) {
					callback(null, exception);
				} else {
					callback({ pubEncKey: encrypted, pubKeyVersion: publicKeyData.getPubKeyVersion() });
				}
			});
		}
	});
};
