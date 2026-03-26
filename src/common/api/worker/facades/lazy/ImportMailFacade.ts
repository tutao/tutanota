import { ArchiveDataType, GroupType, MailMethod, MailPhishingStatus, MailState, ReplyType } from "../../../common/TutanotaConstants.js"
import { RecipientList } from "../../../common/recipients/Recipient.js"
import { UserFacade } from "../UserFacade.js"
import { MailFacade } from "./MailFacade.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { EntityClient } from "../../../common/EntityClient.js"
import {
	createImportAttachment,
	createImportMailData,
	createImportMailDataMailReference,
	createImportMailPostIn,
	createMailAddress,
	createNewImportAttachment,
	createRecipients,
	DraftAttachment,
	FileTypeRef,
	ImportAttachment,
	ImportMailDataMailReference,
	ImportMailDataTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { byteLength, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { UNCOMPRESSED_MAX_SIZE } from "../../Compression.js"
import { MailBodyTooLargeError } from "../../../common/error/MailBodyTooLargeError.js"
import { aes256RandomKey, encryptKey } from "@tutao/tutanota-crypto"
import { ImportMailService } from "../../../entities/tutanota/Services.js"
import { FileReference, isDataFile } from "../../../common/utils/FileUtils.js"
import { BlobReferenceTokenWrapper, createStringWrapper } from "../../../entities/sys/TypeRefs.js"
import { BlobFacade } from "./BlobFacade.js"
import { NativeFileApp } from "../../../../native/common/FileApp.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { DataFile } from "../../../common/DataFile.js"
import { SuspensionBehavior } from "../../rest/RestClient.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade"
import { InstancePipeline } from "../../crypto/InstancePipeline"
import { VersionedKey } from "../../crypto/CryptoWrapper"
import { locator } from "../../../../../mail-app/workerUtils/worker/WorkerLocator"

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
	imapModSeq: bigint | null
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
		private readonly keyLoader: KeyLoaderFacade,
		private readonly instancePipeline: InstancePipeline,
	) {}

	async importMail({
		subject,
		bodyText,
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
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const sk = aes256RandomKey()

		const importMailData = createImportMailData({
			subject,
			compressedBodyText: bodyText,
			date: receivedDate,
			state,
			unread,
			messageId,
			inReplyTo,
			references: references.map(referenceToImportMailDataMailReference),
			sender: createMailAddress({
				name: senderName,
				address: senderMailAddress,
				contact: null,
			}),
			confidential: false,
			method,
			replyType,
			differentEnvelopeSender,
			phishingStatus: MailPhishingStatus.UNKNOWN,
			compressedHeaders: headers,
			//fixme: Fix replies to
			replyTos: [],
			recipients: createRecipients({
				toRecipients: toRecipients.map((recipient) =>
					createMailAddress({
						name: recipient.name ?? "",
						address: recipient.address,
						contact: null,
					}),
				),
				ccRecipients: ccRecipients.map((recipient) =>
					createMailAddress({
						name: recipient.name ?? "",
						address: recipient.address,
						contact: null,
					}),
				),
				bccRecipients: bccRecipients.map((recipient) =>
					createMailAddress({
						name: recipient.name ?? "",
						address: recipient.address,
						contact: null,
					}),
				),
			}),

			importedAttachments: await this._createAddedImportAttachments(attachments, mailGroupId, mailGroupKey),
		})

		const encryptedParsedInstance = await this.instancePipeline.mapAndEncrypt(ImportMailDataTypeRef, importMailData, sk)

		const importMailPostIn = createImportMailPostIn({
			encImports: [
				createStringWrapper({
					value: JSON.stringify(encryptedParsedInstance),
				}),
			],
			//FIXME: use proper mail state
			mailState: null,
			imapFolderSyncState: imapFolderSyncState,
		})

		await this.serviceExecutor.post(ImportMailService, importMailPostIn, { suspensionBehavior: SuspensionBehavior.Throw })
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing and returns all ImportAttachments
	 */
	async _createAddedImportAttachments(
		providedFiles: ImapImportAttachments | null,
		ownerMailGroupId: Id,
		mailGroupKey: VersionedKey,
	): Promise<ImportAttachment[]> {
		if (providedFiles == null || providedFiles.length === 0) return []

		return promiseMap(providedFiles, async (providedFile) => {
			if (isImapImportTutanotaFileId(providedFile)) {
				// attachment is already available on the server, but we need to load ownerEncFileSessionKey
				let existingFile = await this.entityClient.load(FileTypeRef, providedFile._id)
				return this.crypto.resolveSessionKey(existingFile).then((fileSessionKey) => {
					return createImportAttachment({
						existingAttachmentFile: existingFile._id,
						ownerEncFileSessionKey: encryptKey(mailGroupKey.object, <number[]>neverNull(fileSessionKey)),
						newAttachment: null,
						// FIXME
						ownerFileKeyVersion: "0",
					})
				})
			} else if (isDataFile(providedFile)) {
				const fileSessionKey = aes256RandomKey()
				let referenceTokens: Array<BlobReferenceTokenWrapper>
				const { location } = await this.fileApp.writeDataFile(providedFile)
				referenceTokens = await this.blobFacade.encryptAndUploadNative(ArchiveDataType.Attachments, location, ownerMailGroupId, fileSessionKey)
				await this.fileApp.deleteFile(location)
				let draftAttachment = this.mailFacade.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey)
				return draftAttachmentToImportAttachment(draftAttachment, providedFile.fileHash, mailGroupKey)
			} else {
				// (isFileReference(providedFile)) == true
				const fileSessionKey = aes256RandomKey()
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

function draftAttachmentToImportAttachment(draftAttachment: DraftAttachment, newFileHash: string | null, mailGroupKey: VersionedKey): ImportAttachment {
	let importAttachment = createImportAttachment({
		existingAttachmentFile: draftAttachment.existingFile,
		ownerEncFileSessionKey: draftAttachment.ownerEncFileSessionKey,
		newAttachment: null,
		// FIXME
		ownerFileKeyVersion: "0",
	})

	let newFile = draftAttachment.newFile
	if (newFile != null) {
		const fileHashSessionKey = aes256RandomKey()
		importAttachment.newAttachment = createNewImportAttachment({
			// FIXME add key version to TutanotaModelV108
			encFileHash: newFileHash ? locator.cryptoWrapper.encryptString(fileHashSessionKey, newFileHash) : null,
			ownerEncFileHashSessionKey: newFileHash ? encryptKey(mailGroupKey.object, fileHashSessionKey) : null,
			encFileName: newFile.encFileName,
			encCid: newFile.encCid,
			encMimeType: newFile.encMimeType,
			referenceTokens: newFile.referenceTokens,
		})
	}

	return importAttachment
}
