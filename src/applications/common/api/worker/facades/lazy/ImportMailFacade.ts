import { DataFile } from "../../../../../../entities/tutanota/MailBundle"
import { MailMethod, MailPhishingStatus, MailState, RecipientList, ReplyType } from "../../../../../../entities/tutanota/Utils"
import { MailFacade, recipientToEncryptedMailAddress } from "./MailFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { BlobFacade } from "./BlobFacade"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { aes256RandomKey, AesKey, CryptoWrapper, VersionedKey } from "@tutao/crypto"
import {
	createImportAttachment,
	createImportMailData,
	createImportMailDataMailReference,
	createImportMailPostIn,
	createMailAddress,
	createNewImportAttachment,
	createRecipients,
	FileTypeRef,
	ImportAttachment,
	ImportMailDataMailReference,
	ImportMailDataTypeRef,
	ImportMailService,
} from "@tutao/entities/tutanota"
import { assertNotNull, getFirstOrThrow, isEmpty, promiseMap } from "@tutao/utils"
import { ArchiveDataType } from "../../../../../../entities/sys/Utils"
import { BlobReferenceTokenWrapper, createStringWrapper, StringWrapper } from "@tutao/entities/sys"
import { IMPORT_MAIL_SERVICE_SIZE_LIMIT } from "@tutao/rest-client"
import { SuspensionBehavior } from "@tutao/rest-client/types"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"

export interface ImapImportTutaFileId {
	readonly _type: "ImapImportTutaFileId"
	_id: IdTuple
}

export type ImapImportDataFile = DataFile & { fileHash: string | null }

export type ImapImportAttachment = ImapImportTutaFileId | ImapImportDataFile
export type ImapImportAttachments = ReadonlyArray<ImapImportTutaFileId | ImapImportDataFile>

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
 * The ImportMailFacade is responsible for importing mails to the Tuta server.
 * The facade communicates directly with the ImportMailService.
 */
