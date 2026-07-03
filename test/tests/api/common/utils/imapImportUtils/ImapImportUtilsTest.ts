import o from "@tutao/otest"
import {
	getFolderSyncStateForMailboxPath,
	guessServerImapConfigFromEmail,
	imapAccountToImapCredentials,
	imapMailToImportMailParams,
	oAuthTokenEndpointResponseToTokenEndpointResponse,
	tokenEndpointResponseToOAuthTokenEndpointResponse,
} from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapImportUtils.js"
import type { TokenEndpointResponse } from "oauth4webapi"
import { createTestEntity } from "../../../../TestUtils"
import {
	ImapMail,
	ImapMailAddress,
	ImapMailAttachment,
	ImapMailAttachmentDisposition,
} from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMail"
import { ImapMailboxSpecialUse } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { MailMethod, MailState, ReplyType } from "../../../../../../src/entities/tutanota/Utils"
import { ImapAccountTypeRef, ImapFolderSyncStateTypeRef, OAuthTokenEndpointResponseTypeRef } from "@tutao/entities/tutanota"
import { ImapImportAttachments, ImapImportDataFile } from "../../../../../../src/applications/common/api/worker/facades/lazy/ImportMailFacade"

o.spec("ImapImportUtils", () => {
	o.spec("guessServerImapConfigFromEmail", () => {
		o.test("guesses correctly for gmx and web.de", () => {
			o.check(guessServerImapConfigFromEmail("test@gmx.de")?.host).equals("imap.gmx.net")
			o.check(guessServerImapConfigFromEmail("user@web.de")?.host).equals("imap.web.de")
		})

		o.test("returns null in case there is no match", () => {
			o.check(guessServerImapConfigFromEmail("test@test.com")).equals(null)
			o.check(guessServerImapConfigFromEmail("test@thisshouldnotexist.de")).equals(null)
		})
	})

	o.spec("imapAccountToImapCredentials", () => {
		o.test("converts ImapAccount to ImapCredentials without token", () => {
			const importAccountMock = createTestEntity(ImapAccountTypeRef, {
				host: "imap.test.com",
				port: "993",
				username: "user@test.com",
				password: "secret",
				oAuthTokenEndpointResponse: null,
			})
			const result = imapAccountToImapCredentials(importAccountMock)
			o.check(result.host).equals("imap.test.com")
			o.check(result.port).equals(993)
			o.check(result.username).equals("user@test.com")
			o.check(result.password).equals("secret")
			o.check(result.tokenEndpointResponse).equals(undefined)
		})

		o.test("converts with token endpoint response", () => {
			const tokenResponseMock = createTestEntity(OAuthTokenEndpointResponseTypeRef, {
				accessToken: "access123",
				refreshToken: "refresh456",
				expiresIn: "3600",
				tokenType: "Bearer",
			})
			const importAccountMock = createTestEntity(ImapAccountTypeRef, {
				host: "imap.test.com",
				port: "993",
				username: "user@test.com",
				password: null,
				oAuthTokenEndpointResponse: tokenResponseMock,
			})
			const result = imapAccountToImapCredentials(importAccountMock)
			o.check(result.tokenEndpointResponse!.access_token).equals("access123")
			o.check(result.tokenEndpointResponse!.refresh_token).equals("refresh456")
			o.check(result.tokenEndpointResponse!.expires_in).equals(3600)
			o.check(result.tokenEndpointResponse!.token_type.toLowerCase()).equals("bearer")
		})
	})

	o.spec("oAuthTokenEndpointResponseToTokenEndpointResponse", () => {
		o.test("converts with all fields", () => {
			const tutaResponseMock = createTestEntity(OAuthTokenEndpointResponseTypeRef, {
				accessToken: "access123",
				refreshToken: "refresh456",
				expiresIn: "7200",
				tokenType: "Bearer",
			})
			const result = oAuthTokenEndpointResponseToTokenEndpointResponse(tutaResponseMock)
			o.check(result.access_token).equals("access123")
			o.check(result.refresh_token).equals("refresh456")
			o.check(result.expires_in).equals(7200)
			o.check(result.token_type.toLowerCase()).equals("bearer")
		})

		o.test("handles null refreshToken and expiresIn", () => {
			const tutaResponseMock = createTestEntity(OAuthTokenEndpointResponseTypeRef, {
				accessToken: "access123",
				refreshToken: null,
				expiresIn: null,
				tokenType: "Bearer",
			})
			const result = oAuthTokenEndpointResponseToTokenEndpointResponse(tutaResponseMock)
			o.check(result.refresh_token).equals(undefined)
			o.check(result.expires_in).equals(undefined)
		})
	})

	o.spec("tokenEndpointResponseToOAuthTokenEndpointResponse", () => {
		o.test("converts with all fields", () => {
			const oauthResponseMock: TokenEndpointResponse = {
				access_token: "access456",
				refresh_token: "refresh789",
				expires_in: 3600,
				token_type: "bearer",
			}
			const result = tokenEndpointResponseToOAuthTokenEndpointResponse(oauthResponseMock)
			o.check(result.accessToken).equals("access456")
			o.check(result.refreshToken).equals("refresh789")
			o.check(result.expiresIn).equals("3600")
			o.check(result.tokenType).equals("bearer")
		})

		o.test("handles missing refresh_token and expires_in", () => {
			const oauthResponseMock: TokenEndpointResponse = {
				access_token: "access456",
				token_type: "bearer",
			}
			const result = tokenEndpointResponseToOAuthTokenEndpointResponse(oauthResponseMock)
			o.check(result.accessToken).equals("access456")
			o.check(result.refreshToken).equals(null)
			o.check(result.expiresIn).equals(null)
		})
	})

	o.spec("getFolderSyncStateForMailboxPath", () => {
		o.test("returns the folder with matching path", () => {
			const folder1Mock = createTestEntity(ImapFolderSyncStateTypeRef, { path: "INBOX" })
			const folder2Mock = createTestEntity(ImapFolderSyncStateTypeRef, { path: "Sent" })
			const result = getFolderSyncStateForMailboxPath("Sent", [folder1Mock, folder2Mock])
			o.check(result).equals(folder2Mock)
		})

		o.test("returns null if no match", () => {
			const folderMock = createTestEntity(ImapFolderSyncStateTypeRef, { path: "INBOX" })
			const result = getFolderSyncStateForMailboxPath("Drafts", [folderMock])
			o.check(result).equals(null)
		})
	})

	o.spec("imapMailToImportMailParams", () => {
		let imapMailMock: ImapMail
		let folderSyncStateIdMock: IdTuple

		o.beforeEach(() => {
			folderSyncStateIdMock = ["listId", "elementId"]
			imapMailMock = {
				uid: 123,
				modSeq: 456n,
				belongsToMailbox: { path: "INBOX", specialUse: ImapMailboxSpecialUse.INBOX },
				flags: new Set(),
				internalDate: new Date(2024, 0, 1),
				envelope: {
					date: new Date(2024, 0, 1),
					subject: "Test subject",
					from: [{ address: "sender@example.com", name: "Sender" }],
					sender: [{ address: "sender@example.com", name: "Sender" }],
					to: [{ address: "to@example.com", name: "Recipient" }],
					cc: [],
					bcc: [],
					replyTo: [],
					messageId: "msg123",
					inReplyTo: null,
					references: [],
				},
				body: {
					plaintext: "Plain text body",
					html: "<p>HTML body</p>",
				},
				attachments: [],
				headers: "Header: value",
			} as any
		})

		o.test("converts basic mail without attachments", () => {
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.subject).equals("Test subject")
			o.check(result.bodyText).equals("<p>HTML body</p>")
			o.check(result.sentDate).equals(imapMailMock.envelope!.date)
			o.check(result.receivedDate).equals(imapMailMock.internalDate)
			o.check(result.state).equals(MailState.RECEIVED)
			o.check(result.unread).equals(true)
			o.check(result.senderMailAddress).equals("sender@example.com")
			o.check(result.senderName).equals("Sender")
			o.check(result.method).equals(MailMethod.NONE)
			o.check(result.replyType).equals(ReplyType.NONE)
			o.check(result.differentEnvelopeSender).equals(null)
			o.check(result.headers).equals("Header: value")
			o.check(result.replyTos).deepEquals([])
			o.check(result.toRecipients).deepEquals([{ address: "to@example.com", name: "Recipient" }])
			o.check(result.ccRecipients).deepEquals([])
			o.check(result.bccRecipients).deepEquals([])
			o.check(result.attachments).deepEquals([])
			o.check(result.inReplyTo).equals(null)
			o.check(result.references).deepEquals([])
			o.check(result.imapUid).equals(123)
			o.check(result.imapModSeq).equals(456n)
			o.check(result.imapFolderSyncState).equals(folderSyncStateIdMock)
		})

		o.test("uses plaintext body when HTML missing", () => {
			imapMailMock.body = { plaintext: "Only plaintext \n", html: "" } as any
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.bodyText.includes("<br>")).equals(true)
		})

		o.test("handles missing subject", () => {
			imapMailMock.envelope!.subject = undefined
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.subject).equals("")
		})

		o.test("sets differentEnvelopeSender when sender differs from from", () => {
			imapMailMock.envelope!.sender = [{ address: "different@example.com", name: "Different" } as ImapMailAddress]
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.differentEnvelopeSender).equals("different@example.com")
		})

		o.test("sets unread false when mail has \\Seen flag", () => {
			imapMailMock.flags = new Set(["\\Seen"])
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.unread).equals(false)
		})

		o.test("sets replyType correctly for flags", () => {
			imapMailMock.flags = new Set(["\\Answered"])
			let result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.replyType).equals(ReplyType.REPLY)

			imapMailMock.flags = new Set(["$Forwarded"])
			result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.replyType).equals(ReplyType.FORWARD)

			imapMailMock.flags = new Set(["\\Answered", "$Forwarded"])
			result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.replyType).equals(ReplyType.REPLY_FORWARD)
		})

		o.test("sets state to SENT for Sent mailbox", () => {
			imapMailMock.belongsToMailbox = { path: "Sent", specialUse: ImapMailboxSpecialUse.SENT }
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.state).equals(MailState.SENT)
		})

		o.test("sets state to DRAFT for Drafts mailbox", () => {
			imapMailMock.belongsToMailbox = { path: "Drafts", specialUse: ImapMailboxSpecialUse.DRAFTS }
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.state).equals(MailState.DRAFT)
		})

		o.test("includes deduplicated attachments when provided", () => {
			const dedupedAttachmentsMock: ImapImportAttachments = [{ _type: "ImapImportTutaFileId", _id: ["file", "id"] }]
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, dedupedAttachmentsMock)
			o.check(result.attachments).equals(dedupedAttachmentsMock)
		})

		o.test("converts ImapMail attachments when no deduplicated ones", () => {
			const attachmentMock: ImapMailAttachment = {
				size: 3,
				mimeType: "text/plain",
				disposition: ImapMailAttachmentDisposition.Attachment,
				filename: "test.txt",
				content: new Uint8Array([1, 2, 3]),
			} as ImapMailAttachment
			imapMailMock.attachments = [attachmentMock]
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			o.check(result.attachments!.length).equals(1)
			const file = result.attachments![0] as any
			o.check(file._type).equals("DataFile")
			o.check(file.name).equals("test.txt")
			o.check(file.data).equals(attachmentMock.content)
			o.check(file.size).equals(3)
			o.check(file.mimeType).equals("text/plain")
		})

		o.test("generates filename using mimetype when missing", () => {
			const attachmentMock: ImapMailAttachment = {
				size: 1,
				mimeType: "image/png",
				disposition: ImapMailAttachmentDisposition.Inline,
				content: new Uint8Array([1, 2, 3]),
			} as ImapMailAttachment
			imapMailMock.attachments = [attachmentMock]
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null)
			const file = result.attachments![0] as ImapImportDataFile
			o.check(file.name).equals("image.png")
		})
	})
})
