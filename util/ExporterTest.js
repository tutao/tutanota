"use strict";

goog.provide('ExporterTest');

AsyncTestCase("ExporterTest", {
    "test toEml": function (queue) {
    var mail = new tutao.entity.tutanota.Mail()
        .setSender(new tutao.entity.tutanota.MailAddress()
            .setAddress("sender@tutao.de"))
        .setSentDate(new Date(2011, 11, 12, 4, 3, 2))
        .setSubject("Halli Hallo!");
    mail.getToRecipients().push(new tutao.entity.tutanota.MailAddress()
        .setAddress("to1@tutao.de"));
    mail.getToRecipients().push(new tutao.entity.tutanota.MailAddress()
        .setAddress("to2@tutao.de"));
    mail.getCcRecipients().push(new tutao.entity.tutanota.MailAddress()
        .setAddress("cc@tutao.de"));
    mail.getCcRecipients().push(new tutao.entity.tutanota.MailAddress()
        .setAddress("bcc@tutao.de"));
    mail.loadBody = function (callback) {  // invoked from DisplayedMail constructor
        callback({getText: function () {
            return "This is the body<br> Kind regards"
        }});
    };
    var displayedMail = new tutao.tutanota.ctrl.DisplayedMail(mail);
    // TODO replace tutao.tutanota.ctrl.FileFacade.readFileData and test attachments

    queue.call('test', function (callbacks) {
        tutao.tutanota.util.Exporter.toEml(displayedMail).then(callbacks.add(function (eml) {

            var expected = [
                "From: sender@tutao.de",
                "MIME-Version: 1.0",
                "To: to1@tutao.de,",
                "   to2@tutao.de",
                "CC: cc@tutao.de,",
                "   bcc@tutao.de",
                "Subject: =?UTF-8?B?SGFsbGkgSGFsbG8h?=",
                "Date: Tue, 12 Dec 2011 04:03:02 +0100",
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
        }));
    });
}
});