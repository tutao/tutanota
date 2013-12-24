"use strict";

goog.provide('tutao.tutanota.ctrl.SendUnsecureMailFacade');

/**
 * Sends a mail to tutanota and external recipients.
 * @param {string} subject The subject of the mail.
 * @param {string} bodyText The bodyText of the mail.
 * @param {string} senderName The name of the sender that is sent together with the mail address of the sender.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} toRecipients The recipients the mail shall be sent to.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} ccRecipients The recipients the mail shall be sent to in cc.
 * @param {Array.<tutao.tutanota.ctrl.RecipientInfo>} bccRecipients The recipients the mail shall be sent to in bcc.
 * @param {string} conversationType See TutanotaConstants.
 * @param {string} previousMessageId The id of the message that this mail is a reply or forward to. Empty string if this is a new mail.
 * @param {Array.<tutao.tutanota.util.DataFile>} attachments The new files that shall be attached to this mail.
 * @param {function(string, tutao.tutanota.ctrl.RecipientsNotFoundException|tutao.rest.EntityRestException=)} callback Called when finished with the id of
 * the senders mail (only element id, no list id). Provides a RecipientsNotFoundException if some of the recipients could not be found or an EntityRestException
 * if another error occurred.
 */
tutao.tutanota.ctrl.SendUnsecureMailFacade.sendMail = function(subject, bodyText, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, callback) {
	var aes = tutao.locator.aesCrypter;
	var groupKey = tutao.locator.userController.getUserGroupKey();
	var sharableKey = tutao.locator.mailBoxController.getUserMailBoxBucketData().getBucketKey();
	var mailBoxKey = tutao.locator.mailBoxController.getUserMailBox()._entityHelper.getSessionKey();
	var sessionKey = tutao.locator.aesCrypter.generateRandomKey();

	var service = new tutao.entity.tutanota.SendUnsecureMailData();
    service.setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
	    .setSubject(subject)
	    .setBodyText(bodyText)
	    .setSenderName(senderName)
	    .setConversationType(conversationType)
	    .setPreviousMessageId(previousMessageId)
	    .setMailSessionKey(tutao.util.EncodingConverter.hexToBase64(aes.keyToHex(sessionKey))) // for recipients
	    .setListEncSessionKey(aes.encryptKey(mailBoxKey, sessionKey)) // for sender
	    .setSymEncSessionKey(aes.encryptKey(groupKey, sessionKey)) // for sender
	    .setSharableEncSessionKey(aes.encryptKey(sharableKey, sessionKey)); // for sharing the mailbox

	tutao.tutanota.ctrl.SendMailFacade.uploadAttachmentData(attachments, function(fileDatas, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}

		for (var i = 0; i < attachments.length; i++) {
			var fileSessionKey = fileDatas[i]._entityHelper.getSessionKey();
			var attachment = new tutao.entity.tutanota.UnsecureAttachment(service)
			    .setFile(null) // currently no existing files can be attached
			    .setFileData(fileDatas[i].getId())
			    .setFileName(aes.encryptUtf8(fileSessionKey, attachments[i].getName(), true))
			    .setMimeType(aes.encryptUtf8(fileSessionKey, attachments[i].getMimeType(), true))
			    .setFileSessionKey(tutao.util.EncodingConverter.hexToBase64(aes.keyToHex(fileSessionKey)))
			    .setListEncFileSessionKey(aes.encryptKey(mailBoxKey, fileSessionKey));
			service.getAttachments().push(attachment);
		}

		for (var i = 0; i < toRecipients.length; i++) {
			var recipient = new tutao.entity.tutanota.UnsecureRecipient(service);
			recipient.setName(toRecipients[i].getName());
			recipient.setMailAddress(toRecipients[i].getMailAddress());
			service.getToRecipients().push(recipient);
		}
		for (var i = 0; i < ccRecipients.length; i++) {
			var recipient = new tutao.entity.tutanota.UnsecureRecipient(service);
			recipient.setName(ccRecipients[i].getName());
			recipient.setMailAddress(ccRecipients[i].getMailAddress());
			service.getCcRecipients().push(recipient);
		}
		for (var i = 0; i < bccRecipients.length; i++) {
			var recipient = new tutao.entity.tutanota.UnsecureRecipient(service);
			recipient.setName(bccRecipients[i].getName());
			recipient.setMailAddress(bccRecipients[i].getMailAddress());
			service.getBccRecipients().push(recipient);
		}
		var map = {};
		service.setup(map, tutao.entity.EntityHelper.createAuthHeaders(), function(sendUnsecureMailReturn, ex) {
			var mailElementId = sendUnsecureMailReturn.getSenderMail()[1];
			if (ex) {
				callback(null, ex);
			} else {
				callback(mailElementId);
			}
		});
	});
};
