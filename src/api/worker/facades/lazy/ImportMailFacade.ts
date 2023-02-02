import { ArchiveDataType, GroupType, MailMethod, MailPhishingStatus, MailState, ReplyType } from "../../../common/TutanotaConstants.js"
import { RecipientList } from "../../../common/recipients/Recipient.js"
import { UserFacade } from "../UserFacade.js"
import { MailFacade, recipientToDraftRecipient, recipientToEncryptedMailAddress } from "./MailFacade.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { EntityClient } from "../../../common/EntityClient.js"
import {
	createImportAttachment,
	createImportMailData,
	createImportMailDataMailReference,
	createImportMailPostIn,
	createNewImportAttachment,
	DraftAttachment,
	FileTypeRef,
	ImportAttachment,
	ImportMailDataMailReference,
} from "../../../entities/tutanota/TypeRefs.js"
import { byteLength, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { UNCOMPRESSED_MAX_SIZE } from "../../Compression.js"
import { MailBodyTooLargeError } from "../../../common/error/MailBodyTooLargeError.js"
import { aes128RandomKey, encryptKey } from "@tutao/tutanota-crypto"
import { ImportMailService } from "../../../entities/tutanota/Services.js"
import { FileReference, isDataFile } from "../../../common/utils/FileUtils.js"
import { BlobReferenceTokenWrapper } from "../../../entities/sys/TypeRefs.js"
import { BlobFacade } from "./BlobFacade.js"
import { NativeFileApp } from "../../../../native/common/FileApp.js"
import { CryptoFacade, encryptString } from "../../crypto/CryptoFacade.js"
import { DataFile } from "../../../common/DataFile.js"
import { SuspensionBehavior } from "../../rest/RestClient.js"

export interface ImapImportTutanotaFileId {
	readonly _type: "ImapImportTutanotaFileId"
	_id: IdTuple
}

export type ImapImportDataFile = DataFile & { fileHash: string | null }
export type ImapImportFileReference = FileReference & { fileHash: string | null }

export type ImapImportAttachment = ImapImportTutanotaFileId | ImapImportDataFile | ImapImportFileReference
export type ImapImportAttachments = ReadonlyArray<ImapImportTutanotaFileId | ImapImportDataFile | ImapImportFileReference>

export interface ImportMailParams {
	subject: string
	bodyText: string
	sentDate: Date
	receivedDate: Date
	state: MailState
	unread: boolean
	messageId: string | null
	inReplyTo: string | null
	references: string[]
	senderMailAddress: string
	senderName: string
	method: MailMethod
	replyType: ReplyType
	differentEnvelopeSender: string | null
	headers: string
	replyTos: RecipientList
	toRecipients: RecipientList
	ccRecipients: RecipientList
	bccRecipients: RecipientList
	attachments: ImapImportAttachments | null
	imapUid: number
	imapModSeq: BigInt | null
	imapFolderSyncState: IdTuple
}

/**
 * The ImportMailFacade is responsible for importing mails to the Tutanota server.
 * The facade communicates directly with the ImportMailService.
 */
export class ImportMailFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly blobFacade: BlobFacade,
		private readonly fileApp: NativeFileApp,
		private readonly crypto: CryptoFacade,
	) {}

	async importMail({
		subject,
		bodyText,
		sentDate,
		receivedDate,
		state,
		unread,
		messageId,
		inReplyTo,
		references,
		senderMailAddress,
		senderName,
		method,
		replyType,
		differentEnvelopeSender,
		headers,
		replyTos,
		toRecipients,
		ccRecipients,
		bccRecipients,
		attachments,
		imapUid,
		imapModSeq,
		imapFolderSyncState,
	}: ImportMailParams): Promise<void> {
		if (byteLength(bodyText) > UNCOMPRESSED_MAX_SIZE) {
			throw new MailBodyTooLargeError(`Can not import mail, mail body too large (${byteLength(bodyText)})`)
		}

		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)
		const mailGroupKey = this.userFacade.getGroupKey(mailGroupId)
		const sk = aes128RandomKey()
		const service = createImportMailPostIn()
		service.ownerEncSessionKey = encryptKey(mailGroupKey, sk)
		service.ownerGroup = mailGroupId
		service.imapUid = imapUid.toString()
		service.imapModSeq = imapModSeq?.toString() ?? null
		service.imapFolderSyncState = imapFolderSyncState

		service.mailData = createImportMailData({
			subject,
			compressedBodyText: bodyText,
			sentDate,
			receivedDate,
			state,
			unread,
			messageId,
			inReplyTo,
			references: references.map(referenceToImportMailDataMailReference),
			senderMailAddress,
			senderName,
			confidential: false,
			method,
			replyType,
			differentEnvelopeSender,
			phishingStatus: MailPhishingStatus.UNKNOWN,
			compressedHeaders: headers,
			replyTos: replyTos.map(recipientToEncryptedMailAddress),
			toRecipients: toRecipients.map(recipientToDraftRecipient),
			ccRecipients: ccRecipients.map(recipientToDraftRecipient),
			bccRecipients: bccRecipients.map(recipientToDraftRecipient),
			importedAttachments: await this._createAddedImportAttachments(attachments, mailGroupId, mailGroupKey),
		})

		await this.serviceExecutor.post(ImportMailService, service, { sessionKey: sk, suspensionBehavior: SuspensionBehavior.Throw })
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing and returns all ImportAttachments
	 */
	async _createAddedImportAttachments(
		providedFiles: ImapImportAttachments | null,
		ownerMailGroupId: Id,
		mailGroupKey: Aes128Key,
	): Promise<ImportAttachment[]> {
		if (providedFiles == null || providedFiles.length === 0) return []

		return promiseMap(providedFiles, async (providedFile) => {
			if (isImapImportTutanotaFileId(providedFile)) {
				// attachment is already available on the server, but we need to load ownerEncFileSessionKey
				let existingFile = await this.entityClient.load(FileTypeRef, providedFile._id)
				return this.crypto.resolveSessionKeyForInstance(existingFile).then((fileSessionKey) => {
					const attachment = createImportAttachment()
					attachment.existingFile = existingFile._id
					attachment.ownerEncFileSessionKey = encryptKey(mailGroupKey, <number[]>neverNull(fileSessionKey))
					return attachment
				})
			} else if (isDataFile(providedFile)) {
				const fileSessionKey = aes128RandomKey()
				let referenceTokens: Array<BlobReferenceTokenWrapper>
				const { location } = await this.fileApp.writeDataFile(providedFile)
				referenceTokens = await this.blobFacade.encryptAndUploadNative(ArchiveDataType.Attachments, location, ownerMailGroupId, fileSessionKey)
				await this.fileApp.deleteFile(location)
				let draftAttachment = this.mailFacade.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey)
				return draftAttachmentToImportAttachment(draftAttachment, providedFile.fileHash, mailGroupKey)
			} else {
				// (isFileReference(providedFile)) == true
				const fileSessionKey = aes128RandomKey()
				const referenceTokens = await this.blobFacade.encryptAndUploadNative(
					ArchiveDataType.Attachments,
					providedFile.location,
					ownerMailGroupId,
					fileSessionKey,
				)
				let draftAttachment = this.mailFacade.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey)
				return draftAttachmentToImportAttachment(draftAttachment, providedFile.fileHash, mailGroupKey)
			}
		})
	}
}

