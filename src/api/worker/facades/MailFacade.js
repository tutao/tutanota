// @flow
import {decryptKey, encryptBytes, encryptKey, encryptString, resolveSessionKey} from "../crypto/CryptoFacade"
import {aes128RandomKey} from "../crypto/Aes"
import {load, serviceRequest, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import type {LoginFacade} from "./LoginFacade"
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
import {createDraftRecipient} from "../../entities/tutanota/DraftRecipient"
import {createDraftUpdateData} from "../../entities/tutanota/DraftUpdateData"
import {DraftUpdateReturnTypeRef} from "../../entities/tutanota/DraftUpdateReturn"
import type {SendDraftData} from "../../entities/tutanota/SendDraftData"
import {createSendDraftData} from "../../entities/tutanota/SendDraftData"
import type {RecipientInfo} from "../../common/RecipientInfo"
import {isExternalSecureRecipient, RecipientInfoType} from "../../common/RecipientInfo"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {generateKeyFromPassphrase, generateRandomSalt} from "../crypto/Bcrypt"
import {KeyLength} from "../crypto/CryptoConstants"
import {bitArrayToUint8Array, createAuthVerifier, keyToUint8Array} from "../crypto/CryptoUtils"
import {NotFoundError} from "../../common/error/RestError"
import {GroupRootTypeRef} from "../../entities/sys/GroupRoot"
import {HttpMethod} from "../../common/EntityFunctions"
import {ExternalUserReferenceTypeRef} from "../../entities/sys/ExternalUserReference"
import {addressDomain, defer, neverNull} from "../../common/utils/Utils"
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
import {contains} from "../../common/utils/ArrayUtils"
import {createEncryptedMailAddress} from "../../entities/tutanota/EncryptedMailAddress"
import {fileApp} from "../../../native/common/FileApp"
import {encryptBucketKeyForInternalRecipient} from "./ReceipientKeyDataUtils"
// $FlowIgnore[untyped-import]
import murmurHash from "../crypto/lib/murmurhash3_32"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import type {PhishingMarker} from "../../entities/tutanota/PhishingMarker"
import {EntityClient} from "../../common/EntityClient"
import {getEnabledMailAddressesForGroupInfo, getUserGroupMemberships} from "../../common/utils/GroupUtils";
import {containsId, getLetId, isSameId, stringToCustomId} from "../../common/utils/EntityUtils";
import {isSameTypeRefByAttr} from "../../common/utils/TypeRef";

assertWorkerOrNode()

export class MailFacade {
	_login: LoginFacade;
	_file: FileFacade;
	_phishingMarkers: Set<string>;
	_deferredDraftId: ?IdTuple; // the mail id of the draft that we are waiting for to be updated via websocket
	_deferredDraftUpdate: ?Object; // this deferred promise is resolved as soon as the update of the draft is received
	_entity: EntityClient;

	constructor(login: LoginFacade, fileFacade: FileFacade, entity: EntityClient) {
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
	createDraft(subject: string, body: string, senderAddress: string, senderName: string,
	            toRecipients: RecipientInfo[], ccRecipients: RecipientInfo[], bccRecipients: RecipientInfo[],
	            conversationType: ConversationTypeEnum, previousMessageId: ?Id,
	            attachments: ?Array<TutanotaFile | DataFile | FileReference>,
	            confidential: boolean, replyTos: RecipientInfo[], mailMethod: MailMethodEnum): Promise<Mail> {
		return getMailGroupIdForMailAddress(this._login.getLoggedInUser(), senderAddress).then(senderMailGroupId => {
			let userGroupKey = this._login.getUserGroupKey()
			let mailGroupKey = this._login.getGroupKey(senderMailGroupId)
			let sk = aes128RandomKey()
			let service = createDraftCreateData()
			service.previousMessageId = previousMessageId
			service.conversationType = conversationType
			service.ownerEncSessionKey = encryptKey(mailGroupKey, sk)
			service.symEncSessionKey = encryptKey(userGroupKey, sk) // legacy

			let draftData = createDraftData()
			draftData.subject = subject
			draftData.bodyText = body
			draftData.senderMailAddress = senderAddress
			draftData.senderName = senderName
			draftData.confidential = confidential
			draftData.method = mailMethod

			draftData.toRecipients = this._recipientInfoToDraftRecipient(toRecipients)
			draftData.ccRecipients = this._recipientInfoToDraftRecipient(ccRecipients)
			draftData.bccRecipients = this._recipientInfoToDraftRecipient(bccRecipients)
			draftData.replyTos = replyTos.map(recipient => {
				const ema = createEncryptedMailAddress()
				ema.address = recipient.mailAddress
				ema.name = recipient.name
				return ema
			})


			return this._createAddedAttachments(attachments, [], mailGroupKey).then(addedAttachments => {
				draftData.addedAttachments = addedAttachments
				service.draftData = draftData
				return serviceRequest(TutanotaService.DraftService, HttpMethod.POST, service, DraftCreateReturnTypeRef, null, sk)
					.then(createDraftReturn => load(MailTypeRef, createDraftReturn.draft))
			})
		})
	}

	_recipientInfoToDraftRecipient(toRecipients: RecipientInfo[]): DraftRecipient[] {
		return toRecipients.map(ri => {
			let draftRecipient = createDraftRecipient()
			draftRecipient.mailAddress = ri.mailAddress
			draftRecipient.name = ri.name
			return draftRecipient
		})
	}

	/**
	 * Updates a draft mail.
	 * @param subject The subject of the mail.
	 * @param body The body text of the mail.
	 * @param senderAddress The senders mail address.
	 * @param senderName The name of the sender that is sent together with the mail address of the sender.
	 * @param toRecipients The recipients the mail shall be sent to.
	 * @param ccRecipients The recipients the mail shall be sent to in cc.
	 * @param bccRecipients The recipients the mail shall be sent to in bcc.
	 * @param attachments The files that shall be attached to this mail or null if the current attachments shall not be changed.
	 * @param confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
	 * @param draft The draft to update.
	 * @return The updated draft. Rejected with TooManyRequestsError if the number allowed mails was exceeded, AccessBlockedError if the customer is not allowed to send emails currently because he is marked for approval.
	 */
	updateDraft(subject: string, body: string, senderAddress: string, senderName: string,
	            toRecipients: RecipientInfo[], ccRecipients: RecipientInfo[], bccRecipients: RecipientInfo[],
	            attachments: ?Array<TutanotaFile | DataFile | FileReference>, confidential: boolean, draft: Mail): Promise<Mail> {
		return getMailGroupIdForMailAddress(this._login.getLoggedInUser(), senderAddress).then(senderMailGroupId => {
			let mailGroupKey = this._login.getGroupKey(senderMailGroupId)
			let sk = decryptKey(mailGroupKey, (draft._ownerEncSessionKey: any))

			let service = createDraftUpdateData()
			service.draft = draft._id

			let draftData = createDraftData()
			draftData.subject = subject
			draftData.bodyText = body
			draftData.senderMailAddress = senderAddress
			draftData.senderName = senderName
			draftData.confidential = confidential
			draftData.method = draft.method

			draftData.toRecipients = this._recipientInfoToDraftRecipient(toRecipients)
			draftData.ccRecipients = this._recipientInfoToDraftRecipient(ccRecipients)
			draftData.bccRecipients = this._recipientInfoToDraftRecipient(bccRecipients)
			draftData.replyTos = draft.replyTos

			draftData.removedAttachments = this._getRemovedAttachments(attachments, draft.attachments)
			return this._createAddedAttachments(attachments, draft.attachments, mailGroupKey).then(addedAttachments => {
				draftData.addedAttachments = addedAttachments
				service.draftData = draftData
				this._deferredDraftId = draft._id
				// we have to wait for the updated mail because sendMail() might be called right after this update
				this._deferredDraftUpdate = defer()
				// use a local reference here because this._deferredDraftUpdate is set to null when the event is received async
				let deferredUpdatePromiseWrapper = this._deferredDraftUpdate
				return serviceRequest(TutanotaService.DraftService, HttpMethod.PUT, service, DraftUpdateReturnTypeRef, null, sk)
					.then(() => {
						return deferredUpdatePromiseWrapper.promise
					})
			})
		})
	}

	/**
	 * Returns all ids of the files that have been removed, i.e. that are contained in the existingFileIds but not in the provided files
	 */
	_getRemovedAttachments(providedFiles: ?Array<TutanotaFile | DataFile | FileReference>, existingFileIds: IdTuple[]): IdTuple[] {
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
	_createAddedAttachments(providedFiles: ?Array<TutanotaFile | DataFile | FileReference>, existingFileIds: IdTuple[], mailGroupKey: Aes128Key): Promise<DraftAttachment[]> {
		if (providedFiles) {
			return Promise
				.mapSeries((providedFiles: any), providedFile => {
					// check if this is a new attachment or an existing one
					if (providedFile._type === "DataFile") {
						// user added attachment
						let fileSessionKey = aes128RandomKey()
						let dataFile = ((providedFile: any): DataFile)
						return this._file.uploadFileData(dataFile, fileSessionKey).then(fileDataId => {
							return this.createAndEncryptDraftAttachment(fileDataId, fileSessionKey, providedFile, mailGroupKey)
						})
					} else if (providedFile._type === "FileReference") {
						let fileSessionKey = aes128RandomKey()
						let fileRef = ((providedFile: any): FileReference)
						return this._file.uploadFileDataNative(fileRef, fileSessionKey).then(fileDataId => {
							return this.createAndEncryptDraftAttachment(fileDataId, fileSessionKey, providedFile, mailGroupKey)
						})
					} else if (!containsId((existingFileIds: any), getLetId(providedFile))) {
						// forwarded attachment which was not in the draft before
						return resolveSessionKey(FileTypeModel, providedFile).then(fileSessionKey => {
							let attachment = createDraftAttachment();
							attachment.existingFile = getLetId(providedFile)
							attachment.ownerEncFileSessionKey = encryptKey(mailGroupKey, neverNull(fileSessionKey))
							return attachment
						})
					} else {
						return null
					}
				}) // disable concurrent file upload to avoid timeout because of missing progress events on Firefox.
				.then((attachments) => attachments.filter(Boolean))
				.tap(() => {
					// only delete the temporary files after all attachments have been uploaded
					if (isApp()) {
						fileApp.clearFileData()
						       .catch((e) => console.warn("Failed to clear files", e))
					}
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

	sendDraft(draft: Mail, recipientInfos: RecipientInfo[], language: string): Promise<void> {
		return getMailGroupIdForMailAddress(this._login.getLoggedInUser(), draft.sender.address)
			.then(senderMailGroupId => {
				let bucketKey = aes128RandomKey()

				let sendDraftData = createSendDraftData()
				sendDraftData.language = language
				sendDraftData.mail = draft._id

				return Promise.each(draft.attachments, fileId => {
					return load(FileTypeRef, fileId).then(file => {
						return resolveSessionKey(FileTypeModel, file).then(fileSessionKey => {
							let data = createAttachmentKeyData()
							data.file = fileId
							if (draft.confidential) {
								data.bucketEncFileSessionKey = encryptKey(bucketKey, neverNull(fileSessionKey))
							} else {
								data.fileSessionKey = keyToUint8Array(neverNull(fileSessionKey))
							}
							sendDraftData.attachmentKeyData.push(data)
						})
					})
				}).then(() => {
					return Promise.all([
						this._entity.loadRoot(TutanotaPropertiesTypeRef, this._login.getUserGroupId()).then(tutanotaProperties => {
							sendDraftData.plaintext = tutanotaProperties.sendPlaintextOnly
						}),
						resolveSessionKey(MailTypeModel, draft).then(mailSessionkey => {
							let sk = neverNull(mailSessionkey)
							sendDraftData.calendarMethod = draft.method !== MailMethod.NONE
							if (draft.confidential) {
								sendDraftData.bucketEncMailSessionKey = encryptKey(bucketKey, sk)
								if (recipientInfos.find(r => isExternalSecureRecipient(r)) != null) {
									sendDraftData.senderNameUnencrypted = draft.sender.name // needed for notification mail
								}
								return this._addRecipientKeyData(bucketKey, sendDraftData, recipientInfos, senderMailGroupId)
							} else {
								sendDraftData.mailSessionKey = bitArrayToUint8Array(sk)
							}
						})
					])
				}).then(() => serviceRequestVoid(TutanotaService.SendDraftService, HttpMethod.POST, sendDraftData))
			})
	}

	checkMailForPhishing(mail: Mail, links: Array<string>): Promise<boolean> {
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
			if (this._checkFieldForPhishing(ReportedMailFieldType.LINK, link)) {
				score += 6
				break
			} else {
				const domain = getUrlDomain(link)
				if (domain && this._checkFieldForPhishing(ReportedMailFieldType.LINK_DOMAIN, domain)) {
					score += 6
					break
				}
			}
		}
		return Promise.resolve(7 < score)
	}

	_checkFieldForPhishing(type: ReportedMailFieldTypeEnum, value: string): boolean {
		const hash = phishingMarkerValue(type, value)
		return this._phishingMarkers.has(hash)
	}

	_addRecipientKeyData(bucketKey: Aes128Key, service: SendDraftData, recipientInfos: RecipientInfo[], senderMailGroupId: Id): Promise<void> {
		let notFoundRecipients = []
		return Promise.all(recipientInfos.map(recipientInfo => {
				if (recipientInfo.mailAddress === "system@tutanota.de" || !recipientInfo) {
					notFoundRecipients.push(recipientInfo.mailAddress)
					return Promise.resolve()
				}

				// copy password information if this is an external contact
				// otherwise load the key information from the server
				if (recipientInfo.type === RecipientInfoType.EXTERNAL && recipientInfo.contact) {
					let password = recipientInfo.contact.presharedPassword

					if (password == null && recipientInfo.contact.autoTransmitPassword !== "") {
						password = recipientInfo.contact.autoTransmitPassword
					}

					if (password == null || !isSameId(this._login.getGroupId(GroupType.Mail), senderMailGroupId)) { // no password given and prevent sending to secure externals from shared group
						notFoundRecipients.push(recipientInfo.mailAddress)
						return Promise.resolve()
					}

					let salt = generateRandomSalt()
					let passwordKey = generateKeyFromPassphrase(password, salt, KeyLength.b128)
					let passwordVerifier = createAuthVerifier(passwordKey)

					return this._getExternalGroupKey(recipientInfo, passwordKey, passwordVerifier)
					           .then(externalGroupKeys => {
						           let data = createSecureExternalRecipientKeyData()
						           data.mailAddress = recipientInfo.mailAddress
						           data.symEncBucketKey = null // legacy for old permission system, not used any more
						           data.ownerEncBucketKey = encryptKey(externalGroupKeys.externalMailGroupKey, bucketKey)
						           data.passwordVerifier = passwordVerifier
						           data.salt = salt
						           data.saltHash = hash(salt)
						           data.pwEncCommunicationKey = encryptKey(passwordKey, externalGroupKeys.externalUserGroupKey)

						           service.secureExternalRecipientKeyData.push(data)
					           })
				} else {
					return encryptBucketKeyForInternalRecipient(bucketKey, recipientInfo, notFoundRecipients).then(keyData => {
						if (keyData) {
							service.internalRecipientKeyData.push(keyData)
						}
					})
				}
			})
		).then(() => {
			if (notFoundRecipients.length > 0) throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		})
	}

	/**
	 * Checks that an external user instance with a mail box exists for the given recipient. If it does not exist, it is created.
	 * Returns the user group key and the user mail group key of the external recipient.
	 * @param recipientInfo The recipient.
	 * @param externalUserPwKey The external user's password key.
	 * @param verifier The external user's verifier, base64 encoded.
	 * @return Resolves to the the external user's group key and the external user's mail group key, rejected if an error occured
	 */
	_getExternalGroupKey(recipientInfo: RecipientInfo, externalUserPwKey: Aes128Key, verifier: Uint8Array): Promise<{externalUserGroupKey: Aes128Key, externalMailGroupKey: Aes128Key}> {
		return this._entity.loadRoot(GroupRootTypeRef, this._login.getUserGroupId()).then(groupRoot => {
			let cleanedMailAddress = recipientInfo.mailAddress.trim().toLocaleLowerCase()
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
				.catch(NotFoundError, e => {
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
				})
		})
	}

	entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		return Promise.each(data, (update) => {
			if (this._deferredDraftUpdate && this._deferredDraftId && update.operation === OperationType.UPDATE
				&& isSameTypeRefByAttr(MailTypeRef, update.application, update.type)
				&& isSameId(this._deferredDraftId, [update.instanceListId, update.instanceId])) {
				return load(MailTypeRef, neverNull(this._deferredDraftId)).then(mail => {
					let deferredPromiseWrapper = neverNull(this._deferredDraftUpdate)
					this._deferredDraftUpdate = null
					deferredPromiseWrapper.resolve(mail)
				})
			}
		}).return()
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
}

export function phishingMarkerValue(type: ReportedMailFieldTypeEnum, value: string): string {
	return type + murmurHash(value.replace(/\s/g, ""))
}

function getMailGroupIdForMailAddress(user: User, mailAddress: string): Promise<Id> {
	return Promise.filter(getUserGroupMemberships(user, GroupType.Mail), (groupMembership) => {
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

function getUrlDomain(link: string): ?string {
	try {
		return new URL(link).hostname
	} catch (e) {
		return null
	}
}
