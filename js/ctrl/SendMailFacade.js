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
		recipient.setType(tutao.entity.tutanota.TutanotaConstants.RECIPIENT_TYPE_EXTERNAL);
		recipient.setPubEncBucketKey(null);
		recipient.setPubKeyVersion(null);
		
		tutao.tutanota.ctrl.SendMailFacade.getCommunicationKey(recipientInfo.getMailAddress(), function(communicationKey, exception) {
			if (exception) {
				callback(exception);
				return;
			}

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
				var symEncBucketKey = tutao.locator.aesCrypter.encryptKey(communicationKey, bucketKey);
				recipient.setSymEncBucketKey(symEncBucketKey);
				var passwordVerifier = tutao.locator.shaCrypter.hashHex(hexKey);
				// the password is not sent to the server if it is pre-shared
				if (!preshared) {
					recipient.setAutoTransmitPassword(password);
				}
				recipient.setPasswordVerifier(passwordVerifier);
				recipient.setSalt(saltBase64);  // starter accounts may not call this facade, so the salt is always sent to the server
				recipient.setSaltHash(tutao.locator.shaCrypter.hashHex(saltHex));
				recipient.setPwEncCommunicationKey(tutao.locator.aesCrypter.encryptKey(passwordKey, communicationKey));
	
				if (!preshared) {
					var numbers = recipientInfo.getContactWrapper().getContact().getPhoneNumbers();
					var nbrOfValidNumbers = 0;
					for (var a = 0; a < numbers.length; a++) {
						var recipientNumber = tutao.tutanota.util.Formatter.getCleanedPhoneNumber(numbers[a].getNumber());
						if (tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber(recipientNumber)) {
							var number = new tutao.entity.tutanota.PasswordChannelPhoneNumber(recipient);
							number.setNumber(recipientNumber);
							number.setMaskedNumber(tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber(recipientNumber));
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
 * Checks that an ExternalRecipient instance with a mail box exists for the given mail address. If it does not exist, it is created. Returns the communication key of the external recipient.
 * @param {String} externalMailAddress The mail address of the external recipient.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Called when finished with the communication key, receives an exception if one occurred.
 */
tutao.tutanota.ctrl.SendMailFacade.getCommunicationKey = function(externalMailAddress, callback) {
	var self = this;
	var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.ExternalRecipient.ROOT_INSTANCE_ID];
	tutao.entity.sys.RootInstance.load(rootId, function(root, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		var mailAddressId = tutao.rest.EntityRestInterface.stringToCustomId(externalMailAddress);
		tutao.entity.tutanota.ExternalRecipient.load([root.getReference(), mailAddressId], function(externalRecipient, exception) {
			if (exception && exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 404) { // not found
				// it does not exist, so create it
				// load the list key of the ExternalRecipients list
                tutao.entity.EntityHelper.getListKey(root.getReference(), function(externalRecipientsListKey, exception) {
					if (exception) {
						callback(null, exception);
						return;
					}
					var extRecipientCommunicationKey = tutao.locator.aesCrypter.generateRandomKey();
					var extRecipientMailListKey = tutao.locator.aesCrypter.generateRandomKey();
				    var data = new tutao.entity.tutanota.ExternalRecipientData();
					data.setMailAddress(externalMailAddress)
					    .setCommunicationKey(tutao.locator.aesCrypter.keyToBase64(extRecipientCommunicationKey)) // encrypted attribute
					    .setCommEncMailListKey(tutao.locator.aesCrypter.encryptKey(extRecipientCommunicationKey, extRecipientMailListKey))
					    .setListEncSessionKey(tutao.locator.aesCrypter.encryptKey(externalRecipientsListKey, data._entityHelper.getSessionKey()))
					    .setup([], null, function(nothing, exception) {
                            if (exception) {
                                callback(null, exception);
                            } else {
                                callback(extRecipientCommunicationKey);
                            }
                        });
				});
			} else if (exception) {
				callback(null, exception);
			} else {
				callback(tutao.locator.aesCrypter.base64ToKey(externalRecipient.getCommunicationKey()));
			}
		});
	});
};

tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber = function(number) {
	var nbrOfVisibleLastDigits = 3;
	var nbrOfMinVisibleFirstDigits = 6; // e.g. +49170
	var nbrOfMinMaskedDigits = 3; // this shall have prio over nbrOfMinVisibleFirstDigits
	var maskChar = "X";

	if (number.length < (nbrOfVisibleLastDigits + nbrOfMinMaskedDigits)) {
		// not enough digits to show some at the beginning, so only show the last digits
		var nbrOfMaskedDigits = Math.ceil(number.length / 2);
		return Array(nbrOfMaskedDigits + 1).join(maskChar) + number.substring(nbrOfMaskedDigits);
	} else {
		var nbrOfMaskedDigits = Math.max(nbrOfMinMaskedDigits, number.length - nbrOfVisibleLastDigits - nbrOfMinVisibleFirstDigits);
		var nbrOfVisibleFirstDigits = number.length - nbrOfMaskedDigits - nbrOfVisibleLastDigits;
		return number.substring(0, nbrOfVisibleFirstDigits) + Array(nbrOfMaskedDigits + 1).join(maskChar) + number.substring(nbrOfVisibleFirstDigits + nbrOfMaskedDigits);
	}
};

