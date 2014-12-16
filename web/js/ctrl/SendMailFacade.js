"use strict";

tutao.provide('tutao.tutanota.ctrl.SendMailFacade');

/**
 * Sends a secure mail to internal and external recipients. For external recipients the password and password channels must be set.
 * @param {string} subject The subject of the mail.
 * @param {string} bodyText The bodyText of the mail.
 * @param {string} senderName The name of the sender that is sent together with the mail address of the sender.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {string} conversationType See TutanotaConstants.
 * @param {string} previousMessageId The id of the message that this mail is a reply or forward to. Null if this is a new mail.
 * @param {Array.<tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile>} attachments The new files that shall be attached to this mail.
 * @param {string} language Notification mail language.
 * @return {Promise.<string, tutao.RecipientsNotFoundError>} Resolved finished with the id of the senders mail (only element id, no list id). Rejected with a
 * RecipientsNotFoundError if some of the recipients could not be found
 */
tutao.tutanota.ctrl.SendMailFacade.sendMail = function(subject, bodyText, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, language) {
	var accountType = tutao.locator.userController.getLoggedInUser().getAccountType();
	if ((accountType != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE) && (accountType != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM) && (accountType != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER)) {
		return Promise.reject(new Error("invalid account type"));
	}

    var aes = tutao.locator.aesCrypter;
    var groupKey = tutao.locator.userController.getUserGroupKey();
    var bucketKey = aes.generateRandomKey();
    var mailBoxKey = tutao.locator.mailBoxController.getUserMailBox()._entityHelper.getSessionKey();

    var service = new tutao.entity.tutanota.SendMailData();
    service.setLanguage(language)
        .setSubject(subject)
        .setBodyText(bodyText)
        .setSenderName(senderName)
        .setSenderNameUnencrypted(senderName)
        .setListEncSessionKey(aes.encryptKey(mailBoxKey, service._entityHelper.getSessionKey())) // for sender
        .setSymEncSessionKey(aes.encryptKey(groupKey, service._entityHelper.getSessionKey())) // for sender
        .setBucketEncSessionKey(aes.encryptKey(bucketKey, service._entityHelper.getSessionKey())) // for recipeints
        .setConfidential(true);

    if (tutao.locator.userController.isInternalUserLoggedIn()) {
        service.setSharableEncSessionKey(aes.encryptKey(tutao.locator.mailBoxController.getUserMailBoxBucketData().getBucketKey(), service._entityHelper.getSessionKey())); // for sharing the mailbox
    } else {
        service.setSharableEncSessionKey(null);
    }
    service.setConversationType(conversationType);
    service.setPreviousMessageId(previousMessageId);

    return Promise.each(attachments, function(dataFile) {
        var attachment = new tutao.entity.tutanota.Attachment(service);
        return tutao.tutanota.ctrl.SendMailFacade.createAttachment(attachment, dataFile).then(function(fileSessionKey) {
            attachment.setListEncFileSessionKey(aes.encryptKey(mailBoxKey, fileSessionKey))
                .setBucketEncFileSessionKey(aes.encryptKey(bucketKey, fileSessionKey));

            service.getAttachments().push(attachment);
        });
    }).then(function() {
        return tutao.tutanota.ctrl.SendMailFacade._handleRecipients(service, toRecipients, ccRecipients, bccRecipients, bucketKey);
    });
};

/**
 * Uploads the given data files or sets the file if it is already existing files (e.g. forwarded files)
 * @param {tutao.entity.tutanota.Attachment|tutao.entity.tutanota.UnsecureAttachment|tutao.entity.tutanota.AttachmentFromExternal} attachment The attachment
 * @param {tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile} dataFile File to upload.
 * @return {Promise.<Object>} Resolves to the session key of the file, rejects if failed.
 */
