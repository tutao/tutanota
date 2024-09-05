import type { CryptoFacade } from "../../crypto/CryptoFacade.js"
import {
	DraftService,
	ExternalUserService,
	ListUnsubscribeService,
	MailFolderService,
	MailService,
	MoveMailService,
	ReportMailService,
	SendDraftService,
} from "../../../entities/tutanota/Services.js"
import {
	ArchiveDataType,
	ConversationType,
	CounterType,
	CryptoProtocolVersion,
	DEFAULT_KDF_TYPE,
	EncryptionAuthStatus,
	GroupType,
	KdfType,
	MailAuthenticationStatus,
	MailMethod,
	MailReportType,
	OperationType,
	PhishingMarkerStatus,
	PublicKeyIdentifierType,
	ReportedMailFieldType,
	SYSTEM_GROUP_MAIL_ADDRESS,
} from "../../../common/TutanotaConstants.js"
import type {
	Contact,
	DraftAttachment,
	DraftRecipient,
	EncryptedMailAddress,
	File as TutanotaFile,
	InternalRecipientKeyData,
	Mail,
	MailFolder,
	ReportedMailFieldMarker,
	SendDraftData,
	SymEncInternalRecipientKeyData,
} from "../../../entities/tutanota/TypeRefs.js"
import {
	createAttachmentKeyData,
	createCreateExternalUserGroupData,
	createCreateMailFolderData,
	createDeleteMailData,
	createDeleteMailFolderData,
	createDraftAttachment,
	createDraftCreateData,
	createDraftData,
	createDraftRecipient,
	createDraftUpdateData,
	createEncryptedMailAddress,
	createExternalUserData,
	createListUnsubscribeData,
	createMoveMailData,
	createNewDraftAttachment,
	createReportMailPostData,
	createSecureExternalRecipientKeyData,
	createSendDraftData,
	createUpdateMailFolderData,
	FileTypeRef,
	InternalRecipientKeyDataTypeRef,
	MailDetails,
	MailDetailsBlobTypeRef,
	MailDetailsDraftTypeRef,
	MailTypeRef,
	SymEncInternalRecipientKeyDataTypeRef,
	TutanotaPropertiesTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { RecipientsNotFoundError } from "../../../common/error/RecipientsNotFoundError.js"
import { NotFoundError } from "../../../common/error/RestError.js"
import type { EntityUpdate, ExternalUserReference, PublicKeyGetOut, User } from "../../../entities/sys/TypeRefs.js"
import {
	BlobReferenceTokenWrapper,
	createPublicKeyGetIn,
	ExternalUserReferenceTypeRef,
	GroupInfoTypeRef,
	GroupRootTypeRef,
	GroupTypeRef,
	UserTypeRef,
} from "../../../entities/sys/TypeRefs.js"
import {
	addressDomain,
	assertNotNull,
	byteLength,
	contains,
	defer,
	freshVersioned,
	isEmpty,
	isNotNull,
	isSameTypeRef,
	isSameTypeRefByAttr,
	noOp,
	ofClass,
	promiseFilter,
	promiseMap,
} from "@tutao/tutanota-utils"
import { BlobFacade } from "./BlobFacade.js"
import { assertWorkerOrNode, isApp, isDesktop } from "../../../common/Env.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { getEnabledMailAddressesForGroupInfo, getUserGroupMemberships } from "../../../common/utils/GroupUtils.js"
import { containsId, elementIdPart, getElementId, getLetId, isSameId, listIdPart, stringToCustomId } from "../../../common/utils/EntityUtils.js"
import { htmlToText } from "../../search/IndexUtils.js"
import { MailBodyTooLargeError } from "../../../common/error/MailBodyTooLargeError.js"
import { UNCOMPRESSED_MAX_SIZE } from "../../Compression.js"
import {
	Aes128Key,
	aes256RandomKey,
	AesKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	decryptKey,
	encryptKey,
	generateRandomSalt,
	keyToUint8Array,
	murmurHash,
	random,
	sha256Hash,
} from "@tutao/tutanota-crypto"
import { DataFile } from "../../../common/DataFile.js"
import { FileReference, isDataFile, isFileReference } from "../../../common/utils/FileUtils.js"
import { CounterService } from "../../../entities/monitor/Services.js"
import { PublicKeyService } from "../../../entities/sys/Services.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { createWriteCounterData } from "../../../entities/monitor/TypeRefs.js"
import { UserFacade } from "../UserFacade.js"
import { PartialRecipient, Recipient, RecipientList, RecipientType } from "../../../common/recipients/Recipient.js"
import { NativeFileApp } from "../../../../native/common/FileApp.js"
import { LoginFacade } from "../LoginFacade.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { OwnerEncSessionKeyProvider } from "../../rest/EntityRestClient.js"
import { resolveTypeReference } from "../../../common/EntityFunctions.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { encryptBytes, encryptKeyWithVersionedKey, encryptString, VersionedEncryptedKey, VersionedKey } from "../../crypto/CryptoWrapper.js"

assertWorkerOrNode()
type Attachments = ReadonlyArray<TutanotaFile | DataFile | FileReference>

interface CreateDraftParams {
	subject: string
	bodyText: string
	senderMailAddress: string
	senderName: string
	toRecipients: RecipientList
	ccRecipients: RecipientList
	bccRecipients: RecipientList
	conversationType: ConversationType
	previousMessageId: Id | null
	attachments: Attachments | null
	confidential: boolean
	replyTos: RecipientList
	method: MailMethod
}

interface UpdateDraftParams {
	subject: string
	body: string
	senderMailAddress: string
	senderName: string
	toRecipients: RecipientList
	ccRecipients: RecipientList
	bccRecipients: RecipientList
	attachments: Attachments | null
	confidential: boolean
	draft: Mail
}

export class MailFacade {
	private phishingMarkers: Set<string> = new Set()
	private deferredDraftId: IdTuple | null = null // the mail id of the draft that we are waiting for to be updated via websocket
	private deferredDraftUpdate: Record<string, any> | null = null // this deferred promise is resolved as soon as the update of the draft is received

	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly crypto: CryptoFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly blobFacade: BlobFacade,
		private readonly fileApp: NativeFileApp,
		private readonly loginFacade: LoginFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	async createMailFolder(name: string, parent: IdTuple | null, ownerGroupId: Id): Promise<void> {
		const mailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId)

		const sk = aes256RandomKey()
		const ownerEncSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sk)
		const newFolder = createCreateMailFolderData({
			folderName: name,
			parentFolder: parent,
			ownerEncSessionKey: ownerEncSessionKey.key,
			ownerGroup: ownerGroupId,
			ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
		})
		await this.serviceExecutor.post(MailFolderService, newFolder, { sessionKey: sk })
	}

	/**
	 * Updates a mail folder's name, if needed
	 * @param newName - if this is the same as the folder's current name, nothing is done
	 */
	async updateMailFolderName(folder: MailFolder, newName: string): Promise<void> {
		if (newName !== folder.name) {
			folder.name = newName
			await this.entityClient.update(folder)
		}
	}

	/**
	 * Updates a mail folder's parent, if needed
	 * @param newParent - if this is the same as the folder's current parent, nothing is done
	 */
	async updateMailFolderParent(folder: MailFolder, newParent: IdTuple | null): Promise<void> {
		if (
			(folder.parentFolder != null && newParent != null && !isSameId(folder.parentFolder, newParent)) ||
			(folder.parentFolder == null && newParent != null) ||
			(folder.parentFolder != null && newParent == null)
		) {
			const updateFolder = createUpdateMailFolderData({
				folder: folder._id,
				newParent: newParent,
			})
			await this.serviceExecutor.put(MailFolderService, updateFolder)
		}
	}

	/**
	 * Creates a draft mail.
	 * @param bodyText The bodyText of the mail formatted as HTML.
	 * @param previousMessageId The id of the message that this mail is a reply or forward to. Null if this is a new mail.
	 * @param attachments The files that shall be attached to this mail or null if no files shall be attached. TutanotaFiles are already exising on the server, DataFiles are files from the local file system. Attention: the DataFile class information is lost
	 * @param confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
	 */
	async createDraft({
		subject,
		bodyText,
		senderMailAddress,
		senderName,
		toRecipients,
		ccRecipients,
		bccRecipients,
		conversationType,
		previousMessageId,
		attachments,
		confidential,
		replyTos,
		method,
	}: CreateDraftParams): Promise<Mail> {
		if (byteLength(bodyText) > UNCOMPRESSED_MAX_SIZE) {
			throw new MailBodyTooLargeError(`Can't update draft, mail body too large (${byteLength(bodyText)})`)
		}

		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), senderMailAddress)
		const mailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(senderMailGroupId)

		const sk = aes256RandomKey()
		const ownerEncSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sk)
		const service = createDraftCreateData({
			previousMessageId: previousMessageId,
			conversationType: conversationType,
			ownerEncSessionKey: ownerEncSessionKey.key,
			draftData: createDraftData({
				subject,
				compressedBodyText: bodyText,
				senderMailAddress,
				senderName,
				confidential,
				method,
				toRecipients: toRecipients.map(recipientToDraftRecipient),
				ccRecipients: ccRecipients.map(recipientToDraftRecipient),
				bccRecipients: bccRecipients.map(recipientToDraftRecipient),
				replyTos: replyTos.map(recipientToEncryptedMailAddress),
				addedAttachments: await this._createAddedAttachments(attachments, [], senderMailGroupId, mailGroupKey),
				bodyText: "",
				removedAttachments: [],
			}),
			ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
		})
		const createDraftReturn = await this.serviceExecutor.post(DraftService, service, { sessionKey: sk })
		return this.entityClient.load(MailTypeRef, createDraftReturn.draft)
	}

	/**
	 * Updates a draft mail.
	 * @param subject The subject of the mail.
	 * @param body The body text of the mail.
	 * @param senderMailAddress The senders mail address.
	 * @param senderName The name of the sender that is sent together with the mail address of the sender.
	 * @param toRecipients The recipients the mail shall be sent to.
	 * @param ccRecipients The recipients the mail shall be sent to in cc.
	 * @param bccRecipients The recipients the mail shall be sent to in bcc.
	 * @param attachments The files that shall be attached to this mail or null if the current attachments shall not be changed.
	 * @param confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
	 * @param draft The draft to update.
	 * @return The updated draft. Rejected with TooManyRequestsError if the number allowed mails was exceeded, AccessBlockedError if the customer is not allowed to send emails currently because he is marked for approval.
	 */
	async updateDraft({
		subject,
		body,
		senderMailAddress,
		senderName,
		toRecipients,
		ccRecipients,
		bccRecipients,
		attachments,
		confidential,
		draft,
	}: UpdateDraftParams): Promise<Mail> {
		if (byteLength(body) > UNCOMPRESSED_MAX_SIZE) {
			throw new MailBodyTooLargeError(`Can't update draft, mail body too large (${byteLength(body)})`)
		}

		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), senderMailAddress)

		const mailGroupKeyVersion = Number(draft._ownerKeyVersion ?? 0)
		const mailGroupKey = {
			version: mailGroupKeyVersion,
			object: await this.keyLoaderFacade.loadSymGroupKey(senderMailGroupId, mailGroupKeyVersion),
		}
		const currentAttachments = await this.getAttachmentIds(draft)
		const replyTos = await this.getReplyTos(draft)

		const sk = decryptKey(mailGroupKey.object, assertNotNull(draft._ownerEncSessionKey))
		const service = createDraftUpdateData({
			draft: draft._id,
			draftData: createDraftData({
				subject: subject,
				compressedBodyText: body,
				senderMailAddress: senderMailAddress,
				senderName: senderName,
				confidential: confidential,
				method: draft.method,
				toRecipients: toRecipients.map(recipientToDraftRecipient),
				ccRecipients: ccRecipients.map(recipientToDraftRecipient),
				bccRecipients: bccRecipients.map(recipientToDraftRecipient),
				replyTos: replyTos,
				removedAttachments: this._getRemovedAttachments(attachments, currentAttachments),
				addedAttachments: await this._createAddedAttachments(attachments, currentAttachments, senderMailGroupId, mailGroupKey),
				bodyText: "",
			}),
		})
		this.deferredDraftId = draft._id
		// we have to wait for the updated mail because sendMail() might be called right after this update
		this.deferredDraftUpdate = defer()
		// use a local reference here because this._deferredDraftUpdate is set to null when the event is received async
		const deferredUpdatePromiseWrapper = this.deferredDraftUpdate
		await this.serviceExecutor.put(DraftService, service, { sessionKey: sk })
		return deferredUpdatePromiseWrapper.promise
	}

	async moveMails(mails: IdTuple[], sourceFolder: IdTuple, targetFolder: IdTuple): Promise<void> {
		await this.serviceExecutor.post(MoveMailService, createMoveMailData({ mails, sourceFolder, targetFolder }))
	}

	async reportMail(mail: Mail, reportType: MailReportType): Promise<void> {
		const mailSessionKey: Aes128Key = assertNotNull(await this.crypto.resolveSessionKeyForInstance(mail))
		const postData = createReportMailPostData({
			mailId: mail._id,
			mailSessionKey: bitArrayToUint8Array(mailSessionKey),
			reportType,
		})
		await this.serviceExecutor.post(ReportMailService, postData)
	}

	async deleteMails(mails: IdTuple[], folder: IdTuple): Promise<void> {
		const deleteMailData = createDeleteMailData({
			mails,
			folder,
		})
		await this.serviceExecutor.delete(MailService, deleteMailData)
	}

	/**
	 * Returns all ids of the files that have been removed, i.e. that are contained in the existingFileIds but not in the provided files
	 */
	_getRemovedAttachments(providedFiles: Attachments | null, existingFileIds: IdTuple[]): IdTuple[] {
		const removedAttachmentIds: IdTuple[] = []

		if (providedFiles != null) {
			const attachments = providedFiles
			// check which attachments have been removed
			for (const fileId of existingFileIds) {
				if (
					!attachments.some(
						(attachment) => attachment._type !== "DataFile" && attachment._type !== "FileReference" && isSameId(getLetId(attachment), fileId),
					)
				) {
					removedAttachmentIds.push(fileId)
				}
			}
		}

		return removedAttachmentIds
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing files (e.g. forwarded files) and returns all DraftAttachments
	 */
	async _createAddedAttachments(
		providedFiles: Attachments | null,
		existingFileIds: ReadonlyArray<IdTuple>,
		senderMailGroupId: Id,
		mailGroupKey: VersionedKey,
	): Promise<DraftAttachment[]> {
		if (providedFiles == null || providedFiles.length === 0) return []

		// Verify mime types are correct before uploading
		validateMimeTypesForAttachments(providedFiles)

		return promiseMap(providedFiles, async (providedFile) => {
			// check if this is a new attachment or an existing one
			if (isDataFile(providedFile)) {
				// user added attachment
				const fileSessionKey = aes256RandomKey()
				let referenceTokens: Array<BlobReferenceTokenWrapper>
				if (isApp() || isDesktop()) {
					const { location } = await this.fileApp.writeDataFile(providedFile)
					referenceTokens = await this.blobFacade.encryptAndUploadNative(ArchiveDataType.Attachments, location, senderMailGroupId, fileSessionKey)
					await this.fileApp.deleteFile(location)
				} else {
					referenceTokens = await this.blobFacade.encryptAndUpload(ArchiveDataType.Attachments, providedFile.data, senderMailGroupId, fileSessionKey)
				}
				return this.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey)
			} else if (isFileReference(providedFile)) {
				const fileSessionKey = aes256RandomKey()
				const referenceTokens = await this.blobFacade.encryptAndUploadNative(
					ArchiveDataType.Attachments,
					providedFile.location,
					senderMailGroupId,
					fileSessionKey,
				)
				return this.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey)
			} else if (!containsId(existingFileIds, getLetId(providedFile))) {
				// forwarded attachment which was not in the draft before
				return this.crypto.resolveSessionKeyForInstance(providedFile).then((fileSessionKey) => {
					const sessionKey = assertNotNull(fileSessionKey, "filesessionkey was not resolved")
					const ownerEncFileSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sessionKey)
					const attachment = createDraftAttachment({
						existingFile: getLetId(providedFile),
						ownerEncFileSessionKey: ownerEncFileSessionKey.key,
						newFile: null,
						ownerKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
					})
					return attachment
				})
			} else {
				return null
			}
		}) // disable concurrent file upload to avoid timeout because of missing progress events on Firefox.
			.then((attachments) => attachments.filter(isNotNull))
			.then((it) => {
				// only delete the temporary files after all attachments have been uploaded
				if (isApp()) {
					this.fileApp.clearFileData().catch((e) => console.warn("Failed to clear files", e))
				}

				return it
			})
	}

	private createAndEncryptDraftAttachment(
		referenceTokens: BlobReferenceTokenWrapper[],
		fileSessionKey: AesKey,
		providedFile: DataFile | FileReference,
		mailGroupKey: VersionedKey,
	): DraftAttachment {
		const ownerEncFileSessionKey = encryptKeyWithVersionedKey(mailGroupKey, fileSessionKey)
		return createDraftAttachment({
			newFile: createNewDraftAttachment({
				encFileName: encryptString(fileSessionKey, providedFile.name),
				encMimeType: encryptString(fileSessionKey, providedFile.mimeType),
				referenceTokens: referenceTokens,
				encCid: providedFile.cid == null ? null : encryptString(fileSessionKey, providedFile.cid),
			}),
			ownerEncFileSessionKey: ownerEncFileSessionKey.key,
			ownerKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
			existingFile: null,
		})
	}

	async sendDraft(draft: Mail, recipients: Array<Recipient>, language: string): Promise<void> {
		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), draft.sender.address)
		const bucketKey = aes256RandomKey()
		const sendDraftData = createSendDraftData({
			language: language,
			mail: draft._id,
			mailSessionKey: null,
			attachmentKeyData: [],
			calendarMethod: false,
			internalRecipientKeyData: [],
			plaintext: false,
			bucketEncMailSessionKey: null,
			senderNameUnencrypted: null,
			secureExternalRecipientKeyData: [],
			symEncInternalRecipientKeyData: [],
			sessionEncEncryptionAuthStatus: null,
		})

		const attachments = await this.getAttachmentIds(draft)
		for (const fileId of attachments) {
			const file = await this.entityClient.load(FileTypeRef, fileId)
			const fileSessionKey = assertNotNull(await this.crypto.resolveSessionKeyForInstance(file), "fileSessionKey was null")
			const data = createAttachmentKeyData({
				file: fileId,
				fileSessionKey: null,
				bucketEncFileSessionKey: null,
			})

			if (draft.confidential) {
				data.bucketEncFileSessionKey = encryptKey(bucketKey, fileSessionKey)
			} else {
				data.fileSessionKey = keyToUint8Array(fileSessionKey)
			}

			sendDraftData.attachmentKeyData.push(data)
		}

		await Promise.all([
			this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId()).then((tutanotaProperties) => {
				sendDraftData.plaintext = tutanotaProperties.sendPlaintextOnly
			}),
			this.crypto.resolveSessionKeyForInstance(draft).then(async (mailSessionkey) => {
				const sk = assertNotNull(mailSessionkey, "mailSessionKey was null")
				sendDraftData.calendarMethod = draft.method !== MailMethod.NONE

				if (draft.confidential) {
					sendDraftData.bucketEncMailSessionKey = encryptKey(bucketKey, sk)
					const hasExternalSecureRecipient = recipients.some((r) => r.type === RecipientType.EXTERNAL && !!this.getContactPassword(r.contact)?.trim())

					if (hasExternalSecureRecipient) {
						sendDraftData.senderNameUnencrypted = draft.sender.name // needed for notification mail
					}

					await this.addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId)
					if (this.isTutaCryptMail(sendDraftData)) {
						sendDraftData.sessionEncEncryptionAuthStatus = encryptString(sk, EncryptionAuthStatus.TUTACRYPT_SENDER)
					}
				} else {
					sendDraftData.mailSessionKey = bitArrayToUint8Array(sk)
				}
			}),
		])
		await this.serviceExecutor.post(SendDraftService, sendDraftData)
	}

	async getAttachmentIds(draft: Mail): Promise<IdTuple[]> {
		return draft.attachments
	}

	async getReplyTos(draft: Mail): Promise<EncryptedMailAddress[]> {
		const ownerEncSessionKeyProvider: OwnerEncSessionKeyProvider = this.keyProviderFromInstance(draft)
		const mailDetailsDraftId = assertNotNull(draft.mailDetailsDraft, "draft without mailDetailsDraft")
		const mailDetails = await this.entityClient.loadMultiple(
			MailDetailsDraftTypeRef,
			listIdPart(mailDetailsDraftId),
			[elementIdPart(mailDetailsDraftId)],
			ownerEncSessionKeyProvider,
		)
		if (mailDetails.length === 0) {
			throw new NotFoundError(`MailDetailsDraft ${draft.mailDetailsDraft}`)
		}
		return mailDetails[0].details.replyTos
	}

	async checkMailForPhishing(
		mail: Mail,
		links: Array<{
			href: string
			innerHTML: string
		}>,
	): Promise<boolean> {
		let score = 0
		const senderAddress = mail.sender.address

		let senderAuthenticated
		if (mail.authStatus !== null) {
			senderAuthenticated = mail.authStatus === MailAuthenticationStatus.AUTHENTICATED
		} else {
			const mailDetails = await this.loadMailDetailsBlob(mail)
			senderAuthenticated = mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED
		}

		if (senderAuthenticated) {
			if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_ADDRESS, senderAddress)) {
				score += 6
			} else {
				const senderDomain = addressDomain(senderAddress)

				if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_DOMAIN, senderDomain)) {
					score += 6
				}
			}
		} else {
			if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_ADDRESS_NON_AUTH, senderAddress)) {
				score += 6
			} else {
				const senderDomain = addressDomain(senderAddress)

				if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_DOMAIN_NON_AUTH, senderDomain)) {
					score += 6
				}
			}
		}

		// We check that subject exists because when there's an encryption error it will be missing
		if (mail.subject && this._checkFieldForPhishing(ReportedMailFieldType.SUBJECT, mail.subject)) {
			score += 3
		}

		for (const link of links) {
			if (this._checkFieldForPhishing(ReportedMailFieldType.LINK, link.href)) {
				score += 6
				break
			} else {
				const domain = getUrlDomain(link.href)

				if (domain && this._checkFieldForPhishing(ReportedMailFieldType.LINK_DOMAIN, domain)) {
					score += 6
					break
				}
			}
		}

		const hasSuspiciousLink = links.some(({ href, innerHTML }) => {
			const innerText = htmlToText(innerHTML)
			const textUrl = parseUrl(innerText)
			const hrefUrl = parseUrl(href)
			return textUrl && hrefUrl && textUrl.hostname !== hrefUrl.hostname
		})

		if (hasSuspiciousLink) {
			score += 6
		}

		return Promise.resolve(7 < score)
	}

	async deleteFolder(id: IdTuple): Promise<void> {
		const deleteMailFolderData = createDeleteMailFolderData({
			folders: [id],
		})
		// TODO make DeleteMailFolderData unencrypted in next model version
		await this.serviceExecutor.delete(MailFolderService, deleteMailFolderData, { sessionKey: "dummy" as any })
	}

	async fixupCounterForFolder(groupId: Id, folder: MailFolder, unreadMails: number): Promise<void> {
		const counterId = folder.isMailSet ? getElementId(folder) : folder.mails
		const data = createWriteCounterData({
			counterType: CounterType.UnreadMails,
			row: groupId,
			column: counterId,
			value: String(unreadMails),
		})
		await this.serviceExecutor.post(CounterService, data)
	}

	_checkFieldForPhishing(type: ReportedMailFieldType, value: string): boolean {
		const hash = phishingMarkerValue(type, value)
		return this.phishingMarkers.has(hash)
	}

	private async addRecipientKeyData(bucketKey: AesKey, sendDraftData: SendDraftData, recipients: Array<Recipient>, senderMailGroupId: Id): Promise<void> {
		const notFoundRecipients: string[] = []

		for (const recipient of recipients) {
			if (recipient.address === SYSTEM_GROUP_MAIL_ADDRESS || !recipient) {
				notFoundRecipients.push(recipient.address)
				continue
			}

			// copy password information if this is an external contact
			// otherwise load the key information from the server
			const isSharedMailboxSender = !isSameId(this.userFacade.getGroupId(GroupType.Mail), senderMailGroupId)

			if (recipient.type === RecipientType.EXTERNAL) {
				const passphrase = this.getContactPassword(recipient.contact)
				if (passphrase == null || isSharedMailboxSender) {
					// no password given and prevent sending to secure externals from shared group
					notFoundRecipients.push(recipient.address)
					continue
				}

				const salt = generateRandomSalt()
				const kdfType = DEFAULT_KDF_TYPE
				const passwordKey = await this.loginFacade.deriveUserPassphraseKey({ kdfType, passphrase, salt })
				const passwordVerifier = createAuthVerifier(passwordKey)
				const externalGroupKeys = await this.getExternalGroupKeys(recipient.address, kdfType, passwordKey, passwordVerifier)
				const ownerEncBucketKey = encryptKeyWithVersionedKey(externalGroupKeys.currentExternalMailGroupKey, bucketKey)
				const data = createSecureExternalRecipientKeyData({
					mailAddress: recipient.address,
					kdfVersion: kdfType,
					ownerEncBucketKey: ownerEncBucketKey.key,
					ownerKeyVersion: ownerEncBucketKey.encryptingKeyVersion.toString(),
					passwordVerifier: passwordVerifier,
					salt: salt,
					saltHash: sha256Hash(salt),
					pwEncCommunicationKey: encryptKey(passwordKey, externalGroupKeys.currentExternalUserGroupKey.object),
					userGroupKeyVersion: String(externalGroupKeys.currentExternalUserGroupKey.version),
				})
				sendDraftData.secureExternalRecipientKeyData.push(data)
			} else {
				const keyData = await this.crypto.encryptBucketKeyForInternalRecipient(
					isSharedMailboxSender ? senderMailGroupId : this.userFacade.getLoggedInUser().userGroup.group,
					bucketKey,
					recipient.address,
					notFoundRecipients,
				)
				if (keyData == null) {
					// cannot add recipient because of notFoundError
					// we do not throw here because we want to collect all not found recipients first
				} else if (isSameTypeRef(keyData._type, SymEncInternalRecipientKeyDataTypeRef)) {
					sendDraftData.symEncInternalRecipientKeyData.push(keyData as SymEncInternalRecipientKeyData)
				} else if (isSameTypeRef(keyData._type, InternalRecipientKeyDataTypeRef)) {
					sendDraftData.internalRecipientKeyData.push(keyData as InternalRecipientKeyData)
				}
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}
	}

	/**
	 * Checks if the given send draft data contains only encrypt keys that have been encrypted with TutaCrypt protocol.
	 * @VisibleForTesting
	 * @param sendDraftData The send drafta for the mail that should be sent
	 */
	isTutaCryptMail(sendDraftData: SendDraftData) {
		// if an secure external recipient is involved in the conversation we do not use asymmetric encryption
		if (sendDraftData.symEncInternalRecipientKeyData.length > 0 || sendDraftData.secureExternalRecipientKeyData.length) {
			return false
		}
		if (isEmpty(sendDraftData.internalRecipientKeyData)) {
			return false
		}
		return sendDraftData.internalRecipientKeyData.every((recipientData) => recipientData.protocolVersion === CryptoProtocolVersion.TUTA_CRYPT)
	}

	private getContactPassword(contact: Contact | null): string | null {
		return contact?.presharedPassword ?? null
	}

	/**
	 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created.
	 * Returns the user group key and the user mail group key of the external recipient.
	 * @param recipientMailAddress
	 * @param externalUserKdfType the kdf type used to derive externalUserPwKey
	 * @param externalUserPwKey The external user's password key.
	 * @param verifier The external user's verifier, base64 encoded.
	 * @return Resolves to the external user's group key and the external user's mail group key, rejected if an error occurred
	 */
	private async getExternalGroupKeys(
		recipientMailAddress: string,
		externalUserKdfType: KdfType,
		externalUserPwKey: AesKey,
		verifier: Uint8Array,
	): Promise<{ currentExternalUserGroupKey: VersionedKey; currentExternalMailGroupKey: VersionedKey }> {
		const groupRoot = await this.entityClient.loadRoot(GroupRootTypeRef, this.userFacade.getUserGroupId())
		const cleanedMailAddress = recipientMailAddress.trim().toLocaleLowerCase()
		const mailAddressId = stringToCustomId(cleanedMailAddress)

		let externalUserReference: ExternalUserReference
		try {
			externalUserReference = await this.entityClient.load(ExternalUserReferenceTypeRef, [groupRoot.externalUserReferences, mailAddressId])
		} catch (e) {
			if (e instanceof NotFoundError) {
				return this.createExternalUser(cleanedMailAddress, externalUserKdfType, externalUserPwKey, verifier)
			}
			throw e
		}

		const externalUser = await this.entityClient.load(UserTypeRef, externalUserReference.user)
		const externalUserGroupId = externalUserReference.userGroup
		const externalMailGroupId = assertNotNull(
			externalUser.memberships.find((m) => m.groupType === GroupType.Mail),
			"no mail group membership on external user",
		).group

		const externalMailGroup = await this.entityClient.load(GroupTypeRef, externalMailGroupId)
		const externalUserGroup = await this.entityClient.load(GroupTypeRef, externalUserGroupId)
		const requiredInternalUserGroupKeyVersion = Number(externalUserGroup.adminGroupKeyVersion ?? 0)
		const requiredExternalUserGroupKeyVersion = Number(externalMailGroup.adminGroupKeyVersion ?? 0)
		const internalUserEncExternalUserKey = assertNotNull(externalUserGroup.adminGroupEncGKey, "no adminGroupEncGKey on external user group")
		const externalUserEncExternalMailKey = assertNotNull(externalMailGroup.adminGroupEncGKey, "no adminGroupEncGKey on external mail group")
		const requiredInternalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(this.userFacade.getUserGroupId(), requiredInternalUserGroupKeyVersion)
		const currentExternalUserGroupKey = {
			object: decryptKey(requiredInternalUserGroupKey, internalUserEncExternalUserKey),
			version: Number(externalUserGroup.groupKeyVersion),
		}
		const requiredExternalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(
			externalUserGroupId,
			requiredExternalUserGroupKeyVersion,
			currentExternalUserGroupKey,
		)
		const currentExternalMailGroupKey = {
			object: decryptKey(requiredExternalUserGroupKey, externalUserEncExternalMailKey),
			version: Number(externalMailGroup.groupKeyVersion),
		}
		return {
			currentExternalUserGroupKey,
			currentExternalMailGroupKey,
		}
	}

	getRecipientKeyData(mailAddress: string): Promise<PublicKeyGetOut | null> {
		return this.serviceExecutor
			.get(
				PublicKeyService,
				createPublicKeyGetIn({
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
					identifier: mailAddress,
					version: null, // get the current version for encryption
				}),
			)
			.catch(ofClass(NotFoundError, () => null))
	}

	entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		return promiseMap(data, (update) => {
			if (
				this.deferredDraftUpdate != null &&
				this.deferredDraftId != null &&
				update.operation === OperationType.UPDATE &&
				isSameTypeRefByAttr(MailTypeRef, update.application, update.type) &&
				isSameId(this.deferredDraftId, [update.instanceListId, update.instanceId])
			) {
				return this.entityClient
					.load(MailTypeRef, this.deferredDraftId)
					.then((mail) => {
						const deferredPromiseWrapper = assertNotNull(this.deferredDraftUpdate, "deferredDraftUpdate went away?")
						this.deferredDraftUpdate = null
						deferredPromiseWrapper.resolve(mail)
					})
					.catch(
						ofClass(NotFoundError, () => {
							console.log(`Could not find updated mail ${JSON.stringify([update.instanceListId, update.instanceId])}`)
						}),
					)
			}
		}).then(noOp)
	}

	/**
	 * @param markers only phishing (not spam) markers will be sent as event bus updates
	 */
	phishingMarkersUpdateReceived(markers: ReportedMailFieldMarker[]) {
		for (const marker of markers) {
			if (marker.status === PhishingMarkerStatus.INACTIVE) {
				this.phishingMarkers.delete(marker.marker)
			} else {
				this.phishingMarkers.add(marker.marker)
			}
		}
	}

	private async createExternalUser(cleanedMailAddress: string, externalUserKdfType: KdfType, externalUserPwKey: AesKey, verifier: Uint8Array) {
		const internalUserGroupKey = this.userFacade.getCurrentUserGroupKey()
		const internalMailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Mail))

		const currentExternalUserGroupKey = freshVersioned(aes256RandomKey())
		const currentExternalMailGroupKey = freshVersioned(aes256RandomKey())
		const externalUserGroupInfoSessionKey = aes256RandomKey()
		const externalMailGroupInfoSessionKey = aes256RandomKey()
		const tutanotaPropertiesSessionKey = aes256RandomKey()
		const mailboxSessionKey = aes256RandomKey()
		const externalUserEncEntropy = encryptBytes(currentExternalUserGroupKey.object, random.generateRandomData(32))

		const internalUserEncGroupKey = encryptKeyWithVersionedKey(internalUserGroupKey, currentExternalUserGroupKey.object)
		const userGroupData = createCreateExternalUserGroupData({
			mailAddress: cleanedMailAddress,
			externalPwEncUserGroupKey: encryptKey(externalUserPwKey, currentExternalUserGroupKey.object),
			internalUserEncUserGroupKey: internalUserEncGroupKey.key,
			internalUserGroupKeyVersion: internalUserEncGroupKey.encryptingKeyVersion.toString(),
		})

		const externalUserEncUserGroupInfoSessionKey = encryptKeyWithVersionedKey(currentExternalUserGroupKey, externalUserGroupInfoSessionKey)
		const externalUserEncMailGroupKey = encryptKeyWithVersionedKey(currentExternalUserGroupKey, currentExternalMailGroupKey.object)
		const externalUserEncTutanotaPropertiesSessionKey = encryptKeyWithVersionedKey(currentExternalUserGroupKey, tutanotaPropertiesSessionKey)

		const externalMailEncMailGroupInfoSessionKey = encryptKeyWithVersionedKey(currentExternalMailGroupKey, externalMailGroupInfoSessionKey)
		const externalMailEncMailBoxSessionKey = encryptKeyWithVersionedKey(currentExternalMailGroupKey, mailboxSessionKey)

		const internalMailEncUserGroupInfoSessionKey = encryptKeyWithVersionedKey(internalMailGroupKey, externalUserGroupInfoSessionKey)
		const internalMailEncMailGroupInfoSessionKey = encryptKeyWithVersionedKey(internalMailGroupKey, externalMailGroupInfoSessionKey)

		const externalUserData = createExternalUserData({
			verifier,
			userGroupData,
			kdfVersion: externalUserKdfType,

			externalUserEncEntropy,
			externalUserEncUserGroupInfoSessionKey: externalUserEncUserGroupInfoSessionKey.key,
			externalUserEncMailGroupKey: externalUserEncMailGroupKey.key,
			externalUserEncTutanotaPropertiesSessionKey: externalUserEncTutanotaPropertiesSessionKey.key,

			externalMailEncMailGroupInfoSessionKey: externalMailEncMailGroupInfoSessionKey.key,
			externalMailEncMailBoxSessionKey: externalMailEncMailBoxSessionKey.key,

			internalMailEncUserGroupInfoSessionKey: internalMailEncUserGroupInfoSessionKey.key,
			internalMailEncMailGroupInfoSessionKey: internalMailEncMailGroupInfoSessionKey.key,
			internalMailGroupKeyVersion: internalMailGroupKey.version.toString(),
		})
		await this.serviceExecutor.post(ExternalUserService, externalUserData)
		return {
			currentExternalUserGroupKey,
			currentExternalMailGroupKey,
		}
	}

	_getMailGroupIdForMailAddress(user: User, mailAddress: string): Promise<Id> {
		return promiseFilter(getUserGroupMemberships(user, GroupType.Mail), (groupMembership) => {
			return this.entityClient.load(GroupTypeRef, groupMembership.group).then((mailGroup) => {
				if (mailGroup.user == null) {
					return this.entityClient.load(GroupInfoTypeRef, groupMembership.groupInfo).then((mailGroupInfo) => {
						return contains(getEnabledMailAddressesForGroupInfo(mailGroupInfo), mailAddress)
					})
				} else if (isSameId(mailGroup.user, user._id)) {
					return this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo).then((userGroupInfo) => {
						return contains(getEnabledMailAddressesForGroupInfo(userGroupInfo), mailAddress)
					})
				} else {
					// not supported
					return false
				}
			})
		}).then((filteredMemberships) => {
			if (filteredMemberships.length === 1) {
				return filteredMemberships[0].group
			} else {
				throw new NotFoundError("group for mail address not found " + mailAddress)
			}
		})
	}

	async clearFolder(folderId: IdTuple) {
		const deleteMailData = createDeleteMailData({
			folder: folderId,
			mails: [],
		})
		await this.serviceExecutor.delete(MailService, deleteMailData)
	}

	async unsubscribe(mailId: IdTuple, recipient: string, headers: string[]) {
		const postData = createListUnsubscribeData({
			mail: mailId,
			recipient,
			headers: headers.join("\n"),
		})
		await this.serviceExecutor.post(ListUnsubscribeService, postData)
	}

	async loadAttachments(mail: Mail): Promise<TutanotaFile[]> {
		if (mail.attachments.length === 0) {
			return []
		}
		const attachmentsListId = listIdPart(mail.attachments[0])
		const attachmentElementIds = mail.attachments.map(elementIdPart)

		const bucketKey = mail.bucketKey
		let ownerEncSessionKeyProvider: OwnerEncSessionKeyProvider | undefined
		if (bucketKey) {
			const typeModel = await resolveTypeReference(FileTypeRef)
			const resolvedSessionKeys = await this.crypto.resolveWithBucketKey(assertNotNull(mail.bucketKey), mail, typeModel)
			ownerEncSessionKeyProvider = async (instanceElementId: Id): Promise<VersionedEncryptedKey> => {
				const instanceSessionKey = assertNotNull(
					resolvedSessionKeys.instanceSessionKeys.find((instanceSessionKey) => instanceElementId === instanceSessionKey.instanceId),
				)
				return {
					key: instanceSessionKey.symEncSessionKey,
					encryptingKeyVersion: Number(instanceSessionKey.symKeyVersion),
				}
			}
		}
		return await this.entityClient.loadMultiple(FileTypeRef, attachmentsListId, attachmentElementIds, ownerEncSessionKeyProvider)
	}

	/**
	 * @param mail in case it is a mailDetailsBlob
	 */
	async loadMailDetailsBlob(mail: Mail): Promise<MailDetails> {
		// if isDraft
		if (mail.mailDetailsDraft != null) {
			throw new ProgrammingError("not supported, must be mail details blob")
		} else {
			const mailDetailsBlobId = assertNotNull(mail.mailDetails)

			const mailDetailsBlobs = await this.entityClient.loadMultiple(
				MailDetailsBlobTypeRef,
				listIdPart(mailDetailsBlobId),
				[elementIdPart(mailDetailsBlobId)],
				this.keyProviderFromInstance(mail),
			)
			if (mailDetailsBlobs.length === 0) {
				throw new NotFoundError(`MailDetailsBlob ${mailDetailsBlobId}`)
			}
			return mailDetailsBlobs[0].details
		}
	}

	private keyProviderFromInstance(mail: Mail) {
		return async () => ({
			key: assertNotNull(mail._ownerEncSessionKey),
			encryptingKeyVersion: Number(mail._ownerKeyVersion),
		})
	}

	/**
	 * @param mail in case it is a mailDetailsDraft
	 */
	async loadMailDetailsDraft(mail: Mail): Promise<MailDetails> {
		// if not isDraft
		if (mail.mailDetailsDraft == null) {
			throw new ProgrammingError("not supported, must be mail details draft")
		} else {
			const detailsDraftId = assertNotNull(mail.mailDetailsDraft)

			const mailDetailsDrafts = await this.entityClient.loadMultiple(
				MailDetailsDraftTypeRef,
				listIdPart(detailsDraftId),
				[elementIdPart(detailsDraftId)],
				this.keyProviderFromInstance(mail),
			)
			if (mailDetailsDrafts.length === 0) {
				throw new NotFoundError(`MailDetailsDraft ${detailsDraftId}`)
			}
			return mailDetailsDrafts[0].details
		}
	}
}