export class ImportMailFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly blobFacade: BlobFacade,
		private readonly crypto: CryptoFacade,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly instancePipeline: InstancePipeline,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async importMails(importMailsParamsList: Array<ImportMailParams>, mailGroupId: Id): Promise<void> {
		let encImports: Array<StringWrapper> = []
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const imapUidsToImapAttachments = new Map<number, ImapImportAttachments>(
			importMailsParamsList.map((importMailParams) => [importMailParams.imapUid, importMailParams.attachments ?? []]),
		)
		const imapUidsToImportAttachments = await this._createAddedImportAttachments(imapUidsToImapAttachments, mailGroupId, mailGroupKey)
		let currentEstimatedCallSize = 0
		const chunkedEncImports: Array<Array<StringWrapper>> = []
		for (const importMailParams of importMailsParamsList) {
			const sk = aes256RandomKey()

			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const importMailData = createImportMailData({
				ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				ownerEncSessionKey: ownerEncSessionKey.key,
				subject: importMailParams.subject,
				compressedBodyText: importMailParams.bodyText,
				date: importMailParams.receivedDate,
				state: importMailParams.state,
				unread: importMailParams.unread,
				messageId: importMailParams.messageId,
				inReplyTo: importMailParams.inReplyTo,
				references: importMailParams.references.map(referenceToImportMailDataMailReference),
				sender: createMailAddress({
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
				replyTos: importMailParams.replyTos.map(recipientToEncryptedMailAddress),
				recipients: createRecipients({
					toRecipients: importMailParams.toRecipients.map((recipient) =>
						createMailAddress({
							name: recipient.name ?? "",
							address: recipient.address,
							contact: null,
						}),
					),
					ccRecipients: importMailParams.ccRecipients.map((recipient) =>
						createMailAddress({
							name: recipient.name ?? "",
							address: recipient.address,
							contact: null,
						}),
					),
					bccRecipients: importMailParams.bccRecipients.map((recipient) =>
						createMailAddress({
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

			const untypedInstance = await this.instancePipeline.mapAndEncrypt(ImportMailDataTypeRef, importMailData, sk)

			const encImport = createStringWrapper({
				value: JSON.stringify(untypedInstance),
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
			const importMailPostIn = createImportMailPostIn({
				encImports,
				importFileMailState: null,
				imapFolderSyncState: getFirstOrThrow(importMailsParamsList).imapFolderSyncState,
			})
			await this.serviceExecutor.post(ImportMailService, importMailPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				suspensionBehavior: SuspensionBehavior.Throw,
			})
		}
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing and returns all ImportAttachments
	 */
	// visible for testing
	async _createAddedImportAttachments(
		providedFiles: Map<number, ImapImportAttachments>,
		mailGroupId: Id,
		mailGroupKey: VersionedKey,
	): Promise<Map<number, ImportAttachment[]>> {
		const result = new Map<number, ImportAttachment[]>()
		if (providedFiles.size === 0) return result

		const entries = Array.from(providedFiles.entries())

		const alreadyOnServer = new Map(entries.map(([key, files]) => [key, files.filter(isImapImportTutaFileId)]))

		const notOnServer = new Map(entries.map(([key, files]) => [key, files.filter((f) => !isImapImportTutaFileId(f))])) as Map<number, ImapImportDataFile[]>

		await promiseMap(alreadyOnServer, async ([key, files]) => {
			const attachments: ImportAttachment[] = []
			for (const file of files) {
				const existingFile = await this.entityClient.load(FileTypeRef, file._id)
				const fileSessionKey = await this.crypto.resolveSessionKey(existingFile)

				const ownerEncFileSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, assertNotNull(fileSessionKey))

				attachments.push(
					createImportAttachment({
						ownerEncFileSessionKey: ownerEncFileSessionKey.key,
						ownerFileKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
						existingAttachmentFile: existingFile._id,
						newAttachment: null,
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
			mailGroupId,
			fileDataForUpload,
			await this.blobFacade.generateTransferId(),
		)

		for (let index = 0; index < fileDataForUpload.length; index++) {
			const file = fileDataForUpload[index]
			const tokens = referenceTokens[index]

			const importAttachment = this.createAndEncryptImportAttachment(tokens, file.sessionKey, file.original, mailGroupKey)

			const existing = result.get(file.key) ?? []
			existing.push(importAttachment)
			result.set(file.key, existing)
		}

		return result
	}

	private createAndEncryptImportAttachment(
		referenceTokens: BlobReferenceTokenWrapper[],
		fileSessionKey: AesKey,
		newFile: ImapImportDataFile,
		mailGroupKey: VersionedKey,
	): ImportAttachment {
		const ownerEncFileSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, fileSessionKey)

		const importAttachment = createImportAttachment({
			ownerEncFileSessionKey: ownerEncFileSessionKey.key,
			ownerFileKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
			newAttachment: null,
			existingAttachmentFile: null,
		})

		const fileHash = newFile.fileHash

		const fileHashSessionKey = aes256RandomKey()
		const ownerEncFileHashSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, fileHashSessionKey)

		importAttachment.newAttachment = createNewImportAttachment({
			encFileHash: fileHash ? this.cryptoWrapper.encryptString(fileHashSessionKey, fileHash) : null,
			ownerEncFileHashSessionKey: fileHash ? ownerEncFileHashSessionKey.key : null,
			ownerKeyVersion: fileHash ? ownerEncFileHashSessionKey.encryptingKeyVersion.toString() : null,
			encFileName: this.cryptoWrapper.encryptString(fileSessionKey, newFile.name),
			encCid: newFile.cid == null ? null : this.cryptoWrapper.encryptString(fileSessionKey, newFile.cid),
			encMimeType: this.cryptoWrapper.encryptString(fileSessionKey, newFile.mimeType),
			referenceTokens: referenceTokens,
		})

		return importAttachment
	}
}

export function isImapImportTutaFileId(file: ImapImportAttachment): file is ImapImportTutaFileId {
	return file._type === "ImapImportTutaFileId"
}

export function referenceToImportMailDataMailReference(reference: string): ImportMailDataMailReference {
	return createImportMailDataMailReference({
		reference: reference,
	})
}