tutao.tutanota.ctrl.SendMailFacade.createAttachment = function(attachment, dataFile) {
    var aes = tutao.locator.aesCrypter;
    if (dataFile instanceof tutao.entity.tutanota.File) {
        // forwarded attachment
        var fileSessionKey = dataFile._entityHelper.getSessionKey();
        attachment.setFile(dataFile.getId());
        return Promise.resolve(fileSessionKey);
    } else if (dataFile instanceof tutao.tutanota.util.DataFile || dataFile instanceof tutao.native.AndroidFile) {
        // user added attachment
        var fileSessionKey = tutao.locator.aesCrypter.generateRandomKey();
        return tutao.locator.fileFacade.uploadFileData(dataFile, fileSessionKey).then(function (fileDataId) {
            attachment.setFileName(aes.encryptUtf8(fileSessionKey, dataFile.getName()))
                .setMimeType(aes.encryptUtf8(fileSessionKey, dataFile.getMimeType()))
                .setFileData(fileDataId);
            return fileSessionKey;
        });
    } else {
        return Promise.reject(new Error("illegal file type as attachment"))
    }
};

tutao.tutanota.ctrl.SendMailFacade._uploadAttachmentData = function(dataFile, sessionKey) {
    return tutao.locator.fileFacade.uploadFileData(dataFile, sessionKey).then(function(fileDataId) {
        return tutao.entity.tutanota.FileData.load(fileDataId);
    });
};

/**
 * Handles all recipients.
 * @param {tutao.entity.tutanota.SendMailData} service The service data.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {Object} bucketKey The bucket key.
 * @return {Promise.<string, tutao.RecipientsNotFoundError>} Resolved when finished with the id of
 * the senders mail (only element id, no list id). Rejects with an RecipientsNotFoundError if some of the recipients could not be found.
 */
tutao.tutanota.ctrl.SendMailFacade._handleRecipients = function(service, toRecipients, ccRecipients, bccRecipients, bucketKey) {
	//not found recipients are collected here. even if recipients are not found, all recipients are checked
	var notFoundRecipients = [];

    return Promise.each([{ 'recipientInfoList': toRecipients, 'serviceRecipientList': service.getToRecipients()},
                 { 'recipientInfoList': ccRecipients, 'serviceRecipientList': service.getCcRecipients()},
                 { 'recipientInfoList': bccRecipients, 'serviceRecipientList': service.getBccRecipients()}],
        function(recipientLists) {
        return Promise.each(recipientLists.recipientInfoList, function(recipientInfo) {
            var serviceRecipient = new tutao.entity.tutanota.Recipient(service);
            recipientLists.serviceRecipientList.push(serviceRecipient);
            return tutao.tutanota.ctrl.SendMailFacade.handleRecipient(recipientInfo, serviceRecipient, bucketKey, notFoundRecipients);
        });
    }).then(function() {
        if (notFoundRecipients.length > 0) {
            throw new tutao.RecipientsNotFoundError(notFoundRecipients);
        } else {
            var map = {};
            return service.setup(map, tutao.entity.EntityHelper.createAuthHeaders()).then(function(sendMailReturn) {
                return sendMailReturn.getSenderMail()[1];
            });
        }
    });
};

/**
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipientInfo to copy to recipient.
 * @param {tutao.entity.tutanota.Recipient} recipient The recipient to fill.
 * @param {Object} bucketKey The bucket key.
 * @param {Array.<String>} notFoundRecipients Collects all recipients that are not found.
 * @return {Promise.<>} Resolved when finished, rejected if an error occured
 */
