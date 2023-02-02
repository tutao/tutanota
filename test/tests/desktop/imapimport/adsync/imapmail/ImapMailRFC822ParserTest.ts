import o from "@tutao/otest"
import fs from "node:fs"
import { ImapMailRFC822Parser } from "../../../../../../src/common/desktop/imapimport/adsync/imapmail/ImapMailRFC822Parser"

/**
 * This example file contains a mail which has two attachment files, nix-set-draw-func.scm, a text code file and one
 * pgp signature which is unnamed, it is displayed as such in the original received mail(gmail).
 * The same mail on thunderbird contains the attachments ForwardedMesage.eml and nix-set-draw-func.scm, the signature is
 * not displayed as an attachment. The EML attachment is displayed inline and as attachment, in our imap importer such
 * is considered as part of the mail body and thus is not an attachment.
 *
 * The example has been edited as to have fewer bytes since we do not really need the entire original email.
 * */
export const IMAP_TEST_DATA_EXAMPLE_ONE: string = "./tests/desktop/imapimport/adsync/imapmail/sample/imap-example-1.txt"

o.spec("ImapMailRFC822Parser", function () {
	o.spec("parseSource", function () {
		o("parser correctly parses first example", async function () {
			const file = await fs.promises.readFile(IMAP_TEST_DATA_EXAMPLE_ONE)
			const parser = new ImapMailRFC822Parser()
			const imapMailRFC822 = await parser.parseSource(Buffer.from(file))

			// Verify that the mail attachments are properly parsed.
			const parsedAttachments = imapMailRFC822.parsedAttachments!
			o(parsedAttachments.length).equals(2)
			o(parsedAttachments[0].filename).equals("code-attachment.scm")
			o(parsedAttachments[0].content.length).equals(145)
			o(parsedAttachments[0].contentType).equals("text/x-scheme")

			o(parsedAttachments[1].filename).equals("OpenPGP digital signature")
			o(parsedAttachments[1].content.length).equals(145)
			o(parsedAttachments[1].contentType).equals("application/pgp-signature")
			o(imapMailRFC822.parsedAttachments?.length).equals(489)

			// Verify that the mail body is properly parsed. (Including the forwarded EML)
			const parsedBody = imapMailRFC822.parsedBody!

			o(parsedBody.html).equals("")
			o(parsedBody.plaintext).equals(`some base-64 encoded message
another message

----------------------------------------------------
From:    Third Person <third@competi.tor>
Subject: Re: some subject
Date:    13/08/2022, 02:21:29
To:      Other Person <other.person@competitor2.net>
Cc:      some-user@domain.org
----------------------------------------------------

Hello Someone,

> I'm facing the problem mentioned!

\tafaict, we do not support it


some footer`)
			const parsedEnvelope = imapMailRFC822.parsedEnvelope!

			//Do essentially a snapshot test, verifying that all fields are equal to what is expected.
			o(JSON.stringify(parsedEnvelope)).equals(
				`{"date":"2024-08-22T16:00:14.000Z","subject":"some-user Digest, Vol 261, Issue 10","messageId":"<mailman.64.1724342414.4524.some-user@domain.org>","from":[{"name":"","address":"some-user-request@domain.org"}],"sender":[{"name":"","address":"some-user-bounces+bedfortest=gmail.com@domain.org"}],"to":[{"name":"","address":"some-user@domain.org"}],"replyTo":[{"name":"","address":"some-user@domain.org"}]}`,
			)
		})
	})
})
