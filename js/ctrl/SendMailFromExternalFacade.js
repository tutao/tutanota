"use strict";

goog.provide('tutao.tutanota.ctrl.SendMailFromExternalFacade');

/**
 * Sends a secure mail to internal and external recipients. For external recipients the password and password channels must be set.
 * @param {string} subject The subject of the mail.
 * @param {string} bodyText The bodyText of the mail.
 * @param {string} senderName The name of the sender that is sent together with the mail address of the sender.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {string} conversationType See TutanotaConstants.
 * @param {string} previousMessageId The id of the message that this mail is a reply or forward to. Empty string if this is a new mail.
 * @param {Array.<tutao.tutanota.util.DataFile>} attachments The new files that shall be attached to this mail.
 * @param {function(?string, tutao.tutanota.ctrl.RecipientsNotFoundException|tutao.rest.EntityRestException=)} callback Called when finished with the id of
 * the senders mail (only element id, no list id). Provides a RecipientsNotFoundException if some of the recipients could not be found or an EntityRestException
 * if another error occurred.
 */
tutao.tutanota.ctrl.SendMailFromExternalFacade.sendMail = function(subject, bodyText, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, callback) {
	tutao.tutanota.ctrl.SendMailFacade.uploadAttachmentData(attachments, function(fileDatas, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		var aes = tutao.locator.aesCrypter;
		var groupKey = tutao.locator.userController.getUserGroupKey();
		var senderBucketKey = aes.generateRandomKey();
		var recipientBucketKey = aes.generateRandomKey();

		var service = new tutao.entity.tutanota.SendMailFromExternalData();
        service.setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
		    .setSubject(subject)
		    .setBodyText(bodyText)
		    .setSenderName(senderName)
		    .setSenderBucketEncSessionKey(aes.encryptKey(senderBucketKey, service._entityHelper.getSessionKey()))
		    .setRecipientBucketEncSessionKey(aes.encryptKey(recipientBucketKey, service._entityHelper.getSessionKey()))
		    .setSenderSymEncBucketKey(aes.encryptKey(groupKey, senderBucketKey))
		    .setPreviousMessageId(previousMessageId);

		for (var i = 0; i < attachments.length; i++) {
			var fileSessionKey = fileDatas[i]._entityHelper.getSessionKey();
			var attachment = new tutao.entity.tutanota.AttachmentFromExternal(service)
			    .setFileData(fileDatas[i].getId())
			    .setFileName(aes.encryptUtf8(fileSessionKey, attachments[i].getName(), true))
			    .setMimeType(aes.encryptUtf8(fileSessionKey, attachments[i].getMimeType(), true))
			    .setSenderBucketEncFileSessionKey(aes.encryptKey(senderBucketKey, fileSessionKey))
			    .setRecipientBucketEncFileSessionKey(aes.encryptKey(recipientBucketKey, fileSessionKey));
			service.getAttachments().push(attachment);
		}

		var notFoundRecipients = [];
		var serviceRecipient = new tutao.entity.tutanota.Recipient(service);
		service.setToRecipient(serviceRecipient);
		tutao.tutanota.ctrl.SendMailFacade.handleRecipient(toRecipients[0], serviceRecipient, recipientBucketKey, notFoundRecipients, function(exception) {
			if (exception) {
				callback(null, exception);
			} else if (notFoundRecipients.length > 0) {
				callback(null, new tutao.tutanota.ctrl.RecipientsNotFoundException(notFoundRecipients));
			} else {
				var map = {};
				service.setup(map, tutao.entity.EntityHelper.createAuthHeaders(), function(sendMailFromExternalReturn, ex) {
					if (ex) {
						callback(null, ex);
					} else {
						callback(sendMailFromExternalReturn.getSenderMail()[1]);
					}
				});
			}
		});
	});
};
