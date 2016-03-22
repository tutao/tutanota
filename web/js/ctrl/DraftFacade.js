"use strict";

tutao.provide('tutao.tutanota.ctrl.DraftFacade');

/**
 * Creates a draft mail.
 * @param {string} subject The subject of the mail.
 * @param {string} bodyText The bodyText of the mail.
 * @param {string} senderMailAddress The senders mail address.
 * @param {string} senderName The name of the sender that is sent together with the mail address of the sender.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {string} conversationType See TutanotaConstants.
 * @param {string} previousMessageId The id of the message that this mail is a reply or forward to. Null if this is a new mail.
 * @param {?Array.<tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile>} attachments The files that shall be attached to this mail or null if no files shall be attached.
 * @param {bool} confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
 * @return {Promise.<tutao.entity.tutanota.Mail, tutao.TooManyRequestsError|tutao.AccessBlockedError>} Resolved finished with the draft mail. Rejected with TooManyRequestsError if the number allowed mails was exceeded, AccessBlockedError if the customer is not allowed to send emails currently because he is marked for approval.
 */
tutao.tutanota.ctrl.DraftFacade.createDraft = function(subject, bodyText, senderMailAddress, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, confidential) {
    var aes = tutao.locator.aesCrypter;
    var groupKey = tutao.locator.userController.getUserGroupKey();
    var mailBoxKey = tutao.locator.mailBoxController.getUserMailBox().getEntityHelper().getSessionKey();

    var service = new tutao.entity.tutanota.DraftCreateData();
    service.setPreviousMessageId(previousMessageId)
        .setConversationType(conversationType)
        .setListEncSessionKey(aes.encryptKey(mailBoxKey, service.getEntityHelper().getSessionKey()))
        .setSymEncSessionKey(aes.encryptKey(groupKey, service.getEntityHelper().getSessionKey()));

    service.setDraftData(new tutao.entity.tutanota.DraftData(service)
        .setSubject(subject)
        .setBodyText(bodyText)
        .setSenderMailAddress(senderMailAddress)
        .setSenderName(senderName)
        .setConfidential(confidential)
    );

    if (tutao.locator.userController.isInternalUserLoggedIn()) {
        service.setSharableEncSessionKey(aes.encryptKey(tutao.locator.mailBoxController.getUserMailBoxBucketData().getBucketKey(), service.getEntityHelper().getSessionKey())); // for sharing the mailbox
    } else {
        service.setSharableEncSessionKey(null);
    }

    var attachmentPromise = null;
    if (attachments) {
        attachmentPromise = Promise.each(attachments, function(dataFile) {
            var attachment = new tutao.entity.tutanota.DraftAttachment(service);
            return tutao.tutanota.ctrl.DraftFacade._createAttachment(attachment, dataFile).then(function (fileSessionKey) {
                attachment.setListEncFileSessionKey(aes.encryptKey(mailBoxKey, fileSessionKey));
                service.getDraftData().getAddedAttachments().push(attachment);
            });
        });
    } else {
        attachmentPromise = Promise.resolve();
    }
    return attachmentPromise.then(function() {
        return tutao.tutanota.ctrl.DraftFacade._addRecipients(service, toRecipients, service.getDraftData().getToRecipients()).then(function() {
            return tutao.tutanota.ctrl.DraftFacade._addRecipients(service, ccRecipients, service.getDraftData().getCcRecipients()).then(function() {
                return tutao.tutanota.ctrl.DraftFacade._addRecipients(service, bccRecipients, service.getDraftData().getBccRecipients());
            });
        });
    }).then(function() {
        return service.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(createDraftReturn) {
            return tutao.entity.tutanota.Mail.load(createDraftReturn.getDraft());
        });
    });
};

