import o from "@tutao/otest"
import {
	migrationMailFromGmailMessage,
	migrationMailFromGraphMessage,
	migrationMailFromImapFlowFetchMessageObject,
} from "../../../../../src/applications/common/desktop/migration/mailparser/MailParserUtils"
import { FetchMessageObject } from "imapflow"
import { MigrationMailAttachmentDisposition } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMail"
import { MigrationMailboxSpecialUse } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"

// See ImapMailRFC822ParserTest for more info.

o.spec("MailParserUtils", function () {
	o("migrationMailFromImapFlowFetchMessageObject correctly parses expected values", async function () {
		const source = Buffer.from(new Uint8Array())
		const date = new Date(2015, 5, 30)
		const testMail = {
			source,
			uid: 123,
			modseq: BigInt(10),
			size: 12345,
			internalDate: date,
			flags: new Set<string>(),
		} as FetchMessageObject
		const result = await migrationMailFromImapFlowFetchMessageObject(testMail, { sourceId: "INBOX" })
		o(result.modSeq).equals(BigInt(10))
		o(result.size).equals(12345)
		o(result.internalDate).equals(date)
		o(result.flags?.size).equals(0)
		o(result.labels).equals(undefined)
		o(result.rfc822Source).equals(source)
	})

	o.spec("migrationMailFromGmailMessage", () => {
		const raw = Buffer.from("From: a@b.com\r\nTo: c@d.com\r\nSubject: Hello\r\nMessage-ID: <1@b.com>\r\n\r\nbody").toString("base64url")
		const mailbox = { path: "[Gmail]/All Mail", specialUse: MigrationMailboxSpecialUse.ALL }

		o("parses the raw source and takes the date and the id of Gmail", async function () {
			const result = await migrationMailFromGmailMessage({ id: "18c3", raw, internalDate: "1700000000000" }, mailbox, new Map())

			o(result.sourceId).equals("18c3")
			o(result.envelope?.subject).equals("Hello")
			o(result.internalDate?.getTime()).equals(1700000000000)
			o(result.size).equals(Buffer.from(raw, "base64url").length)
			o(result.belongsToMailbox).equals(mailbox)
			o(result.rfc822Source?.toString()).equals(Buffer.from(raw, "base64url").toString())
		})

		o("derives the flags from the labels", async function () {
			const unreadStarredDraft = await migrationMailFromGmailMessage({ id: "1", raw, labelIds: ["UNREAD", "STARRED", "DRAFT"] }, mailbox, new Map())
			const read = await migrationMailFromGmailMessage({ id: "2", raw, labelIds: ["INBOX"] }, mailbox, new Map())

			o(Array.from(unreadStarredDraft.flags ?? []).sort()).deepEquals(["\\Draft", "\\Flagged"])
			o(Array.from(read.flags ?? [])).deepEquals(["\\Seen"])
		})

		o("references system labels by their special use and user labels by their name, ignoring other labels", async function () {
			const result = await migrationMailFromGmailMessage(
				{ id: "1", raw, labelIds: ["INBOX", "SENT", "Label_1", "CATEGORY_SOCIAL", "UNREAD", "Label_unknown"] },
				mailbox,
				new Map([["Label_1", "Work/Project"]]),
			)

			o(Array.from(result.labels ?? []).sort()).deepEquals(["Work/Project", MigrationMailboxSpecialUse.INBOX, MigrationMailboxSpecialUse.SENT].sort())
		})
	})

	o.spec("migrationMailFromGraphMessage", () => {
		const mailbox = { path: "Inbox" }

		o("converts the envelope, the html body, the flags and the headers", function () {
			const result = migrationMailFromGraphMessage(
				{
					id: "graph-1",
					internetMessageId: "<1@x>",
					subject: "Hello",
					from: { emailAddress: { name: "A", address: "a@x.com" } },
					toRecipients: [{ emailAddress: { name: "C", address: "c@x.com" } }],
					sentDateTime: "2024-01-02T03:04:05Z",
					receivedDateTime: "2024-01-02T03:04:06Z",
					isRead: true,
					body: { contentType: "html", content: "<b>hi</b>" },
					internetMessageHeaders: [
						{ name: "X-A", value: "1" },
						{ name: "X-B", value: "2" },
					],
				},
				mailbox,
			)

			o(result.sourceId).equals("graph-1")
			o(result.envelope?.subject).equals("Hello")
			o(result.envelope?.messageId).equals("<1@x>")
			o(result.envelope?.from).deepEquals([{ name: "A", address: "a@x.com" }])
			o(result.envelope?.to).deepEquals([{ name: "C", address: "c@x.com" }])
			o(result.envelope?.date?.toISOString()).equals("2024-01-02T03:04:05.000Z")
			o(result.internalDate?.toISOString()).equals("2024-01-02T03:04:06.000Z")
			o(result.body).deepEquals({ html: "<b>hi</b>", plaintext: "" })
			o(Array.from(result.flags ?? [])).deepEquals(["\\Seen"])
			o(result.headers).equals("X-A: 1\r\nX-B: 2")
			o(result.belongsToMailbox).equals(mailbox)
		})

		o("converts a text body and unread mails, and only takes attachments that have content", function () {
			const result = migrationMailFromGraphMessage(
				{
					id: "graph-2",
					isRead: false,
					body: { contentType: "text", content: "hi" },
					attachments: [
						{ id: "a1", name: "file.txt", contentType: "text/plain", contentBytes: Buffer.from("data").toString("base64"), size: 4 },
						{ id: "a2", name: "inline.png", isInline: true, contentBytes: "AAAA", contentId: "cid1" },
						{ id: "a3", name: "reference-attachment" },
					],
				},
				mailbox,
			)

			o(result.body).deepEquals({ html: "", plaintext: "hi" })
			o(result.flags?.size).equals(0)
			o(result.headers).equals(undefined)
			o(result.attachments?.length).equals(2)
			o(result.attachments?.[0].content.toString()).equals("data")
			o(result.attachments?.[0].disposition).equals(MigrationMailAttachmentDisposition.Attachment)
			o(result.attachments?.[1].disposition).equals(MigrationMailAttachmentDisposition.Inline)
			o(result.attachments?.[1].cid).equals("cid1")
			o(result.attachments?.[1].mimeType).equals("application/octet-stream")
		})
	})
})
