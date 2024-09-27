import o from "@tutao/otest"
import { _formatSmtpDateTime, mailToEml } from "../../../../src/mail-app/mail/export/Exporter.js"
import { base64ToUint8Array, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { createDataFile } from "../../../../src/common/api/common/DataFile.js"
import { MailBundle } from "../../../../src/common/mailFunctionality/SharedMailUtils.js"

o.spec("Exporter", function () {
	o.spec("mail to eml", function () {
		o("most minimal eml", function () {
			const now = Date.now()
			const mostMinimalBundle: MailBundle = {
				mailId: ["", ""],
				subject: "",
				body: "",
				sender: { address: "complaints@johnbotr.is" },
				to: [],
				cc: [],
				bcc: [],
				replyTo: [],
				isDraft: false,
				isRead: true,
				sentOn: now,
				receivedOn: now,
				headers: null,
				attachments: [],
			}

			const actual = mailToEml(mostMinimalBundle)
			const expected = `From: complaints@johnbotr.is\r\n\
MIME-Version: 1.0\r\n\
Subject: \r\n\
Date: ${_formatSmtpDateTime(new Date(now))}\r\n\
Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota\r\n\
Content-Type: text/html; charset=UTF-8\r\n\
Content-transfer-encoding: base64\r\n\
\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota--`

			const actualLines = actual.split("\r\n")
			const expectedLines = expected.split("\r\n")
			o(actualLines.length).equals(expectedLines.length)
			for (let i = 0; i < Math.min(expectedLines.length, actualLines.length); ++i) {
				o(actualLines[i]).equals(expectedLines[i])(`Line: ${i}`)
			}
		})

		o("non minimal eml with no headers", function () {
			const now = Date.now()
			const subject = "Hey, I know that guy, he’s a nihilist."
			const body = `I’m the Dude, so that’s what you call me. That or, uh, His Dudeness, or uh, Duder, or El Duderino, if you’re not into the whole brevity thing. <img src="cid:cid123" />`
			const attachment1 = createDataFile("file1.txt", "text/plain", stringToUtf8Uint8Array("this is a text file"))
			const attachment2 = createDataFile(
				"icon10x10.png",
				"image/png",
				base64ToUint8Array(
					"iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAgVBMVEWgHiCgHh+gHiEAAACfHyGgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiD////HdIxaAAAAKXRSTlMAAAAAAImrqvvx5OX+oGaj1/r1w1MjV7P5lwEPjO+dIRb83pU8BnMqAyX2q3sAAAABYktHRCpTvtSeAAAACXBIWXMAAAcDAAAHAwGHNB/CAAAAB3RJTUUH5AkBDTcdD3SpngAAAE5JREFUCNc9ykUSgDAABMGFCIHg7q7//yCVhGJOfRgw7ug4g3i+BJ4/RdeT0jcMwihODNMsL8qqNm/TousVh3GChRnLuu0HbEIpzusG0b05dgnLISKbuAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0wOS0wMVQxMTo1NToyOSswMjowMNbkv24AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDktMDFUMTE6NTU6MjkrMDI6MDCnuQfSAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAABJRU5ErkJggg==",
				),
			)
			attachment2.cid = "123cid"
			const bundle: MailBundle = {
				mailId: ["", ""],
				subject,
				body,
				sender: { address: "lorem@ipsum.net", name: "" },
				to: [{ name: "guy1", address: "guy1@guys.net" }, { name: "guy2", address: "guy2@guys.net" }, { address: "guy2.5@guys.net" }],
				cc: [{ address: "guy3@guys.net" }, { name: "Dennis Dennisman", address: "guy4@guys.net" }],
				bcc: [{ address: "guy5@guys.net" }, { name: "Sixth guy", address: "guy6@guys.net" }],
				replyTo: [{ address: "guy7@guys.net" }, { name: "guy8", address: "guy8@guys.net" }],
				isDraft: false,
				isRead: true,
				sentOn: now,
				receivedOn: now,
				headers: null,
				attachments: [attachment1, attachment2],
			}

			const actual = mailToEml(bundle)
			const expected = `From: lorem@ipsum.net\r\n\
MIME-Version: 1.0\r\n\
To: guy1 <guy1@guys.net>,guy2 <guy2@guys.net>,<guy2.5@guys.net>\r\n\
CC: <guy3@guys.net>,Dennis Dennisman <guy4@guys.net>\r\n\
BCC: <guy5@guys.net>,Sixth guy <guy6@guys.net>\r\n\
Subject: =?UTF-8?B?SGV5LCBJIGtub3cgdGhhdCBndXksIGhl4oCZcyBhIG5paGlsaXN0Lg==?=\r\n\
Date: ${_formatSmtpDateTime(new Date(now))}\r\n\
Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota\r\n\
Content-Type: text/html; charset=UTF-8\r\n\
Content-transfer-encoding: base64\r\n\
\r\n\
SeKAmW0gdGhlIER1ZGUsIHNvIHRoYXTigJlzIHdoYXQgeW91IGNhbGwgbWUuIFRoYXQgb3IsIHVoLC\r\n\
BIaXMgRHVkZW5lc3MsIG9yIHVoLCBEdWRlciwgb3IgRWwgRHVkZXJpbm8sIGlmIHlvdeKAmXJlIG5v\r\n\
dCBpbnRvIHRoZSB3aG9sZSBicmV2aXR5IHRoaW5nLiA8aW1nIHNyYz0iY2lkOmNpZDEyMyIgLz4=\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota\r\n\
Content-Type: text/plain;\r\n\
 name==?UTF-8?B?ZmlsZTEudHh0?=\r\n\
Content-Transfer-Encoding: base64\r\n\
Content-Disposition: attachment;\r\n\
 filename==?UTF-8?B?ZmlsZTEudHh0?=\r\n\
\r\n\
dGhpcyBpcyBhIHRleHQgZmlsZQ==\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota\r\n\
Content-Type: image/png;\r\n\
 name==?UTF-8?B?aWNvbjEweDEwLnBuZw==?=\r\n\
Content-Transfer-Encoding: base64\r\n\
Content-Disposition: attachment;\r\n\
 filename==?UTF-8?B?aWNvbjEweDEwLnBuZw==?=\r\n\
Content-Id: <123cid>\r\n\
\r\n\
iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAA\r\n\
B6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAgVBMVEWgHiCgHh+gHiEAAACfHyGg\r\n\
HiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHi\r\n\
CgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiD////HdIxa\r\n\
AAAAKXRSTlMAAAAAAImrqvvx5OX+oGaj1/r1w1MjV7P5lwEPjO+dIRb83pU8BnMqAyX2q3sAAAABYk\r\n\
tHRCpTvtSeAAAACXBIWXMAAAcDAAAHAwGHNB/CAAAAB3RJTUUH5AkBDTcdD3SpngAAAE5JREFUCNc9\r\n\
ykUSgDAABMGFCIHg7q7//yCVhGJOfRgw7ug4g3i+BJ4/RdeT0jcMwihODNMsL8qqNm/TousVh3GChR\r\n\
nLuu0HbEIpzusG0b05dgnLISKbuAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0wOS0wMVQxMTo1NToy\r\n\
OSswMjowMNbkv24AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDktMDFUMTE6NTU6MjkrMDI6MDCnuQ\r\n\
fSAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAABJRU5ErkJggg==\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota--`

			const actualLines = actual.split("\r\n")
			const expectedLines = expected.split("\r\n")
			o(actualLines.length).equals(expectedLines.length)("check length")
			for (let i = 0; i < Math.min(expectedLines.length, actualLines.length); ++i) {
				o(actualLines[i]).equals(expectedLines[i])(`Line: ${i}`)
			}
		})

		o("email with headers", function () {
			// the first few lines have wrong line endings, but we should handle that
			const headers = `Received: from x.y.test\n\
   by example.net\n\
   via TCP\n\
   with ESMTP\r\n\
   id ABC12345\r\n\
   for <mary@example.net>;  21 Nov 1997 10:05:43 -0600\r\n\
Received: from node.example by x.y.test; 21 Nov 1997 10:01:22 -0600\r\n\
From: John Doe <jdoe@node.example>\r\n\
To: Mary Smith <mary@example.net>\r\n\
Subject: Saying Hello\r\n\
Date: Fri, 21 Nov 1997 09:55:06 -0600\r\n\
Message-ID: <1234@local.node.example>`

			const now = Date.now()
			const bundle: MailBundle = {
				mailId: ["", ""],
				subject: "Saying hello",
				body: "",
				sender: { address: "jdoe@node.example" },
				to: [{ address: "mary@example.net" }],
				cc: [],
				bcc: [],
				replyTo: [],
				isDraft: false,
				isRead: true,
				sentOn: now,
				receivedOn: now,
				headers,
				attachments: [],
			}

			const actual = mailToEml(bundle)
			const expected = `Received: from x.y.test\r\n\
   by example.net\r\n\
   via TCP\r\n\
   with ESMTP\r\n\
   id ABC12345\r\n\
   for <mary@example.net>;  21 Nov 1997 10:05:43 -0600\r\n\
Received: from node.example by x.y.test; 21 Nov 1997 10:01:22 -0600\r\n\
From: John Doe <jdoe@node.example>\r\n\
To: Mary Smith <mary@example.net>\r\n\
Subject: Saying Hello\r\n\
Date: Fri, 21 Nov 1997 09:55:06 -0600\r\n\
Message-ID: <1234@local.node.example>\r\n\
Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota\r\n\
Content-Type: text/html; charset=UTF-8\r\n\
Content-transfer-encoding: base64\r\n\
\r\n\
\r\n\
--------------79Bu5A16qPEYcVIZL@tutanota--`

			const actualLines = actual.split("\r\n")
			const expectedLines = expected.split("\r\n")
			o(actualLines.length).equals(expectedLines.length)
			for (let i = 0; i < Math.min(expectedLines.length, actualLines.length); ++i) {
				o(actualLines[i]).equals(expectedLines[i])(`Line: ${i}`)
			}
		})
	})
})
