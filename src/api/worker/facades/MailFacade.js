// @flow
import {decryptKey, encryptBytes, encryptKey, encryptString, resolveSessionKey} from "../crypto/CryptoFacade"
import {aes128RandomKey} from "../crypto/Aes"
import {load, serviceRequest, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {LoginFacadeImpl} from "./LoginFacade"
import type {ConversationTypeEnum, MailMethodEnum, ReportedMailFieldTypeEnum} from "../../common/TutanotaConstants"
import {
	GroupType,
	MailAuthenticationStatus as MailAuthStatus,
	MailMethod,
	OperationType,
	PhishingMarkerStatus,
	ReportedMailFieldType
} from "../../common/TutanotaConstants"
import {createCreateMailFolderData} from "../../entities/tutanota/CreateMailFolderData"
import {createDraftCreateData} from "../../entities/tutanota/DraftCreateData"
import {createDraftData} from "../../entities/tutanota/DraftData"
import {DraftCreateReturnTypeRef} from "../../entities/tutanota/DraftCreateReturn"
import type {Mail} from "../../entities/tutanota/Mail"
import {_TypeModel as MailTypeModel, MailTypeRef} from "../../entities/tutanota/Mail"
import type {DraftRecipient} from "../../entities/tutanota/DraftRecipient"
import {createDraftUpdateData} from "../../entities/tutanota/DraftUpdateData"
import {DraftUpdateReturnTypeRef} from "../../entities/tutanota/DraftUpdateReturn"
import type {SendDraftData} from "../../entities/tutanota/SendDraftData"
import {createSendDraftData} from "../../entities/tutanota/SendDraftData"
import type {RecipientDetails} from "../../common/RecipientInfo"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {generateKeyFromPassphrase, generateRandomSalt} from "../crypto/Bcrypt"
import {KeyLength} from "../crypto/CryptoConstants"
import {bitArrayToUint8Array, createAuthVerifier, keyToUint8Array} from "../crypto/CryptoUtils"
import {NotFoundError} from "../../common/error/RestError"
import {GroupRootTypeRef} from "../../entities/sys/GroupRoot"
import {HttpMethod} from "../../common/EntityFunctions"
import {ExternalUserReferenceTypeRef} from "../../entities/sys/ExternalUserReference"
import {
	addressDomain,
	byteLength,
	contains,
	defer,
	downcast,
	isSameTypeRefByAttr,
	neverNull,
	noOp,
	ofClass,
	promiseFilter,
	promiseMap
} from "@tutao/tutanota-utils"
import type {User} from "../../entities/sys/User"
import {UserTypeRef} from "../../entities/sys/User"
import {GroupTypeRef} from "../../entities/sys/Group"
import {random} from "../crypto/Randomizer"
import {createExternalUserData} from "../../entities/tutanota/ExternalUserData"
import {createCreateExternalUserGroupData} from "../../entities/tutanota/CreateExternalUserGroupData"
import {createSecureExternalRecipientKeyData} from "../../entities/tutanota/SecureExternalRecipientKeyData"
import {hash} from "../crypto/Sha256"
import type {DraftAttachment} from "../../entities/tutanota/DraftAttachment"
import {createDraftAttachment} from "../../entities/tutanota/DraftAttachment"
import {createNewDraftAttachment} from "../../entities/tutanota/NewDraftAttachment"
import type {File as TutanotaFile} from "../../entities/tutanota/File"
import {_TypeModel as FileTypeModel, FileTypeRef} from "../../entities/tutanota/File"
import type {FileFacade} from "./FileFacade"
import {createAttachmentKeyData} from "../../entities/tutanota/AttachmentKeyData"
import {assertWorkerOrNode, isApp} from "../../common/Env"
import {TutanotaPropertiesTypeRef} from "../../entities/tutanota/TutanotaProperties"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import type {EncryptedMailAddress} from "../../entities/tutanota/EncryptedMailAddress"
import {fileApp} from "../../../native/common/FileApp"
import {encryptBucketKeyForInternalRecipient} from "../utils/ReceipientKeyDataUtils"
// $FlowIgnore[untyped-import]
import murmurHash from "../crypto/lib/murmurhash3_32"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import type {PhishingMarker} from "../../entities/tutanota/PhishingMarker"
import {EntityClient} from "../../common/EntityClient"
import {getEnabledMailAddressesForGroupInfo, getUserGroupMemberships} from "../../common/utils/GroupUtils";
import {containsId, getLetId, isSameId, stringToCustomId} from "../../common/utils/EntityUtils";
import {htmlToText} from "../search/IndexUtils"
import {MailBodyTooLargeError} from "../../common/error/MailBodyTooLargeError"
import {UNCOMPRESSED_MAX_SIZE} from "../Compression"
import type {PublicKeyReturn} from "../../entities/sys/PublicKeyReturn"
import {PublicKeyReturnTypeRef} from "../../entities/sys/PublicKeyReturn"
import {SysService} from "../../entities/sys/Services"
import {createPublicKeyData} from "../../entities/sys/PublicKeyData"

assertWorkerOrNode()

type Attachments = $ReadOnlyArray<TutanotaFile | DataFile | FileReference>

export class MailFacade {
	_login: LoginFacadeImpl;
	_file: FileFacade;
	_phishingMarkers: Set<string>;
	_deferredDraftId: ?IdTuple; // the mail id of the draft that we are waiting for to be updated via websocket
	_deferredDraftUpdate: ?Object; // this deferred promise is resolved as soon as the update of the draft is received
	_entity: EntityClient;

	constructor(login: LoginFacadeImpl, fileFacade: FileFacade, entity: EntityClient) {
		this._login = login
		this._file = fileFacade
		this._phishingMarkers = new Set()
		this._deferredDraftId = null
		this._deferredDraftUpdate = null
		this._entity = entity
	}

	createMailFolder(name: string, parent: IdTuple, ownerGroupId: Id): Promise<void> {
		let mailGroupKey = this._login.getGroupKey(ownerGroupId)
		let sk = aes128RandomKey()
		let newFolder = createCreateMailFolderData()
		newFolder.folderName = name
		newFolder.parentFolder = parent
		newFolder.ownerEncSessionKey = encryptKey(mailGroupKey, sk)
		return serviceRequestVoid(TutanotaService.MailFolderService, HttpMethod.POST, newFolder, null, sk)
	}

	/**
	 * Creates a draft mail.
	 * @param bodyText The bodyText of the mail formatted as HTML.
	 * @param previousMessageId The id of the message that this mail is a reply or forward to. Null if this is a new mail.
	 * @param attachments The files that shall be attached to this mail or null if no files shall be attached. TutanotaFiles are already exising on the server, DataFiles are files from the local file system. Attention: the DataFile class information is lost
	 * @param confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
	 */
	async createDraft(subject: string, bodyText: string, senderMailAddress: string, senderName: string,
	                  toRecipients: Array<DraftRecipient>, ccRecipients: Array<DraftRecipient>, bccRecipients: Array<DraftRecipient>,
	                  conversationType: ConversationTypeEnum, previousMessageId: ?Id,
	                  attachments: ?Attachments,
	                  confidential: boolean, replyTos: Array<EncryptedMailAddress>, method: MailMethodEnum): Promise<Mail> {

		if (byteLength(bodyText) > UNCOMPRESSED_MAX_SIZE) {
			throw new MailBodyTooLargeError(`Can't update draft, mail body too large (${byteLength(bodyText)})`)
		}

		const senderMailGroupId = await getMailGroupIdForMailAddress(this._login.getLoggedInUser(), senderMailAddress)
		const userGroupKey = this._login.getUserGroupKey()
		const mailGroupKey = this._login.getGroupKey(senderMailGroupId)
		const sk = aes128RandomKey()
		const service = createDraftCreateData()
		service.previousMessageId = previousMessageId
		service.conversationType = conversationType
		service.ownerEncSessionKey = encryptKey(mailGroupKey, sk)
		service.symEncSessionKey = encryptKey(userGroupKey, sk) // legacy
		service.draftData = createDraftData({
			subject,
			bodyText,
			senderMailAddress,
			senderName,
			confidential,
			method,
			toRecipients,
			ccRecipients,
			bccRecipients,
			replyTos,
			addedAttachments: await this._createAddedAttachments(attachments, [], mailGroupKey)
		})
		const createDraftReturn = await serviceRequest(TutanotaService.DraftService, HttpMethod.POST, service, DraftCreateReturnTypeRef, null, sk)
		return this._entity.load(MailTypeRef, createDraftReturn.draft)
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
	async updateDraft(subject: string, body: string, senderMailAddress: string, senderName: string,
	                  toRecipients: Array<DraftRecipient>, ccRecipients: Array<DraftRecipient>, bccRecipients: Array<DraftRecipient>,
	                  attachments: ?Attachments, confidential: boolean, draft: Mail): Promise<Mail> {

		if (byteLength(body) > UNCOMPRESSED_MAX_SIZE) {
			throw new MailBodyTooLargeError(`Can't update draft, mail body too large (${byteLength(body)})`)
		}

		const senderMailGroupId = await getMailGroupIdForMailAddress(this._login.getLoggedInUser(), senderMailAddress)
		const mailGroupKey = this._login.getGroupKey(senderMailGroupId)
		const sk = decryptKey(mailGroupKey, (draft._ownerEncSessionKey: any))

		const service = createDraftUpdateData()
		service.draft = draft._id
		service.draftData = createDraftData({
			subject: subject,
			bodyText: body,
			senderMailAddress: senderMailAddress,
			senderName: senderName,
			confidential: confidential,
			method: draft.method,
			toRecipients,
			ccRecipients,
			bccRecipients,
			replyTos: draft.replyTos,
			removedAttachments: this._getRemovedAttachments(attachments, draft.attachments),
			addedAttachments: await this._createAddedAttachments(attachments, draft.attachments, mailGroupKey),

		})

		this._deferredDraftId = draft._id

		// we have to wait for the updated mail because sendMail() might be called right after this update
		this._deferredDraftUpdate = defer()

		// use a local reference here because this._deferredDraftUpdate is set to null when the event is received async
		const deferredUpdatePromiseWrapper = this._deferredDraftUpdate
		await serviceRequest(TutanotaService.DraftService, HttpMethod.PUT, service, DraftUpdateReturnTypeRef, null, sk)
		return deferredUpdatePromiseWrapper.promise
	}

	/**
	 * Returns all ids of the files that have been removed, i.e. that are contained in the existingFileIds but not in the provided files
	 */
	_getRemovedAttachments(providedFiles: ?Attachments, existingFileIds: IdTuple[]): IdTuple[] {
		let removedAttachmentIds = [];
		if (providedFiles) {
			let attachments = neverNull(providedFiles)
			// check which attachments have been removed
			existingFileIds.forEach(fileId => {
				if (!attachments.find(attachment =>
					(attachment._type !== "DataFile" && attachment._type !== "FileReference" && isSameId(getLetId(attachment), fileId)))) {
					removedAttachmentIds.push(fileId);
				}
			})
		}
		return removedAttachmentIds
	}

	/**
	 * Uploads the given data files or sets the file if it is already existing files (e.g. forwarded files) and returns all DraftAttachments
	 */
	_createAddedAttachments(
		providedFiles: ?Attachments,
		existingFileIds: $ReadOnlyArray<IdTuple>,
		mailGroupKey: Aes128Key
	): Promise<DraftAttachment[]> {
		if (providedFiles) {
			return promiseMap(providedFiles, providedFile => {
				// check if this is a new attachment or an existing one
				if (providedFile._type === "DataFile") {
					// user added attachment
					const fileSessionKey = aes128RandomKey()
					const dataFile = downcast<DataFile>(providedFile)
					return this._file.uploadFileData(dataFile, fileSessionKey).then(fileDataId => {
						return this.createAndEncryptDraftAttachment(fileDataId, fileSessionKey, dataFile, mailGroupKey)
					})
				} else if (providedFile._type === "FileReference") {
					const fileSessionKey = aes128RandomKey()
					const fileRef = downcast<FileReference>(providedFile)
					return this._file.uploadFileDataNative(fileRef, fileSessionKey).then(fileDataId => {
						return this.createAndEncryptDraftAttachment(fileDataId, fileSessionKey, fileRef, mailGroupKey)
					})
				} else if (!containsId(existingFileIds, getLetId(providedFile))) {
					// forwarded attachment which was not in the draft before
					return resolveSessionKey(FileTypeModel, providedFile).then(fileSessionKey => {
						const attachment = createDraftAttachment();
						attachment.existingFile = getLetId(providedFile)
						attachment.ownerEncFileSessionKey = encryptKey(mailGroupKey, neverNull(fileSessionKey))
						return attachment
					})
				} else {
					return null
				}
			}) // disable concurrent file upload to avoid timeout because of missing progress events on Firefox.
				.then((attachments) => attachments.filter(Boolean))
				.then((it) => {
					// only delete the temporary files after all attachments have been uploaded
					if (isApp()) {
						fileApp.clearFileData()
						       .catch((e) => console.warn("Failed to clear files", e))
					}
					return it
				})
		} else {
			return Promise.resolve([])
		}
	}

	createAndEncryptDraftAttachment(fileDataId: Id, fileSessionKey: Aes128Key, providedFile: DataFile | FileReference, mailGroupKey: Aes128Key): DraftAttachment {
		let attachment = createDraftAttachment()
		let newAttachmentData = createNewDraftAttachment()
		newAttachmentData.encFileName = encryptString(fileSessionKey, providedFile.name)
		newAttachmentData.encMimeType = encryptString(fileSessionKey, providedFile.mimeType)
		newAttachmentData.fileData = fileDataId
		newAttachmentData.encCid = providedFile.cid == null ? null : encryptString(fileSessionKey, providedFile.cid)
		attachment.newFile = newAttachmentData
		attachment.ownerEncFileSessionKey = encryptKey(mailGroupKey, fileSessionKey)
		return attachment
	}

	async sendDraft(draft: Mail, recipients: Array<RecipientDetails>, language: string): Promise<void> {
		const senderMailGroupId = await getMailGroupIdForMailAddress(this._login.getLoggedInUser(), draft.sender.address)
		const bucketKey = aes128RandomKey()

		const sendDraftData = createSendDraftData()
		sendDraftData.language = language
		sendDraftData.mail = draft._id
		for (let fileId of draft.attachments) {
			const file = await this._entity.load(FileTypeRef, fileId)
			const fileSessionKey = await resolveSessionKey(FileTypeModel, file)
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
			this._entity.loadRoot(TutanotaPropertiesTypeRef, this._login.getUserGroupId()).then(tutanotaProperties => {
				sendDraftData.plaintext = tutanotaProperties.sendPlaintextOnly
			}),
			resolveSessionKey(MailTypeModel, draft).then(mailSessionkey => {
				let sk = neverNull(mailSessionkey)
				sendDraftData.calendarMethod = draft.method !== MailMethod.NONE
				if (draft.confidential) {
					sendDraftData.bucketEncMailSessionKey = encryptKey(bucketKey, sk)
					const hasExternalSecureRecipient = recipients.some(r => r.isExternal && !!r.password?.trim())
					if (hasExternalSecureRecipient) {
						sendDraftData.senderNameUnencrypted = draft.sender.name // needed for notification mail
					}
					return this._addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId)
				} else {
					sendDraftData.mailSessionKey = bitArrayToUint8Array(sk)
				}
			})
		])
		return serviceRequestVoid(TutanotaService.SendDraftService, HttpMethod.POST, sendDraftData)
	}

	checkMailForPhishing(mail: Mail, links: Array<{href: string, innerHTML: string}>): Promise<boolean> {
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

		const hasSuspiciousLink = links.some(({href, innerHTML}) => {
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

	_checkFieldForPhishing(type: ReportedMailFieldTypeEnum, value: string): boolean {
		const hash = phishingMarkerValue(type, value)
		return this._phishingMarkers.has(hash)
	}

	async _addRecipientKeyData(bucketKey: Aes128Key, service: SendDraftData, recipients: Array<RecipientDetails>, senderMailGroupId: Id): Promise<void> {
		const notFoundRecipients = []
		for (let recipient of recipients) {
			if (recipient.mailAddress === "system@tutanota.de" || !recipient) {
				notFoundRecipients.push(recipient.mailAddress)
				continue
			}

			// copy password information if this is an external contact
			// otherwise load the key information from the server
			if (recipient.isExternal) {
				const password = recipient.password

				if (password == null || !isSameId(this._login.getGroupId(GroupType.Mail), senderMailGroupId)) { // no password given and prevent sending to secure externals from shared group
					notFoundRecipients.push(recipient.mailAddress)
					continue
				}

				const salt = generateRandomSalt()
				const passwordKey = generateKeyFromPassphrase(password, salt, KeyLength.b128)
				const passwordVerifier = createAuthVerifier(passwordKey)

				const externalGroupKeys = await this._getExternalGroupKey(recipient.mailAddress, passwordKey, passwordVerifier)
				const data = createSecureExternalRecipientKeyData()
				data.mailAddress = recipient.mailAddress
				data.symEncBucketKey = null // legacy for old permission system, not used any more
				data.ownerEncBucketKey = encryptKey(externalGroupKeys.externalMailGroupKey, bucketKey)
				data.passwordVerifier = passwordVerifier
				data.salt = salt
				data.saltHash = hash(salt)
				data.pwEncCommunicationKey = encryptKey(passwordKey, externalGroupKeys.externalUserGroupKey)

				service.secureExternalRecipientKeyData.push(data)
			} else {
				const keyData = await encryptBucketKeyForInternalRecipient(bucketKey, recipient.mailAddress, notFoundRecipients)
				if (keyData) {
					service.internalRecipientKeyData.push(keyData)
				}
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}

	}

	/**
	 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created.
	 * Returns the user group key and the user mail group key of the external recipient.
	 * @param recipientMailAddress
	 * @param externalUserPwKey The external user's password key.
	 * @param verifier The external user's verifier, base64 encoded.
	 * @return Resolves to the the external user's group key and the external user's mail group key, rejected if an error occured
	 */
	_getExternalGroupKey(recipientMailAddress: string, externalUserPwKey: Aes128Key, verifier: Uint8Array): Promise<{externalUserGroupKey: Aes128Key, externalMailGroupKey: Aes128Key}> {
		return this._entity.loadRoot(GroupRootTypeRef, this._login.getUserGroupId()).then(groupRoot => {
			let cleanedMailAddress = recipientMailAddress.trim().toLocaleLowerCase()
			let mailAddressId = stringToCustomId(cleanedMailAddress)
			return load(ExternalUserReferenceTypeRef, [groupRoot.externalUserReferences, mailAddressId])
				.then(externalUserReference => {
					return load(UserTypeRef, externalUserReference.user).then(externalUser => {
						let mailGroupId = neverNull(externalUser.memberships.find(m => m.groupType
							=== GroupType.Mail)).group
						return Promise.all([
							load(GroupTypeRef, mailGroupId), load(GroupTypeRef, externalUserReference.userGroup)
						]).then(([externalMailGroup, externalUserGroup]) => {
							let externalUserGroupKey = decryptKey(this._login.getUserGroupKey(), neverNull(externalUserGroup.adminGroupEncGKey))
							let externalMailGroupKey = decryptKey(externalUserGroupKey, neverNull(externalMailGroup.adminGroupEncGKey))
							return {externalUserGroupKey, externalMailGroupKey}
						})
					})
				})
				.catch(ofClass(NotFoundError, e => {
					// it does not exist, so create it
					let internalMailGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Mail))
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
					userGroupData.internalUserEncUserGroupKey = encryptKey(this._login.getUserGroupKey(), externalUserGroupKey)

					d.userGroupData = userGroupData

					return serviceRequestVoid(TutanotaService.ExternalUserService, HttpMethod.POST, d).then(() => {
						return {externalUserGroupKey: externalUserGroupKey, externalMailGroupKey: externalMailGroupKey}
					})
				}))
		})
	}

	entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		return promiseMap(data, (update) => {
			if (this._deferredDraftUpdate && this._deferredDraftId && update.operation === OperationType.UPDATE
				&& isSameTypeRefByAttr(MailTypeRef, update.application, update.type)
				&& isSameId(this._deferredDraftId, [update.instanceListId, update.instanceId])) {
				return load(MailTypeRef, neverNull(this._deferredDraftId)).then(mail => {
					let deferredPromiseWrapper = neverNull(this._deferredDraftUpdate)
					this._deferredDraftUpdate = null
					deferredPromiseWrapper.resolve(mail)
				})
			}
		}).then(noOp)
	}

	phishingMarkersUpdateReceived(markers: Array<PhishingMarker>) {
		markers.forEach((marker) => {
			if (marker.status === PhishingMarkerStatus.INACTIVE) {
				this._phishingMarkers.delete(marker.marker)
			} else {
				this._phishingMarkers.add(marker.marker)
			}
		})
	}

	getRecipientKeyData(mailAddress: string): Promise<?PublicKeyReturn> {
		return serviceRequest(
			SysService.PublicKeyService,
			HttpMethod.GET,
			createPublicKeyData({mailAddress}),
			PublicKeyReturnTypeRef
		).catch(ofClass(NotFoundError, () => null))
	}
}

export function phishingMarkerValue(type: ReportedMailFieldTypeEnum, value: string): string {
	return type + murmurHash(value.replace(/\s/g, ""))
}

function getMailGroupIdForMailAddress(user: User, mailAddress: string): Promise<Id> {
	return promiseFilter(getUserGroupMemberships(user, GroupType.Mail), (groupMembership) => {
		return load(GroupTypeRef, groupMembership.group).then(mailGroup => {
			if (mailGroup.user == null) {
				return load(GroupInfoTypeRef, groupMembership.groupInfo).then(mailGroupInfo => {
					return contains(getEnabledMailAddressesForGroupInfo(mailGroupInfo), mailAddress)
				})
			} else if (isSameId(mailGroup.user, user._id)) {
				return load(GroupInfoTypeRef, user.userGroup.groupInfo).then(userGroupInfo => {
					return contains(getEnabledMailAddressesForGroupInfo(userGroupInfo), mailAddress)
				})
			} else {
				// not supported
				return false
			}
		})
	}).then(filteredMemberships => {
		if (filteredMemberships.length === 1) {
			return filteredMemberships[0].group
		} else {
			throw new NotFoundError("group for mail address not found " + mailAddress)
		}
	})
}

function parseUrl(link: string): ?URL {
	try {
		return new URL(link)
	} catch (e) {
		return null
	}
}

function getUrlDomain(link: string): ?string {
	const url = parseUrl(link)
	return url && url.hostname
}
