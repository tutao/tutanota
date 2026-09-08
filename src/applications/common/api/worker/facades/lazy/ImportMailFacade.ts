import { DataFile, MailMethod, MailPhishingStatus, MailState, PartialRecipient, RecipientList, ReplyType } from "../../../../../../entities/tutanota/Utils"
import { recipientToEncryptedMailAddress } from "./MailFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { BlobFacade } from "./BlobFacade"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { AeadCipherVersion, AesKey, CryptoWrapper, KeyEncryption, SessionKeyDecryptor, SymmetricCipherUtils, VersionedKey } from "@tutao/crypto"
import {
	createFileTransferAggregatedType,
	createImportAttachment,
	createImportedBody,
	createImportedDeduplicatedImportedAttachment,
	createImportedHeader,
	createImportedImportedMigrationMail,
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
	ImportMailService_POST,
} from "@tutao/entities/tutanota"
import { assertNotNull, getFirstOrThrow, isEmpty, Nullable, promiseMap } from "@tutao/utils"
import { ArchiveDataType } from "../../../../../../entities/sys/Utils"
import { BlobReferenceTokenWrapper, createStringWrapper, StringWrapper } from "@tutao/entities/sys"
import { IMPORT_MAIL_SERVICE_SIZE_LIMIT } from "@tutao/rest-client"
import { SuspensionBehavior } from "@tutao/rest-client/types"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"

export interface MigrationImportTutaFileId {
	readonly _type: "MigrationImportTutaFileId"
	_id: IdTuple
}

export type MigrationImportDataFile = DataFile & { fileHash: string | null }

export type MigrationImportAttachment = MigrationImportTutaFileId | MigrationImportDataFile
export type MigrationImportAttachments = ReadonlyArray<MigrationImportTutaFileId | MigrationImportDataFile>

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
	attachments: MigrationImportAttachments | null
	sourceId: string // imapUid.toString() for IMAP imported mails
	imapUid: number | null
	imapModSeq: bigint | null
	mailboxMigrationFolderSyncState: IdTuple
	labels: IdTuple[]
}

/**
 * The ImportMailFacade is responsible for importing mails to the Tuta server.
 * The facade communicates directly with the ImportMailService.
 */