tutao.tutanota.ctrl.SendMailFacade.handleRecipient = function(recipientInfo, recipient, bucketKey, notFoundRecipients) {
	recipient.setName(recipientInfo.getName());
	recipient.setMailAddress(recipientInfo.getMailAddress());


    if (recipientInfo.getMailAddress() == "system@tutanota.de"){
        notFoundRecipients.push(recipientInfo.getMailAddress());
        return Promise.resolve();
    }

	// copy phone number and password information if this is an external contact
	// otherwise load the key information from the server
	if (recipientInfo.isExternal() && notFoundRecipients.length == 0) {
        // pre-shared password has prio
        var password = recipientInfo.getContactWrapper().getContact().getPresharedPassword();
        var preshared = true;
        if (password == null) {
            password = recipientInfo.getContactWrapper().getContact().getAutoTransmitPassword();
            preshared = false;
        }
        var promise = Promise.resolve();
        if (!preshared && password == "") {
            password = tutao.tutanota.util.PasswordUtils.generateMessagePassword();
            if (recipientInfo.isExistingContact()) {
                recipientInfo.getContactWrapper().getContact().setAutoTransmitPassword(password);
                promise = recipientInfo.getContactWrapper().getContact().update();
            }
        }
        //console.log(password);

        var saltHex = tutao.locator.kdfCrypter.generateRandomSalt();
        var saltBase64 = tutao.util.EncodingConverter.hexToBase64(saltHex);
        // TODO (story performance): make kdf async in worker
        return promise.then(function () {
            return tutao.locator.crypto.generateKeyFromPassphrase(password, saltHex).then(function(hexKey) {
                var passwordKey = tutao.locator.aesCrypter.hexToKey(hexKey);
                var passwordVerifier = tutao.locator.shaCrypter.hashHex(hexKey);
                return tutao.tutanota.ctrl.SendMailFacade.getExternalGroupKey(recipientInfo, passwordKey, passwordVerifier).then(function(externalUserGroupKey) {
                    recipient.setType(tutao.entity.tutanota.TutanotaConstants.RECIPIENT_TYPE_EXTERNAL);
                    recipient.setPubEncBucketKey(null);
                    recipient.setPubKeyVersion(null);
                    // the password is not sent to the server if it is pre-shared
                    if (!preshared) {
                        recipient.setAutoTransmitPassword(password);
                    }
                    recipient.setSymEncBucketKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, bucketKey));
                    recipient.setPasswordVerifier(passwordVerifier);
                    recipient.setSalt(saltBase64);  // starter accounts may not call this facade, so the salt is always sent to the server
                    recipient.setSaltHash(tutao.locator.shaCrypter.hashHex(saltHex));
                    recipient.setPwEncCommunicationKey(tutao.locator.aesCrypter.encryptKey(passwordKey, externalUserGroupKey));

                    if (!preshared) {
                        var numbers = recipientInfo.getContactWrapper().getContact().getPhoneNumbers();
                        var nbrOfValidNumbers = 0;
                        for (var a = 0; a < numbers.length; a++) {
                            var recipientNumber = tutao.tutanota.util.Formatter.getCleanedPhoneNumber(numbers[a].getNumber());
                            if (tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber(recipientNumber)) {
                                var number = new tutao.entity.tutanota.PasswordChannelPhoneNumber(recipient)
                                    .setNumber(recipientNumber);
                                recipient.getPasswordChannelPhoneNumbers().push(number);
                                nbrOfValidNumbers++;
                            }
                        }
                        if (nbrOfValidNumbers == 0) {
                            throw new Error("no valid password channels for recipient");
                        }
                    }
                });
            });
        });
	} else if (!recipientInfo.isExternal()) {
		recipient.setType(tutao.entity.tutanota.TutanotaConstants.RECIPIENT_TYPE_INTERNAL);

		// load recipient key information
		var parameters = {};
		return tutao.entity.sys.PublicKeyReturn.load(new tutao.entity.sys.PublicKeyData().setMailAddress(recipientInfo.getMailAddress()), parameters, null).then(function(publicKeyData) {
            if (notFoundRecipients.length == 0) {
				var publicKey = tutao.locator.rsaUtil.hexToPublicKey(tutao.util.EncodingConverter.base64ToHex(publicKeyData.getPubKey()));
				var hexBucketKey = new Uint8Array(tutao.util.EncodingConverter.hexToBytes(tutao.locator.aesCrypter.keyToHex(bucketKey)));
                return tutao.locator.crypto.rsaEncrypt(publicKey, hexBucketKey).then(function(encrypted) {
                    recipient.setPubEncBucketKey(tutao.util.EncodingConverter.arrayBufferToBase64(encrypted));
                    recipient.setPubKeyVersion(publicKeyData.getPubKeyVersion());
                });
			}
		}).caught(tutao.NotFoundError, function(exception) {
            notFoundRecipients.push(recipient.getMailAddress());
        });
	}
};

