import { ArchiveDataType, GroupType, MailMethod, MailPhishingStatus, MailState, ReplyType } from "@tutao/app-env"
import { RecipientList } from "../../../common/recipients/Recipient.js"
import { UserFacade } from "../UserFacade.js"
import { MailFacade } from "./MailFacade.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { sysTypeRefs, tutanotaServices, tutanotaTypeRefs } from "@tutao/typerefs"
import { getFirstOrThrow, isEmpty, neverNull, promiseMap } from "@tutao/utils"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { aes256RandomKey, CryptoWrapper, encryptKey, VersionedKey } from "@tutao/crypto"
import { FileReference } from "../../../common/utils/FileUtils.js"
import { BlobFacade } from "./BlobFacade.js"
import { NativeFileApp } from "../../../../native/common/FileApp.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { DataFile } from "../../../common/DataFile.js"
import { IMPORT_MAIL_SERVICE_SIZE_LIMIT, restSuspension } from "@tutao/rest-client"
import { KeyLoaderFacade } from "../KeyLoaderFacade"
import { locator } from "../../../../../mail-app/workerUtils/worker/WorkerLocator"

export interface ImapImportTutanotaFileId {
	readonly _type: "ImapImportTutanotaFileId"
	_id: IdTuple
}

export type ImapImportDataFile = DataFile & { fileHash: string | null }
export type ImapImportFileReference = FileReference & { fileHash: string | null }

