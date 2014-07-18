"use strict";

goog.provide('ExporterTest');

AsyncTestCase("ExporterTest", {
    "test toEml": function (queue) {
    var mail = new tutao.entity.tutanota.Mail();
    mail.setSender(new tutao.entity.tutanota.MailAddress(mail)
            .setAddress("sender@tutao.de"))
        .setSentDate(new Date(Date.UTC(2011, 11, 12, 4, 3, 2)))
        .setSubject("Halli Hallo!");
    mail.getToRecipients().push(new tutao.entity.tutanota.MailAddress(mail)
        .setAddress("to1@tutao.de"));
    mail.getToRecipients().push(new tutao.entity.tutanota.MailAddress(mail)
        .setAddress("to2@tutao.de"));
    mail.getCcRecipients().push(new tutao.entity.tutanota.MailAddress(mail)
        .setAddress("cc@tutao.de"));
    mail.getCcRecipients().push(new tutao.entity.tutanota.MailAddress(mail)
        .setAddress("bcc@tutao.de"));

    var displayedMail = new tutao.tutanota.ctrl.DisplayedMail(mail);
    displayedMail.bodyText("This is the body<br> Kind regards");
    // TODO replace tutao.tutanota.ctrl.FileFacade.readFileData and test attachments

    queue.call('test', function (callbacks) {
        var doneHandler = callbacks.add(function(e) {
            if (e) {
                throw e;
            }
        });

        tutao.tutanota.util.Exporter.toEml(displayedMail).then(callbacks.add(function (eml) {

            var expected = [
                "From: sender@tutao.de",
                "MIME-Version: 1.0",
                "To: to1@tutao.de,",
                "   to2@tutao.de",
                "CC: cc@tutao.de,",
                "   bcc@tutao.de",
                "Subject: =?UTF-8?B?SGFsbGkgSGFsbG8h?=",
                "Date: Tue, 12 Dec 2011 04:03:02 +0000",
                "Content-Type: multipart/mixed; boundary=\"------------79Bu5A16qPEYcVIZL@tutanota\"",
                "",
                "--------------79Bu5A16qPEYcVIZL@tutanota",
                "Content-Type: text/html; charset=UTF-8",
                "Content-transfer-encoding: base64",
                "",
                "VGhpcyBpcyB0aGUgYm9keTxicj4gS2luZCByZWdhcmRz",
                "",
                "--------------79Bu5A16qPEYcVIZL@tutanota--"].join("\r\n");
            assertEquals(expected, eml);
        })).done(doneHandler, doneHandler);
    });
}
});