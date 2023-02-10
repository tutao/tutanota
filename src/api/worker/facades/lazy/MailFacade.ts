import type { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { encryptBytes, encryptString } from "../../crypto/CryptoFacade.js"
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
import type { ConversationType } from "../../../common/TutanotaConstants.js"
import {
	ArchiveDataType,
	CounterType_UnreadMails,
	GroupType,
	MailAuthenticationStatus as MailAuthStatus,
	MailMethod,
	MailReportType,
	OperationType,
	PhishingMarkerStatus,
	ReportedMailFieldType,
} from "../../../common/TutanotaConstants.js"
import type {
	Contact,
	DraftAttachment,
	DraftRecipient,
	EncryptedMailAddress,
	File as TutanotaFile,
	Mail,
	MailFolder,
	PhishingMarker,
	SendDraftData,
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
	MailDetailsDraftTypeRef,
	MailTypeRef,
	TutanotaPropertiesTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { RecipientsNotFoundError } from "../../../common/error/RecipientsNotFoundError.js"
import { NotFoundError } from "../../../common/error/RestError.js"
import type { EntityUpdate, PublicKeyReturn, User } from "../../../entities/sys/TypeRefs.js"
import {
	BlobReferenceTokenWrapper,
	createPublicKeyData,
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
	isNotNull,
	isSameTypeRefByAttr,
	neverNull,
	noOp,
	ofClass,
	promiseFilter,
	promiseMap,
} from "@tutao/tutanota-utils"
import { BlobFacade } from "./BlobFacade.js"
import { FileFacade } from "./FileFacade.js"
import { assertWorkerOrNode, isApp, isDesktop } from "../../../common/Env.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { getEnabledMailAddressesForGroupInfo, getUserGroupMemberships } from "../../../common/utils/GroupUtils.js"
import { containsId, getLetId, isSameId, stringToCustomId } from "../../../common/utils/EntityUtils.js"
import { htmlToText } from "../../search/IndexUtils.js"
import { MailBodyTooLargeError } from "../../../common/error/MailBodyTooLargeError.js"
import { UNCOMPRESSED_MAX_SIZE } from "../../Compression.js"
import {
	aes128RandomKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	decryptKey,
	encryptKey,
	generateKeyFromPassphrase,
	generateRandomSalt,
	KeyLength,
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
import { isLegacyMail } from "../../../common/MailWrapper.js"

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
		private readonly fileFacade: FileFacade,
		private readonly entityClient: EntityClient,
		private readonly crypto: CryptoFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly blobFacade: BlobFacade,
		private readonly fileApp: NativeFileApp,
	) {}

	async createMailFolder(name: string, parent: IdTuple | null, ownerGroupId: Id): Promise<void> {
		const mailGroupKey = this.userFacade.getGroupKey(ownerGroupId)

		const sk = aes128RandomKey()
		const newFolder = createCreateMailFolderData({
			folderName: name,
			parentFolder: parent,
			ownerEncSessionKey: encryptKey(mailGroupKey, sk),
			ownerGroup: ownerGroupId,
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

		const userGroupKey = this.userFacade.getUserGroupKey()

		const mailGroupKey = this.userFacade.getGroupKey(senderMailGroupId)

		const sk = aes128RandomKey()
		const service = createDraftCreateData()
		service.previousMessageId = previousMessageId
		service.conversationType = conversationType
		service.ownerEncSessionKey = encryptKey(mailGroupKey, sk)
		service.symEncSessionKey = encryptKey(userGroupKey, sk) // legacy

		service.draftData = createDraftData({
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

		const mailGroupKey = this.userFacade.getGroupKey(senderMailGroupId)
		const currentAttachments = await this.getAttachmentIds(draft)
		const replyTos = await this.getReplyTos(draft)

		const sk = decryptKey(mailGroupKey, draft._ownerEncSessionKey as any)
		const service = createDraftUpdateData()
		service.draft = draft._id
		service.draftData = createDraftData({
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
		})
		this.deferredDraftId = draft._id
		// we have to wait for the updated mail because sendMail() might be called right after this update
		this.deferredDraftUpdate = defer()
		// use a local reference here because this._deferredDraftUpdate is set to null when the event is received async
		const deferredUpdatePromiseWrapper = this.deferredDraftUpdate
		await this.serviceExecutor.put(DraftService, service, { sessionKey: sk })
		return deferredUpdatePromiseWrapper.promise
	}

	async moveMails(mails: IdTuple[], targetFolder: IdTuple): Promise<void> {
		await this.serviceExecutor.post(MoveMailService, createMoveMailData({ mails, targetFolder }))
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
		let removedAttachmentIds: IdTuple[] = []

		if (providedFiles) {
			let attachments = neverNull(providedFiles)
			// check which attachments have been removed
			existingFileIds.forEach((fileId) => {
				if (
					!attachments.find(
						(attachment) => attachment._type !== "DataFile" && attachment._type !== "FileReference" && isSameId(getLetId(attachment), fileId),
					)
				) {
					removedAttachmentIds.push(fileId)
				}
			})
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
		mailGroupKey: Aes128Key,
	): Promise<DraftAttachment[]> {
		if (providedFiles == null || providedFiles.length === 0) return []

		return promiseMap(providedFiles, async (providedFile) => {
			// check if this is a new attachment or an existing one
			if (isDataFile(providedFile)) {
				// user added attachment
				const fileSessionKey = aes128RandomKey()
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
				const fileSessionKey = aes128RandomKey()
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
					const attachment = createDraftAttachment()
					attachment.existingFile = getLetId(providedFile)
					attachment.ownerEncFileSessionKey = encryptKey(mailGroupKey, neverNull(fileSessionKey))
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
					this.fileFacade.clearFileData().catch((e) => console.warn("Failed to clear files", e))
				}

				return it
			})
	}

	private createAndEncryptDraftAttachment(
		referenceTokens: BlobReferenceTokenWrapper[],
		fileSessionKey: Aes128Key,
		providedFile: DataFile | FileReference,
		mailGroupKey: Aes128Key,
	): DraftAttachment {
		let attachment = createDraftAttachment()
		let newAttachmentData = createNewDraftAttachment()
		newAttachmentData.encFileName = encryptString(fileSessionKey, providedFile.name)
		newAttachmentData.encMimeType = encryptString(fileSessionKey, providedFile.mimeType)
		newAttachmentData.fileData = null
		newAttachmentData.referenceTokens = referenceTokens
		newAttachmentData.encCid = providedFile.cid == null ? null : encryptString(fileSessionKey, providedFile.cid)
		attachment.newFile = newAttachmentData
		attachment.ownerEncFileSessionKey = encryptKey(mailGroupKey, fileSessionKey)
		return attachment
	}

	async sendDraft(draft: Mail, recipients: Array<Recipient>, language: string): Promise<void> {
		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), draft.sender.address)
		const bucketKey = aes128RandomKey()
		const sendDraftData = createSendDraftData()
		sendDraftData.language = language
		sendDraftData.mail = draft._id

		const attachments = await this.getAttachmentIds(draft)
		for (let fileId of attachments) {
			const file = await this.entityClient.load(FileTypeRef, fileId)
			const fileSessionKey = await this.crypto.resolveSessionKeyForInstance(file)
			const data = createAttachmentKeyData({
				file: fileId,
			})

			if (draft.confidential) {
				data.bucketEncFileSessionKey = encryptKey(bucketKey, neverNull(fileSessionKey))
			} else {
				data.fileSessionKey = keyToUint8Array(neverNull(fileSessionKey))
			}

			sendDraftData.attachmentKeyData.push(data)
		}

		await Promise.all([
			this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId()).then((tutanotaProperties) => {
				sendDraftData.plaintext = tutanotaProperties.sendPlaintextOnly
			}),
			this.crypto.resolveSessionKeyForInstance(draft).then((mailSessionkey) => {
				let sk = neverNull(mailSessionkey)
				sendDraftData.calendarMethod = draft.method !== MailMethod.NONE

				if (draft.confidential) {
					sendDraftData.bucketEncMailSessionKey = encryptKey(bucketKey, sk)
					const hasExternalSecureRecipient = recipients.some((r) => r.type === RecipientType.EXTERNAL && !!this.getContactPassword(r.contact)?.trim())

					if (hasExternalSecureRecipient) {
						sendDraftData.senderNameUnencrypted = draft.sender.name // needed for notification mail
					}

					return this._addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId)
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
		if (isLegacyMail(draft)) {
			return draft.replyTos
		} else {
			const mailDetails = await this.entityClient.load(MailDetailsDraftTypeRef, neverNull(draft.mailDetailsDraft))
			return mailDetails.details.replyTos
		}
	}

	checkMailForPhishing(
		mail: Mail,
		links: Array<{
			href: string
			innerHTML: string
		}>,
	): Promise<boolean> {
		let score = 0
		const senderAddress = mail.sender.address
		const senderAuthenticated = mail.authStatus === MailAuthStatus.AUTHENTICATED

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

	async fixupCounterForMailList(groupId: Id, listId: Id, unreadMails: number): Promise<void> {
		const data = createWriteCounterData({
			counterType: CounterType_UnreadMails,
			row: groupId,
			column: listId,
			value: String(unreadMails),
		})
		await this.serviceExecutor.post(CounterService, data)
	}

	_checkFieldForPhishing(type: ReportedMailFieldType, value: string): boolean {
		const hash = phishingMarkerValue(type, value)
		return this.phishingMarkers.has(hash)
	}

	async _addRecipientKeyData(bucketKey: Aes128Key, service: SendDraftData, recipients: Array<Recipient>, senderMailGroupId: Id): Promise<void> {
		const notFoundRecipients: string[] = []

		for (let recipient of recipients) {
			if (recipient.address === "system@tutanota.de" || !recipient) {
				notFoundRecipients.push(recipient.address)
				continue
			}

			// copy password information if this is an external contact
			// otherwise load the key information from the server
			if (recipient.type === RecipientType.EXTERNAL) {
				const password = this.getContactPassword(recipient.contact)

				if (password == null || !isSameId(this.userFacade.getGroupId(GroupType.Mail), senderMailGroupId)) {
					// no password given and prevent sending to secure externals from shared group
					notFoundRecipients.push(recipient.address)
					continue
				}

				const salt = generateRandomSalt()
				const passwordKey = generateKeyFromPassphrase(password, salt, KeyLength.b128)
				const passwordVerifier = createAuthVerifier(passwordKey)
				const externalGroupKeys = await this._getExternalGroupKey(recipient.address, passwordKey, passwordVerifier)
				const data = createSecureExternalRecipientKeyData()
				data.mailAddress = recipient.address
				data.symEncBucketKey = null // legacy for old permission system, not used any more

				data.ownerEncBucketKey = encryptKey(externalGroupKeys.externalMailGroupKey, bucketKey)
				data.passwordVerifier = passwordVerifier
				data.salt = salt
				data.saltHash = sha256Hash(salt)
				data.pwEncCommunicationKey = encryptKey(passwordKey, externalGroupKeys.externalUserGroupKey)
				service.secureExternalRecipientKeyData.push(data)
			} else {
				const keyData = await this.crypto.encryptBucketKeyForInternalRecipient(bucketKey, recipient.address, notFoundRecipients)

				if (keyData) {
					service.internalRecipientKeyData.push(keyData)
				}
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}
	}

	private getContactPassword(contact: Contact | null): string | null {
		return contact?.presharedPassword ?? contact?.autoTransmitPassword ?? null
	}

	/**
	 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created.
	 * Returns the user group key and the user mail group key of the external recipient.
	 * @param recipientMailAddress
	 * @param externalUserPwKey The external user's password key.
	 * @param verifier The external user's verifier, base64 encoded.
	 * @return Resolves to the the external user's group key and the external user's mail group key, rejected if an error occured
	 */
	_getExternalGroupKey(
		recipientMailAddress: string,
		externalUserPwKey: Aes128Key,
		verifier: Uint8Array,
	): Promise<{
		externalUserGroupKey: Aes128Key
		externalMailGroupKey: Aes128Key
	}> {
		return this.entityClient.loadRoot(GroupRootTypeRef, this.userFacade.getUserGroupId()).then((groupRoot) => {
			let cleanedMailAddress = recipientMailAddress.trim().toLocaleLowerCase()
			let mailAddressId = stringToCustomId(cleanedMailAddress)
			return this.entityClient
				.load(ExternalUserReferenceTypeRef, [groupRoot.externalUserReferences, mailAddressId])
				.then((externalUserReference) => {
					return this.entityClient.load(UserTypeRef, externalUserReference.user).then((externalUser) => {
						let mailGroupId = neverNull(externalUser.memberships.find((m) => m.groupType === GroupType.Mail)).group
						return Promise.all([
							this.entityClient.load(GroupTypeRef, mailGroupId),
							this.entityClient.load(GroupTypeRef, externalUserReference.userGroup),
						]).then(([externalMailGroup, externalUserGroup]) => {
							let externalUserGroupKey = decryptKey(this.userFacade.getUserGroupKey(), neverNull(externalUserGroup.adminGroupEncGKey))
							let externalMailGroupKey = decryptKey(externalUserGroupKey, neverNull(externalMailGroup.adminGroupEncGKey))
							return {
								externalUserGroupKey,
								externalMailGroupKey,
							}
						})
					})
				})
				.catch(
					ofClass(NotFoundError, (e) => {
						// it does not exist, so create it
						let internalMailGroupKey = this.userFacade.getGroupKey(this.userFacade.getGroupId(GroupType.Mail))

						let externalUserGroupKey = aes128RandomKey()
						let externalMailGroupKey = aes128RandomKey()
						let externalUserGroupInfoSessionKey = aes128RandomKey()
						let externalMailGroupInfoSessionKey = aes128RandomKey()
						let clientKey = aes128RandomKey()
						let tutanotaPropertiesSessionKey = aes128RandomKey()
						let mailboxSessionKey = aes128RandomKey()
						let userEncEntropy = encryptBytes(externalUserGroupKey, random.generateRandomData(32))
						let d = createExternalUserData()
						d.verifier = verifier
						d.userEncClientKey = encryptKey(externalUserGroupKey, clientKey)
						d.externalUserEncUserGroupInfoSessionKey = encryptKey(externalUserGroupKey, externalUserGroupInfoSessionKey)
						d.internalMailEncUserGroupInfoSessionKey = encryptKey(internalMailGroupKey, externalUserGroupInfoSessionKey)
						d.externalUserEncMailGroupKey = encryptKey(externalUserGroupKey, externalMailGroupKey)
						d.externalMailEncMailGroupInfoSessionKey = encryptKey(externalMailGroupKey, externalMailGroupInfoSessionKey)
						d.internalMailEncMailGroupInfoSessionKey = encryptKey(internalMailGroupKey, externalMailGroupInfoSessionKey)
						d.externalUserEncEntropy = userEncEntropy
						d.externalUserEncTutanotaPropertiesSessionKey = encryptKey(externalUserGroupKey, tutanotaPropertiesSessionKey)
						d.externalMailEncMailBoxSessionKey = encryptKey(externalMailGroupKey, mailboxSessionKey)
						let userGroupData = createCreateExternalUserGroupData()
						userGroupData.mailAddress = cleanedMailAddress
						userGroupData.externalPwEncUserGroupKey = encryptKey(externalUserPwKey, externalUserGroupKey)
						userGroupData.internalUserEncUserGroupKey = encryptKey(this.userFacade.getUserGroupKey(), externalUserGroupKey)
						d.userGroupData = userGroupData
						return this.serviceExecutor.post(ExternalUserService, d).then(() => {
							return {
								externalUserGroupKey: externalUserGroupKey,
								externalMailGroupKey: externalMailGroupKey,
							}
						})
					}),
				)
		})
	}

	entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		return promiseMap(data, (update) => {
			if (
				this.deferredDraftUpdate &&
				this.deferredDraftId &&
				update.operation === OperationType.UPDATE &&
				isSameTypeRefByAttr(MailTypeRef, update.application, update.type) &&
				isSameId(this.deferredDraftId, [update.instanceListId, update.instanceId])
			) {
				return this.entityClient.load(MailTypeRef, neverNull(this.deferredDraftId)).then((mail) => {
					let deferredPromiseWrapper = neverNull(this.deferredDraftUpdate)
					this.deferredDraftUpdate = null
					deferredPromiseWrapper.resolve(mail)
				})
			}
		}).then(noOp)
	}

	phishingMarkersUpdateReceived(markers: Array<PhishingMarker>) {
		markers.forEach((marker) => {
			if (marker.status === PhishingMarkerStatus.INACTIVE) {
				this.phishingMarkers.delete(marker.marker)
			} else {
				this.phishingMarkers.add(marker.marker)
			}
		})
	}

	getRecipientKeyData(mailAddress: string): Promise<PublicKeyReturn | null> {
		return this.serviceExecutor
			.get(
				PublicKeyService,
				createPublicKeyData({
					mailAddress,
				}),
			)
			.catch(ofClass(NotFoundError, () => null))
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
