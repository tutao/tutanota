"use strict";

goog.provide('tutao.tutanota.ctrl.SendMailFacade');

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
 * @param {Array.<tutao.tutanota.util.DataFile>} attachments The new files that shall be attached to this mail.
 * @param {function(?string, tutao.tutanota.ctrl.RecipientsNotFoundException|tutao.rest.EntityRestException=)} callback Called when finished with the id of
 * the senders mail (only element id, no list id). Provides a RecipientsNotFoundException if some of the recipients could not be found or an EntityRestException
 * if another error occurred.
 */
tutao.tutanota.ctrl.SendMailFacade.sendMail = function(subject, bodyText, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, callback) {
	var accountType = tutao.locator.userController.getLoggedInUser().getAccountType();
	if ((accountType != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE) && (accountType != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM)) {
		callback(null, new Error("invalid account type"));
		return;
	}

    var aes = tutao.locator.aesCrypter;
    var groupKey = tutao.locator.userController.getUserGroupKey();
    var bucketKey = aes.generateRandomKey();
    var mailBoxKey = tutao.locator.mailBoxController.getUserMailBox()._entityHelper.getSessionKey();

    var service = new tutao.entity.tutanota.SendMailData();
    service.setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
        .setSubject(subject)
        .setBodyText(bodyText)
        .setSenderName(senderName)
        .setSenderNameUnencrypted(senderName)
        .setListEncSessionKey(aes.encryptKey(mailBoxKey, service._entityHelper.getSessionKey())) // for sender
        .setSymEncSessionKey(aes.encryptKey(groupKey, service._entityHelper.getSessionKey())) // for sender
        .setBucketEncSessionKey(aes.encryptKey(bucketKey, service._entityHelper.getSessionKey())); // for recipeints

    if (tutao.locator.userController.isInternalUserLoggedIn()) {
        service.setSharableEncSessionKey(aes.encryptKey(tutao.locator.mailBoxController.getUserMailBoxBucketData().getBucketKey(), service._entityHelper.getSessionKey())); // for sharing the mailbox
    } else {
        service.setSharableEncSessionKey(null);
    }
    service.setConversationType(conversationType);
    service.setPreviousMessageId(previousMessageId);

    tutao.util.FunctionUtils.executeSequentially(attachments, function(dataFile, finishedCallback) {
        var fileSessionKey = tutao.locator.aesCrypter.generateRandomKey();
        tutao.tutanota.ctrl.SendMailFacade.uploadAttachmentData(dataFile, fileSessionKey, function(fileData, exception) {
            if (exception) {
                finishedCallback(exception);
                return;
            }
            var attachment = new tutao.entity.tutanota.Attachment(service)
                .setFile(null) // currently no existing files can be attached
                .setFileData(fileData.getId())
                .setFileName(aes.encryptUtf8(fileSessionKey, dataFile.getName(), true))
                .setMimeType(aes.encryptUtf8(fileSessionKey, dataFile.getMimeType(), true))
                .setListEncFileSessionKey(aes.encryptKey(mailBoxKey, fileSessionKey))
                .setBucketEncFileSessionKey(aes.encryptKey(bucketKey, fileSessionKey));
            service.getAttachments().push(attachment);
            finishedCallback();
        });
    }, function(exception) {
        if (exception) {
            callback(null, exception);
            return;
        }

		tutao.tutanota.ctrl.SendMailFacade._handleRecipients(service, toRecipients, ccRecipients, bccRecipients, bucketKey, callback);
	});
};

/**
 * Uploads the given data files and provides a list of files.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file to upload.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @param {function(?tutao.entity.tutanota.FileData,tutao.rest.EntityRestException=)} callback Called when finished with the file data ids DataFile.
 * Receives an exception if the operation fails.
 */
tutao.tutanota.ctrl.SendMailFacade.uploadAttachmentData = function(dataFile, sessionKey, callback) {
    tutao.tutanota.ctrl.FileFacade.uploadFileData(dataFile, sessionKey, function(fileDataId, exception) {
        if (exception) {
            callback(null, exception);
            return;
        }
        tutao.entity.tutanota.FileData.load(fileDataId, function(fileData, exception) {
            if (exception) {
                callback(null, exception);
                return;
            }
            callback(fileData);
        });
    });
};

/**
 * Handles all recipients.
 * @param {tutao.entity.tutanota.SendMailData} service The service data.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {Object} bucketKey The bucket key.
 * @param {function(?string, tutao.tutanota.ctrl.RecipientsNotFoundException|tutao.rest.EntityRestException=)} callback Called when finished with the id of
 * the senders mail (only element id, no list id). Provides a RecipientsNotFoundException if some of the recipients could not be found or an EntityRestException
 * if another error occurred.
 */
