import { DataFile } from "../../../../../../entities/tutanota/MailBundle"
import { MailMethod, MailPhishingStatus, MailState, PartialRecipient, RecipientList, ReplyType } from "../../../../../../entities/tutanota/Utils"
import { MailFacade, recipientToEncryptedMailAddress } from "./MailFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { BlobFacade } from "./BlobFacade"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { aes256RandomKey, AesKey, CryptoWrapper, VersionedKey } from "@tutao/crypto"
import {
	createFileTransferAggregatedType,
	createImportAttachment,
	createImportedBody,
	createImportedDeduplicatedImportedAttachment,
	createImportedHeader,
	createImportedImportedImapMail,
	createImportedMail,
	createImportedMailAddress,
	createImportedMailDetails,
	createImportedMailDetailsBlob,
	createImportedRecipients,
	createImportMailData2,
	createImportMailDataMailReference,
	createImportMailPostIn,
	createNewImportAttachment,
	FileTypeRef,
	ImportAttachment,
	ImportedDeduplicatedImportedAttachment,
	ImportedMailAddress,
	ImportMailData2TypeRef,
	ImportMailDataMailReference,
	ImportMailService,
} from "@tutao/entities/tutanota"
import { assertNotNull, getFirstOrThrow, isEmpty, Nullable, promiseMap } from "@tutao/utils"
import { ArchiveDataType } from "../../../../../../entities/sys/Utils"
import { BlobReferenceTokenWrapper, createStringWrapper, StringWrapper } from "@tutao/entities/sys"
import { IMPORT_MAIL_SERVICE_SIZE_LIMIT } from "@tutao/rest-client"
import { SuspensionBehavior } from "@tutao/rest-client/types"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { ServiceExecutor } from "../../../../../../platform-kit/network/ServiceExecutor"

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
	labels: IdTuple[]
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
		let encImports2: Array<StringWrapper> = []
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const imapUidsToImapAttachments = new Map<number, ImapImportAttachments>(
			importMailsParamsList.map((importMailParams) => [importMailParams.imapUid, importMailParams.attachments ?? []]),
		)
		const imapUidsToImportAttachments = await this._createAddedImportAttachments(imapUidsToImapAttachments, mailGroupId, mailGroupKey)
		let currentEstimatedCallSize = 0
		const chunkedEncImports2: Array<Array<StringWrapper>> = []
		for (const importMailParams of importMailsParamsList) {
			const sk = aes256RandomKey()

			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const firstPartialRecipient: Nullable<PartialRecipient> =
				importMailParams.toRecipients[0] ?? importMailParams.ccRecipients[0] ?? importMailParams.bccRecipients[0] ?? null
			const firstRecipient: Nullable<ImportedMailAddress> =
				firstPartialRecipient &&
				createImportedMailAddress({
					name: firstPartialRecipient.name ?? "",
					address: firstPartialRecipient.address,
				})

			const importedMail = createImportedMail({
				subject: importMailParams.subject,
				method: importMailParams.method,
				confidential: false,
				differentEnvelopeSender: importMailParams.differentEnvelopeSender,
				firstRecipient,
				phishingStatus: MailPhishingStatus.UNKNOWN,
				receivedDate: importMailParams.receivedDate,
				replyType: importMailParams.replyType,
				sender: createImportedMailAddress({
					name: importMailParams.senderName,
					address: importMailParams.senderMailAddress,
				}),
				state: importMailParams.state,
				unread: importMailParams.unread,
			})

			importedMail._ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
			importedMail._ownerEncSessionKey = ownerEncSessionKey.key

			const importMailData2 = createImportMailData2({
				importAttachments: imapUidsToImportAttachments.get(importMailParams.imapUid) ?? [],
				importedImapMail: createImportedImportedImapMail({
					imapUid: importMailParams.imapUid.toString(),
					imapModSeq: importMailParams.imapModSeq?.toString() ?? null,
				}),
				mail: importedMail,
				inReplyTo: importMailParams.inReplyTo,
				labels: importMailParams.labels,
				mailDetailsBlob: createImportedMailDetailsBlob({
					details: createImportedMailDetails({
						body: createImportedBody({
							compressedText: importMailParams.bodyText,
						}),
						headers: createImportedHeader({
							compressedHeaders: importMailParams.headers,
						}),
						recipients: createImportedRecipients({
							toRecipients: importMailParams.toRecipients.map((recipient) =>
								createImportedMailAddress({
									name: recipient.name ?? "",
									address: recipient.address,
								}),
							),
							ccRecipients: importMailParams.ccRecipients.map((recipient) =>
								createImportedMailAddress({
									name: recipient.name ?? "",
									address: recipient.address,
								}),
							),
							bccRecipients: importMailParams.bccRecipients.map((recipient) =>
								createImportedMailAddress({
									name: recipient.name ?? "",
									address: recipient.address,
								}),
							),
						}),
						replyTos: importMailParams.replyTos.map(recipientToEncryptedMailAddress),
						// There is also a sent date in importMailParams. Should that be used instead???
						sentDate: importMailParams.receivedDate,
					}),
				}),
				messageId: importMailParams.messageId,
				references: importMailParams.references.map(referenceToImportMailDataMailReference),
			})

			const subKeyInfo = (this.serviceExecutor as ServiceExecutor)["getSubKeyInfo"](sk) // TODO: make this less hacky
			const untypedInstance = await this.instancePipeline.mapAndEncryptWithSubKeyInfo(ImportMailData2TypeRef, importMailData2, subKeyInfo, mailGroupKey)

			const encImport2 = createStringWrapper({
				value: untypedInstance.getJsonRepresentation(),
			})
			currentEstimatedCallSize += encImport2.value.length
			if (currentEstimatedCallSize >= IMPORT_MAIL_SERVICE_SIZE_LIMIT) {
				chunkedEncImports2.push(encImports2)
				encImports2 = []
				currentEstimatedCallSize = encImport2.value.length
			}
			encImports2.push(encImport2)
		}
		if (encImports2.length > 0) {
			chunkedEncImports2.push(encImports2)
		}
		for (const encImports2 of chunkedEncImports2) {
			const importMailPostIn = createImportMailPostIn({
				encImports: [],
				importFileMailState: null,
				imapFolderSyncState: getFirstOrThrow(importMailsParamsList).imapFolderSyncState,
				encImports2,
			})
			await this.serviceExecutor.post(ImportMailService, importMailPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				suspensionBehavior: SuspensionBehavior.Throw,
				ownerKey: mailGroupKey,
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
						newAttachment: null, // TODO: Is this never used???
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

		let deduplicatedImportedAttachment: Nullable<ImportedDeduplicatedImportedAttachment> = null
		if (fileHash) {
			deduplicatedImportedAttachment = createImportedDeduplicatedImportedAttachment({
				attachmentHash: fileHash,
			})
			deduplicatedImportedAttachment._ownerEncSessionKey = ownerEncFileHashSessionKey.key
			deduplicatedImportedAttachment._ownerKeyVersion = ownerEncFileHashSessionKey.encryptingKeyVersion.toString()
		}

		const file = createFileTransferAggregatedType({
			cid: newFile.cid ?? null,
			name: newFile.name,
			mimeType: newFile.mimeType,
		})
		file._ownerEncSessionKey = ownerEncFileSessionKey.key
		file._ownerKeyVersion = ownerEncFileSessionKey.encryptingKeyVersion.toString()

		importAttachment.newAttachment = createNewImportAttachment({
			referenceTokens: referenceTokens,
			deduplicatedImportedAttachment,
			file,

			// No longer used

			encFileHash: null,
			ownerEncFileHashSessionKey: null,
			encFileName: null,
			encCid: null,
			encMimeType: null,
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
