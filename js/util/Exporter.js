"use strict";

goog.provide('tutao.tutanota.util.Exporter');

/**
 * Converts a mail into the plain text EML format.
 * @param {tutao.tutanota.ctrl.DisplayedMail} displayedMail The mail we want to export.
 * @return {Promise.<string, Error>} callback Called when the mail has been exported.
 */
tutao.tutanota.util.Exporter.toEml = function(displayedMail) {
    return new Promise(function (resolve, reject) {
        // @type {tutao.entity.tutanota.Mail}
        var mail = displayedMail.mail;
        var emlArray = ["From: " + mail.getSender().getAddress(),
            "MIME-Version: 1.0"];
        if (mail.getToRecipients().length > 0) {
            emlArray.push(tutao.tutanota.util.Exporter._formatRecipient("To: ", mail.getToRecipients()));
        }
        if (mail.getCcRecipients().length > 0) {
            emlArray.push(tutao.tutanota.util.Exporter._formatRecipient("CC: ", mail.getCcRecipients()));
        }
        if (mail.getBccRecipients().length > 0) {
            emlArray.push(tutao.tutanota.util.Exporter._formatRecipient("BCC: ", mail.getBccRecipients()));
        }
        emlArray = emlArray.concat([
            "Subject: =?UTF-8?B?" + tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.utf8ToHex(mail.getSubject())) + "?=",
            "Date: " + tutao.tutanota.util.Formatter.formatSmtpDateTime(mail.getSentDate()),
            // TODO (later) load conversation entries and write message id and references
            //"Message-ID: " + // <006e01cf442b$52864f10$f792ed30$@tutao.de>
            //References: <53074EB8.4010505@tutao.de> <DD374AF0-AC6D-4C58-8F38-7F6D8A0307F3@tutao.de> <530E3529.70503@tutao.de>
            "Content-Type: multipart/mixed; boundary=\"------------79Bu5A16qPEYcVIZL@tutanota\"",
            "",
            "--------------79Bu5A16qPEYcVIZL@tutanota",
            "Content-Type: text/html; charset=UTF-8",
            "Content-transfer-encoding: base64",
            "",
            tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.utf8ToHex(displayedMail.bodyText())).match(/.{1,78}/g).join("\r\n"),
            ""
        ]);

        // @type {Array.<tutao.entity.tutanota.File>}
        var attachments = displayedMail.attachments();
        resolve(Promise.map(attachments, function(attachment, index, arrayLength) {
            return new Promise(function(resolve, reject) {
                tutao.tutanota.ctrl.FileFacade.readFileData(attachment, function(dataFile, exception) {
                    if (exception) {
                        reject(exception);
                        return;
                    }
                    var base64Filename = "=?UTF-8?B?" + tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.utf8ToHex(attachment.getName())) + "?=";
                    emlArray = emlArray.concat([
                        "--------------79Bu5A16qPEYcVIZL@tutanota",
                        "Content-Type: " + attachment.getMimeType(),
                        " name=" + base64Filename + "",
                        "Content-Transfer-Encoding: base64",
                        "Content-Disposition: attachment;",
                        " filename=" + base64Filename + "",
                        "",
                        tutao.util.EncodingConverter.arrayBufferToBase64(dataFile.getData()).match(/.{1,78}/g).join("\r\n")
                    ]);
                    resolve();
                });
            });
        }).then(function() {
                emlArray.push("--------------79Bu5A16qPEYcVIZL@tutanota--");
                var eml = emlArray.join("\r\n");
                return eml;
            }));
    });
};

tutao.tutanota.util.Exporter._formatRecipient = function(key, recipients) {
    var recipientsString = key;
    for(var i = 0; i < recipients.length; i++) {
        recipientsString += recipients[i].getAddress() + ",\r\n" + new Array(key.length).join(' ');
    }
    return recipientsString.substr(0, recipientsString.length - (2 + key.length));
};