export function isImapImportTutanotaFileId(file: ImapImportAttachment): file is ImapImportTutanotaFileId {
	return file._type === "ImapImportTutanotaFileId"
}

export function referenceToImportMailDataMailReference(reference: string): ImportMailDataMailReference {
	return createImportMailDataMailReference({
		reference: reference,
	})
}

function draftAttachmentToImportAttachment(draftAttachment: DraftAttachment, newFileHash: string | null, mailGroupKey: Aes128Key): ImportAttachment {
	let importAttachment = createImportAttachment()
	importAttachment.existingFile = draftAttachment.existingFile
	importAttachment.ownerEncFileSessionKey = draftAttachment.ownerEncFileSessionKey

	let newFile = draftAttachment.newFile
	if (newFile != null) {
		let newImportAttachment = createNewImportAttachment()

		const fileHashSessionKey = aes128RandomKey()

		newImportAttachment.encFileHash = newFileHash ? encryptString(fileHashSessionKey, newFileHash) : null
		newImportAttachment.ownerEncFileHashSessionKey = newFileHash ? encryptKey(mailGroupKey, fileHashSessionKey) : null
		newImportAttachment.encFileName = newFile.encFileName
		newImportAttachment.encCid = newFile.encCid
		newImportAttachment.encMimeType = newFile.encMimeType
		newImportAttachment.referenceTokens = newFile.referenceTokens

		importAttachment.newFile = newImportAttachment
	}

	return importAttachment
}
