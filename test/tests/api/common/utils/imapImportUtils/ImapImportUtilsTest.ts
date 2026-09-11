import o from "@tutao/otest"
import {
	getFolderSyncStateForMailboxPath,
	guessServerImapConfigFromEmail,
	migrationSyncStateToImapCredentials,
	imapMailToImportMailParams,
	labelsFromImapLabels,
	oAuthTokenLikeToTokenEndpointResponse,
	tokenEndpointResponseToOAuthTokenEndpointResponseLegacy,
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
import {
	MailboxMigrationSyncStateTypeRef,
	MailboxMigrationImapConfigurationTypeRef,
	MigrationFolderSyncStateTypeRef,
	OAuthTokenEndpointResponseLegacyTypeRef,
} from "@tutao/entities/tutanota"
import { UserMigrationInformationTypeRef } from "@tutao/entities/sys"
import { ImapImportAttachments, ImapImportDataFile } from "../../../../../../src/applications/common/api/worker/facades/lazy/ImportMailFacade"
import { ImapProvider } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"

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

	o.spec("migrationSyncStateToImapCredentials", () => {
		o.test("converts to ImapCredentials without token", () => {
			const migrationSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
				imapAccount: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
					host: "imap.test.com",
					port: "993",
					sharedUsername: "user@test.com",
					sharedPassword: "secret",
					sharedOauthToken: null,
				}),
				legacyProvider: ImapProvider.Other.toString(),
			})
			const result = migrationSyncStateToImapCredentials(migrationSyncStateMock, null)
			o.check(result.host).equals("imap.test.com")
			o.check(result.port).equals(993)
			o.check(result.username).equals("user@test.com")
			o.check(result.password).equals("secret")
			o.check(result.tokenEndpointResponse).equals(undefined)
			o.check(result.provider).equals(ImapProvider.Other)
		})

		o.test("converts with token endpoint response", () => {
			const tokenResponseMock = createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
				accessToken: "access123",
				refreshToken: "refresh456",
				expiresIn: "3600",
				tokenType: "Bearer",
			})
			const migrationSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
				imapAccount: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
					host: "imap.test.com",
					port: "993",
					sharedUsername: "user@test.com",
					sharedPassword: null,
					sharedOauthToken: tokenResponseMock,
				}),
				legacyProvider: ImapProvider.Gmail.toString(),
			})
			const result = migrationSyncStateToImapCredentials(migrationSyncStateMock, null)
			o.check(result.tokenEndpointResponse!.access_token).equals("access123")
			o.check(result.tokenEndpointResponse!.refresh_token).equals("refresh456")
			o.check(result.tokenEndpointResponse!.expires_in).equals(3600)
			o.check(result.tokenEndpointResponse!.token_type.toLowerCase()).equals("bearer")
			o.check(result.provider).equals(ImapProvider.Gmail)
		})

		o.test("prefers userMigrationInformation credential and provider when present", () => {
			const migrationSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
				imapAccount: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
					host: "imap.test.com",
					port: "993",
					sharedUsername: "fallback@test.com",
					sharedPassword: "fallbackSecret",
					sharedOauthToken: null,
				}),
				legacyProvider: ImapProvider.Other.toString(),
			})
			const userMigrationInformationMock = createTestEntity(UserMigrationInformationTypeRef, {
				provider: ImapProvider.Outlook.toString(),
				credential: {
					_id: "credentialId",
					username: "user@outlook.com",
					password: "secret",
					oAuthToken: null,
				} as any,
			})
			const result = migrationSyncStateToImapCredentials(migrationSyncStateMock, userMigrationInformationMock)
			o.check(result.username).equals("user@outlook.com")
			o.check(result.password).equals("secret")
			o.check(result.provider).equals(ImapProvider.Outlook)
		})
	})

	o.spec("oAuthTokenLikeToTokenEndpointResponse", () => {
		o.test("converts with all fields", () => {
			const tutaResponseMock = createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
				accessToken: "access123",
				refreshToken: "refresh456",
				expiresIn: "7200",
				tokenType: "Bearer",
			})
			const result = oAuthTokenLikeToTokenEndpointResponse(tutaResponseMock)
			o.check(result.access_token).equals("access123")
			o.check(result.refresh_token).equals("refresh456")
			o.check(result.expires_in).equals(7200)
			o.check(result.token_type.toLowerCase()).equals("bearer")
		})

		o.test("handles null refreshToken and expiresIn", () => {
			const tutaResponseMock = createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
				accessToken: "access123",
				refreshToken: null,
				expiresIn: null,
				tokenType: "Bearer",
			})
			const result = oAuthTokenLikeToTokenEndpointResponse(tutaResponseMock)
			o.check(result.refresh_token).equals(undefined)
			o.check(result.expires_in).equals(undefined)
		})
	})

	o.spec("tokenEndpointResponseToOAuthTokenEndpointResponseLegacy", () => {
		o.test("converts with all fields", () => {
			const oauthResponseMock: TokenEndpointResponse = {
				access_token: "access456",
				refresh_token: "refresh789",
				expires_in: 3600,
				token_type: "bearer",
			}
			const result = tokenEndpointResponseToOAuthTokenEndpointResponseLegacy(oauthResponseMock)
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
			const result = tokenEndpointResponseToOAuthTokenEndpointResponseLegacy(oauthResponseMock)
			o.check(result.accessToken).equals("access456")
			o.check(result.refreshToken).equals(null)
			o.check(result.expiresIn).equals(null)
		})
	})

	o.spec("getFolderSyncStateForMailboxPath", () => {
		o.test("returns the folder with matching path", () => {
			const folder1Mock = createTestEntity(MigrationFolderSyncStateTypeRef, { path: "INBOX" })
			const folder2Mock = createTestEntity(MigrationFolderSyncStateTypeRef, { path: "Sent" })
			const result = getFolderSyncStateForMailboxPath("Sent", [folder1Mock, folder2Mock])
			o.check(result).equals(folder2Mock)
		})

		o.test("returns null if no match", () => {
			const folderMock = createTestEntity(MigrationFolderSyncStateTypeRef, { path: "INBOX" })
			const result = getFolderSyncStateForMailboxPath("Drafts", [folderMock])
			o.check(result).equals(null)
		})
	})

	o.spec("imapMailToImportMailParams", () => {
		let imapMailMock: ImapMail
		let folderSyncStateIdMock: IdTuple

		const folderSyncStatesMock = [
			createTestEntity(MigrationFolderSyncStateTypeRef, {
				path: "INBOX",
				specialUse: ImapMailboxSpecialUse.INBOX,
				mailSet: ["mailSetsListId", "inboxLabelSet"],
			}),
			createTestEntity(MigrationFolderSyncStateTypeRef, {
				path: "[Google Mail]/Important",
				specialUse: ImapMailboxSpecialUse.IMPORTANT,
				mailSet: ["mailSetsListId", "importantLabelSet"],
			}),
			createTestEntity(MigrationFolderSyncStateTypeRef, {
				path: "Drafts",
				specialUse: ImapMailboxSpecialUse.DRAFTS,
				mailSet: ["mailSetsListId", "draftsLabelSet"],
			}),
			createTestEntity(MigrationFolderSyncStateTypeRef, {
				path: "Custom",
				specialUse: null,
				mailSet: ["mailSetsListId", "customLabelSet"],
			}),
		]

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
				labels: new Set(["\\Important", "Custom", "RandomLabelNotToBeApplied"]),
			} as any
		})

		o.test("converts basic mail without attachments", () => {
			imapMailMock.labels?.add("\\Inbox")

			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
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
			const expectedLabels = new Set([
				["mailSetsListId", "customLabelSet"] as IdTuple,
				["mailSetsListId", "importantLabelSet"] as IdTuple,
				["mailSetsListId", "inboxLabelSet"] as IdTuple,
			])
			o.check(new Set(result.labels)).deepEquals(expectedLabels)
		})

		o.test("converts basic mail without attachments with draft label", () => {
			imapMailMock.labels?.add("\\Draft")

			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.subject).equals("Test subject")
			o.check(result.bodyText).equals("<p>HTML body</p>")
			o.check(result.sentDate).equals(imapMailMock.envelope!.date)
			o.check(result.receivedDate).equals(imapMailMock.internalDate)
			o.check(result.state).equals(MailState.DRAFT)
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
			o.check(result.labels).deepEquals([
				["mailSetsListId", "importantLabelSet"],
				["mailSetsListId", "customLabelSet"],
				["mailSetsListId", "draftsLabelSet"],
			])
		})

		o.test("uses plaintext body when HTML missing", () => {
			imapMailMock.body = { plaintext: "Only plaintext \n", html: "" } as any
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.bodyText.includes("<br>")).equals(true)
		})

		o.test("handles missing subject", () => {
			imapMailMock.envelope!.subject = undefined
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.subject).equals("")
		})

		o.test("sets differentEnvelopeSender when sender differs from from", () => {
			imapMailMock.envelope!.sender = [{ address: "different@example.com", name: "Different" } as ImapMailAddress]
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.differentEnvelopeSender).equals("different@example.com")
		})

		o.test("sets unread false when mail has \\Seen flag", () => {
			imapMailMock.flags = new Set(["\\Seen"])
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.unread).equals(false)
		})

		o.test("sets replyType correctly for flags", () => {
			imapMailMock.flags = new Set(["\\Answered"])
			let result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.replyType).equals(ReplyType.REPLY)

			imapMailMock.flags = new Set(["$Forwarded"])
			result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.replyType).equals(ReplyType.FORWARD)

			imapMailMock.flags = new Set(["\\Answered", "$Forwarded"])
			result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.replyType).equals(ReplyType.REPLY_FORWARD)
		})

		o.test("sets state to SENT for Sent mailbox", () => {
			imapMailMock.belongsToMailbox = { path: "Sent", specialUse: ImapMailboxSpecialUse.SENT }
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.state).equals(MailState.SENT)
		})

		o.test("sets state to DRAFT for Drafts mailbox", () => {
			imapMailMock.belongsToMailbox = { path: "Drafts", specialUse: ImapMailboxSpecialUse.DRAFTS }
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			o.check(result.state).equals(MailState.DRAFT)
		})

		o.test("includes deduplicated attachments when provided", () => {
			const dedupedAttachmentsMock: ImapImportAttachments = [{ _type: "ImapImportTutaFileId", _id: ["file", "id"] }]
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, dedupedAttachmentsMock, folderSyncStatesMock)
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
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
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
			const result = imapMailToImportMailParams(imapMailMock, folderSyncStateIdMock, null, folderSyncStatesMock)
			const file = result.attachments![0] as ImapImportDataFile
			o.check(file.name).equals("image.png")
		})

		o.test("labelsFromImapLabels works correctly", () => {
			const labels = new Set(["\\Inbox", "\\Important", "\\Draft", "Custom", "RandomLabelShouldNotBeImported"])
			const result = labelsFromImapLabels(labels, folderSyncStatesMock)
			o.check(result[0]).equals(folderSyncStatesMock[0].mailSet)
			o.check(result[1]).equals(folderSyncStatesMock[1].mailSet)
			o.check(result[2]).equals(folderSyncStatesMock[2].mailSet)
			o.check(result[3]).equals(folderSyncStatesMock[3].mailSet)
			o.check(result.length).equals(4)
		})
	})
})
