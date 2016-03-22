"use strict";

tutao.provide('tutao.tutanota.ctrl.ShareFacade');

/**
 * Share a functional area with someone else.
 * @param {String} shareType One of tutao.entity.tutanota.TutanotaConstants.SHARE_TYPE_*;.
 * @param {String} shareholderMailAddress The mail address of the user that shall get the data shared (i.e. the shareholder).
 * @param {boolean} writePermission True if the shareholder shall get write permissions, false if he shall only get read permissions.
 * @return {Promise.<>} Resolves when finished, rejected if failed.
 */
tutao.tutanota.ctrl.ShareFacade.share = function(shareType, shareholderMailAddress, writePermission) {
	var shareService = new tutao.entity.sys.ShareData();
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
		return Promise.reject(new Error("invalid share type: " + shareType));
	}

	shareService.setInstancePermissions(instancePermissionList);
	shareService.setBucket(bucketId);

	return tutao.tutanota.ctrl.ShareFacade.encryptKeyForGroup(shareholderMailAddress, shareBucketKey).then(function(keyData) {
		shareService.setPubEncBucketKey(keyData.pubEncKey)
		    .setPubKeyVersion(keyData.pubKeyVersion)
            .setOwnerGroupId(tutao.locator.userController.getUserGroupId());


		var headers = tutao.entity.EntityHelper.createAuthHeaders();
		var postParams = {};
		return shareService.setup(postParams, headers);
	});
};

/**
 * Encrypts a symmetric key with the public key of the group with the given mail address (internal user).
 * @param {String} mailAddress The mail address for which we want to get the key info.
 * @param {Object} keyToEncrypt The symmetric key to encrypt.
 * @return {Promise.<{pubEncKey:String,pubKeyVersion:Number}, tutao.RecipientsNotFoundError>} Resolves when finished, rejected if failed.
 */
tutao.tutanota.ctrl.ShareFacade.encryptKeyForGroup = function(mailAddress, keyToEncrypt) {
	//load recipient key information
	var parameters = {};
	return tutao.entity.sys.PublicKeyReturn.load(new tutao.entity.sys.PublicKeyData().setMailAddress(mailAddress), parameters, null).then(function(publicKeyData, exception) {
        var publicKey = tutao.locator.rsaUtil.hexToPublicKey(tutao.util.EncodingConverter.base64ToHex(publicKeyData.getPubKey()));
        var bucketKey = new Uint8Array(sjcl.codec.bytes.fromBits(keyToEncrypt));
        return tutao.locator.crypto.rsaEncrypt(publicKey, bucketKey).then(function(encrypted) {
            return { pubEncKey: tutao.util.EncodingConverter.uint8ArrayToBase64(encrypted), pubKeyVersion: publicKeyData.getPubKeyVersion() };
        });
	}).caught(tutao.NotFoundError, function(exception) {
        throw new tutao.RecipientsNotFoundError([mailAddress]);
    });
};