/**
 * Updates a draft mail. Does not make sure that the body is updated on client side. this has to be done by the web socket connection.
 * @param {string} subject The subject of the mail.
 * @param {string} bodyText The bodyText of the mail.
 * @param {string} senderMailAddress The senders mail address.
 * @param {string} senderName The name of the sender that is sent together with the mail address of the sender.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {?Array.<tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile>} attachments The files that shall be attached to this mail or null if the current attachments shall not be changed.
 * @param {bool} confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
 * @param {tutao.entity.tutanota.Mail} draft The draft to update.
 * @return {Promise.<tutao.TooManyRequestsError|tutao.AccessBlockedError>} Resolved finished. Rejected with TooManyRequestsError if the number allowed mails was exceeded, AccessBlockedError if the customer is not allowed to send emails currently because he is marked for approval.
 */
tutao.tutanota.ctrl.DraftFacade.updateDraft = function(subject, bodyText, senderMailAddress, senderName, toRecipients, ccRecipients, bccRecipients, attachments, confidential, draft) {
    var aes = tutao.locator.aesCrypter;
    var mailBoxKey = tutao.locator.mailBoxController.getUserMailBox().getEntityHelper().getSessionKey();

    var service = new tutao.entity.tutanota.DraftUpdateData();
    service.getEntityHelper().setSessionKey(draft.getEntityHelper().getSessionKey());
    service.setDraft(draft.getId());

    service.setDraftData(new tutao.entity.tutanota.DraftData(service)
            .setSubject(subject)
            .setBodyText(bodyText)
            .setSenderMailAddress(senderMailAddress)
            .setSenderName(senderName)
            .setConfidential(confidential)
    );

    var attachmentPromise = null;
    if (attachments) {
        // check which attachments have been removed
        attachmentPromise = Promise.each(draft.getAttachments(), function (fileId) {
            var existing = false;
            for (var i = 0; i < attachments.length; i++) {
                if ((attachments[i] instanceof tutao.entity.tutanota.File) && tutao.rest.EntityRestInterface.sameListElementIds(attachments[i].getId(), fileId)) {
                    existing = true;
                    break;
                }
            }
            if (!existing) {
                service.getDraftData().getRemovedAttachments().push(fileId);
            }
        }).then(function () {
            // add new attachments
            return Promise.each(attachments, function (dataFile) {
                // check if this is a new attachment or an existing one
                var existing = false;
                if (!(dataFile instanceof tutao.entity.tutanota.File) || !tutao.rest.EntityRestInterface.containsId(draft.getAttachments(), dataFile.getId())) {
                    var attachment = new tutao.entity.tutanota.DraftAttachment(service);
                    return tutao.tutanota.ctrl.DraftFacade._createAttachment(attachment, dataFile).then(function (fileSessionKey) {
                        attachment.setListEncFileSessionKey(aes.encryptKey(mailBoxKey, fileSessionKey));
                        service.getDraftData().getAddedAttachments().push(attachment);
                    });
                }
            });
        });
    } else {
        attachmentPromise = Promise.resolve();
    }
    return attachmentPromise.then(function () {
        return tutao.tutanota.ctrl.DraftFacade._addRecipients(service, toRecipients, service.getDraftData().getToRecipients()).then(function() {
            return tutao.tutanota.ctrl.DraftFacade._addRecipients(service, ccRecipients, service.getDraftData().getCcRecipients()).then(function() {
                return tutao.tutanota.ctrl.DraftFacade._addRecipients(service, bccRecipients, service.getDraftData().getBccRecipients());
            });
        });
    }).then(function() {
        return service.update({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(draftUpdateReturn) {
            // replace the data on the draft, because we can not rely on the web socket update, especially when sending directly after updating
            draft.setSubject(subject);
            draft.getSender().setAddress(senderMailAddress);
            draft.getSender().setName(senderName);
            draft.setConfidential(confidential);
            tutao.tutanota.ctrl.DraftFacade._updateRecipientsOnDraft(draft, toRecipients, draft.getToRecipients());
            tutao.tutanota.ctrl.DraftFacade._updateRecipientsOnDraft(draft, ccRecipients, draft.getCcRecipients());
            tutao.tutanota.ctrl.DraftFacade._updateRecipientsOnDraft(draft, bccRecipients, draft.getBccRecipients());
            // use the attachments returned from the service because these are the new file ids
            draft.getAttachments().length = 0;
            Array.prototype.push.apply(draft.getAttachments(), draftUpdateReturn.getAttachments());
        });
    });
};

/**
 * Uploads the given data files or sets the file if it is already existing files (e.g. forwarded files)
 * @param {tutao.entity.tutanota.DraftAttachment} attachment The attachment
 * @param {tutao.tutanota.util.DataFile|tutao.entity.tutanota.File|tutao.native.AndroidFile} dataFile File to upload.
 * @return {Promise.<Object>} Resolves to the session key of the file, rejects if failed.
 */
tutao.tutanota.ctrl.DraftFacade._createAttachment = function(attachment, dataFile) {
    var aes = tutao.locator.aesCrypter;
    if (dataFile instanceof tutao.entity.tutanota.File) {
        // forwarded attachment
        var fileSessionKey = dataFile.getEntityHelper().getSessionKey();
        attachment.setExistingFile(dataFile.getId());
        return Promise.resolve(fileSessionKey);
    } else if (dataFile instanceof tutao.tutanota.util.DataFile || dataFile instanceof tutao.native.AndroidFile) {
        // user added attachment
        var fileSessionKey = tutao.locator.aesCrypter.generateRandomKey();
        return tutao.locator.fileFacade.uploadFileData(dataFile, fileSessionKey).then(function (fileDataId) {
            var newAttachmentData = new tutao.entity.tutanota.NewDraftAttachment(attachment._parent);
            newAttachmentData.setEncFileName(aes.encryptUtf8(fileSessionKey, dataFile.getName()))
                .setEncMimeType(aes.encryptUtf8(fileSessionKey, dataFile.getMimeType()))
                .setFileData(fileDataId);
            attachment.setNewFile(newAttachmentData);
            return fileSessionKey;
        });
    } else {
        return Promise.reject(new Error("illegal file type as attachment"))
    }
};

tutao.tutanota.ctrl.DraftFacade._uploadAttachmentData = function(dataFile, sessionKey) {
    return tutao.locator.fileFacade.uploadFileData(dataFile, sessionKey).then(function(fileDataId) {
        return tutao.entity.tutanota.FileData.load(fileDataId);
    });
};

/**
 * Adds the given recipient to the given recipient list.
 * @param {tutao.entity.tutanota.DraftCreateData|tutao.entity.tutanota.DraftUpdateData} service The service data.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} recipientInfos The recipients that shall be added.
 * @param {Array.<tutao.entity.tutanota.DraftRecipient>} targetRecipientList The list to add the recipient to..
 * @return {Promise.<Array<string>, tutao.RecipientsNotFoundError>} Resolved when finished with the id of
 * the senders mail (only element id, no list id). Rejects with an RecipientsNotFoundError if some of the recipients could not be found.
 */
tutao.tutanota.ctrl.DraftFacade._addRecipients = function(service, recipientInfos, targetRecipientList) {
    return Promise.each(recipientInfos, function(recipientInfo) {
        targetRecipientList.push(new tutao.entity.tutanota.DraftRecipient(service)
            .setMailAddress(recipientInfo.getMailAddress())
            .setName(recipientInfo.getName()));
    });
};

/**
 * Sets the given recipient to the given list of recipients of the draft.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} recipientInfos The recipients that shall be set.
 * @param {Array.<tutao.entity.tutanota.MailAddress>} draftRecipients The list to set the recipient in.
 * @param {tutao.entity.tutanota.Mail} draft The draft.
 */
tutao.tutanota.ctrl.DraftFacade._updateRecipientsOnDraft = function(draft, recipientInfos, draftRecipients) {
    draftRecipients.length = 0;
    for (var i=0; i<recipientInfos.length; i++) {
        var mailAddress = new tutao.entity.tutanota.MailAddress(draft);
        mailAddress.setAddress(recipientInfos[i].getMailAddress());
        mailAddress.setName(recipientInfos[i].getName());
        draftRecipients.push(mailAddress);
    }
};

/**
 * Sends a draft mail to all recipients.
 * @param {tutao.entity.tutanota.Mail} draft The draft mail.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} recipientInfos The recipients the mail shall be sent to.
 * @param {string} language Notification mail language.
 * @return {Promise.<Array<string>, tutao.RecipientsNotFoundError|tutao.TooManyRequestsError|tutao.AccessBlockedError>} Resolved finished with the id of the senders mail (only element id, no list id). Rejected with a
 * RecipientsNotFoundError if some of the recipients could not be found, rejected with TooManyRequestsError if the number allowed mails was exceeded, AccessBlockedError if the customer is not allowed to send emails currently because he is marked for approval.
 */
tutao.tutanota.ctrl.DraftFacade.sendDraft = function(draft, recipientInfos, language) {
    var aes = tutao.locator.aesCrypter;
    var bucketKey = aes.generateRandomKey();

    var secure = draft.getConfidential();

    var service = new tutao.entity.tutanota.SendDraftData();
    service.setLanguage(language)
        .setMail(draft.getId());

    return Promise.each(draft.getAttachments(), function(fileId) {
        return tutao.entity.tutanota.File.load(fileId).then(function(file) {
            var fileSessionKey = file.getEntityHelper().getSessionKey();
            var data = new tutao.entity.tutanota.AttachmentKeyData(service)
                .setFile(fileId);
            if (secure) {
                data.setBucketEncFileSessionKey(aes.encryptKey(bucketKey, fileSessionKey));
            } else {
                data.setFileSessionKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.aesCrypter.keyToHex(fileSessionKey)));
            }
            service.getAttachmentKeyData().push(data);
        });
    }).then(function() {
        var mailSessionKey = draft.getEntityHelper().getSessionKey();
        if (secure) {
            service.setBucketEncMailSessionKey(aes.encryptKey(bucketKey, mailSessionKey));
            if (tutao.tutanota.ctrl.DraftFacade._containsSecureExternalRecipients(recipientInfos)) {
                service.setSenderNameUnencrypted(draft.getSender().getName()); // needed for the notification mail
            }
            return tutao.tutanota.ctrl.DraftFacade._addRecipientKeyData(bucketKey, service, draft.getToRecipients(), recipientInfos).then(function() {
                return tutao.tutanota.ctrl.DraftFacade._addRecipientKeyData(bucketKey, service, draft.getCcRecipients(), recipientInfos).then(function() {
                    return tutao.tutanota.ctrl.DraftFacade._addRecipientKeyData(bucketKey, service, draft.getBccRecipients(), recipientInfos);
                });
            });
        } else {
            service.setMailSessionKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.aesCrypter.keyToHex(mailSessionKey)));
        }
    }).then(function() {
        return service.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(sendDraftReturn) {
            return sendDraftReturn.getSentMail();
        });
    });
};

