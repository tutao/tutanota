"use strict";

tutao.provide('tutao.tutanota.ctrl.SendMailFromExternalFacade');

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
 * @param {string} language Notification mail language.
 * @return {Promise.<string, tutao.RecipientsNotFoundError>} Resolves to the senders mail id (only element id, no list id),
 * rejected with an RecipientsNotFoundError if some of the recipients could not be found.
 */
tutao.tutanota.ctrl.SendMailFromExternalFacade.sendMail = function(subject, bodyText, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, language) {
    var aes = tutao.locator.aesCrypter;
    var groupKey = tutao.locator.userController.getUserGroupKey();
    var senderBucketKey = aes.generateRandomKey();
    var recipientBucketKey = aes.generateRandomKey();

    var service = new tutao.entity.tutanota.SendMailFromExternalData();
    service.setLanguage(language)
        .setSubject(subject)
        .setBodyText(bodyText)
        .setSenderName(senderName)
        .setSenderBucketEncSessionKey(aes.encryptKey(senderBucketKey, service._entityHelper.getSessionKey()))
        .setRecipientBucketEncSessionKey(aes.encryptKey(recipientBucketKey, service._entityHelper.getSessionKey()))
        .setSenderSymEncBucketKey(aes.encryptKey(groupKey, senderBucketKey))
        .setPreviousMessageId(previousMessageId)
        .setConfidential(true);

    return Promise.map(attachments, function(dataFile) {
        var attachment = new tutao.entity.tutanota.AttachmentFromExternal(service);
        return tutao.tutanota.ctrl.SendMailFacade.createAttachment(attachment, dataFile).then(function(fileSessionKey) {
            attachment.setSenderBucketEncFileSessionKey(aes.encryptKey(senderBucketKey, fileSessionKey))
                .setRecipientBucketEncFileSessionKey(aes.encryptKey(recipientBucketKey, fileSessionKey));
            service.getAttachments().push(attachment);
        });
    }).then(function() {
        var notFoundRecipients = [];
        var serviceRecipient = new tutao.entity.tutanota.Recipient(service);
        service.setToRecipient(serviceRecipient);
        return tutao.tutanota.ctrl.SendMailFacade.handleRecipient(toRecipients[0], serviceRecipient, recipientBucketKey, notFoundRecipients).then(function() {
            if (notFoundRecipients.length > 0) {
                throw new tutao.RecipientsNotFoundError(notFoundRecipients);
            } else {
                var map = {};
                return service.setup(map, tutao.entity.EntityHelper.createAuthHeaders()).then(function(sendMailFromExternalReturn) {
                    return sendMailFromExternalReturn.getSenderMail()[1];
                });
            }
        });
    });
};