export class ImportMailFacade {
	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly blobFacade: BlobFacade,
		private readonly crypto: CryptoFacade,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly instancePipeline: InstancePipeline,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly keyEncryption: KeyEncryption,
	) {}

	async importMails(importMailsParamsList: Array<ImportMailParams>, mailGroupId: Id): Promise<void> {
		let encImports2: Array<StringWrapper> = []
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const mailKeyToMigrationImportAttachments = new Map<string, MigrationImportAttachments>(
			importMailsParamsList.map((importMailParams) => [importMailParams.sourceId, importMailParams.attachments ?? []]),
		)
		const mailKeyToImportAttachments = await this._createAddedImportAttachments(mailKeyToMigrationImportAttachments, mailGroupId, mailGroupKey)
		let currentEstimatedCallSize = 0
		const chunkedEncImports2: Array<Array<StringWrapper>> = []
		for (const importMailParams of importMailsParamsList) {
			const sessionKey = this.symmetricCipherUtils.aes256RandomKey()
			const kdfNonce = this.symmetricCipherUtils.generateKdfNonce()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sessionKey)

			const firstPartialRecipient: Nullable<PartialRecipient> =
				importMailParams.toRecipients[0] ?? importMailParams.ccRecipients[0] ?? importMailParams.bccRecipients[0] ?? null
			const firstRecipient: Nullable<ImportedMailAddress> =
				firstPartialRecipient &&
				createImportedMailAddress({
					name: firstPartialRecipient.name ?? "",
					address: firstPartialRecipient.address,
				})

			const importedMail = createImportedMail({
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: kdfNonce,
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

			const importedMailDetailsBlob = createImportedMailDetailsBlob({
				_ownerEncSessionKey: this.cryptoWrapper.encryptKey(mailGroupKey.object, sessionKey),
				_ownerKeyVersion: mailGroupKey.version.toString(),
				_kdfNonce: kdfNonce,
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
					sentDate: importMailParams.sentDate,
				}),
			})

			const importMailData2 = createImportMailData2({
				importAttachments: mailKeyToImportAttachments.get(importMailParams.sourceId) ?? [],
				imapUid: importMailParams.imapUid?.toString() ?? null,
				importedMigrationMail: createImportedImportedMigrationMail({
					sourceId: importMailParams.sourceId ?? importMailParams.imapUid?.toString() ?? null,
					imapModSeq: importMailParams.imapModSeq?.toString() ?? null,
				}),
				mail: importedMail,
				inReplyTo: importMailParams.inReplyTo,
				labels: importMailParams.labels,
				mailDetailsBlob: importedMailDetailsBlob,
				messageId: importMailParams.messageId,
				references: importMailParams.references.map(referenceToImportMailDataMailReference),
			})

			const untypedInstance = await this.instancePipeline.mapAndEncryptForDataTransferType(
				ImportMailData2TypeRef,
				importMailData2,
				mailGroupKey,
				AeadCipherVersion.WithInstanceKey,
				new SessionKeyDecryptor(mailGroupKey, this.keyEncryption),
			)

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
				mailboxMigrationFolderSyncState: getFirstOrThrow(importMailsParamsList).mailboxMigrationFolderSyncState,
				encImports2,
			})
			await this.serviceExecutor.execute(ImportMailService_POST, importMailPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				...(await this.keyLoader.assembleServiceEncryptionParamsForPost(mailGroupId)),
				suspensionBehavior: SuspensionBehavior.Throw,
			})
		}
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing and returns all ImportAttachments
	 */
	// visible for testing
	async _createAddedImportAttachments(
		providedFiles: Map<string, MigrationImportAttachments>,
		mailGroupId: Id,
		mailGroupKey: VersionedKey,
	): Promise<Map<string, ImportAttachment[]>> {
		const result = new Map<string, ImportAttachment[]>()
		if (providedFiles.size === 0) return result

		const entries = Array.from(providedFiles.entries())

		const alreadyOnServer = new Map(entries.map(([key, files]) => [key, files.filter(isMigrationImportTutaFileId)]))

		const notOnServer = new Map(entries.map(([key, files]) => [key, files.filter((f) => !isMigrationImportTutaFileId(f))])) as Map<
			string,
			MigrationImportDataFile[]
		>

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
			sessionKey: this.symmetricCipherUtils.aes256RandomKey(),
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
		newFile: MigrationImportDataFile,
		mailGroupKey: VersionedKey,
	): ImportAttachment {
		const ownerEncFileSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, fileSessionKey)
		const fileKdfNonce = this.symmetricCipherUtils.generateKdfNonce()

		const fileHash = newFile.fileHash

		const fileHashSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const ownerEncFileHashSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, fileHashSessionKey)
		const fileHashKdfNonce = this.symmetricCipherUtils.generateKdfNonce()

		let deduplicatedImportedAttachment: Nullable<ImportedDeduplicatedImportedAttachment> = null
		if (fileHash) {
			deduplicatedImportedAttachment = createImportedDeduplicatedImportedAttachment({
				_ownerEncSessionKey: ownerEncFileHashSessionKey.key,
				_ownerKeyVersion: ownerEncFileHashSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: fileHashKdfNonce,
				attachmentHash: fileHash,
			})
		}

		const file = createFileTransferAggregatedType({
			_ownerEncSessionKey: ownerEncFileSessionKey.key,
			_ownerKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
			_kdfNonce: fileKdfNonce,
			cid: newFile.cid ?? null,
			name: newFile.name,
			mimeType: newFile.mimeType,
		})

		const newAttachment = createNewImportAttachment({
			referenceTokens: referenceTokens,
			deduplicatedImportedAttachment,
			file,

			// No longer used

			encFileHash: null,
			ownerEncFileHashSessionKey: null,
			ownerKeyVersion: null,
			encFileName: null,
			encCid: null,
			encMimeType: null,
		})

		return createImportAttachment({
			ownerEncFileSessionKey: ownerEncFileSessionKey.key,
			ownerFileKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
			newAttachment,
			existingAttachmentFile: null,
		})
	}
}

export function isMigrationImportTutaFileId(file: MigrationImportAttachment): file is MigrationImportTutaFileId {
	return file._type === "MigrationImportTutaFileId"
}

export function referenceToImportMailDataMailReference(reference: string): ImportMailDataMailReference {
	return createImportMailDataMailReference({
		reference: reference,
	})
}