tutao.tutanota.ctrl.DraftFacade._containsSecureExternalRecipients = function(recipientInfos) {
    for (var i=0; i<recipientInfos.length; i++) {
        if (recipientInfos[i].isExternal() && recipientInfos[i].isSecure()) {
            return true;
        }
    }
    return false;
};

tutao.tutanota.ctrl.DraftFacade._addRecipientKeyData = function(bucketKey, service, recipients, recipientInfos) {
    var notFoundRecipients = [];
    return Promise.each(recipients, function(recipient) {
        if (recipient.getAddress() == "system@tutanota.de") {
            notFoundRecipients.push(recipient.getAddress());
            return Promise.resolve();
        }

        var recipientInfo = null;
        for (var i=0; i<recipientInfos.length; i++) {
            if (recipientInfos[i].getMailAddress() == recipient.getAddress()) {
                recipientInfo = recipientInfos[i];
                break;
            }
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
                    return tutao.tutanota.ctrl.DraftFacade._getExternalGroupKey(recipientInfo, passwordKey, passwordVerifier).then(function(externalUserGroupKey) {
                        var data = new tutao.entity.tutanota.SecureExternalRecipientKeyData(service);
                        data.setMailAddress(recipient.getAddress());
                        // the password is not sent to the server if it is pre-shared
                        if (!preshared) {
                            data.setAutoTransmitPassword(password);
                        }
                        data.setSymEncBucketKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, bucketKey));
                        data.setPasswordVerifier(passwordVerifier);
                        data.setSalt(saltBase64);  // starter accounts may not call this facade, so the salt is always sent to the server
                        data.setSaltHash(tutao.locator.shaCrypter.hashHex(saltHex));
                        data.setPwEncCommunicationKey(tutao.locator.aesCrypter.encryptKey(passwordKey, externalUserGroupKey));

                        if (!preshared) {
                            var numbers = recipientInfo.getContactWrapper().getContact().getPhoneNumbers();
                            var nbrOfValidNumbers = 0;
                            for (var a = 0; a < numbers.length; a++) {
                                var recipientNumber = tutao.tutanota.util.Formatter.getCleanedPhoneNumber(numbers[a].getNumber());
                                if (tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber(recipientNumber)) {
                                    var number = new tutao.entity.tutanota.PasswordChannelPhoneNumber(recipient)
                                        .setNumber(recipientNumber);
                                    data.getPasswordChannelPhoneNumbers().push(number);
                                    nbrOfValidNumbers++;
                                }
                            }
                            if (nbrOfValidNumbers == 0) {
                                throw new Error("no valid password channels for recipient");
                            }
                        }
                        service.getSecureExternalRecipientKeyData().push(data);
                    });
                });
            });
        } else if (!recipientInfo.isExternal()) {
            return tutao.entity.sys.PublicKeyReturn.load(new tutao.entity.sys.PublicKeyData().setMailAddress(recipientInfo.getMailAddress()), {}, null).then(function(publicKeyData) {
                if (notFoundRecipients.length == 0) {
                    var publicKey = tutao.locator.rsaUtil.hexToPublicKey(tutao.util.EncodingConverter.base64ToHex(publicKeyData.getPubKey()));
                    var hexBucketKey = new Uint8Array(tutao.util.EncodingConverter.hexToBytes(tutao.locator.aesCrypter.keyToHex(bucketKey)));
                    return tutao.locator.crypto.rsaEncrypt(publicKey, hexBucketKey).then(function(encrypted) {
                        var data = new tutao.entity.tutanota.InternalRecipientKeyData(service);
                        data.setMailAddress(recipient.getAddress());
                        data.setPubEncBucketKey(tutao.util.EncodingConverter.uint8ArrayToBase64(encrypted));
                        data.setPubKeyVersion(publicKeyData.getPubKeyVersion());
                        service.getInternalRecipientKeyData().push(data);
                    });
                }
            }).caught(tutao.NotFoundError, function(exception) {
                notFoundRecipients.push(recipient.getAddress());
            });
        }
    }).then(function() {
        if (notFoundRecipients.length > 0) {
            throw new tutao.RecipientsNotFoundError(notFoundRecipients);
        }
    });
};

/**
 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created. Returns the user group key of the external recipient.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipient.
 * @param {Object} externalUserPwKey The external user's password key.
 * @param {string} verifier The external user's verifier.
 * @return {Promise.<Object>} Resolved to the the external user's group key, rejected if an error occured
 */
tutao.tutanota.ctrl.DraftFacade._getExternalGroupKey = function(recipientInfo, externalUserPwKey, verifier) {
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