/**
 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created. Returns the user group key of the external recipient.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipient.
 * @param {Object} externalUserPwKey The external user's password key.
 * @param {string} verifier The external user's verifier.
 * @return {Promise.<Object>} Resolved to the the external user's group key, rejected if an error occured
 */
tutao.tutanota.ctrl.SendMailFacade.getExternalGroupKey = function(recipientInfo, externalUserPwKey, verifier) {
	var self = this;
	var groupRootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.sys.GroupRoot.ROOT_INSTANCE_ID];
	return tutao.entity.sys.RootInstance.load(groupRootId).then(function(rootInstance) {
        return tutao.entity.sys.GroupRoot.load(rootInstance.getReference()).then(function(groupRoot) {
            var cleanedMailAddress = tutao.tutanota.util.Formatter.getCleanedMailAddress(recipientInfo.getMailAddress());
            var mailAddressId = tutao.rest.EntityRestInterface.stringToCustomId(cleanedMailAddress);
            return tutao.entity.sys.ExternalUserReference.load([groupRoot.getExternalUserReferences(), mailAddressId]).then(function(externalUserReference, exception) {
                return tutao.entity.sys.Group.load(externalUserReference.getUserGroup()).then(function(externalUserGroup, exception) {
                    return tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), externalUserGroup.getAdminGroupEncGKey());
                });
            }).caught(tutao.NotFoundError, function(exception) {
                // it does not exist, so create it
                // load the list key of the ExternalRecipients list
                return tutao.entity.EntityHelper.getListKey(groupRoot.getExternalGroupInfos()).then(function(externalRecipientsListKey) {
                    return tutao.entity.EntityHelper.getListKey(groupRoot.getExternalGroupInfos()).then(function(externalGroupInfoListKey) {
                        var mailListKey = tutao.locator.aesCrypter.generateRandomKey();
                        var externalUserGroupKey = tutao.locator.aesCrypter.generateRandomKey();
                        var groupInfoSessionKey = tutao.locator.aesCrypter.generateRandomKey();
                        var clientKey = tutao.locator.aesCrypter.generateRandomKey();

                        var externalRecipientData = new tutao.entity.tutanota.ExternalUserData()
                            .setGroupEncMailListKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, mailListKey))
                            .setUserEncClientKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, clientKey))
                            .setVerifier(verifier)
                            .setExternalUserEncGroupInfoSessionKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, externalGroupInfoListKey))
                            .setGroupEncEntropy(tutao.locator.aesCrypter.encryptBytes(externalUserGroupKey, tutao.util.EncodingConverter.hexToBase64(tutao.locator.randomizer.generateRandomData(32))));
                        var userGroupData = new tutao.entity.tutanota.CreateExternalUserGroupData(externalRecipientData)
                            .setMailAddress(cleanedMailAddress)
                            .setAdminEncGKey(tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), externalUserGroupKey))
                            .setEncryptedName(tutao.locator.aesCrypter.encryptUtf8(groupInfoSessionKey, recipientInfo.getName()))
                            .setGroupInfoListEncSessionKey(tutao.locator.aesCrypter.encryptKey(externalGroupInfoListKey, groupInfoSessionKey))
                            .setSymEncGKey(tutao.locator.aesCrypter.encryptKey(externalUserPwKey, externalUserGroupKey));
                        return externalRecipientData.setUserGroupData(userGroupData).setup([], null).then(function() {
                            return externalUserGroupKey;
                        });
                    });
                });
            });

        });
	});
};