tutao.tutanota.ctrl.SendMailFacade._handleRecipients = function(service, toRecipients, ccRecipients, bccRecipients, bucketKey, callback) {
	//not found recipients are collected here. even if recipients are not found, all recipients are checked
	var notFoundRecipients = [];

	tutao.util.FunctionUtils.executeSequentially([{ 'recipientInfoList': toRecipients, 'serviceRecipientList': service.getToRecipients()},
	                                              { 'recipientInfoList': ccRecipients, 'serviceRecipientList': service.getCcRecipients()},
	                                              { 'recipientInfoList': bccRecipients, 'serviceRecipientList': service.getBccRecipients()}],
	function(recipientLists, listFinishedCallback) {
		tutao.util.FunctionUtils.executeSequentially(recipientLists.recipientInfoList, function(recipientInfo, recipientFinishedCallback) {
			var serviceRecipient = new tutao.entity.tutanota.Recipient(service);
			recipientLists.serviceRecipientList.push(serviceRecipient);
			tutao.tutanota.ctrl.SendMailFacade.handleRecipient(recipientInfo, serviceRecipient, bucketKey, notFoundRecipients, recipientFinishedCallback);
		}, function(exception) {
			listFinishedCallback(exception);
		});
	}, function(exception) {
		if (exception) {
			callback(null, exception);
		} else if (notFoundRecipients.length > 0) {
			callback(null, new tutao.tutanota.ctrl.RecipientsNotFoundException(notFoundRecipients));
		} else {
			var map = {};
			service.setup(map, tutao.entity.EntityHelper.createAuthHeaders(), function(sendMailReturn, ex) {
				if (ex) {
					callback(null, ex);
				} else {
					callback(sendMailReturn.getSenderMail()[1]);
				}
			});
		}
	});
};

/**
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipientInfo to copy to recipient.
 * @param {tutao.entity.tutanota.Recipient} recipient The recipient to fill.
 * @param {Object} bucketKey The bucket key.
 * @param {Array.<String>} notFoundRecipients Collects all recipients that are not found.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished, receives an exception if one occurred.
 */
tutao.tutanota.ctrl.SendMailFacade.handleRecipient = function(recipientInfo, recipient, bucketKey, notFoundRecipients, callback) {
	recipient.setName(recipientInfo.getName());
	recipient.setMailAddress(recipientInfo.getMailAddress());

	// copy phone number and password information if this is an external contact
	// otherwise load the key information from the server
	if (recipientInfo.isExternal() && notFoundRecipients.length == 0) {
        // pre-shared password has prio
        var password = recipientInfo.getContactWrapper().getContact().getPresharedPassword();
        var preshared = true;
        if (!password) {
            password = recipientInfo.getContactWrapper().getContact().getAutoTransmitPassword();
            preshared = false;
        }
        if (password == "") {
            password = tutao.tutanota.util.PasswordUtils.generateMessagePassword();
            if (recipientInfo.isExistingContact()) {
                recipientInfo.getContactWrapper().getContact().setAutoTransmitPassword(password);
                recipientInfo.getContactWrapper().getContact().update(function() {});
            }
        }
        console.log(password); //TODO (before beta) just for testing, remove later or dev mode

        var saltHex = tutao.locator.kdfCrypter.generateRandomSalt();
        var saltBase64 = tutao.util.EncodingConverter.hexToBase64(saltHex);
        // TODO (story performance): make kdf async in worker
        tutao.locator.kdfCrypter.generateKeyFromPassphrase(password, saltHex, function(hexKey) {
            var passwordKey = tutao.locator.aesCrypter.hexToKey(hexKey);
            var passwordVerifier = tutao.locator.shaCrypter.hashHex(hexKey);
            tutao.tutanota.ctrl.SendMailFacade.getExternalGroupKey(recipientInfo, passwordKey, passwordVerifier, function(externalUserGroupKey, exception) {
                if (exception) {
                    callback(exception);
                    return;
                }

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
						callback(new tutao.rest.EntityRestException(new Error("no valid password channels for recipient")));
					} else {
						callback();
					}
				} else {
					callback();
				}
			});
		});
	} else if (!recipientInfo.isExternal()) {
		recipient.setType(tutao.entity.tutanota.TutanotaConstants.RECIPIENT_TYPE_INTERNAL);

		// load recipient key information
		var parameters = {};
		tutao.entity.sys.PublicKeyReturn.load(new tutao.entity.sys.PublicKeyData().setMailAddress(recipientInfo.getMailAddress()), parameters, null, function(publicKeyData, exception) {
			if (exception) {
				if (exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 404) {
					notFoundRecipients.push(recipient.getMailAddress());
					callback();
				} else {
					callback(exception);
				}
			} else if (notFoundRecipients.length == 0) {
				var publicKey = tutao.locator.rsaCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(publicKeyData.getPubKey()));
				var hexBucketKey = tutao.locator.aesCrypter.keyToHex(bucketKey);
				tutao.locator.rsaCrypter.encryptAesKey(publicKey, hexBucketKey, function(encrypted, exception) {
					if (exception) {
						callback(exception);
					} else {
						recipient.setPubEncBucketKey(encrypted);
						recipient.setPubKeyVersion(publicKeyData.getPubKeyVersion());
						callback();
					}
				});
			} else {
				// there are already not found recipients, so just skip encryption for this one
				callback();
			}
		});
	} else {
		// it is an external recipient, but there are already not found recipients, so just skip this one
		callback();
	}
};

