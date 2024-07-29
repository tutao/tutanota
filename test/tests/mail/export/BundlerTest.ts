import o from "@tutao/otest"
import { makeMailBundle } from "../../../../src/mail-app/mail/export/Bundler.js"
import {
	BodyTypeRef,
	FileTypeRef,
	HeaderTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { MailState } from "../../../../src/common/api/common/TutanotaConstants.js"
import { DataFile } from "../../../../src/common/api/common/DataFile.js"
import { HtmlSanitizer } from "../../../../src/common/misc/HtmlSanitizer.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { FileController } from "../../../../src/common/file/FileController.js"
import { matchers, object, verify, when } from "testdouble"
import { MailFacade } from "../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { createTestEntity } from "../../TestUtils.js"
import { CryptoFacade } from "../../../../src/common/api/worker/crypto/CryptoFacade.js"

o.spec("Bundler", function () {
	let entityClientMock: EntityClient
	let fileControllerMock: FileController
	let sanitizerMock: HtmlSanitizer
	let mailFacadeMock: MailFacade
	let cryptoMock: CryptoFacade

	o.beforeEach(function () {
		entityClientMock = object()
		fileControllerMock = object()
		sanitizerMock = object()
		mailFacadeMock = object()
		cryptoMock = object()
	})
	o("make mail bundle non compressed headers", async function () {
		const mailId: IdTuple = ["maillistid", "maillid"]
		const subject = "hello"
		const sanitizedBodyText = "this is the sanitized body text of the email"
		const sender = { address: "sender@mycoolsite.co.uk", name: "the sender" }
		const sentOn = new Date()
		const receivedOn = new Date()
		const attachmentListId: Id = "attachmentListId"
		const attachmentIds: Id[] = ["attachmentId1", "attachmentId2", "attachmentId3"]
		const attachments: Array<DataFile> = attachmentIds.map((id) => {
			return {
				_type: "DataFile",
				id: undefined,
				name: id,
				cid: id,
				data: new Uint8Array(),
				size: 4,
				mimeType: "test",
			}
		})

		const bodyText = "This is the body text of the body of the email"
		const body = createTestEntity(BodyTypeRef, { text: bodyText })
		const toValues = {
			address: "to@mycoolsite.co.uk",
			name: "the to",
		}
		const ccValues = {
			address: "cc@mycoolsite.co.uk",
			name: "the cc",
		}
		const bccValues = {
			address: "bcc@mycoolsite.co.uk",
			name: "the bcc",
		}
		const recipients = createTestEntity(RecipientsTypeRef, {
			toRecipients: [createTestEntity(MailAddressTypeRef, toValues)],
			ccRecipients: [createTestEntity(MailAddressTypeRef, ccValues)],
			bccRecipients: [createTestEntity(MailAddressTypeRef, bccValues)],
		})
		const headersText = "this is the headers"
		const replyToValues = {
			address: "replyto@mycoolsite.co.uk",
			name: "the replyto",
		}
		const mailDetails = createTestEntity(MailDetailsTypeRef, {
			_id: "detailsId",
			headers: createTestEntity(HeaderTypeRef, { headers: headersText }),
			body: body,
			recipients,
			sentDate: new Date(sentOn),
			replyTos: [createTestEntity(MailAddressTypeRef, replyToValues)],
		})
		const mailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, { _id: ["archiveId", mailDetails._id], details: mailDetails })

		const mail = createTestEntity(MailTypeRef, {
			_id: mailId,
			subject,
			sender: createTestEntity(MailAddressTypeRef, sender),
			state: MailState.RECEIVED,
			unread: false,
			receivedDate: new Date(receivedOn),
			attachments: attachmentIds.map((id) => [attachmentListId, id] as IdTuple),
			mailDetails: mailDetailsBlob._id,
		})

		when(mailFacadeMock.loadMailDetailsBlob(mail)).thenResolve(mailDetails)

		for (const attachment of attachments) {
			// the file is only needed to pass to the fileController and is not kept, so we mock it as a string for convenience
			when(entityClientMock.load(FileTypeRef, [attachmentListId, attachment.name])).thenResolve(`file ${attachment.name}` as any)
			when(fileControllerMock.getAsDataFile(`file ${attachment.name}` as any)).thenResolve(attachment)
		}

		when(
			sanitizerMock.sanitizeHTML(bodyText, {
				blockExternalContent: false,
				allowRelativeLinks: false,
				usePlaceholderForInlineImages: false,
			}),
		).thenReturn({ html: sanitizedBodyText })

		const attachmentsCaptor = matchers.captor()
		when(cryptoMock.enforceSessionKeyUpdateIfNeeded(mail, attachmentsCaptor.capture())).thenDo((mail: Mail, attachments: File) =>
			Promise.resolve(attachments),
		)

		const bundle = await makeMailBundle(mail, mailFacadeMock, entityClientMock, fileControllerMock, sanitizerMock, cryptoMock)
		verify(cryptoMock.enforceSessionKeyUpdateIfNeeded(mail, attachments.map((a) => `file ${a.name}`) as any))

		o(bundle).deepEquals({
			mailId: mailId,
			subject: subject,
			sender: sender,
			body: sanitizedBodyText,
			to: [toValues],
			cc: [ccValues],
			bcc: [bccValues],
			replyTo: [replyToValues],
			isDraft: false,
			isRead: true,
			headers: headersText,
			attachments: attachments,
			sentOn: sentOn.getTime(),
			receivedOn: receivedOn.getTime(),
		})
	})
})
