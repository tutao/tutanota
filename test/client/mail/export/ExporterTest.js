// @flow

import o from "ospec"
import type {MailBundle} from "../../../../src/mail/export/Bundler"
import {_formatSmtpDateTime, mailToEml} from "../../../../src/mail/export/Exporter"
import {base64ToUint8Array, stringToUtf8Uint8Array} from "../../../../src/api/common/utils/Encoding"
import {createDataFile} from "../../../../src/api/common/DataFile"

o.spec("Exporter", function () {
	o.spec("mail to eml", function () {
		o("most minimal eml", function () {
			const now = Date.now()
			const mostMinimalBundle: MailBundle = {
				mailId: ["", ""],
				subject: "",
				body: "",
				sender: {address: "complaints@johnbotr.is"},
				to: [],
				cc: [],
				bcc: [],
				replyTo: [],
				isDraft: false,
				isRead: true,
				sentOn: now,
				receivedOn: now,
				headers: null,
				attachments: []
			}

			const actual = mailToEml(mostMinimalBundle)
			const expected =
				`From: complaints@johnbotr.is
MIME-Version: 1.0
Subject: 
Date: ${_formatSmtpDateTime(new Date(now))}
Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"

--------------79Bu5A16qPEYcVIZL@tutanota
Content-Type: text/html; charset=UTF-8
Content-transfer-encoding: base64


--------------79Bu5A16qPEYcVIZL@tutanota--`

			const actualLines = actual.split("\r\n")
			const expectedLines = expected.split("\n")
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
			const attachment2 = createDataFile("icon10x10.png", "image/png", base64ToUint8Array("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAgVBMVEWgHiCgHh+gHiEAAACfHyGgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiD////HdIxaAAAAKXRSTlMAAAAAAImrqvvx5OX+oGaj1/r1w1MjV7P5lwEPjO+dIRb83pU8BnMqAyX2q3sAAAABYktHRCpTvtSeAAAACXBIWXMAAAcDAAAHAwGHNB/CAAAAB3RJTUUH5AkBDTcdD3SpngAAAE5JREFUCNc9ykUSgDAABMGFCIHg7q7//yCVhGJOfRgw7ug4g3i+BJ4/RdeT0jcMwihODNMsL8qqNm/TousVh3GChRnLuu0HbEIpzusG0b05dgnLISKbuAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0wOS0wMVQxMTo1NToyOSswMjowMNbkv24AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDktMDFUMTE6NTU6MjkrMDI6MDCnuQfSAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAABJRU5ErkJggg=="))
			attachment2.cid = "123cid"
			const bundle: MailBundle = {
				mailId: ["", ""],
				subject,
				body,
				sender: {address: "lorem@ipsum.net", name: ""},
				to: [
					{name: "guy1", address: "guy1@guys.net"}, {name: "guy2", address: "guy2@guys.net"},
					{address: "guy2.5@guys.net"}
				],
				cc: [{address: "guy3@guys.net"}, {name: "Dennis Dennisman", address: "guy4@guys.net"}],
				bcc: [{address: "guy5@guys.net"}, {name: "Sixth guy", address: "guy6@guys.net"}],
				replyTo: [{address: "guy7@guys.net"}, {name: "guy8", address: "guy8@guys.net"}],
				isDraft: false,
				isRead: true,
				sentOn: now,
				receivedOn: now,
				headers: null,
				attachments: [
					attachment1,
					attachment2
				]
			}

			const actual = mailToEml(bundle)
			const expected =
				`From: lorem@ipsum.net
MIME-Version: 1.0
To: guy1 <guy1@guys.net>,guy2 <guy2@guys.net>,<guy2.5@guys.net>
CC: <guy3@guys.net>,Dennis Dennisman <guy4@guys.net>
BCC: <guy5@guys.net>,Sixth guy <guy6@guys.net>
Subject: =?UTF-8?B?SGV5LCBJIGtub3cgdGhhdCBndXksIGhl4oCZcyBhIG5paGlsaXN0Lg==?=
Date: ${_formatSmtpDateTime(new Date(now))}
Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"

--------------79Bu5A16qPEYcVIZL@tutanota
Content-Type: text/html; charset=UTF-8
Content-transfer-encoding: base64

SeKAmW0gdGhlIER1ZGUsIHNvIHRoYXTigJlzIHdoYXQgeW91IGNhbGwgbWUuIFRoYXQgb3IsIHVoLC
BIaXMgRHVkZW5lc3MsIG9yIHVoLCBEdWRlciwgb3IgRWwgRHVkZXJpbm8sIGlmIHlvdeKAmXJlIG5v
dCBpbnRvIHRoZSB3aG9sZSBicmV2aXR5IHRoaW5nLiA8aW1nIHNyYz0iY2lkOmNpZDEyMyIgLz4=

--------------79Bu5A16qPEYcVIZL@tutanota
Content-Type: text/plain;
 name==?UTF-8?B?ZmlsZTEudHh0?=
Content-Transfer-Encoding: base64
Content-Disposition: attachment;
 filename==?UTF-8?B?ZmlsZTEudHh0?=

dGhpcyBpcyBhIHRleHQgZmlsZQ==

--------------79Bu5A16qPEYcVIZL@tutanota
Content-Type: image/png;
 name==?UTF-8?B?aWNvbjEweDEwLnBuZw==?=
Content-Transfer-Encoding: base64
Content-Disposition: attachment;
 filename==?UTF-8?B?aWNvbjEweDEwLnBuZw==?=
Content-Id: <123cid>

iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAA
B6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAgVBMVEWgHiCgHh+gHiEAAACfHyGg
HiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHi
CgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiCgHiD////HdIxa
AAAAKXRSTlMAAAAAAImrqvvx5OX+oGaj1/r1w1MjV7P5lwEPjO+dIRb83pU8BnMqAyX2q3sAAAABYk
tHRCpTvtSeAAAACXBIWXMAAAcDAAAHAwGHNB/CAAAAB3RJTUUH5AkBDTcdD3SpngAAAE5JREFUCNc9
ykUSgDAABMGFCIHg7q7//yCVhGJOfRgw7ug4g3i+BJ4/RdeT0jcMwihODNMsL8qqNm/TousVh3GChR
nLuu0HbEIpzusG0b05dgnLISKbuAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0wOS0wMVQxMTo1NToy
OSswMjowMNbkv24AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDktMDFUMTE6NTU6MjkrMDI6MDCnuQ
fSAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAABJRU5ErkJggg==

--------------79Bu5A16qPEYcVIZL@tutanota--`

			const actualLines = actual.split("\r\n")
			const expectedLines = expected.split("\n")
			o(actualLines.length).equals(expectedLines.length)("check length")
			for (let i = 0; i < Math.min(expectedLines.length, actualLines.length); ++i) {
				o(actualLines[i]).equals(expectedLines[i])(`Line: ${i}`)
			}
		})

		o("email with headers", function () {

			const headers = `
Received: from x.y.test
   by example.net
   via TCP
   with ESMTP
   id ABC12345
   for <mary@example.net>;  21 Nov 1997 10:05:43 -0600
Received: from node.example by x.y.test; 21 Nov 1997 10:01:22 -0600
From: John Doe <jdoe@node.example>
To: Mary Smith <mary@example.net>
Subject: Saying Hello
Date: Fri, 21 Nov 1997 09:55:06 -0600
Message-ID: <1234@local.node.example>`

			const now = Date.now()
			const bundle: MailBundle = {
				mailId: ["", ""],
				subject: "Saying hello",
				body: "",
				sender: {address: "jdoe@node.example"},
				to: [{address: "mary@example.net"}],
				cc: [],
				bcc: [],
				replyTo: [],
				isDraft: false,
				isRead: true,
				sentOn: now,
				receivedOn: now,
				headers,
				attachments: []
			}

			const actual = mailToEml(bundle)
			const expected =
				`Received: from x.y.test
   by example.net
   via TCP
   with ESMTP
   id ABC12345
   for <mary@example.net>;  21 Nov 1997 10:05:43 -0600
Received: from node.example by x.y.test; 21 Nov 1997 10:01:22 -0600
From: John Doe <jdoe@node.example>
To: Mary Smith <mary@example.net>
Subject: Saying Hello
Date: Fri, 21 Nov 1997 09:55:06 -0600
Message-ID: <1234@local.node.example>
Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"

--------------79Bu5A16qPEYcVIZL@tutanota
Content-Type: text/html; charset=UTF-8
Content-transfer-encoding: base64


--------------79Bu5A16qPEYcVIZL@tutanota--`

			const actualLines = actual.split("\r\n")
			const expectedLines = expected.split("\n")
			o(actualLines.length).equals(expectedLines.length)
			for (let i = 0; i < Math.min(expectedLines.length, actualLines.length); ++i) {
				o(actualLines[i]).equals(expectedLines[i])(`Line: ${i}`)
			}


		})
	})
})