export function phishingMarkerValue(type: ReportedMailFieldType, value: string): string {
	return type + murmurHash(value.replace(/\s/g, ""))
}

function parseUrl(link: string): URL | null {
	try {
		return new URL(link)
	} catch (e) {
		return null
	}
}

function getUrlDomain(link: string): string | null {
	const url = parseUrl(link)
	return url && url.hostname
}

function recipientToDraftRecipient(recipient: PartialRecipient): DraftRecipient {
	return createDraftRecipient({
		name: recipient.name ?? "",
		mailAddress: recipient.address,
	})
}

function recipientToEncryptedMailAddress(recipient: PartialRecipient): EncryptedMailAddress {
	return createEncryptedMailAddress({
		name: recipient.name ?? "",
		address: recipient.address,
	})
}

/**
 * Verify all attachments contain correctly formatted MIME types. This ensures that they can be sent.
 *
 * Note that this does not verify that the mime type actually corresponds to a known MIME type.
 * @param attachments
 * @throws {ProgrammingError} if a MIME type is somehow not correctly formatted for at least one attachment
 */
export function validateMimeTypesForAttachments(attachments: Attachments) {
	const regex = /^\w+\/[\w.+-]+?(;\s*[\w.+-]+=([\w.+-]+|"[\w\s,.+-]+"))*$/g
	for (const attachment of attachments) {
		if (isDataFile(attachment) || isFileReference(attachment)) {
			if (!attachment.mimeType.match(regex)) {
				throw new ProgrammingError(`${attachment.mimeType} is not a correctly formatted mimetype (${attachment.name})`)
			}
		}
	}
}