/**
 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created. Returns the user group key of the external recipient.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipient.
 * @param {string} externalUserPwKey The external user's password key.
 * @param {string} verifier The external user's verifier.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Called when finished with the external user's group key, Receives an exception if one occurred.
 */
tutao.tutanota.ctrl.SendMailFacade.getExternalGroupKey = function(recipientInfo, externalUserPwKey, verifier, callback) {
	var self = this;
	var groupRootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.sys.GroupRoot.ROOT_INSTANCE_ID];
	tutao.entity.sys.RootInstance.load(groupRootId, function(rootInstance, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
        tutao.entity.sys.GroupRoot.load(rootInstance.getReference(), function(groupRoot, exception) {
            if (exception) {
                callback(null, exception);
                return;
            }
            var mailAddressId = tutao.rest.EntityRestInterface.stringToCustomId(recipientInfo.getMailAddress());
            tutao.entity.sys.ExternalUserReference.load([groupRoot.getExternalUserReferences(), mailAddressId], function(externalUserReference, exception) {
                if (exception && exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 404) { // not found
                    // it does not exist, so create it
                    // load the list key of the ExternalRecipients list
                    tutao.entity.EntityHelper.getListKey(groupRoot.getExternalGroupInfos(), function(externalRecipientsListKey, exception) {
                        if (exception) {
                            callback(null, exception);
                            return;
                        }
                        tutao.entity.EntityHelper.getListKey(groupRoot.getExternalGroupInfos(), function(externalGroupInfoListKey, exception) {
                            if (exception) {
                                callback(null, exception);
                                return;
                            }

                            var mailListKey = tutao.locator.aesCrypter.generateRandomKey();
                            var externalUserGroupKey = tutao.locator.aesCrypter.generateRandomKey();
                            var groupInfoSessionKey = tutao.locator.aesCrypter.generateRandomKey();
                            var clientKey = tutao.locator.aesCrypter.generateRandomKey();

                            var externalRecipientData = new tutao.entity.tutanota.ExternalUserData()
                                .setGroupEncMailListKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, mailListKey))
                                .setUserEncClientKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, clientKey))
                                .setVerifier(verifier)
                                .setExternalUserEncGroupInfoSessionKey(tutao.locator.aesCrypter.encryptKey(externalUserGroupKey, externalGroupInfoListKey));
                            var userGroupData = new tutao.entity.tutanota.CreateExternalUserGroupData(externalRecipientData)
                                .setMailAddress(recipientInfo.getMailAddress())
                                .setAdminEncGKey(tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), externalUserGroupKey))
                                .setEncryptedName(tutao.locator.aesCrypter.encryptUtf8(groupInfoSessionKey, recipientInfo.getName(), true))
                                .setGroupInfoListEncSessionKey(tutao.locator.aesCrypter.encryptKey(externalGroupInfoListKey, groupInfoSessionKey))
                                .setSymEncGKey(tutao.locator.aesCrypter.encryptKey(externalUserPwKey, externalUserGroupKey));
                            externalRecipientData.setUserGroupData(userGroupData)
                            .setup([], null, function(nothing, exception) {
                                if (exception) {
                                    callback(null, exception);
                                } else {
                                    callback(externalUserGroupKey);
                                }
                            });
                        });
                    });
                } else if (exception) {
                    callback(null, exception);
                } else {
                    tutao.entity.sys.Group.load(externalUserReference.getUserGroup(), function(externalUserGroup, exception) {
                        if (exception) {
                            callback(null, exception);
                            return;
                        }
                        callback(tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), externalUserGroup.getAdminGroupEncGKey()));
                    });
                }
            });

        });
	});
};