export type ImapImportAttachment = ImapImportTutanotaFileId | ImapImportDataFile
export type ImapImportAttachments = ReadonlyArray<ImapImportTutanotaFileId | ImapImportDataFile>

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
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async importMails(importMailsParamsList: Array<ImportMailParams>): Promise<void> {
		let encImports: Array<sysTypeRefs.StringWrapper> = []
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const imapUidsToImapAttachments = new Map<number, ImapImportAttachments>(
			importMailsParamsList.map((importMailParams) => [importMailParams.imapUid, importMailParams.attachments ?? []]),
		)
		const imapUidsToImportAttachments = await this._createAddedImportAttachments(imapUidsToImapAttachments, mailGroupId, mailGroupKey)
		let currentEstimatedCallSize = 0
		const chunkedEncImports: Array<Array<sysTypeRefs.StringWrapper>> = []
		for (const importMailParams of importMailsParamsList) {
			const sk = aes256RandomKey()

			const ownerEncSessionKey = this.cryptoWrapper.encryptKey(mailGroupKey.object, sk)

			const importMailData = tutanotaTypeRefs.createImportMailData({
				ownerKeyVersion: "0",
				ownerEncSessionKey: ownerEncSessionKey,
				subject: importMailParams.subject,
				compressedBodyText: importMailParams.bodyText,
				date: importMailParams.receivedDate,
				state: importMailParams.state,
				unread: importMailParams.unread,
				messageId: importMailParams.messageId,
				inReplyTo: importMailParams.inReplyTo,
				references: importMailParams.references.map(referenceToImportMailDataMailReference),
				sender: tutanotaTypeRefs.createMailAddress({
					name: importMailParams.senderName,
					address: importMailParams.senderMailAddress,
					contact: null,
				}),
				confidential: false,
				method: importMailParams.method,
				replyType: importMailParams.replyType,
				differentEnvelopeSender: importMailParams.differentEnvelopeSender,
				phishingStatus: MailPhishingStatus.UNKNOWN,
				compressedHeaders: importMailParams.headers,
				//fixme: Fix replies to
				replyTos: [],
				recipients: tutanotaTypeRefs.createRecipients({
					toRecipients: importMailParams.toRecipients.map((recipient) =>
						tutanotaTypeRefs.createMailAddress({
							name: recipient.name ?? "",
							address: recipient.address,
							contact: null,
						}),
					),
					ccRecipients: importMailParams.ccRecipients.map((recipient) =>
						tutanotaTypeRefs.createMailAddress({
							name: recipient.name ?? "",
							address: recipient.address,
							contact: null,
						}),
					),
					bccRecipients: importMailParams.bccRecipients.map((recipient) =>
						tutanotaTypeRefs.createMailAddress({
							name: recipient.name ?? "",
							address: recipient.address,
							contact: null,
						}),
					),
				}),

				importedAttachments: imapUidsToImportAttachments.get(importMailParams.imapUid) ?? [],
				imapUid: importMailParams.imapUid.toString(),
				imapModSeq: importMailParams.imapModSeq?.toString() ?? null,
			})

			const unTypedInstance = await this.instancePipeline.mapAndEncrypt(tutanotaTypeRefs.ImportMailDataTypeRef, importMailData, sk)

			const encImport = sysTypeRefs.createStringWrapper({
				value: JSON.stringify(unTypedInstance),
			})
			currentEstimatedCallSize += encImport.value.length
			if (currentEstimatedCallSize >= IMPORT_MAIL_SERVICE_SIZE_LIMIT) {
				chunkedEncImports.push(encImports)
				encImports = []
				currentEstimatedCallSize = encImport.value.length
			}
			encImports.push(encImport)
		}
		if (encImports.length > 0) {
			chunkedEncImports.push(encImports)
		}
		for (const encImports of chunkedEncImports) {
			const importMailPostIn = tutanotaTypeRefs.createImportMailPostIn({
				encImports,
				//FIXME: use proper mail state
				importFileMailState: null,
				imapFolderSyncState: getFirstOrThrow(importMailsParamsList).imapFolderSyncState,
			})
			await this.serviceExecutor.post(tutanotaServices.ImportMailService, importMailPostIn, {
				suspensionBehavior: restSuspension.SuspensionBehavior.Throw,
			})
		}
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing and returns all ImportAttachments
	 */
	private async _createAddedImportAttachments(
		providedFiles: Map<number, ImapImportAttachments>,
		ownerMailGroupId: Id,
		mailGroupKey: VersionedKey,
	): Promise<Map<number, tutanotaTypeRefs.ImportAttachment[]>> {
		const result = new Map<number, tutanotaTypeRefs.ImportAttachment[]>()
		if (providedFiles.size === 0) return result

		const entries = Array.from(providedFiles.entries())

		const alreadyOnServer = new Map(entries.map(([key, files]) => [key, files.filter(isImapImportTutanotaFileId)]))

		const notOnServer = new Map(entries.map(([key, files]) => [key, files.filter((f) => !isImapImportTutanotaFileId(f))])) as Map<
			number,
			ImapImportDataFile[]
		>

		await promiseMap(alreadyOnServer, async ([key, files]) => {
			const attachments: tutanotaTypeRefs.ImportAttachment[] = []
			for (const file of files) {
				const existingFile = await this.entityClient.load(tutanotaTypeRefs.FileTypeRef, file._id)
				const fileSessionKey = await this.crypto.resolveSessionKey(existingFile)
				attachments.push(
					tutanotaTypeRefs.createImportAttachment({
						existingAttachmentFile: existingFile._id,
						ownerEncFileSessionKey: encryptKey(mailGroupKey.object, <number[]>neverNull(fileSessionKey)),
						newAttachment: null,
						ownerFileKeyVersion: "0", // FIXME
					}),
				)
			}

			if (!isEmpty(attachments)) {
				result.set(key, attachments)
			}
		})

		const filesToUpload = Array.from(notOnServer.entries()).flatMap(([key, files]) => files.map((file) => ({ key, file })))

		const fileDataForUpload = await promiseMap(filesToUpload, async ({ key, file }) => ({
			key,
			data: file.data,
			sessionKey: aes256RandomKey(),
			original: file,
		}))

		const referenceTokens = await this.blobFacade.encryptAndUploadMultiple(
			ArchiveDataType.Attachments,
			ownerMailGroupId,
			fileDataForUpload,
			await this.blobFacade.generateTransferId(),
		)

		for (let index = 0; index < fileDataForUpload.length; index++) {
			const file = fileDataForUpload[index]
			const tokens = referenceTokens[index]

			const draftAttachment = this.mailFacade.createAndEncryptDraftAttachment(tokens, file.sessionKey, file.original, mailGroupKey)

			const importAttachment = draftAttachmentToImportAttachment(draftAttachment, file.original.fileHash, mailGroupKey)

			const existing = result.get(file.key) ?? []
			existing.push(importAttachment)
			result.set(file.key, existing)
		}

		return result
	}
}

export function isImapImportTutanotaFileId(file: ImapImportAttachment): file is ImapImportTutanotaFileId {
	return file._type === "ImapImportTutanotaFileId"
}

export function referenceToImportMailDataMailReference(reference: string): tutanotaTypeRefs.ImportMailDataMailReference {
	return tutanotaTypeRefs.createImportMailDataMailReference({
		reference: reference,
	})
}

function draftAttachmentToImportAttachment(
	draftAttachment: tutanotaTypeRefs.DraftAttachment,
	newFileHash: string | null,
	mailGroupKey: VersionedKey,
): tutanotaTypeRefs.ImportAttachment {
	let importAttachment = tutanotaTypeRefs.createImportAttachment({
		existingAttachmentFile: draftAttachment.existingFile,
		ownerEncFileSessionKey: draftAttachment.ownerEncFileSessionKey,
		newAttachment: null,
		// FIXME
		ownerFileKeyVersion: "0",
	})

	let newFile = draftAttachment.newFile
	if (newFile != null) {
		const fileHashSessionKey = aes256RandomKey()
		importAttachment.newAttachment = tutanotaTypeRefs.createNewImportAttachment({
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
