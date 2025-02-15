import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertWorkerOrNode, isApp, isDesktop } from "./Env-chunk.js";
import { addressDomain, assertNotNull, byteLength, contains, defer, freshVersioned, isEmpty, isNotNull, isSameTypeRef, isSameTypeRefByAttr, noOp, ofClass, pMap, promiseFilter } from "./dist2-chunk.js";
import { ArchiveDataType, CounterType, CryptoProtocolVersion, DEFAULT_KDF_TYPE, EncryptionAuthStatus, GroupType, MailAuthenticationStatus, MailMethod, OperationType, PhishingMarkerStatus, PublicKeyIdentifierType, ReportedMailFieldType, SYSTEM_GROUP_MAIL_ADDRESS } from "./TutanotaConstants-chunk.js";
import { containsId, elementIdPart, getElementId, getLetId, isSameId, listIdPart, stringToCustomId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { FileTypeRef, InternalRecipientKeyDataTypeRef, MailDetailsBlobTypeRef, MailDetailsDraftTypeRef, MailTypeRef, SymEncInternalRecipientKeyDataTypeRef, TutanotaPropertiesTypeRef, createApplyLabelServicePostIn, createAttachmentKeyData, createCreateExternalUserGroupData, createCreateMailFolderData, createDeleteMailData, createDeleteMailFolderData, createDraftAttachment, createDraftCreateData, createDraftData, createDraftRecipient, createDraftUpdateData, createEncryptedMailAddress, createExternalUserData, createListUnsubscribeData, createManageLabelServiceDeleteIn, createManageLabelServiceLabelData, createManageLabelServicePostIn, createMoveMailData, createNewDraftAttachment, createReportMailPostData, createSecureExternalRecipientKeyData, createSendDraftData, createUpdateMailFolderData } from "./TypeRefs-chunk.js";
import "./TypeModels2-chunk.js";
import { ExternalUserReferenceTypeRef, GroupInfoTypeRef, GroupRootTypeRef, GroupTypeRef, UserTypeRef, createPublicKeyGetIn } from "./TypeRefs2-chunk.js";
import { resolveTypeReference } from "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import { NotFoundError } from "./RestError-chunk.js";
import "./CryptoError-chunk.js";
import { RecipientsNotFoundError } from "./RecipientsNotFoundError-chunk.js";
import { MailBodyTooLargeError } from "./MailBodyTooLargeError-chunk.js";
import { PublicKeyService } from "./Services-chunk.js";
import { aes256RandomKey, bitArrayToUint8Array, createAuthVerifier, decryptKey, encryptKey, generateRandomSalt, keyToUint8Array, murmurHash, random, sha256Hash } from "./dist3-chunk.js";
import { encryptBytes, encryptKeyWithVersionedKey, encryptString } from "./CryptoWrapper-chunk.js";
import { ApplyLabelService, DraftService, ExternalUserService, ListUnsubscribeService, MailFolderService, MailService, ManageLabelService, MoveMailService, ReportMailService, SendDraftService } from "./Services2-chunk.js";
import { UNCOMPRESSED_MAX_SIZE } from "./Compression-chunk.js";
import { getEnabledMailAddressesForGroupInfo, getUserGroupMemberships } from "./GroupUtils-chunk.js";
import { isDataFile, isFileReference } from "./FileUtils-chunk.js";
import { RecipientType } from "./Recipient-chunk.js";
import { CounterService, createWriteCounterData } from "./Services4-chunk.js";
import { htmlToText } from "./IndexUtils-chunk.js";

//#region src/common/api/worker/facades/lazy/MailFacade.ts
assertWorkerOrNode();
var MailFacade = class {
	phishingMarkers = new Set();
	deferredDraftId = null;
	deferredDraftUpdate = null;
	constructor(userFacade, entityClient, crypto, serviceExecutor, blobFacade, fileApp, loginFacade, keyLoaderFacade) {
		this.userFacade = userFacade;
		this.entityClient = entityClient;
		this.crypto = crypto;
		this.serviceExecutor = serviceExecutor;
		this.blobFacade = blobFacade;
		this.fileApp = fileApp;
		this.loginFacade = loginFacade;
		this.keyLoaderFacade = keyLoaderFacade;
	}
	async createMailFolder(name, parent, ownerGroupId) {
		const mailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId);
		const sk = aes256RandomKey();
		const ownerEncSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sk);
		const newFolder = createCreateMailFolderData({
			folderName: name,
			parentFolder: parent,
			ownerEncSessionKey: ownerEncSessionKey.key,
			ownerGroup: ownerGroupId,
			ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString()
		});
		await this.serviceExecutor.post(MailFolderService, newFolder, { sessionKey: sk });
	}
	/**
	* Updates a mail folder's name, if needed
	* @param newName - if this is the same as the folder's current name, nothing is done
	*/
	async updateMailFolderName(folder, newName) {
		if (newName !== folder.name) {
			folder.name = newName;
			await this.entityClient.update(folder);
		}
	}
	/**
	* Updates a mail folder's parent, if needed
	* @param newParent - if this is the same as the folder's current parent, nothing is done
	*/
	async updateMailFolderParent(folder, newParent) {
		if (folder.parentFolder != null && newParent != null && !isSameId(folder.parentFolder, newParent) || folder.parentFolder == null && newParent != null || folder.parentFolder != null && newParent == null) {
			const updateFolder = createUpdateMailFolderData({
				folder: folder._id,
				newParent
			});
			await this.serviceExecutor.put(MailFolderService, updateFolder);
		}
	}
	/**
	* Creates a draft mail.
	* @param bodyText The bodyText of the mail formatted as HTML.
	* @param previousMessageId The id of the message that this mail is a reply or forward to. Null if this is a new mail.
	* @param attachments The files that shall be attached to this mail or null if no files shall be attached. TutanotaFiles are already exising on the server, DataFiles are files from the local file system. Attention: the DataFile class information is lost
	* @param confidential True if the mail shall be sent end-to-end encrypted, false otherwise.
	*/
	async createDraft({ subject, bodyText, senderMailAddress, senderName, toRecipients, ccRecipients, bccRecipients, conversationType, previousMessageId, attachments, confidential, replyTos, method }) {
		if (byteLength(bodyText) > UNCOMPRESSED_MAX_SIZE) throw new MailBodyTooLargeError(`Can't update draft, mail body too large (${byteLength(bodyText)})`);
		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), senderMailAddress);
		const mailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(senderMailGroupId);
		const sk = aes256RandomKey();
		const ownerEncSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sk);
		const service = createDraftCreateData({
			previousMessageId,
			conversationType,
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
				removedAttachments: []
			}),
			ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString()
		});
		const createDraftReturn = await this.serviceExecutor.post(DraftService, service, { sessionKey: sk });
		return this.entityClient.load(MailTypeRef, createDraftReturn.draft);
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
	async updateDraft({ subject, body, senderMailAddress, senderName, toRecipients, ccRecipients, bccRecipients, attachments, confidential, draft }) {
		if (byteLength(body) > UNCOMPRESSED_MAX_SIZE) throw new MailBodyTooLargeError(`Can't update draft, mail body too large (${byteLength(body)})`);
		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), senderMailAddress);
		const mailGroupKeyVersion = Number(draft._ownerKeyVersion ?? 0);
		const mailGroupKey = {
			version: mailGroupKeyVersion,
			object: await this.keyLoaderFacade.loadSymGroupKey(senderMailGroupId, mailGroupKeyVersion)
		};
		const currentAttachments = await this.getAttachmentIds(draft);
		const replyTos = await this.getReplyTos(draft);
		const sk = decryptKey(mailGroupKey.object, assertNotNull(draft._ownerEncSessionKey));
		const service = createDraftUpdateData({
			draft: draft._id,
			draftData: createDraftData({
				subject,
				compressedBodyText: body,
				senderMailAddress,
				senderName,
				confidential,
				method: draft.method,
				toRecipients: toRecipients.map(recipientToDraftRecipient),
				ccRecipients: ccRecipients.map(recipientToDraftRecipient),
				bccRecipients: bccRecipients.map(recipientToDraftRecipient),
				replyTos,
				removedAttachments: this._getRemovedAttachments(attachments, currentAttachments),
				addedAttachments: await this._createAddedAttachments(attachments, currentAttachments, senderMailGroupId, mailGroupKey),
				bodyText: ""
			})
		});
		this.deferredDraftId = draft._id;
		this.deferredDraftUpdate = defer();
		const deferredUpdatePromiseWrapper = this.deferredDraftUpdate;
		await this.serviceExecutor.put(DraftService, service, { sessionKey: sk });
		return deferredUpdatePromiseWrapper.promise;
	}
	async moveMails(mails, sourceFolder, targetFolder) {
		await this.serviceExecutor.post(MoveMailService, createMoveMailData({
			mails,
			sourceFolder,
			targetFolder
		}));
	}
	async reportMail(mail, reportType) {
		const mailSessionKey = assertNotNull(await this.crypto.resolveSessionKeyForInstance(mail));
		const postData = createReportMailPostData({
			mailId: mail._id,
			mailSessionKey: bitArrayToUint8Array(mailSessionKey),
			reportType
		});
		await this.serviceExecutor.post(ReportMailService, postData);
	}
	async deleteMails(mails, folder) {
		const deleteMailData = createDeleteMailData({
			mails,
			folder
		});
		await this.serviceExecutor.delete(MailService, deleteMailData);
	}
	/**
	* Returns all ids of the files that have been removed, i.e. that are contained in the existingFileIds but not in the provided files
	*/
	_getRemovedAttachments(providedFiles, existingFileIds) {
		const removedAttachmentIds = [];
		if (providedFiles != null) {
			const attachments = providedFiles;
			for (const fileId of existingFileIds) if (!attachments.some((attachment) => attachment._type !== "DataFile" && attachment._type !== "FileReference" && isSameId(getLetId(attachment), fileId))) removedAttachmentIds.push(fileId);
		}
		return removedAttachmentIds;
	}
	/**
	* Uploads the given data files or sets the file if it is already existing files (e.g. forwarded files) and returns all DraftAttachments
	*/
	async _createAddedAttachments(providedFiles, existingFileIds, senderMailGroupId, mailGroupKey) {
		if (providedFiles == null || providedFiles.length === 0) return [];
		validateMimeTypesForAttachments(providedFiles);
		return pMap(providedFiles, async (providedFile) => {
			if (isDataFile(providedFile)) {
				const fileSessionKey = aes256RandomKey();
				let referenceTokens;
				if (isApp() || isDesktop()) {
					const { location } = await this.fileApp.writeDataFile(providedFile);
					referenceTokens = await this.blobFacade.encryptAndUploadNative(ArchiveDataType.Attachments, location, senderMailGroupId, fileSessionKey);
					await this.fileApp.deleteFile(location);
				} else referenceTokens = await this.blobFacade.encryptAndUpload(ArchiveDataType.Attachments, providedFile.data, senderMailGroupId, fileSessionKey);
				return this.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey);
			} else if (isFileReference(providedFile)) {
				const fileSessionKey = aes256RandomKey();
				const referenceTokens = await this.blobFacade.encryptAndUploadNative(ArchiveDataType.Attachments, providedFile.location, senderMailGroupId, fileSessionKey);
				return this.createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey);
			} else if (!containsId(existingFileIds, getLetId(providedFile))) return this.crypto.resolveSessionKeyForInstance(providedFile).then((fileSessionKey) => {
				const sessionKey = assertNotNull(fileSessionKey, "filesessionkey was not resolved");
				const ownerEncFileSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sessionKey);
				const attachment = createDraftAttachment({
					existingFile: getLetId(providedFile),
					ownerEncFileSessionKey: ownerEncFileSessionKey.key,
					newFile: null,
					ownerKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString()
				});
				return attachment;
			});
else return null;
		}).then((attachments) => attachments.filter(isNotNull)).then((it) => {
			if (isApp()) this.fileApp.clearFileData().catch((e) => console.warn("Failed to clear files", e));
			return it;
		});
	}
	createAndEncryptDraftAttachment(referenceTokens, fileSessionKey, providedFile, mailGroupKey) {
		const ownerEncFileSessionKey = encryptKeyWithVersionedKey(mailGroupKey, fileSessionKey);
		return createDraftAttachment({
			newFile: createNewDraftAttachment({
				encFileName: encryptString(fileSessionKey, providedFile.name),
				encMimeType: encryptString(fileSessionKey, providedFile.mimeType),
				referenceTokens,
				encCid: providedFile.cid == null ? null : encryptString(fileSessionKey, providedFile.cid)
			}),
			ownerEncFileSessionKey: ownerEncFileSessionKey.key,
			ownerKeyVersion: ownerEncFileSessionKey.encryptingKeyVersion.toString(),
			existingFile: null
		});
	}
	async sendDraft(draft, recipients, language) {
		const senderMailGroupId = await this._getMailGroupIdForMailAddress(this.userFacade.getLoggedInUser(), draft.sender.address);
		const bucketKey = aes256RandomKey();
		const sendDraftData = createSendDraftData({
			language,
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
			sessionEncEncryptionAuthStatus: null
		});
		const attachments = await this.getAttachmentIds(draft);
		for (const fileId of attachments) {
			const file = await this.entityClient.load(FileTypeRef, fileId);
			const fileSessionKey = assertNotNull(await this.crypto.resolveSessionKeyForInstance(file), "fileSessionKey was null");
			const data = createAttachmentKeyData({
				file: fileId,
				fileSessionKey: null,
				bucketEncFileSessionKey: null
			});
			if (draft.confidential) data.bucketEncFileSessionKey = encryptKey(bucketKey, fileSessionKey);
else data.fileSessionKey = keyToUint8Array(fileSessionKey);
			sendDraftData.attachmentKeyData.push(data);
		}
		await Promise.all([this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId()).then((tutanotaProperties) => {
			sendDraftData.plaintext = tutanotaProperties.sendPlaintextOnly;
		}), this.crypto.resolveSessionKeyForInstance(draft).then(async (mailSessionkey) => {
			const sk = assertNotNull(mailSessionkey, "mailSessionKey was null");
			sendDraftData.calendarMethod = draft.method !== MailMethod.NONE;
			if (draft.confidential) {
				sendDraftData.bucketEncMailSessionKey = encryptKey(bucketKey, sk);
				const hasExternalSecureRecipient = recipients.some((r) => r.type === RecipientType.EXTERNAL && !!this.getContactPassword(r.contact)?.trim());
				if (hasExternalSecureRecipient) sendDraftData.senderNameUnencrypted = draft.sender.name;
				await this.addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId);
				if (this.isTutaCryptMail(sendDraftData)) sendDraftData.sessionEncEncryptionAuthStatus = encryptString(sk, EncryptionAuthStatus.TUTACRYPT_SENDER);
			} else sendDraftData.mailSessionKey = bitArrayToUint8Array(sk);
		})]);
		await this.serviceExecutor.post(SendDraftService, sendDraftData);
	}
	async getAttachmentIds(draft) {
		return draft.attachments;
	}
	async getReplyTos(draft) {
		const ownerEncSessionKeyProvider = this.keyProviderFromInstance(draft);
		const mailDetailsDraftId = assertNotNull(draft.mailDetailsDraft, "draft without mailDetailsDraft");
		const mailDetails = await this.entityClient.loadMultiple(MailDetailsDraftTypeRef, listIdPart(mailDetailsDraftId), [elementIdPart(mailDetailsDraftId)], ownerEncSessionKeyProvider);
		if (mailDetails.length === 0) throw new NotFoundError(`MailDetailsDraft ${draft.mailDetailsDraft}`);
		return mailDetails[0].details.replyTos;
	}
	async checkMailForPhishing(mail, links) {
		let score = 0;
		const senderAddress = mail.sender.address;
		let senderAuthenticated;
		if (mail.authStatus !== null) senderAuthenticated = mail.authStatus === MailAuthenticationStatus.AUTHENTICATED;
else {
			const mailDetails = await this.loadMailDetailsBlob(mail);
			senderAuthenticated = mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED;
		}
		if (senderAuthenticated) if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_ADDRESS, senderAddress)) score += 6;
else {
			const senderDomain = addressDomain(senderAddress);
			if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_DOMAIN, senderDomain)) score += 6;
		}
else if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_ADDRESS_NON_AUTH, senderAddress)) score += 6;
else {
			const senderDomain = addressDomain(senderAddress);
			if (this._checkFieldForPhishing(ReportedMailFieldType.FROM_DOMAIN_NON_AUTH, senderDomain)) score += 6;
		}
		if (mail.subject && this._checkFieldForPhishing(ReportedMailFieldType.SUBJECT, mail.subject)) score += 3;
		for (const link of links) if (this._checkFieldForPhishing(ReportedMailFieldType.LINK, link.href)) {
			score += 6;
			break;
		} else {
			const domain = getUrlDomain(link.href);
			if (domain && this._checkFieldForPhishing(ReportedMailFieldType.LINK_DOMAIN, domain)) {
				score += 6;
				break;
			}
		}
		const hasSuspiciousLink = links.some(({ href, innerHTML }) => {
			const innerText = htmlToText(innerHTML);
			const textUrl = parseUrl(innerText);
			const hrefUrl = parseUrl(href);
			return textUrl && hrefUrl && textUrl.hostname !== hrefUrl.hostname;
		});
		if (hasSuspiciousLink) score += 6;
		return Promise.resolve(7 < score);
	}
	async deleteFolder(id) {
		const deleteMailFolderData = createDeleteMailFolderData({ folders: [id] });
		await this.serviceExecutor.delete(MailFolderService, deleteMailFolderData, { sessionKey: "dummy" });
	}
	async fixupCounterForFolder(groupId, folder, unreadMails) {
		const counterId = folder.isMailSet ? getElementId(folder) : folder.mails;
		const data = createWriteCounterData({
			counterType: CounterType.UnreadMails,
			row: groupId,
			column: counterId,
			value: String(unreadMails)
		});
		await this.serviceExecutor.post(CounterService, data);
	}
	_checkFieldForPhishing(type, value) {
		const hash = phishingMarkerValue(type, value);
		return this.phishingMarkers.has(hash);
	}
	async addRecipientKeyData(bucketKey, sendDraftData, recipients, senderMailGroupId) {
		const notFoundRecipients = [];
		for (const recipient of recipients) {
			if (recipient.address === SYSTEM_GROUP_MAIL_ADDRESS || !recipient) {
				notFoundRecipients.push(recipient.address);
				continue;
			}
			const isSharedMailboxSender = !isSameId(this.userFacade.getGroupId(GroupType.Mail), senderMailGroupId);
			if (recipient.type === RecipientType.EXTERNAL) {
				const passphrase = this.getContactPassword(recipient.contact);
				if (passphrase == null || isSharedMailboxSender) {
					notFoundRecipients.push(recipient.address);
					continue;
				}
				const salt = generateRandomSalt();
				const kdfType = DEFAULT_KDF_TYPE;
				const passwordKey = await this.loginFacade.deriveUserPassphraseKey({
					kdfType,
					passphrase,
					salt
				});
				const passwordVerifier = createAuthVerifier(passwordKey);
				const externalGroupKeys = await this.getExternalGroupKeys(recipient.address, kdfType, passwordKey, passwordVerifier);
				const ownerEncBucketKey = encryptKeyWithVersionedKey(externalGroupKeys.currentExternalMailGroupKey, bucketKey);
				const data = createSecureExternalRecipientKeyData({
					mailAddress: recipient.address,
					kdfVersion: kdfType,
					ownerEncBucketKey: ownerEncBucketKey.key,
					ownerKeyVersion: ownerEncBucketKey.encryptingKeyVersion.toString(),
					passwordVerifier,
					salt,
					saltHash: sha256Hash(salt),
					pwEncCommunicationKey: encryptKey(passwordKey, externalGroupKeys.currentExternalUserGroupKey.object),
					userGroupKeyVersion: String(externalGroupKeys.currentExternalUserGroupKey.version)
				});
				sendDraftData.secureExternalRecipientKeyData.push(data);
			} else {
				const keyData = await this.crypto.encryptBucketKeyForInternalRecipient(isSharedMailboxSender ? senderMailGroupId : this.userFacade.getLoggedInUser().userGroup.group, bucketKey, recipient.address, notFoundRecipients);
				if (keyData == null) {} else if (isSameTypeRef(keyData._type, SymEncInternalRecipientKeyDataTypeRef)) sendDraftData.symEncInternalRecipientKeyData.push(keyData);
else if (isSameTypeRef(keyData._type, InternalRecipientKeyDataTypeRef)) sendDraftData.internalRecipientKeyData.push(keyData);
			}
		}
		if (notFoundRecipients.length > 0) throw new RecipientsNotFoundError(notFoundRecipients.join("\n"));
	}
	/**
	* Checks if the given send draft data contains only encrypt keys that have been encrypted with TutaCrypt protocol.
	* @VisibleForTesting
	* @param sendDraftData The send drafta for the mail that should be sent
	*/
	isTutaCryptMail(sendDraftData) {
		if (sendDraftData.symEncInternalRecipientKeyData.length > 0 || sendDraftData.secureExternalRecipientKeyData.length) return false;
		if (isEmpty(sendDraftData.internalRecipientKeyData)) return false;
		return sendDraftData.internalRecipientKeyData.every((recipientData) => recipientData.protocolVersion === CryptoProtocolVersion.TUTA_CRYPT);
	}
	getContactPassword(contact) {
		return contact?.presharedPassword ?? null;
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
	async getExternalGroupKeys(recipientMailAddress, externalUserKdfType, externalUserPwKey, verifier) {
		const groupRoot = await this.entityClient.loadRoot(GroupRootTypeRef, this.userFacade.getUserGroupId());
		const cleanedMailAddress = recipientMailAddress.trim().toLocaleLowerCase();
		const mailAddressId = stringToCustomId(cleanedMailAddress);
		let externalUserReference;
		try {
			externalUserReference = await this.entityClient.load(ExternalUserReferenceTypeRef, [groupRoot.externalUserReferences, mailAddressId]);
		} catch (e) {
			if (e instanceof NotFoundError) return this.createExternalUser(cleanedMailAddress, externalUserKdfType, externalUserPwKey, verifier);
			throw e;
		}
		const externalUser = await this.entityClient.load(UserTypeRef, externalUserReference.user);
		const externalUserGroupId = externalUserReference.userGroup;
		const externalMailGroupId = assertNotNull(externalUser.memberships.find((m) => m.groupType === GroupType.Mail), "no mail group membership on external user").group;
		const externalMailGroup = await this.entityClient.load(GroupTypeRef, externalMailGroupId);
		const externalUserGroup = await this.entityClient.load(GroupTypeRef, externalUserGroupId);
		const requiredInternalUserGroupKeyVersion = Number(externalUserGroup.adminGroupKeyVersion ?? 0);
		const requiredExternalUserGroupKeyVersion = Number(externalMailGroup.adminGroupKeyVersion ?? 0);
		const internalUserEncExternalUserKey = assertNotNull(externalUserGroup.adminGroupEncGKey, "no adminGroupEncGKey on external user group");
		const externalUserEncExternalMailKey = assertNotNull(externalMailGroup.adminGroupEncGKey, "no adminGroupEncGKey on external mail group");
		const requiredInternalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(this.userFacade.getUserGroupId(), requiredInternalUserGroupKeyVersion);
		const currentExternalUserGroupKey = {
			object: decryptKey(requiredInternalUserGroupKey, internalUserEncExternalUserKey),
			version: Number(externalUserGroup.groupKeyVersion)
		};
		const requiredExternalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(externalUserGroupId, requiredExternalUserGroupKeyVersion, currentExternalUserGroupKey);
		const currentExternalMailGroupKey = {
			object: decryptKey(requiredExternalUserGroupKey, externalUserEncExternalMailKey),
			version: Number(externalMailGroup.groupKeyVersion)
		};
		return {
			currentExternalUserGroupKey,
			currentExternalMailGroupKey
		};
	}
	getRecipientKeyData(mailAddress) {
		return this.serviceExecutor.get(PublicKeyService, createPublicKeyGetIn({
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			identifier: mailAddress,
			version: null
		})).catch(ofClass(NotFoundError, () => null));
	}
	entityEventsReceived(data) {
		return pMap(data, (update) => {
			if (this.deferredDraftUpdate != null && this.deferredDraftId != null && update.operation === OperationType.UPDATE && isSameTypeRefByAttr(MailTypeRef, update.application, update.type) && isSameId(this.deferredDraftId, [update.instanceListId, update.instanceId])) return this.entityClient.load(MailTypeRef, this.deferredDraftId).then((mail) => {
				const deferredPromiseWrapper = assertNotNull(this.deferredDraftUpdate, "deferredDraftUpdate went away?");
				this.deferredDraftUpdate = null;
				deferredPromiseWrapper.resolve(mail);
			}).catch(ofClass(NotFoundError, () => {
				console.log(`Could not find updated mail ${JSON.stringify([update.instanceListId, update.instanceId])}`);
			}));
		}).then(noOp);
	}
	/**
	* @param markers only phishing (not spam) markers will be sent as event bus updates
	*/
	phishingMarkersUpdateReceived(markers) {
		for (const marker of markers) if (marker.status === PhishingMarkerStatus.INACTIVE) this.phishingMarkers.delete(marker.marker);
else this.phishingMarkers.add(marker.marker);
	}
	async createExternalUser(cleanedMailAddress, externalUserKdfType, externalUserPwKey, verifier) {
		const internalUserGroupKey = this.userFacade.getCurrentUserGroupKey();
		const internalMailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Mail));
		const currentExternalUserGroupKey = freshVersioned(aes256RandomKey());
		const currentExternalMailGroupKey = freshVersioned(aes256RandomKey());
		const externalUserGroupInfoSessionKey = aes256RandomKey();
		const externalMailGroupInfoSessionKey = aes256RandomKey();
		const tutanotaPropertiesSessionKey = aes256RandomKey();
		const mailboxSessionKey = aes256RandomKey();
		const externalUserEncEntropy = encryptBytes(currentExternalUserGroupKey.object, random.generateRandomData(32));
		const internalUserEncGroupKey = encryptKeyWithVersionedKey(internalUserGroupKey, currentExternalUserGroupKey.object);
		const userGroupData = createCreateExternalUserGroupData({
			mailAddress: cleanedMailAddress,
			externalPwEncUserGroupKey: encryptKey(externalUserPwKey, currentExternalUserGroupKey.object),
			internalUserEncUserGroupKey: internalUserEncGroupKey.key,
			internalUserGroupKeyVersion: internalUserEncGroupKey.encryptingKeyVersion.toString()
		});
		const externalUserEncUserGroupInfoSessionKey = encryptKeyWithVersionedKey(currentExternalUserGroupKey, externalUserGroupInfoSessionKey);
		const externalUserEncMailGroupKey = encryptKeyWithVersionedKey(currentExternalUserGroupKey, currentExternalMailGroupKey.object);
		const externalUserEncTutanotaPropertiesSessionKey = encryptKeyWithVersionedKey(currentExternalUserGroupKey, tutanotaPropertiesSessionKey);
		const externalMailEncMailGroupInfoSessionKey = encryptKeyWithVersionedKey(currentExternalMailGroupKey, externalMailGroupInfoSessionKey);
		const externalMailEncMailBoxSessionKey = encryptKeyWithVersionedKey(currentExternalMailGroupKey, mailboxSessionKey);
		const internalMailEncUserGroupInfoSessionKey = encryptKeyWithVersionedKey(internalMailGroupKey, externalUserGroupInfoSessionKey);
		const internalMailEncMailGroupInfoSessionKey = encryptKeyWithVersionedKey(internalMailGroupKey, externalMailGroupInfoSessionKey);
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
			internalMailGroupKeyVersion: internalMailGroupKey.version.toString()
		});
		await this.serviceExecutor.post(ExternalUserService, externalUserData);
		return {
			currentExternalUserGroupKey,
			currentExternalMailGroupKey
		};
	}
	_getMailGroupIdForMailAddress(user, mailAddress) {
		return promiseFilter(getUserGroupMemberships(user, GroupType.Mail), (groupMembership) => {
			return this.entityClient.load(GroupTypeRef, groupMembership.group).then((mailGroup) => {
				if (mailGroup.user == null) return this.entityClient.load(GroupInfoTypeRef, groupMembership.groupInfo).then((mailGroupInfo) => {
					return contains(getEnabledMailAddressesForGroupInfo(mailGroupInfo), mailAddress);
				});
else if (isSameId(mailGroup.user, user._id)) return this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo).then((userGroupInfo) => {
					return contains(getEnabledMailAddressesForGroupInfo(userGroupInfo), mailAddress);
				});
else return false;
			});
		}).then((filteredMemberships) => {
			if (filteredMemberships.length === 1) return filteredMemberships[0].group;
else throw new NotFoundError("group for mail address not found " + mailAddress);
		});
	}
	async clearFolder(folderId) {
		const deleteMailData = createDeleteMailData({
			folder: folderId,
			mails: []
		});
		await this.serviceExecutor.delete(MailService, deleteMailData);
	}
	async unsubscribe(mailId, recipient, headers) {
		const postData = createListUnsubscribeData({
			mail: mailId,
			recipient,
			headers: headers.join("\n")
		});
		await this.serviceExecutor.post(ListUnsubscribeService, postData);
	}
	async loadAttachments(mail) {
		if (mail.attachments.length === 0) return [];
		const attachmentsListId = listIdPart(mail.attachments[0]);
		const attachmentElementIds = mail.attachments.map(elementIdPart);
		const bucketKey = mail.bucketKey;
		let ownerEncSessionKeyProvider;
		if (bucketKey) {
			const typeModel = await resolveTypeReference(FileTypeRef);
			const resolvedSessionKeys = await this.crypto.resolveWithBucketKey(assertNotNull(mail.bucketKey), mail, typeModel);
			ownerEncSessionKeyProvider = async (instanceElementId) => {
				const instanceSessionKey = assertNotNull(resolvedSessionKeys.instanceSessionKeys.find((instanceSessionKey$1) => instanceElementId === instanceSessionKey$1.instanceId));
				return {
					key: instanceSessionKey.symEncSessionKey,
					encryptingKeyVersion: Number(instanceSessionKey.symKeyVersion)
				};
			};
		}
		return await this.entityClient.loadMultiple(FileTypeRef, attachmentsListId, attachmentElementIds, ownerEncSessionKeyProvider);
	}
	/**
	* @param mail in case it is a mailDetailsBlob
	*/
	async loadMailDetailsBlob(mail) {
		if (mail.mailDetailsDraft != null) throw new ProgrammingError("not supported, must be mail details blob");
else {
			const mailDetailsBlobId = assertNotNull(mail.mailDetails);
			const mailDetailsBlobs = await this.entityClient.loadMultiple(MailDetailsBlobTypeRef, listIdPart(mailDetailsBlobId), [elementIdPart(mailDetailsBlobId)], this.keyProviderFromInstance(mail));
			if (mailDetailsBlobs.length === 0) throw new NotFoundError(`MailDetailsBlob ${mailDetailsBlobId}`);
			return mailDetailsBlobs[0].details;
		}
	}
	keyProviderFromInstance(mail) {
		return async () => ({
			key: assertNotNull(mail._ownerEncSessionKey),
			encryptingKeyVersion: Number(mail._ownerKeyVersion)
		});
	}
	/**
	* @param mail in case it is a mailDetailsDraft
	*/
	async loadMailDetailsDraft(mail) {
		if (mail.mailDetailsDraft == null) throw new ProgrammingError("not supported, must be mail details draft");
else {
			const detailsDraftId = assertNotNull(mail.mailDetailsDraft);
			const mailDetailsDrafts = await this.entityClient.loadMultiple(MailDetailsDraftTypeRef, listIdPart(detailsDraftId), [elementIdPart(detailsDraftId)], this.keyProviderFromInstance(mail));
			if (mailDetailsDrafts.length === 0) throw new NotFoundError(`MailDetailsDraft ${detailsDraftId}`);
			return mailDetailsDrafts[0].details;
		}
	}
	/**
	* Create a label (aka MailSet aka {@link MailFolder} of kind {@link MailSetKind.LABEL}) for the group {@param mailGroupId}.
	*/
	async createLabel(mailGroupId, labelData) {
		const mailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(mailGroupId);
		const sk = aes256RandomKey();
		const ownerEncSessionKey = encryptKeyWithVersionedKey(mailGroupKey, sk);
		await this.serviceExecutor.post(ManageLabelService, createManageLabelServicePostIn({
			ownerGroup: mailGroupId,
			ownerEncSessionKey: ownerEncSessionKey.key,
			ownerKeyVersion: String(ownerEncSessionKey.encryptingKeyVersion),
			data: createManageLabelServiceLabelData({
				name: labelData.name,
				color: labelData.color
			})
		}), { sessionKey: sk });
	}
	async updateLabel(label, name, color) {
		if (name !== label.name || color != label.color) {
			label.name = name;
			label.color = color;
			await this.entityClient.update(label);
		}
	}
	async deleteLabel(label) {
		await this.serviceExecutor.delete(ManageLabelService, createManageLabelServiceDeleteIn({ label: label._id }));
	}
	async applyLabels(mails, addedLabels, removedLabels) {
		const postIn = createApplyLabelServicePostIn({
			mails: mails.map((mail) => mail._id),
			addedLabels: addedLabels.map((label) => label._id),
			removedLabels: removedLabels.map((label) => label._id)
		});
		await this.serviceExecutor.post(ApplyLabelService, postIn);
	}
};
function phishingMarkerValue(type, value) {
	return type + murmurHash(value.replace(/\s/g, ""));
}
function parseUrl(link) {
	try {
		return new URL(link);
	} catch (e) {
		return null;
	}
}
function getUrlDomain(link) {
	const url = parseUrl(link);
	return url && url.hostname;
}
function recipientToDraftRecipient(recipient) {
	return createDraftRecipient({
		name: recipient.name ?? "",
		mailAddress: recipient.address
	});
}
function recipientToEncryptedMailAddress(recipient) {
	return createEncryptedMailAddress({
		name: recipient.name ?? "",
		address: recipient.address
	});
}
function validateMimeTypesForAttachments(attachments) {
	const regex = /^\w+\/[\w.+-]+?(;\s*[\w.+-]+=([\w.+-]+|"[\w\s,.+-]+"))*$/g;
	for (const attachment of attachments) if (isDataFile(attachment) || isFileReference(attachment)) {
		if (!attachment.mimeType.match(regex)) throw new ProgrammingError(`${attachment.mimeType} is not a correctly formatted mimetype (${attachment.name})`);
	}
}

//#endregion
export { MailFacade };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbEZhY2FkZS1jaHVuay5qcyIsIm5hbWVzIjpbInVzZXJGYWNhZGU6IFVzZXJGYWNhZGUiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImNyeXB0bzogQ3J5cHRvRmFjYWRlIiwic2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yIiwiYmxvYkZhY2FkZTogQmxvYkZhY2FkZSIsImZpbGVBcHA6IE5hdGl2ZUZpbGVBcHAiLCJsb2dpbkZhY2FkZTogTG9naW5GYWNhZGUiLCJrZXlMb2FkZXJGYWNhZGU6IEtleUxvYWRlckZhY2FkZSIsIm5hbWU6IHN0cmluZyIsInBhcmVudDogSWRUdXBsZSB8IG51bGwiLCJvd25lckdyb3VwSWQ6IElkIiwiZm9sZGVyOiBNYWlsRm9sZGVyIiwibmV3TmFtZTogc3RyaW5nIiwibmV3UGFyZW50OiBJZFR1cGxlIHwgbnVsbCIsIm1haWxzOiBJZFR1cGxlW10iLCJzb3VyY2VGb2xkZXI6IElkVHVwbGUiLCJ0YXJnZXRGb2xkZXI6IElkVHVwbGUiLCJtYWlsOiBNYWlsIiwicmVwb3J0VHlwZTogTWFpbFJlcG9ydFR5cGUiLCJtYWlsU2Vzc2lvbktleTogQWVzMTI4S2V5IiwiZm9sZGVyOiBJZFR1cGxlIiwicHJvdmlkZWRGaWxlczogQXR0YWNobWVudHMgfCBudWxsIiwiZXhpc3RpbmdGaWxlSWRzOiBJZFR1cGxlW10iLCJyZW1vdmVkQXR0YWNobWVudElkczogSWRUdXBsZVtdIiwiZXhpc3RpbmdGaWxlSWRzOiBSZWFkb25seUFycmF5PElkVHVwbGU+Iiwic2VuZGVyTWFpbEdyb3VwSWQ6IElkIiwibWFpbEdyb3VwS2V5OiBWZXJzaW9uZWRLZXkiLCJyZWZlcmVuY2VUb2tlbnM6IEFycmF5PEJsb2JSZWZlcmVuY2VUb2tlbldyYXBwZXI+IiwicmVmZXJlbmNlVG9rZW5zOiBCbG9iUmVmZXJlbmNlVG9rZW5XcmFwcGVyW10iLCJmaWxlU2Vzc2lvbktleTogQWVzS2V5IiwicHJvdmlkZWRGaWxlOiBEYXRhRmlsZSB8IEZpbGVSZWZlcmVuY2UiLCJkcmFmdDogTWFpbCIsInJlY2lwaWVudHM6IEFycmF5PFJlY2lwaWVudD4iLCJsYW5ndWFnZTogc3RyaW5nIiwib3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXI6IE93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyIiwibGlua3M6IEFycmF5PHtcblx0XHRcdGhyZWY6IHN0cmluZ1xuXHRcdFx0aW5uZXJIVE1MOiBzdHJpbmdcblx0XHR9PiIsImlkOiBJZFR1cGxlIiwiZ3JvdXBJZDogSWQiLCJ1bnJlYWRNYWlsczogbnVtYmVyIiwidHlwZTogUmVwb3J0ZWRNYWlsRmllbGRUeXBlIiwidmFsdWU6IHN0cmluZyIsImJ1Y2tldEtleTogQWVzS2V5Iiwic2VuZERyYWZ0RGF0YTogU2VuZERyYWZ0RGF0YSIsIm5vdEZvdW5kUmVjaXBpZW50czogc3RyaW5nW10iLCJjb250YWN0OiBDb250YWN0IHwgbnVsbCIsInJlY2lwaWVudE1haWxBZGRyZXNzOiBzdHJpbmciLCJleHRlcm5hbFVzZXJLZGZUeXBlOiBLZGZUeXBlIiwiZXh0ZXJuYWxVc2VyUHdLZXk6IEFlc0tleSIsInZlcmlmaWVyOiBVaW50OEFycmF5IiwiZXh0ZXJuYWxVc2VyUmVmZXJlbmNlOiBFeHRlcm5hbFVzZXJSZWZlcmVuY2UiLCJtYWlsQWRkcmVzczogc3RyaW5nIiwiZGF0YTogRW50aXR5VXBkYXRlW10iLCJtYXJrZXJzOiBSZXBvcnRlZE1haWxGaWVsZE1hcmtlcltdIiwiY2xlYW5lZE1haWxBZGRyZXNzOiBzdHJpbmciLCJ1c2VyOiBVc2VyIiwiZm9sZGVySWQ6IElkVHVwbGUiLCJtYWlsSWQ6IElkVHVwbGUiLCJyZWNpcGllbnQ6IHN0cmluZyIsImhlYWRlcnM6IHN0cmluZ1tdIiwib3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXI6IE93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyIHwgdW5kZWZpbmVkIiwiaW5zdGFuY2VFbGVtZW50SWQ6IElkIiwiaW5zdGFuY2VTZXNzaW9uS2V5IiwibWFpbEdyb3VwSWQ6IElkIiwibGFiZWxEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9IiwibGFiZWw6IE1haWxGb2xkZXIiLCJjb2xvcjogc3RyaW5nIiwibWFpbHM6IHJlYWRvbmx5IE1haWxbXSIsImFkZGVkTGFiZWxzOiByZWFkb25seSBNYWlsRm9sZGVyW10iLCJyZW1vdmVkTGFiZWxzOiByZWFkb25seSBNYWlsRm9sZGVyW10iLCJsaW5rOiBzdHJpbmciLCJyZWNpcGllbnQ6IFBhcnRpYWxSZWNpcGllbnQiLCJhdHRhY2htZW50czogQXR0YWNobWVudHMiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxGYWNhZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vLi4vY3J5cHRvL0NyeXB0b0ZhY2FkZS5qc1wiXG5pbXBvcnQge1xuXHRBcHBseUxhYmVsU2VydmljZSxcblx0RHJhZnRTZXJ2aWNlLFxuXHRFeHRlcm5hbFVzZXJTZXJ2aWNlLFxuXHRMaXN0VW5zdWJzY3JpYmVTZXJ2aWNlLFxuXHRNYWlsRm9sZGVyU2VydmljZSxcblx0TWFpbFNlcnZpY2UsXG5cdE1hbmFnZUxhYmVsU2VydmljZSxcblx0TW92ZU1haWxTZXJ2aWNlLFxuXHRSZXBvcnRNYWlsU2VydmljZSxcblx0U2VuZERyYWZ0U2VydmljZSxcbn0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7XG5cdEFyY2hpdmVEYXRhVHlwZSxcblx0Q29udmVyc2F0aW9uVHlwZSxcblx0Q291bnRlclR5cGUsXG5cdENyeXB0b1Byb3RvY29sVmVyc2lvbixcblx0REVGQVVMVF9LREZfVFlQRSxcblx0RW5jcnlwdGlvbkF1dGhTdGF0dXMsXG5cdEdyb3VwVHlwZSxcblx0S2RmVHlwZSxcblx0TWFpbEF1dGhlbnRpY2F0aW9uU3RhdHVzLFxuXHRNYWlsTWV0aG9kLFxuXHRNYWlsUmVwb3J0VHlwZSxcblx0T3BlcmF0aW9uVHlwZSxcblx0UGhpc2hpbmdNYXJrZXJTdGF0dXMsXG5cdFB1YmxpY0tleUlkZW50aWZpZXJUeXBlLFxuXHRSZXBvcnRlZE1haWxGaWVsZFR5cGUsXG5cdFNZU1RFTV9HUk9VUF9NQUlMX0FERFJFU1MsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHtcblx0Q29udGFjdCxcblx0Y3JlYXRlQXBwbHlMYWJlbFNlcnZpY2VQb3N0SW4sXG5cdGNyZWF0ZUF0dGFjaG1lbnRLZXlEYXRhLFxuXHRjcmVhdGVDcmVhdGVFeHRlcm5hbFVzZXJHcm91cERhdGEsXG5cdGNyZWF0ZUNyZWF0ZU1haWxGb2xkZXJEYXRhLFxuXHRjcmVhdGVEZWxldGVNYWlsRGF0YSxcblx0Y3JlYXRlRGVsZXRlTWFpbEZvbGRlckRhdGEsXG5cdGNyZWF0ZURyYWZ0QXR0YWNobWVudCxcblx0Y3JlYXRlRHJhZnRDcmVhdGVEYXRhLFxuXHRjcmVhdGVEcmFmdERhdGEsXG5cdGNyZWF0ZURyYWZ0UmVjaXBpZW50LFxuXHRjcmVhdGVEcmFmdFVwZGF0ZURhdGEsXG5cdGNyZWF0ZUVuY3J5cHRlZE1haWxBZGRyZXNzLFxuXHRjcmVhdGVFeHRlcm5hbFVzZXJEYXRhLFxuXHRjcmVhdGVMaXN0VW5zdWJzY3JpYmVEYXRhLFxuXHRjcmVhdGVNYW5hZ2VMYWJlbFNlcnZpY2VEZWxldGVJbixcblx0Y3JlYXRlTWFuYWdlTGFiZWxTZXJ2aWNlTGFiZWxEYXRhLFxuXHRjcmVhdGVNYW5hZ2VMYWJlbFNlcnZpY2VQb3N0SW4sXG5cdGNyZWF0ZU1vdmVNYWlsRGF0YSxcblx0Y3JlYXRlTmV3RHJhZnRBdHRhY2htZW50LFxuXHRjcmVhdGVSZXBvcnRNYWlsUG9zdERhdGEsXG5cdGNyZWF0ZVNlY3VyZUV4dGVybmFsUmVjaXBpZW50S2V5RGF0YSxcblx0Y3JlYXRlU2VuZERyYWZ0RGF0YSxcblx0Y3JlYXRlVXBkYXRlTWFpbEZvbGRlckRhdGEsXG5cdERyYWZ0QXR0YWNobWVudCxcblx0RHJhZnRSZWNpcGllbnQsXG5cdEVuY3J5cHRlZE1haWxBZGRyZXNzLFxuXHRGaWxlIGFzIFR1dGFub3RhRmlsZSxcblx0RmlsZVR5cGVSZWYsXG5cdEludGVybmFsUmVjaXBpZW50S2V5RGF0YSxcblx0SW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhVHlwZVJlZixcblx0TWFpbCxcblx0TWFpbERldGFpbHMsXG5cdE1haWxEZXRhaWxzQmxvYlR5cGVSZWYsXG5cdE1haWxEZXRhaWxzRHJhZnRUeXBlUmVmLFxuXHRNYWlsRm9sZGVyLFxuXHRNYWlsVHlwZVJlZixcblx0UmVwb3J0ZWRNYWlsRmllbGRNYXJrZXIsXG5cdFNlbmREcmFmdERhdGEsXG5cdFN5bUVuY0ludGVybmFsUmVjaXBpZW50S2V5RGF0YSxcblx0U3ltRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhVHlwZVJlZixcblx0VHV0YW5vdGFQcm9wZXJ0aWVzVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9lcnJvci9SZWNpcGllbnRzTm90Rm91bmRFcnJvci5qc1wiXG5pbXBvcnQgeyBOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHR5cGUgeyBFbnRpdHlVcGRhdGUsIEV4dGVybmFsVXNlclJlZmVyZW5jZSwgUHVibGljS2V5R2V0T3V0LCBVc2VyIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRCbG9iUmVmZXJlbmNlVG9rZW5XcmFwcGVyLFxuXHRjcmVhdGVQdWJsaWNLZXlHZXRJbixcblx0RXh0ZXJuYWxVc2VyUmVmZXJlbmNlVHlwZVJlZixcblx0R3JvdXBJbmZvVHlwZVJlZixcblx0R3JvdXBSb290VHlwZVJlZixcblx0R3JvdXBUeXBlUmVmLFxuXHRVc2VyVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRhZGRyZXNzRG9tYWluLFxuXHRhc3NlcnROb3ROdWxsLFxuXHRieXRlTGVuZ3RoLFxuXHRjb250YWlucyxcblx0ZGVmZXIsXG5cdGZyZXNoVmVyc2lvbmVkLFxuXHRpc0VtcHR5LFxuXHRpc05vdE51bGwsXG5cdGlzU2FtZVR5cGVSZWYsXG5cdGlzU2FtZVR5cGVSZWZCeUF0dHIsXG5cdG5vT3AsXG5cdG9mQ2xhc3MsXG5cdHByb21pc2VGaWx0ZXIsXG5cdHByb21pc2VNYXAsXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQmxvYkZhY2FkZSB9IGZyb20gXCIuL0Jsb2JGYWNhZGUuanNcIlxuaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlLCBpc0FwcCwgaXNEZXNrdG9wIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9FbnRpdHlDbGllbnQuanNcIlxuaW1wb3J0IHsgZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNGb3JHcm91cEluZm8sIGdldFVzZXJHcm91cE1lbWJlcnNoaXBzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi91dGlscy9Hcm91cFV0aWxzLmpzXCJcbmltcG9ydCB7IGNvbnRhaW5zSWQsIGVsZW1lbnRJZFBhcnQsIGdldEVsZW1lbnRJZCwgZ2V0TGV0SWQsIGlzU2FtZUlkLCBsaXN0SWRQYXJ0LCBzdHJpbmdUb0N1c3RvbUlkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBodG1sVG9UZXh0IH0gZnJvbSBcIi4uLy4uL3NlYXJjaC9JbmRleFV0aWxzLmpzXCJcbmltcG9ydCB7IE1haWxCb2R5VG9vTGFyZ2VFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZXJyb3IvTWFpbEJvZHlUb29MYXJnZUVycm9yLmpzXCJcbmltcG9ydCB7IFVOQ09NUFJFU1NFRF9NQVhfU0laRSB9IGZyb20gXCIuLi8uLi9Db21wcmVzc2lvbi5qc1wiXG5pbXBvcnQge1xuXHRBZXMxMjhLZXksXG5cdGFlczI1NlJhbmRvbUtleSxcblx0QWVzS2V5LFxuXHRiaXRBcnJheVRvVWludDhBcnJheSxcblx0Y3JlYXRlQXV0aFZlcmlmaWVyLFxuXHRkZWNyeXB0S2V5LFxuXHRlbmNyeXB0S2V5LFxuXHRnZW5lcmF0ZVJhbmRvbVNhbHQsXG5cdGtleVRvVWludDhBcnJheSxcblx0bXVybXVySGFzaCxcblx0cmFuZG9tLFxuXHRzaGEyNTZIYXNoLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0b1wiXG5pbXBvcnQgeyBEYXRhRmlsZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vRGF0YUZpbGUuanNcIlxuaW1wb3J0IHsgRmlsZVJlZmVyZW5jZSwgaXNEYXRhRmlsZSwgaXNGaWxlUmVmZXJlbmNlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi91dGlscy9GaWxlVXRpbHMuanNcIlxuaW1wb3J0IHsgQ291bnRlclNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvbW9uaXRvci9TZXJ2aWNlcy5qc1wiXG5pbXBvcnQgeyBQdWJsaWNLZXlTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9TZXJ2aWNlcy5qc1wiXG5pbXBvcnQgeyBJU2VydmljZUV4ZWN1dG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdC5qc1wiXG5pbXBvcnQgeyBjcmVhdGVXcml0ZUNvdW50ZXJEYXRhIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL21vbml0b3IvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgVXNlckZhY2FkZSB9IGZyb20gXCIuLi9Vc2VyRmFjYWRlLmpzXCJcbmltcG9ydCB7IFBhcnRpYWxSZWNpcGllbnQsIFJlY2lwaWVudCwgUmVjaXBpZW50TGlzdCwgUmVjaXBpZW50VHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vcmVjaXBpZW50cy9SZWNpcGllbnQuanNcIlxuaW1wb3J0IHsgTmF0aXZlRmlsZUFwcCB9IGZyb20gXCIuLi8uLi8uLi8uLi9uYXRpdmUvY29tbW9uL0ZpbGVBcHAuanNcIlxuaW1wb3J0IHsgTG9naW5GYWNhZGUgfSBmcm9tIFwiLi4vTG9naW5GYWNhZGUuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBPd25lckVuY1Nlc3Npb25LZXlQcm92aWRlciB9IGZyb20gXCIuLi8uLi9yZXN0L0VudGl0eVJlc3RDbGllbnQuanNcIlxuaW1wb3J0IHsgcmVzb2x2ZVR5cGVSZWZlcmVuY2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL0VudGl0eUZ1bmN0aW9ucy5qc1wiXG5pbXBvcnQgeyBLZXlMb2FkZXJGYWNhZGUgfSBmcm9tIFwiLi4vS2V5TG9hZGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGVuY3J5cHRCeXRlcywgZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXksIGVuY3J5cHRTdHJpbmcsIFZlcnNpb25lZEVuY3J5cHRlZEtleSwgVmVyc2lvbmVkS2V5IH0gZnJvbSBcIi4uLy4uL2NyeXB0by9DcnlwdG9XcmFwcGVyLmpzXCJcblxuYXNzZXJ0V29ya2VyT3JOb2RlKClcbnR5cGUgQXR0YWNobWVudHMgPSBSZWFkb25seUFycmF5PFR1dGFub3RhRmlsZSB8IERhdGFGaWxlIHwgRmlsZVJlZmVyZW5jZT5cblxuaW50ZXJmYWNlIENyZWF0ZURyYWZ0UGFyYW1zIHtcblx0c3ViamVjdDogc3RyaW5nXG5cdGJvZHlUZXh0OiBzdHJpbmdcblx0c2VuZGVyTWFpbEFkZHJlc3M6IHN0cmluZ1xuXHRzZW5kZXJOYW1lOiBzdHJpbmdcblx0dG9SZWNpcGllbnRzOiBSZWNpcGllbnRMaXN0XG5cdGNjUmVjaXBpZW50czogUmVjaXBpZW50TGlzdFxuXHRiY2NSZWNpcGllbnRzOiBSZWNpcGllbnRMaXN0XG5cdGNvbnZlcnNhdGlvblR5cGU6IENvbnZlcnNhdGlvblR5cGVcblx0cHJldmlvdXNNZXNzYWdlSWQ6IElkIHwgbnVsbFxuXHRhdHRhY2htZW50czogQXR0YWNobWVudHMgfCBudWxsXG5cdGNvbmZpZGVudGlhbDogYm9vbGVhblxuXHRyZXBseVRvczogUmVjaXBpZW50TGlzdFxuXHRtZXRob2Q6IE1haWxNZXRob2Rcbn1cblxuaW50ZXJmYWNlIFVwZGF0ZURyYWZ0UGFyYW1zIHtcblx0c3ViamVjdDogc3RyaW5nXG5cdGJvZHk6IHN0cmluZ1xuXHRzZW5kZXJNYWlsQWRkcmVzczogc3RyaW5nXG5cdHNlbmRlck5hbWU6IHN0cmluZ1xuXHR0b1JlY2lwaWVudHM6IFJlY2lwaWVudExpc3Rcblx0Y2NSZWNpcGllbnRzOiBSZWNpcGllbnRMaXN0XG5cdGJjY1JlY2lwaWVudHM6IFJlY2lwaWVudExpc3Rcblx0YXR0YWNobWVudHM6IEF0dGFjaG1lbnRzIHwgbnVsbFxuXHRjb25maWRlbnRpYWw6IGJvb2xlYW5cblx0ZHJhZnQ6IE1haWxcbn1cblxuZXhwb3J0IGNsYXNzIE1haWxGYWNhZGUge1xuXHRwcml2YXRlIHBoaXNoaW5nTWFya2VyczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KClcblx0cHJpdmF0ZSBkZWZlcnJlZERyYWZ0SWQ6IElkVHVwbGUgfCBudWxsID0gbnVsbCAvLyB0aGUgbWFpbCBpZCBvZiB0aGUgZHJhZnQgdGhhdCB3ZSBhcmUgd2FpdGluZyBmb3IgdG8gYmUgdXBkYXRlZCB2aWEgd2Vic29ja2V0XG5cdHByaXZhdGUgZGVmZXJyZWREcmFmdFVwZGF0ZTogUmVjb3JkPHN0cmluZywgYW55PiB8IG51bGwgPSBudWxsIC8vIHRoaXMgZGVmZXJyZWQgcHJvbWlzZSBpcyByZXNvbHZlZCBhcyBzb29uIGFzIHRoZSB1cGRhdGUgb2YgdGhlIGRyYWZ0IGlzIHJlY2VpdmVkXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSB1c2VyRmFjYWRlOiBVc2VyRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjcnlwdG86IENyeXB0b0ZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGJsb2JGYWNhZGU6IEJsb2JGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBmaWxlQXBwOiBOYXRpdmVGaWxlQXBwLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5GYWNhZGU6IExvZ2luRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkga2V5TG9hZGVyRmFjYWRlOiBLZXlMb2FkZXJGYWNhZGUsXG5cdCkge31cblxuXHRhc3luYyBjcmVhdGVNYWlsRm9sZGVyKG5hbWU6IHN0cmluZywgcGFyZW50OiBJZFR1cGxlIHwgbnVsbCwgb3duZXJHcm91cElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1haWxHcm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmdldEN1cnJlbnRTeW1Hcm91cEtleShvd25lckdyb3VwSWQpXG5cblx0XHRjb25zdCBzayA9IGFlczI1NlJhbmRvbUtleSgpXG5cdFx0Y29uc3Qgb3duZXJFbmNTZXNzaW9uS2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkobWFpbEdyb3VwS2V5LCBzaylcblx0XHRjb25zdCBuZXdGb2xkZXIgPSBjcmVhdGVDcmVhdGVNYWlsRm9sZGVyRGF0YSh7XG5cdFx0XHRmb2xkZXJOYW1lOiBuYW1lLFxuXHRcdFx0cGFyZW50Rm9sZGVyOiBwYXJlbnQsXG5cdFx0XHRvd25lckVuY1Nlc3Npb25LZXk6IG93bmVyRW5jU2Vzc2lvbktleS5rZXksXG5cdFx0XHRvd25lckdyb3VwOiBvd25lckdyb3VwSWQsXG5cdFx0XHRvd25lcktleVZlcnNpb246IG93bmVyRW5jU2Vzc2lvbktleS5lbmNyeXB0aW5nS2V5VmVyc2lvbi50b1N0cmluZygpLFxuXHRcdH0pXG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChNYWlsRm9sZGVyU2VydmljZSwgbmV3Rm9sZGVyLCB7IHNlc3Npb25LZXk6IHNrIH0pXG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlcyBhIG1haWwgZm9sZGVyJ3MgbmFtZSwgaWYgbmVlZGVkXG5cdCAqIEBwYXJhbSBuZXdOYW1lIC0gaWYgdGhpcyBpcyB0aGUgc2FtZSBhcyB0aGUgZm9sZGVyJ3MgY3VycmVudCBuYW1lLCBub3RoaW5nIGlzIGRvbmVcblx0ICovXG5cdGFzeW5jIHVwZGF0ZU1haWxGb2xkZXJOYW1lKGZvbGRlcjogTWFpbEZvbGRlciwgbmV3TmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKG5ld05hbWUgIT09IGZvbGRlci5uYW1lKSB7XG5cdFx0XHRmb2xkZXIubmFtZSA9IG5ld05hbWVcblx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnVwZGF0ZShmb2xkZXIpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgYSBtYWlsIGZvbGRlcidzIHBhcmVudCwgaWYgbmVlZGVkXG5cdCAqIEBwYXJhbSBuZXdQYXJlbnQgLSBpZiB0aGlzIGlzIHRoZSBzYW1lIGFzIHRoZSBmb2xkZXIncyBjdXJyZW50IHBhcmVudCwgbm90aGluZyBpcyBkb25lXG5cdCAqL1xuXHRhc3luYyB1cGRhdGVNYWlsRm9sZGVyUGFyZW50KGZvbGRlcjogTWFpbEZvbGRlciwgbmV3UGFyZW50OiBJZFR1cGxlIHwgbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmIChcblx0XHRcdChmb2xkZXIucGFyZW50Rm9sZGVyICE9IG51bGwgJiYgbmV3UGFyZW50ICE9IG51bGwgJiYgIWlzU2FtZUlkKGZvbGRlci5wYXJlbnRGb2xkZXIsIG5ld1BhcmVudCkpIHx8XG5cdFx0XHQoZm9sZGVyLnBhcmVudEZvbGRlciA9PSBudWxsICYmIG5ld1BhcmVudCAhPSBudWxsKSB8fFxuXHRcdFx0KGZvbGRlci5wYXJlbnRGb2xkZXIgIT0gbnVsbCAmJiBuZXdQYXJlbnQgPT0gbnVsbClcblx0XHQpIHtcblx0XHRcdGNvbnN0IHVwZGF0ZUZvbGRlciA9IGNyZWF0ZVVwZGF0ZU1haWxGb2xkZXJEYXRhKHtcblx0XHRcdFx0Zm9sZGVyOiBmb2xkZXIuX2lkLFxuXHRcdFx0XHRuZXdQYXJlbnQ6IG5ld1BhcmVudCxcblx0XHRcdH0pXG5cdFx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wdXQoTWFpbEZvbGRlclNlcnZpY2UsIHVwZGF0ZUZvbGRlcilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIGRyYWZ0IG1haWwuXG5cdCAqIEBwYXJhbSBib2R5VGV4dCBUaGUgYm9keVRleHQgb2YgdGhlIG1haWwgZm9ybWF0dGVkIGFzIEhUTUwuXG5cdCAqIEBwYXJhbSBwcmV2aW91c01lc3NhZ2VJZCBUaGUgaWQgb2YgdGhlIG1lc3NhZ2UgdGhhdCB0aGlzIG1haWwgaXMgYSByZXBseSBvciBmb3J3YXJkIHRvLiBOdWxsIGlmIHRoaXMgaXMgYSBuZXcgbWFpbC5cblx0ICogQHBhcmFtIGF0dGFjaG1lbnRzIFRoZSBmaWxlcyB0aGF0IHNoYWxsIGJlIGF0dGFjaGVkIHRvIHRoaXMgbWFpbCBvciBudWxsIGlmIG5vIGZpbGVzIHNoYWxsIGJlIGF0dGFjaGVkLiBUdXRhbm90YUZpbGVzIGFyZSBhbHJlYWR5IGV4aXNpbmcgb24gdGhlIHNlcnZlciwgRGF0YUZpbGVzIGFyZSBmaWxlcyBmcm9tIHRoZSBsb2NhbCBmaWxlIHN5c3RlbS4gQXR0ZW50aW9uOiB0aGUgRGF0YUZpbGUgY2xhc3MgaW5mb3JtYXRpb24gaXMgbG9zdFxuXHQgKiBAcGFyYW0gY29uZmlkZW50aWFsIFRydWUgaWYgdGhlIG1haWwgc2hhbGwgYmUgc2VudCBlbmQtdG8tZW5kIGVuY3J5cHRlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKi9cblx0YXN5bmMgY3JlYXRlRHJhZnQoe1xuXHRcdHN1YmplY3QsXG5cdFx0Ym9keVRleHQsXG5cdFx0c2VuZGVyTWFpbEFkZHJlc3MsXG5cdFx0c2VuZGVyTmFtZSxcblx0XHR0b1JlY2lwaWVudHMsXG5cdFx0Y2NSZWNpcGllbnRzLFxuXHRcdGJjY1JlY2lwaWVudHMsXG5cdFx0Y29udmVyc2F0aW9uVHlwZSxcblx0XHRwcmV2aW91c01lc3NhZ2VJZCxcblx0XHRhdHRhY2htZW50cyxcblx0XHRjb25maWRlbnRpYWwsXG5cdFx0cmVwbHlUb3MsXG5cdFx0bWV0aG9kLFxuXHR9OiBDcmVhdGVEcmFmdFBhcmFtcyk6IFByb21pc2U8TWFpbD4ge1xuXHRcdGlmIChieXRlTGVuZ3RoKGJvZHlUZXh0KSA+IFVOQ09NUFJFU1NFRF9NQVhfU0laRSkge1xuXHRcdFx0dGhyb3cgbmV3IE1haWxCb2R5VG9vTGFyZ2VFcnJvcihgQ2FuJ3QgdXBkYXRlIGRyYWZ0LCBtYWlsIGJvZHkgdG9vIGxhcmdlICgke2J5dGVMZW5ndGgoYm9keVRleHQpfSlgKVxuXHRcdH1cblxuXHRcdGNvbnN0IHNlbmRlck1haWxHcm91cElkID0gYXdhaXQgdGhpcy5fZ2V0TWFpbEdyb3VwSWRGb3JNYWlsQWRkcmVzcyh0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCksIHNlbmRlck1haWxBZGRyZXNzKVxuXHRcdGNvbnN0IG1haWxHcm91cEtleSA9IGF3YWl0IHRoaXMua2V5TG9hZGVyRmFjYWRlLmdldEN1cnJlbnRTeW1Hcm91cEtleShzZW5kZXJNYWlsR3JvdXBJZClcblxuXHRcdGNvbnN0IHNrID0gYWVzMjU2UmFuZG9tS2V5KClcblx0XHRjb25zdCBvd25lckVuY1Nlc3Npb25LZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShtYWlsR3JvdXBLZXksIHNrKVxuXHRcdGNvbnN0IHNlcnZpY2UgPSBjcmVhdGVEcmFmdENyZWF0ZURhdGEoe1xuXHRcdFx0cHJldmlvdXNNZXNzYWdlSWQ6IHByZXZpb3VzTWVzc2FnZUlkLFxuXHRcdFx0Y29udmVyc2F0aW9uVHlwZTogY29udmVyc2F0aW9uVHlwZSxcblx0XHRcdG93bmVyRW5jU2Vzc2lvbktleTogb3duZXJFbmNTZXNzaW9uS2V5LmtleSxcblx0XHRcdGRyYWZ0RGF0YTogY3JlYXRlRHJhZnREYXRhKHtcblx0XHRcdFx0c3ViamVjdCxcblx0XHRcdFx0Y29tcHJlc3NlZEJvZHlUZXh0OiBib2R5VGV4dCxcblx0XHRcdFx0c2VuZGVyTWFpbEFkZHJlc3MsXG5cdFx0XHRcdHNlbmRlck5hbWUsXG5cdFx0XHRcdGNvbmZpZGVudGlhbCxcblx0XHRcdFx0bWV0aG9kLFxuXHRcdFx0XHR0b1JlY2lwaWVudHM6IHRvUmVjaXBpZW50cy5tYXAocmVjaXBpZW50VG9EcmFmdFJlY2lwaWVudCksXG5cdFx0XHRcdGNjUmVjaXBpZW50czogY2NSZWNpcGllbnRzLm1hcChyZWNpcGllbnRUb0RyYWZ0UmVjaXBpZW50KSxcblx0XHRcdFx0YmNjUmVjaXBpZW50czogYmNjUmVjaXBpZW50cy5tYXAocmVjaXBpZW50VG9EcmFmdFJlY2lwaWVudCksXG5cdFx0XHRcdHJlcGx5VG9zOiByZXBseVRvcy5tYXAocmVjaXBpZW50VG9FbmNyeXB0ZWRNYWlsQWRkcmVzcyksXG5cdFx0XHRcdGFkZGVkQXR0YWNobWVudHM6IGF3YWl0IHRoaXMuX2NyZWF0ZUFkZGVkQXR0YWNobWVudHMoYXR0YWNobWVudHMsIFtdLCBzZW5kZXJNYWlsR3JvdXBJZCwgbWFpbEdyb3VwS2V5KSxcblx0XHRcdFx0Ym9keVRleHQ6IFwiXCIsXG5cdFx0XHRcdHJlbW92ZWRBdHRhY2htZW50czogW10sXG5cdFx0XHR9KSxcblx0XHRcdG93bmVyS2V5VmVyc2lvbjogb3duZXJFbmNTZXNzaW9uS2V5LmVuY3J5cHRpbmdLZXlWZXJzaW9uLnRvU3RyaW5nKCksXG5cdFx0fSlcblx0XHRjb25zdCBjcmVhdGVEcmFmdFJldHVybiA9IGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoRHJhZnRTZXJ2aWNlLCBzZXJ2aWNlLCB7IHNlc3Npb25LZXk6IHNrIH0pXG5cdFx0cmV0dXJuIHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoTWFpbFR5cGVSZWYsIGNyZWF0ZURyYWZ0UmV0dXJuLmRyYWZ0KVxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgYSBkcmFmdCBtYWlsLlxuXHQgKiBAcGFyYW0gc3ViamVjdCBUaGUgc3ViamVjdCBvZiB0aGUgbWFpbC5cblx0ICogQHBhcmFtIGJvZHkgVGhlIGJvZHkgdGV4dCBvZiB0aGUgbWFpbC5cblx0ICogQHBhcmFtIHNlbmRlck1haWxBZGRyZXNzIFRoZSBzZW5kZXJzIG1haWwgYWRkcmVzcy5cblx0ICogQHBhcmFtIHNlbmRlck5hbWUgVGhlIG5hbWUgb2YgdGhlIHNlbmRlciB0aGF0IGlzIHNlbnQgdG9nZXRoZXIgd2l0aCB0aGUgbWFpbCBhZGRyZXNzIG9mIHRoZSBzZW5kZXIuXG5cdCAqIEBwYXJhbSB0b1JlY2lwaWVudHMgVGhlIHJlY2lwaWVudHMgdGhlIG1haWwgc2hhbGwgYmUgc2VudCB0by5cblx0ICogQHBhcmFtIGNjUmVjaXBpZW50cyBUaGUgcmVjaXBpZW50cyB0aGUgbWFpbCBzaGFsbCBiZSBzZW50IHRvIGluIGNjLlxuXHQgKiBAcGFyYW0gYmNjUmVjaXBpZW50cyBUaGUgcmVjaXBpZW50cyB0aGUgbWFpbCBzaGFsbCBiZSBzZW50IHRvIGluIGJjYy5cblx0ICogQHBhcmFtIGF0dGFjaG1lbnRzIFRoZSBmaWxlcyB0aGF0IHNoYWxsIGJlIGF0dGFjaGVkIHRvIHRoaXMgbWFpbCBvciBudWxsIGlmIHRoZSBjdXJyZW50IGF0dGFjaG1lbnRzIHNoYWxsIG5vdCBiZSBjaGFuZ2VkLlxuXHQgKiBAcGFyYW0gY29uZmlkZW50aWFsIFRydWUgaWYgdGhlIG1haWwgc2hhbGwgYmUgc2VudCBlbmQtdG8tZW5kIGVuY3J5cHRlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKiBAcGFyYW0gZHJhZnQgVGhlIGRyYWZ0IHRvIHVwZGF0ZS5cblx0ICogQHJldHVybiBUaGUgdXBkYXRlZCBkcmFmdC4gUmVqZWN0ZWQgd2l0aCBUb29NYW55UmVxdWVzdHNFcnJvciBpZiB0aGUgbnVtYmVyIGFsbG93ZWQgbWFpbHMgd2FzIGV4Y2VlZGVkLCBBY2Nlc3NCbG9ja2VkRXJyb3IgaWYgdGhlIGN1c3RvbWVyIGlzIG5vdCBhbGxvd2VkIHRvIHNlbmQgZW1haWxzIGN1cnJlbnRseSBiZWNhdXNlIGhlIGlzIG1hcmtlZCBmb3IgYXBwcm92YWwuXG5cdCAqL1xuXHRhc3luYyB1cGRhdGVEcmFmdCh7XG5cdFx0c3ViamVjdCxcblx0XHRib2R5LFxuXHRcdHNlbmRlck1haWxBZGRyZXNzLFxuXHRcdHNlbmRlck5hbWUsXG5cdFx0dG9SZWNpcGllbnRzLFxuXHRcdGNjUmVjaXBpZW50cyxcblx0XHRiY2NSZWNpcGllbnRzLFxuXHRcdGF0dGFjaG1lbnRzLFxuXHRcdGNvbmZpZGVudGlhbCxcblx0XHRkcmFmdCxcblx0fTogVXBkYXRlRHJhZnRQYXJhbXMpOiBQcm9taXNlPE1haWw+IHtcblx0XHRpZiAoYnl0ZUxlbmd0aChib2R5KSA+IFVOQ09NUFJFU1NFRF9NQVhfU0laRSkge1xuXHRcdFx0dGhyb3cgbmV3IE1haWxCb2R5VG9vTGFyZ2VFcnJvcihgQ2FuJ3QgdXBkYXRlIGRyYWZ0LCBtYWlsIGJvZHkgdG9vIGxhcmdlICgke2J5dGVMZW5ndGgoYm9keSl9KWApXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2VuZGVyTWFpbEdyb3VwSWQgPSBhd2FpdCB0aGlzLl9nZXRNYWlsR3JvdXBJZEZvck1haWxBZGRyZXNzKHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKSwgc2VuZGVyTWFpbEFkZHJlc3MpXG5cblx0XHRjb25zdCBtYWlsR3JvdXBLZXlWZXJzaW9uID0gTnVtYmVyKGRyYWZ0Ll9vd25lcktleVZlcnNpb24gPz8gMClcblx0XHRjb25zdCBtYWlsR3JvdXBLZXkgPSB7XG5cdFx0XHR2ZXJzaW9uOiBtYWlsR3JvdXBLZXlWZXJzaW9uLFxuXHRcdFx0b2JqZWN0OiBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkoc2VuZGVyTWFpbEdyb3VwSWQsIG1haWxHcm91cEtleVZlcnNpb24pLFxuXHRcdH1cblx0XHRjb25zdCBjdXJyZW50QXR0YWNobWVudHMgPSBhd2FpdCB0aGlzLmdldEF0dGFjaG1lbnRJZHMoZHJhZnQpXG5cdFx0Y29uc3QgcmVwbHlUb3MgPSBhd2FpdCB0aGlzLmdldFJlcGx5VG9zKGRyYWZ0KVxuXG5cdFx0Y29uc3Qgc2sgPSBkZWNyeXB0S2V5KG1haWxHcm91cEtleS5vYmplY3QsIGFzc2VydE5vdE51bGwoZHJhZnQuX293bmVyRW5jU2Vzc2lvbktleSkpXG5cdFx0Y29uc3Qgc2VydmljZSA9IGNyZWF0ZURyYWZ0VXBkYXRlRGF0YSh7XG5cdFx0XHRkcmFmdDogZHJhZnQuX2lkLFxuXHRcdFx0ZHJhZnREYXRhOiBjcmVhdGVEcmFmdERhdGEoe1xuXHRcdFx0XHRzdWJqZWN0OiBzdWJqZWN0LFxuXHRcdFx0XHRjb21wcmVzc2VkQm9keVRleHQ6IGJvZHksXG5cdFx0XHRcdHNlbmRlck1haWxBZGRyZXNzOiBzZW5kZXJNYWlsQWRkcmVzcyxcblx0XHRcdFx0c2VuZGVyTmFtZTogc2VuZGVyTmFtZSxcblx0XHRcdFx0Y29uZmlkZW50aWFsOiBjb25maWRlbnRpYWwsXG5cdFx0XHRcdG1ldGhvZDogZHJhZnQubWV0aG9kLFxuXHRcdFx0XHR0b1JlY2lwaWVudHM6IHRvUmVjaXBpZW50cy5tYXAocmVjaXBpZW50VG9EcmFmdFJlY2lwaWVudCksXG5cdFx0XHRcdGNjUmVjaXBpZW50czogY2NSZWNpcGllbnRzLm1hcChyZWNpcGllbnRUb0RyYWZ0UmVjaXBpZW50KSxcblx0XHRcdFx0YmNjUmVjaXBpZW50czogYmNjUmVjaXBpZW50cy5tYXAocmVjaXBpZW50VG9EcmFmdFJlY2lwaWVudCksXG5cdFx0XHRcdHJlcGx5VG9zOiByZXBseVRvcyxcblx0XHRcdFx0cmVtb3ZlZEF0dGFjaG1lbnRzOiB0aGlzLl9nZXRSZW1vdmVkQXR0YWNobWVudHMoYXR0YWNobWVudHMsIGN1cnJlbnRBdHRhY2htZW50cyksXG5cdFx0XHRcdGFkZGVkQXR0YWNobWVudHM6IGF3YWl0IHRoaXMuX2NyZWF0ZUFkZGVkQXR0YWNobWVudHMoYXR0YWNobWVudHMsIGN1cnJlbnRBdHRhY2htZW50cywgc2VuZGVyTWFpbEdyb3VwSWQsIG1haWxHcm91cEtleSksXG5cdFx0XHRcdGJvZHlUZXh0OiBcIlwiLFxuXHRcdFx0fSksXG5cdFx0fSlcblx0XHR0aGlzLmRlZmVycmVkRHJhZnRJZCA9IGRyYWZ0Ll9pZFxuXHRcdC8vIHdlIGhhdmUgdG8gd2FpdCBmb3IgdGhlIHVwZGF0ZWQgbWFpbCBiZWNhdXNlIHNlbmRNYWlsKCkgbWlnaHQgYmUgY2FsbGVkIHJpZ2h0IGFmdGVyIHRoaXMgdXBkYXRlXG5cdFx0dGhpcy5kZWZlcnJlZERyYWZ0VXBkYXRlID0gZGVmZXIoKVxuXHRcdC8vIHVzZSBhIGxvY2FsIHJlZmVyZW5jZSBoZXJlIGJlY2F1c2UgdGhpcy5fZGVmZXJyZWREcmFmdFVwZGF0ZSBpcyBzZXQgdG8gbnVsbCB3aGVuIHRoZSBldmVudCBpcyByZWNlaXZlZCBhc3luY1xuXHRcdGNvbnN0IGRlZmVycmVkVXBkYXRlUHJvbWlzZVdyYXBwZXIgPSB0aGlzLmRlZmVycmVkRHJhZnRVcGRhdGVcblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wdXQoRHJhZnRTZXJ2aWNlLCBzZXJ2aWNlLCB7IHNlc3Npb25LZXk6IHNrIH0pXG5cdFx0cmV0dXJuIGRlZmVycmVkVXBkYXRlUHJvbWlzZVdyYXBwZXIucHJvbWlzZVxuXHR9XG5cblx0YXN5bmMgbW92ZU1haWxzKG1haWxzOiBJZFR1cGxlW10sIHNvdXJjZUZvbGRlcjogSWRUdXBsZSwgdGFyZ2V0Rm9sZGVyOiBJZFR1cGxlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChNb3ZlTWFpbFNlcnZpY2UsIGNyZWF0ZU1vdmVNYWlsRGF0YSh7IG1haWxzLCBzb3VyY2VGb2xkZXIsIHRhcmdldEZvbGRlciB9KSlcblx0fVxuXG5cdGFzeW5jIHJlcG9ydE1haWwobWFpbDogTWFpbCwgcmVwb3J0VHlwZTogTWFpbFJlcG9ydFR5cGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBtYWlsU2Vzc2lvbktleTogQWVzMTI4S2V5ID0gYXNzZXJ0Tm90TnVsbChhd2FpdCB0aGlzLmNyeXB0by5yZXNvbHZlU2Vzc2lvbktleUZvckluc3RhbmNlKG1haWwpKVxuXHRcdGNvbnN0IHBvc3REYXRhID0gY3JlYXRlUmVwb3J0TWFpbFBvc3REYXRhKHtcblx0XHRcdG1haWxJZDogbWFpbC5faWQsXG5cdFx0XHRtYWlsU2Vzc2lvbktleTogYml0QXJyYXlUb1VpbnQ4QXJyYXkobWFpbFNlc3Npb25LZXkpLFxuXHRcdFx0cmVwb3J0VHlwZSxcblx0XHR9KVxuXHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoUmVwb3J0TWFpbFNlcnZpY2UsIHBvc3REYXRhKVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlTWFpbHMobWFpbHM6IElkVHVwbGVbXSwgZm9sZGVyOiBJZFR1cGxlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZGVsZXRlTWFpbERhdGEgPSBjcmVhdGVEZWxldGVNYWlsRGF0YSh7XG5cdFx0XHRtYWlscyxcblx0XHRcdGZvbGRlcixcblx0XHR9KVxuXHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLmRlbGV0ZShNYWlsU2VydmljZSwgZGVsZXRlTWFpbERhdGEpXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhbGwgaWRzIG9mIHRoZSBmaWxlcyB0aGF0IGhhdmUgYmVlbiByZW1vdmVkLCBpLmUuIHRoYXQgYXJlIGNvbnRhaW5lZCBpbiB0aGUgZXhpc3RpbmdGaWxlSWRzIGJ1dCBub3QgaW4gdGhlIHByb3ZpZGVkIGZpbGVzXG5cdCAqL1xuXHRfZ2V0UmVtb3ZlZEF0dGFjaG1lbnRzKHByb3ZpZGVkRmlsZXM6IEF0dGFjaG1lbnRzIHwgbnVsbCwgZXhpc3RpbmdGaWxlSWRzOiBJZFR1cGxlW10pOiBJZFR1cGxlW10ge1xuXHRcdGNvbnN0IHJlbW92ZWRBdHRhY2htZW50SWRzOiBJZFR1cGxlW10gPSBbXVxuXG5cdFx0aWYgKHByb3ZpZGVkRmlsZXMgIT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgYXR0YWNobWVudHMgPSBwcm92aWRlZEZpbGVzXG5cdFx0XHQvLyBjaGVjayB3aGljaCBhdHRhY2htZW50cyBoYXZlIGJlZW4gcmVtb3ZlZFxuXHRcdFx0Zm9yIChjb25zdCBmaWxlSWQgb2YgZXhpc3RpbmdGaWxlSWRzKSB7XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHQhYXR0YWNobWVudHMuc29tZShcblx0XHRcdFx0XHRcdChhdHRhY2htZW50KSA9PiBhdHRhY2htZW50Ll90eXBlICE9PSBcIkRhdGFGaWxlXCIgJiYgYXR0YWNobWVudC5fdHlwZSAhPT0gXCJGaWxlUmVmZXJlbmNlXCIgJiYgaXNTYW1lSWQoZ2V0TGV0SWQoYXR0YWNobWVudCksIGZpbGVJZCksXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRyZW1vdmVkQXR0YWNobWVudElkcy5wdXNoKGZpbGVJZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiByZW1vdmVkQXR0YWNobWVudElkc1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwbG9hZHMgdGhlIGdpdmVuIGRhdGEgZmlsZXMgb3Igc2V0cyB0aGUgZmlsZSBpZiBpdCBpcyBhbHJlYWR5IGV4aXN0aW5nIGZpbGVzIChlLmcuIGZvcndhcmRlZCBmaWxlcykgYW5kIHJldHVybnMgYWxsIERyYWZ0QXR0YWNobWVudHNcblx0ICovXG5cdGFzeW5jIF9jcmVhdGVBZGRlZEF0dGFjaG1lbnRzKFxuXHRcdHByb3ZpZGVkRmlsZXM6IEF0dGFjaG1lbnRzIHwgbnVsbCxcblx0XHRleGlzdGluZ0ZpbGVJZHM6IFJlYWRvbmx5QXJyYXk8SWRUdXBsZT4sXG5cdFx0c2VuZGVyTWFpbEdyb3VwSWQ6IElkLFxuXHRcdG1haWxHcm91cEtleTogVmVyc2lvbmVkS2V5LFxuXHQpOiBQcm9taXNlPERyYWZ0QXR0YWNobWVudFtdPiB7XG5cdFx0aWYgKHByb3ZpZGVkRmlsZXMgPT0gbnVsbCB8fCBwcm92aWRlZEZpbGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdXG5cblx0XHQvLyBWZXJpZnkgbWltZSB0eXBlcyBhcmUgY29ycmVjdCBiZWZvcmUgdXBsb2FkaW5nXG5cdFx0dmFsaWRhdGVNaW1lVHlwZXNGb3JBdHRhY2htZW50cyhwcm92aWRlZEZpbGVzKVxuXG5cdFx0cmV0dXJuIHByb21pc2VNYXAocHJvdmlkZWRGaWxlcywgYXN5bmMgKHByb3ZpZGVkRmlsZSkgPT4ge1xuXHRcdFx0Ly8gY2hlY2sgaWYgdGhpcyBpcyBhIG5ldyBhdHRhY2htZW50IG9yIGFuIGV4aXN0aW5nIG9uZVxuXHRcdFx0aWYgKGlzRGF0YUZpbGUocHJvdmlkZWRGaWxlKSkge1xuXHRcdFx0XHQvLyB1c2VyIGFkZGVkIGF0dGFjaG1lbnRcblx0XHRcdFx0Y29uc3QgZmlsZVNlc3Npb25LZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdFx0XHRsZXQgcmVmZXJlbmNlVG9rZW5zOiBBcnJheTxCbG9iUmVmZXJlbmNlVG9rZW5XcmFwcGVyPlxuXHRcdFx0XHRpZiAoaXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSkge1xuXHRcdFx0XHRcdGNvbnN0IHsgbG9jYXRpb24gfSA9IGF3YWl0IHRoaXMuZmlsZUFwcC53cml0ZURhdGFGaWxlKHByb3ZpZGVkRmlsZSlcblx0XHRcdFx0XHRyZWZlcmVuY2VUb2tlbnMgPSBhd2FpdCB0aGlzLmJsb2JGYWNhZGUuZW5jcnlwdEFuZFVwbG9hZE5hdGl2ZShBcmNoaXZlRGF0YVR5cGUuQXR0YWNobWVudHMsIGxvY2F0aW9uLCBzZW5kZXJNYWlsR3JvdXBJZCwgZmlsZVNlc3Npb25LZXkpXG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5maWxlQXBwLmRlbGV0ZUZpbGUobG9jYXRpb24pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVmZXJlbmNlVG9rZW5zID0gYXdhaXQgdGhpcy5ibG9iRmFjYWRlLmVuY3J5cHRBbmRVcGxvYWQoQXJjaGl2ZURhdGFUeXBlLkF0dGFjaG1lbnRzLCBwcm92aWRlZEZpbGUuZGF0YSwgc2VuZGVyTWFpbEdyb3VwSWQsIGZpbGVTZXNzaW9uS2V5KVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0aGlzLmNyZWF0ZUFuZEVuY3J5cHREcmFmdEF0dGFjaG1lbnQocmVmZXJlbmNlVG9rZW5zLCBmaWxlU2Vzc2lvbktleSwgcHJvdmlkZWRGaWxlLCBtYWlsR3JvdXBLZXkpXG5cdFx0XHR9IGVsc2UgaWYgKGlzRmlsZVJlZmVyZW5jZShwcm92aWRlZEZpbGUpKSB7XG5cdFx0XHRcdGNvbnN0IGZpbGVTZXNzaW9uS2V5ID0gYWVzMjU2UmFuZG9tS2V5KClcblx0XHRcdFx0Y29uc3QgcmVmZXJlbmNlVG9rZW5zID0gYXdhaXQgdGhpcy5ibG9iRmFjYWRlLmVuY3J5cHRBbmRVcGxvYWROYXRpdmUoXG5cdFx0XHRcdFx0QXJjaGl2ZURhdGFUeXBlLkF0dGFjaG1lbnRzLFxuXHRcdFx0XHRcdHByb3ZpZGVkRmlsZS5sb2NhdGlvbixcblx0XHRcdFx0XHRzZW5kZXJNYWlsR3JvdXBJZCxcblx0XHRcdFx0XHRmaWxlU2Vzc2lvbktleSxcblx0XHRcdFx0KVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5jcmVhdGVBbmRFbmNyeXB0RHJhZnRBdHRhY2htZW50KHJlZmVyZW5jZVRva2VucywgZmlsZVNlc3Npb25LZXksIHByb3ZpZGVkRmlsZSwgbWFpbEdyb3VwS2V5KVxuXHRcdFx0fSBlbHNlIGlmICghY29udGFpbnNJZChleGlzdGluZ0ZpbGVJZHMsIGdldExldElkKHByb3ZpZGVkRmlsZSkpKSB7XG5cdFx0XHRcdC8vIGZvcndhcmRlZCBhdHRhY2htZW50IHdoaWNoIHdhcyBub3QgaW4gdGhlIGRyYWZ0IGJlZm9yZVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5jcnlwdG8ucmVzb2x2ZVNlc3Npb25LZXlGb3JJbnN0YW5jZShwcm92aWRlZEZpbGUpLnRoZW4oKGZpbGVTZXNzaW9uS2V5KSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgc2Vzc2lvbktleSA9IGFzc2VydE5vdE51bGwoZmlsZVNlc3Npb25LZXksIFwiZmlsZXNlc3Npb25rZXkgd2FzIG5vdCByZXNvbHZlZFwiKVxuXHRcdFx0XHRcdGNvbnN0IG93bmVyRW5jRmlsZVNlc3Npb25LZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShtYWlsR3JvdXBLZXksIHNlc3Npb25LZXkpXG5cdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudCA9IGNyZWF0ZURyYWZ0QXR0YWNobWVudCh7XG5cdFx0XHRcdFx0XHRleGlzdGluZ0ZpbGU6IGdldExldElkKHByb3ZpZGVkRmlsZSksXG5cdFx0XHRcdFx0XHRvd25lckVuY0ZpbGVTZXNzaW9uS2V5OiBvd25lckVuY0ZpbGVTZXNzaW9uS2V5LmtleSxcblx0XHRcdFx0XHRcdG5ld0ZpbGU6IG51bGwsXG5cdFx0XHRcdFx0XHRvd25lcktleVZlcnNpb246IG93bmVyRW5jRmlsZVNlc3Npb25LZXkuZW5jcnlwdGluZ0tleVZlcnNpb24udG9TdHJpbmcoKSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdHJldHVybiBhdHRhY2htZW50XG5cdFx0XHRcdH0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fVxuXHRcdH0pIC8vIGRpc2FibGUgY29uY3VycmVudCBmaWxlIHVwbG9hZCB0byBhdm9pZCB0aW1lb3V0IGJlY2F1c2Ugb2YgbWlzc2luZyBwcm9ncmVzcyBldmVudHMgb24gRmlyZWZveC5cblx0XHRcdC50aGVuKChhdHRhY2htZW50cykgPT4gYXR0YWNobWVudHMuZmlsdGVyKGlzTm90TnVsbCkpXG5cdFx0XHQudGhlbigoaXQpID0+IHtcblx0XHRcdFx0Ly8gb25seSBkZWxldGUgdGhlIHRlbXBvcmFyeSBmaWxlcyBhZnRlciBhbGwgYXR0YWNobWVudHMgaGF2ZSBiZWVuIHVwbG9hZGVkXG5cdFx0XHRcdGlmIChpc0FwcCgpKSB7XG5cdFx0XHRcdFx0dGhpcy5maWxlQXBwLmNsZWFyRmlsZURhdGEoKS5jYXRjaCgoZSkgPT4gY29uc29sZS53YXJuKFwiRmFpbGVkIHRvIGNsZWFyIGZpbGVzXCIsIGUpKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGl0XG5cdFx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVBbmRFbmNyeXB0RHJhZnRBdHRhY2htZW50KFxuXHRcdHJlZmVyZW5jZVRva2VuczogQmxvYlJlZmVyZW5jZVRva2VuV3JhcHBlcltdLFxuXHRcdGZpbGVTZXNzaW9uS2V5OiBBZXNLZXksXG5cdFx0cHJvdmlkZWRGaWxlOiBEYXRhRmlsZSB8IEZpbGVSZWZlcmVuY2UsXG5cdFx0bWFpbEdyb3VwS2V5OiBWZXJzaW9uZWRLZXksXG5cdCk6IERyYWZ0QXR0YWNobWVudCB7XG5cdFx0Y29uc3Qgb3duZXJFbmNGaWxlU2Vzc2lvbktleSA9IGVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KG1haWxHcm91cEtleSwgZmlsZVNlc3Npb25LZXkpXG5cdFx0cmV0dXJuIGNyZWF0ZURyYWZ0QXR0YWNobWVudCh7XG5cdFx0XHRuZXdGaWxlOiBjcmVhdGVOZXdEcmFmdEF0dGFjaG1lbnQoe1xuXHRcdFx0XHRlbmNGaWxlTmFtZTogZW5jcnlwdFN0cmluZyhmaWxlU2Vzc2lvbktleSwgcHJvdmlkZWRGaWxlLm5hbWUpLFxuXHRcdFx0XHRlbmNNaW1lVHlwZTogZW5jcnlwdFN0cmluZyhmaWxlU2Vzc2lvbktleSwgcHJvdmlkZWRGaWxlLm1pbWVUeXBlKSxcblx0XHRcdFx0cmVmZXJlbmNlVG9rZW5zOiByZWZlcmVuY2VUb2tlbnMsXG5cdFx0XHRcdGVuY0NpZDogcHJvdmlkZWRGaWxlLmNpZCA9PSBudWxsID8gbnVsbCA6IGVuY3J5cHRTdHJpbmcoZmlsZVNlc3Npb25LZXksIHByb3ZpZGVkRmlsZS5jaWQpLFxuXHRcdFx0fSksXG5cdFx0XHRvd25lckVuY0ZpbGVTZXNzaW9uS2V5OiBvd25lckVuY0ZpbGVTZXNzaW9uS2V5LmtleSxcblx0XHRcdG93bmVyS2V5VmVyc2lvbjogb3duZXJFbmNGaWxlU2Vzc2lvbktleS5lbmNyeXB0aW5nS2V5VmVyc2lvbi50b1N0cmluZygpLFxuXHRcdFx0ZXhpc3RpbmdGaWxlOiBudWxsLFxuXHRcdH0pXG5cdH1cblxuXHRhc3luYyBzZW5kRHJhZnQoZHJhZnQ6IE1haWwsIHJlY2lwaWVudHM6IEFycmF5PFJlY2lwaWVudD4sIGxhbmd1YWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBzZW5kZXJNYWlsR3JvdXBJZCA9IGF3YWl0IHRoaXMuX2dldE1haWxHcm91cElkRm9yTWFpbEFkZHJlc3ModGhpcy51c2VyRmFjYWRlLmdldExvZ2dlZEluVXNlcigpLCBkcmFmdC5zZW5kZXIuYWRkcmVzcylcblx0XHRjb25zdCBidWNrZXRLZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdGNvbnN0IHNlbmREcmFmdERhdGEgPSBjcmVhdGVTZW5kRHJhZnREYXRhKHtcblx0XHRcdGxhbmd1YWdlOiBsYW5ndWFnZSxcblx0XHRcdG1haWw6IGRyYWZ0Ll9pZCxcblx0XHRcdG1haWxTZXNzaW9uS2V5OiBudWxsLFxuXHRcdFx0YXR0YWNobWVudEtleURhdGE6IFtdLFxuXHRcdFx0Y2FsZW5kYXJNZXRob2Q6IGZhbHNlLFxuXHRcdFx0aW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhOiBbXSxcblx0XHRcdHBsYWludGV4dDogZmFsc2UsXG5cdFx0XHRidWNrZXRFbmNNYWlsU2Vzc2lvbktleTogbnVsbCxcblx0XHRcdHNlbmRlck5hbWVVbmVuY3J5cHRlZDogbnVsbCxcblx0XHRcdHNlY3VyZUV4dGVybmFsUmVjaXBpZW50S2V5RGF0YTogW10sXG5cdFx0XHRzeW1FbmNJbnRlcm5hbFJlY2lwaWVudEtleURhdGE6IFtdLFxuXHRcdFx0c2Vzc2lvbkVuY0VuY3J5cHRpb25BdXRoU3RhdHVzOiBudWxsLFxuXHRcdH0pXG5cblx0XHRjb25zdCBhdHRhY2htZW50cyA9IGF3YWl0IHRoaXMuZ2V0QXR0YWNobWVudElkcyhkcmFmdClcblx0XHRmb3IgKGNvbnN0IGZpbGVJZCBvZiBhdHRhY2htZW50cykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoRmlsZVR5cGVSZWYsIGZpbGVJZClcblx0XHRcdGNvbnN0IGZpbGVTZXNzaW9uS2V5ID0gYXNzZXJ0Tm90TnVsbChhd2FpdCB0aGlzLmNyeXB0by5yZXNvbHZlU2Vzc2lvbktleUZvckluc3RhbmNlKGZpbGUpLCBcImZpbGVTZXNzaW9uS2V5IHdhcyBudWxsXCIpXG5cdFx0XHRjb25zdCBkYXRhID0gY3JlYXRlQXR0YWNobWVudEtleURhdGEoe1xuXHRcdFx0XHRmaWxlOiBmaWxlSWQsXG5cdFx0XHRcdGZpbGVTZXNzaW9uS2V5OiBudWxsLFxuXHRcdFx0XHRidWNrZXRFbmNGaWxlU2Vzc2lvbktleTogbnVsbCxcblx0XHRcdH0pXG5cblx0XHRcdGlmIChkcmFmdC5jb25maWRlbnRpYWwpIHtcblx0XHRcdFx0ZGF0YS5idWNrZXRFbmNGaWxlU2Vzc2lvbktleSA9IGVuY3J5cHRLZXkoYnVja2V0S2V5LCBmaWxlU2Vzc2lvbktleSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRhdGEuZmlsZVNlc3Npb25LZXkgPSBrZXlUb1VpbnQ4QXJyYXkoZmlsZVNlc3Npb25LZXkpXG5cdFx0XHR9XG5cblx0XHRcdHNlbmREcmFmdERhdGEuYXR0YWNobWVudEtleURhdGEucHVzaChkYXRhKVxuXHRcdH1cblxuXHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LmxvYWRSb290KFR1dGFub3RhUHJvcGVydGllc1R5cGVSZWYsIHRoaXMudXNlckZhY2FkZS5nZXRVc2VyR3JvdXBJZCgpKS50aGVuKCh0dXRhbm90YVByb3BlcnRpZXMpID0+IHtcblx0XHRcdFx0c2VuZERyYWZ0RGF0YS5wbGFpbnRleHQgPSB0dXRhbm90YVByb3BlcnRpZXMuc2VuZFBsYWludGV4dE9ubHlcblx0XHRcdH0pLFxuXHRcdFx0dGhpcy5jcnlwdG8ucmVzb2x2ZVNlc3Npb25LZXlGb3JJbnN0YW5jZShkcmFmdCkudGhlbihhc3luYyAobWFpbFNlc3Npb25rZXkpID0+IHtcblx0XHRcdFx0Y29uc3Qgc2sgPSBhc3NlcnROb3ROdWxsKG1haWxTZXNzaW9ua2V5LCBcIm1haWxTZXNzaW9uS2V5IHdhcyBudWxsXCIpXG5cdFx0XHRcdHNlbmREcmFmdERhdGEuY2FsZW5kYXJNZXRob2QgPSBkcmFmdC5tZXRob2QgIT09IE1haWxNZXRob2QuTk9ORVxuXG5cdFx0XHRcdGlmIChkcmFmdC5jb25maWRlbnRpYWwpIHtcblx0XHRcdFx0XHRzZW5kRHJhZnREYXRhLmJ1Y2tldEVuY01haWxTZXNzaW9uS2V5ID0gZW5jcnlwdEtleShidWNrZXRLZXksIHNrKVxuXHRcdFx0XHRcdGNvbnN0IGhhc0V4dGVybmFsU2VjdXJlUmVjaXBpZW50ID0gcmVjaXBpZW50cy5zb21lKChyKSA9PiByLnR5cGUgPT09IFJlY2lwaWVudFR5cGUuRVhURVJOQUwgJiYgISF0aGlzLmdldENvbnRhY3RQYXNzd29yZChyLmNvbnRhY3QpPy50cmltKCkpXG5cblx0XHRcdFx0XHRpZiAoaGFzRXh0ZXJuYWxTZWN1cmVSZWNpcGllbnQpIHtcblx0XHRcdFx0XHRcdHNlbmREcmFmdERhdGEuc2VuZGVyTmFtZVVuZW5jcnlwdGVkID0gZHJhZnQuc2VuZGVyLm5hbWUgLy8gbmVlZGVkIGZvciBub3RpZmljYXRpb24gbWFpbFxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGF3YWl0IHRoaXMuYWRkUmVjaXBpZW50S2V5RGF0YShidWNrZXRLZXksIHNlbmREcmFmdERhdGEsIHJlY2lwaWVudHMsIHNlbmRlck1haWxHcm91cElkKVxuXHRcdFx0XHRcdGlmICh0aGlzLmlzVHV0YUNyeXB0TWFpbChzZW5kRHJhZnREYXRhKSkge1xuXHRcdFx0XHRcdFx0c2VuZERyYWZ0RGF0YS5zZXNzaW9uRW5jRW5jcnlwdGlvbkF1dGhTdGF0dXMgPSBlbmNyeXB0U3RyaW5nKHNrLCBFbmNyeXB0aW9uQXV0aFN0YXR1cy5UVVRBQ1JZUFRfU0VOREVSKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZW5kRHJhZnREYXRhLm1haWxTZXNzaW9uS2V5ID0gYml0QXJyYXlUb1VpbnQ4QXJyYXkoc2spXG5cdFx0XHRcdH1cblx0XHRcdH0pLFxuXHRcdF0pXG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChTZW5kRHJhZnRTZXJ2aWNlLCBzZW5kRHJhZnREYXRhKVxuXHR9XG5cblx0YXN5bmMgZ2V0QXR0YWNobWVudElkcyhkcmFmdDogTWFpbCk6IFByb21pc2U8SWRUdXBsZVtdPiB7XG5cdFx0cmV0dXJuIGRyYWZ0LmF0dGFjaG1lbnRzXG5cdH1cblxuXHRhc3luYyBnZXRSZXBseVRvcyhkcmFmdDogTWFpbCk6IFByb21pc2U8RW5jcnlwdGVkTWFpbEFkZHJlc3NbXT4ge1xuXHRcdGNvbnN0IG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyOiBPd25lckVuY1Nlc3Npb25LZXlQcm92aWRlciA9IHRoaXMua2V5UHJvdmlkZXJGcm9tSW5zdGFuY2UoZHJhZnQpXG5cdFx0Y29uc3QgbWFpbERldGFpbHNEcmFmdElkID0gYXNzZXJ0Tm90TnVsbChkcmFmdC5tYWlsRGV0YWlsc0RyYWZ0LCBcImRyYWZ0IHdpdGhvdXQgbWFpbERldGFpbHNEcmFmdFwiKVxuXHRcdGNvbnN0IG1haWxEZXRhaWxzID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKFxuXHRcdFx0TWFpbERldGFpbHNEcmFmdFR5cGVSZWYsXG5cdFx0XHRsaXN0SWRQYXJ0KG1haWxEZXRhaWxzRHJhZnRJZCksXG5cdFx0XHRbZWxlbWVudElkUGFydChtYWlsRGV0YWlsc0RyYWZ0SWQpXSxcblx0XHRcdG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyLFxuXHRcdClcblx0XHRpZiAobWFpbERldGFpbHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgTm90Rm91bmRFcnJvcihgTWFpbERldGFpbHNEcmFmdCAke2RyYWZ0Lm1haWxEZXRhaWxzRHJhZnR9YClcblx0XHR9XG5cdFx0cmV0dXJuIG1haWxEZXRhaWxzWzBdLmRldGFpbHMucmVwbHlUb3Ncblx0fVxuXG5cdGFzeW5jIGNoZWNrTWFpbEZvclBoaXNoaW5nKFxuXHRcdG1haWw6IE1haWwsXG5cdFx0bGlua3M6IEFycmF5PHtcblx0XHRcdGhyZWY6IHN0cmluZ1xuXHRcdFx0aW5uZXJIVE1MOiBzdHJpbmdcblx0XHR9Pixcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0bGV0IHNjb3JlID0gMFxuXHRcdGNvbnN0IHNlbmRlckFkZHJlc3MgPSBtYWlsLnNlbmRlci5hZGRyZXNzXG5cblx0XHRsZXQgc2VuZGVyQXV0aGVudGljYXRlZFxuXHRcdGlmIChtYWlsLmF1dGhTdGF0dXMgIT09IG51bGwpIHtcblx0XHRcdHNlbmRlckF1dGhlbnRpY2F0ZWQgPSBtYWlsLmF1dGhTdGF0dXMgPT09IE1haWxBdXRoZW50aWNhdGlvblN0YXR1cy5BVVRIRU5USUNBVEVEXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IG1haWxEZXRhaWxzID0gYXdhaXQgdGhpcy5sb2FkTWFpbERldGFpbHNCbG9iKG1haWwpXG5cdFx0XHRzZW5kZXJBdXRoZW50aWNhdGVkID0gbWFpbERldGFpbHMuYXV0aFN0YXR1cyA9PT0gTWFpbEF1dGhlbnRpY2F0aW9uU3RhdHVzLkFVVEhFTlRJQ0FURURcblx0XHR9XG5cblx0XHRpZiAoc2VuZGVyQXV0aGVudGljYXRlZCkge1xuXHRcdFx0aWYgKHRoaXMuX2NoZWNrRmllbGRGb3JQaGlzaGluZyhSZXBvcnRlZE1haWxGaWVsZFR5cGUuRlJPTV9BRERSRVNTLCBzZW5kZXJBZGRyZXNzKSkge1xuXHRcdFx0XHRzY29yZSArPSA2XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBzZW5kZXJEb21haW4gPSBhZGRyZXNzRG9tYWluKHNlbmRlckFkZHJlc3MpXG5cblx0XHRcdFx0aWYgKHRoaXMuX2NoZWNrRmllbGRGb3JQaGlzaGluZyhSZXBvcnRlZE1haWxGaWVsZFR5cGUuRlJPTV9ET01BSU4sIHNlbmRlckRvbWFpbikpIHtcblx0XHRcdFx0XHRzY29yZSArPSA2XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHRoaXMuX2NoZWNrRmllbGRGb3JQaGlzaGluZyhSZXBvcnRlZE1haWxGaWVsZFR5cGUuRlJPTV9BRERSRVNTX05PTl9BVVRILCBzZW5kZXJBZGRyZXNzKSkge1xuXHRcdFx0XHRzY29yZSArPSA2XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBzZW5kZXJEb21haW4gPSBhZGRyZXNzRG9tYWluKHNlbmRlckFkZHJlc3MpXG5cblx0XHRcdFx0aWYgKHRoaXMuX2NoZWNrRmllbGRGb3JQaGlzaGluZyhSZXBvcnRlZE1haWxGaWVsZFR5cGUuRlJPTV9ET01BSU5fTk9OX0FVVEgsIHNlbmRlckRvbWFpbikpIHtcblx0XHRcdFx0XHRzY29yZSArPSA2XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBXZSBjaGVjayB0aGF0IHN1YmplY3QgZXhpc3RzIGJlY2F1c2Ugd2hlbiB0aGVyZSdzIGFuIGVuY3J5cHRpb24gZXJyb3IgaXQgd2lsbCBiZSBtaXNzaW5nXG5cdFx0aWYgKG1haWwuc3ViamVjdCAmJiB0aGlzLl9jaGVja0ZpZWxkRm9yUGhpc2hpbmcoUmVwb3J0ZWRNYWlsRmllbGRUeXBlLlNVQkpFQ1QsIG1haWwuc3ViamVjdCkpIHtcblx0XHRcdHNjb3JlICs9IDNcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IGxpbmsgb2YgbGlua3MpIHtcblx0XHRcdGlmICh0aGlzLl9jaGVja0ZpZWxkRm9yUGhpc2hpbmcoUmVwb3J0ZWRNYWlsRmllbGRUeXBlLkxJTkssIGxpbmsuaHJlZikpIHtcblx0XHRcdFx0c2NvcmUgKz0gNlxuXHRcdFx0XHRicmVha1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgZG9tYWluID0gZ2V0VXJsRG9tYWluKGxpbmsuaHJlZilcblxuXHRcdFx0XHRpZiAoZG9tYWluICYmIHRoaXMuX2NoZWNrRmllbGRGb3JQaGlzaGluZyhSZXBvcnRlZE1haWxGaWVsZFR5cGUuTElOS19ET01BSU4sIGRvbWFpbikpIHtcblx0XHRcdFx0XHRzY29yZSArPSA2XG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGhhc1N1c3BpY2lvdXNMaW5rID0gbGlua3Muc29tZSgoeyBocmVmLCBpbm5lckhUTUwgfSkgPT4ge1xuXHRcdFx0Y29uc3QgaW5uZXJUZXh0ID0gaHRtbFRvVGV4dChpbm5lckhUTUwpXG5cdFx0XHRjb25zdCB0ZXh0VXJsID0gcGFyc2VVcmwoaW5uZXJUZXh0KVxuXHRcdFx0Y29uc3QgaHJlZlVybCA9IHBhcnNlVXJsKGhyZWYpXG5cdFx0XHRyZXR1cm4gdGV4dFVybCAmJiBocmVmVXJsICYmIHRleHRVcmwuaG9zdG5hbWUgIT09IGhyZWZVcmwuaG9zdG5hbWVcblx0XHR9KVxuXG5cdFx0aWYgKGhhc1N1c3BpY2lvdXNMaW5rKSB7XG5cdFx0XHRzY29yZSArPSA2XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSg3IDwgc2NvcmUpXG5cdH1cblxuXHRhc3luYyBkZWxldGVGb2xkZXIoaWQ6IElkVHVwbGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBkZWxldGVNYWlsRm9sZGVyRGF0YSA9IGNyZWF0ZURlbGV0ZU1haWxGb2xkZXJEYXRhKHtcblx0XHRcdGZvbGRlcnM6IFtpZF0sXG5cdFx0fSlcblx0XHQvLyBUT0RPIG1ha2UgRGVsZXRlTWFpbEZvbGRlckRhdGEgdW5lbmNyeXB0ZWQgaW4gbmV4dCBtb2RlbCB2ZXJzaW9uXG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZGVsZXRlKE1haWxGb2xkZXJTZXJ2aWNlLCBkZWxldGVNYWlsRm9sZGVyRGF0YSwgeyBzZXNzaW9uS2V5OiBcImR1bW15XCIgYXMgYW55IH0pXG5cdH1cblxuXHRhc3luYyBmaXh1cENvdW50ZXJGb3JGb2xkZXIoZ3JvdXBJZDogSWQsIGZvbGRlcjogTWFpbEZvbGRlciwgdW5yZWFkTWFpbHM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGNvdW50ZXJJZCA9IGZvbGRlci5pc01haWxTZXQgPyBnZXRFbGVtZW50SWQoZm9sZGVyKSA6IGZvbGRlci5tYWlsc1xuXHRcdGNvbnN0IGRhdGEgPSBjcmVhdGVXcml0ZUNvdW50ZXJEYXRhKHtcblx0XHRcdGNvdW50ZXJUeXBlOiBDb3VudGVyVHlwZS5VbnJlYWRNYWlscyxcblx0XHRcdHJvdzogZ3JvdXBJZCxcblx0XHRcdGNvbHVtbjogY291bnRlcklkLFxuXHRcdFx0dmFsdWU6IFN0cmluZyh1bnJlYWRNYWlscyksXG5cdFx0fSlcblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KENvdW50ZXJTZXJ2aWNlLCBkYXRhKVxuXHR9XG5cblx0X2NoZWNrRmllbGRGb3JQaGlzaGluZyh0eXBlOiBSZXBvcnRlZE1haWxGaWVsZFR5cGUsIHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHRjb25zdCBoYXNoID0gcGhpc2hpbmdNYXJrZXJWYWx1ZSh0eXBlLCB2YWx1ZSlcblx0XHRyZXR1cm4gdGhpcy5waGlzaGluZ01hcmtlcnMuaGFzKGhhc2gpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGFkZFJlY2lwaWVudEtleURhdGEoYnVja2V0S2V5OiBBZXNLZXksIHNlbmREcmFmdERhdGE6IFNlbmREcmFmdERhdGEsIHJlY2lwaWVudHM6IEFycmF5PFJlY2lwaWVudD4sIHNlbmRlck1haWxHcm91cElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG5vdEZvdW5kUmVjaXBpZW50czogc3RyaW5nW10gPSBbXVxuXG5cdFx0Zm9yIChjb25zdCByZWNpcGllbnQgb2YgcmVjaXBpZW50cykge1xuXHRcdFx0aWYgKHJlY2lwaWVudC5hZGRyZXNzID09PSBTWVNURU1fR1JPVVBfTUFJTF9BRERSRVNTIHx8ICFyZWNpcGllbnQpIHtcblx0XHRcdFx0bm90Rm91bmRSZWNpcGllbnRzLnB1c2gocmVjaXBpZW50LmFkZHJlc3MpXG5cdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHR9XG5cblx0XHRcdC8vIGNvcHkgcGFzc3dvcmQgaW5mb3JtYXRpb24gaWYgdGhpcyBpcyBhbiBleHRlcm5hbCBjb250YWN0XG5cdFx0XHQvLyBvdGhlcndpc2UgbG9hZCB0aGUga2V5IGluZm9ybWF0aW9uIGZyb20gdGhlIHNlcnZlclxuXHRcdFx0Y29uc3QgaXNTaGFyZWRNYWlsYm94U2VuZGVyID0gIWlzU2FtZUlkKHRoaXMudXNlckZhY2FkZS5nZXRHcm91cElkKEdyb3VwVHlwZS5NYWlsKSwgc2VuZGVyTWFpbEdyb3VwSWQpXG5cblx0XHRcdGlmIChyZWNpcGllbnQudHlwZSA9PT0gUmVjaXBpZW50VHlwZS5FWFRFUk5BTCkge1xuXHRcdFx0XHRjb25zdCBwYXNzcGhyYXNlID0gdGhpcy5nZXRDb250YWN0UGFzc3dvcmQocmVjaXBpZW50LmNvbnRhY3QpXG5cdFx0XHRcdGlmIChwYXNzcGhyYXNlID09IG51bGwgfHwgaXNTaGFyZWRNYWlsYm94U2VuZGVyKSB7XG5cdFx0XHRcdFx0Ly8gbm8gcGFzc3dvcmQgZ2l2ZW4gYW5kIHByZXZlbnQgc2VuZGluZyB0byBzZWN1cmUgZXh0ZXJuYWxzIGZyb20gc2hhcmVkIGdyb3VwXG5cdFx0XHRcdFx0bm90Rm91bmRSZWNpcGllbnRzLnB1c2gocmVjaXBpZW50LmFkZHJlc3MpXG5cdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHNhbHQgPSBnZW5lcmF0ZVJhbmRvbVNhbHQoKVxuXHRcdFx0XHRjb25zdCBrZGZUeXBlID0gREVGQVVMVF9LREZfVFlQRVxuXHRcdFx0XHRjb25zdCBwYXNzd29yZEtleSA9IGF3YWl0IHRoaXMubG9naW5GYWNhZGUuZGVyaXZlVXNlclBhc3NwaHJhc2VLZXkoeyBrZGZUeXBlLCBwYXNzcGhyYXNlLCBzYWx0IH0pXG5cdFx0XHRcdGNvbnN0IHBhc3N3b3JkVmVyaWZpZXIgPSBjcmVhdGVBdXRoVmVyaWZpZXIocGFzc3dvcmRLZXkpXG5cdFx0XHRcdGNvbnN0IGV4dGVybmFsR3JvdXBLZXlzID0gYXdhaXQgdGhpcy5nZXRFeHRlcm5hbEdyb3VwS2V5cyhyZWNpcGllbnQuYWRkcmVzcywga2RmVHlwZSwgcGFzc3dvcmRLZXksIHBhc3N3b3JkVmVyaWZpZXIpXG5cdFx0XHRcdGNvbnN0IG93bmVyRW5jQnVja2V0S2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoZXh0ZXJuYWxHcm91cEtleXMuY3VycmVudEV4dGVybmFsTWFpbEdyb3VwS2V5LCBidWNrZXRLZXkpXG5cdFx0XHRcdGNvbnN0IGRhdGEgPSBjcmVhdGVTZWN1cmVFeHRlcm5hbFJlY2lwaWVudEtleURhdGEoe1xuXHRcdFx0XHRcdG1haWxBZGRyZXNzOiByZWNpcGllbnQuYWRkcmVzcyxcblx0XHRcdFx0XHRrZGZWZXJzaW9uOiBrZGZUeXBlLFxuXHRcdFx0XHRcdG93bmVyRW5jQnVja2V0S2V5OiBvd25lckVuY0J1Y2tldEtleS5rZXksXG5cdFx0XHRcdFx0b3duZXJLZXlWZXJzaW9uOiBvd25lckVuY0J1Y2tldEtleS5lbmNyeXB0aW5nS2V5VmVyc2lvbi50b1N0cmluZygpLFxuXHRcdFx0XHRcdHBhc3N3b3JkVmVyaWZpZXI6IHBhc3N3b3JkVmVyaWZpZXIsXG5cdFx0XHRcdFx0c2FsdDogc2FsdCxcblx0XHRcdFx0XHRzYWx0SGFzaDogc2hhMjU2SGFzaChzYWx0KSxcblx0XHRcdFx0XHRwd0VuY0NvbW11bmljYXRpb25LZXk6IGVuY3J5cHRLZXkocGFzc3dvcmRLZXksIGV4dGVybmFsR3JvdXBLZXlzLmN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleS5vYmplY3QpLFxuXHRcdFx0XHRcdHVzZXJHcm91cEtleVZlcnNpb246IFN0cmluZyhleHRlcm5hbEdyb3VwS2V5cy5jdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXkudmVyc2lvbiksXG5cdFx0XHRcdH0pXG5cdFx0XHRcdHNlbmREcmFmdERhdGEuc2VjdXJlRXh0ZXJuYWxSZWNpcGllbnRLZXlEYXRhLnB1c2goZGF0YSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGtleURhdGEgPSBhd2FpdCB0aGlzLmNyeXB0by5lbmNyeXB0QnVja2V0S2V5Rm9ySW50ZXJuYWxSZWNpcGllbnQoXG5cdFx0XHRcdFx0aXNTaGFyZWRNYWlsYm94U2VuZGVyID8gc2VuZGVyTWFpbEdyb3VwSWQgOiB0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCkudXNlckdyb3VwLmdyb3VwLFxuXHRcdFx0XHRcdGJ1Y2tldEtleSxcblx0XHRcdFx0XHRyZWNpcGllbnQuYWRkcmVzcyxcblx0XHRcdFx0XHRub3RGb3VuZFJlY2lwaWVudHMsXG5cdFx0XHRcdClcblx0XHRcdFx0aWYgKGtleURhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdC8vIGNhbm5vdCBhZGQgcmVjaXBpZW50IGJlY2F1c2Ugb2Ygbm90Rm91bmRFcnJvclxuXHRcdFx0XHRcdC8vIHdlIGRvIG5vdCB0aHJvdyBoZXJlIGJlY2F1c2Ugd2Ugd2FudCB0byBjb2xsZWN0IGFsbCBub3QgZm91bmQgcmVjaXBpZW50cyBmaXJzdFxuXHRcdFx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYoa2V5RGF0YS5fdHlwZSwgU3ltRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhVHlwZVJlZikpIHtcblx0XHRcdFx0XHRzZW5kRHJhZnREYXRhLnN5bUVuY0ludGVybmFsUmVjaXBpZW50S2V5RGF0YS5wdXNoKGtleURhdGEgYXMgU3ltRW5jSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhKVxuXHRcdFx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYoa2V5RGF0YS5fdHlwZSwgSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhVHlwZVJlZikpIHtcblx0XHRcdFx0XHRzZW5kRHJhZnREYXRhLmludGVybmFsUmVjaXBpZW50S2V5RGF0YS5wdXNoKGtleURhdGEgYXMgSW50ZXJuYWxSZWNpcGllbnRLZXlEYXRhKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG5vdEZvdW5kUmVjaXBpZW50cy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgUmVjaXBpZW50c05vdEZvdW5kRXJyb3Iobm90Rm91bmRSZWNpcGllbnRzLmpvaW4oXCJcXG5cIikpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiB0aGUgZ2l2ZW4gc2VuZCBkcmFmdCBkYXRhIGNvbnRhaW5zIG9ubHkgZW5jcnlwdCBrZXlzIHRoYXQgaGF2ZSBiZWVuIGVuY3J5cHRlZCB3aXRoIFR1dGFDcnlwdCBwcm90b2NvbC5cblx0ICogQFZpc2libGVGb3JUZXN0aW5nXG5cdCAqIEBwYXJhbSBzZW5kRHJhZnREYXRhIFRoZSBzZW5kIGRyYWZ0YSBmb3IgdGhlIG1haWwgdGhhdCBzaG91bGQgYmUgc2VudFxuXHQgKi9cblx0aXNUdXRhQ3J5cHRNYWlsKHNlbmREcmFmdERhdGE6IFNlbmREcmFmdERhdGEpIHtcblx0XHQvLyBpZiBhbiBzZWN1cmUgZXh0ZXJuYWwgcmVjaXBpZW50IGlzIGludm9sdmVkIGluIHRoZSBjb252ZXJzYXRpb24gd2UgZG8gbm90IHVzZSBhc3ltbWV0cmljIGVuY3J5cHRpb25cblx0XHRpZiAoc2VuZERyYWZ0RGF0YS5zeW1FbmNJbnRlcm5hbFJlY2lwaWVudEtleURhdGEubGVuZ3RoID4gMCB8fCBzZW5kRHJhZnREYXRhLnNlY3VyZUV4dGVybmFsUmVjaXBpZW50S2V5RGF0YS5sZW5ndGgpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblx0XHRpZiAoaXNFbXB0eShzZW5kRHJhZnREYXRhLmludGVybmFsUmVjaXBpZW50S2V5RGF0YSkpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblx0XHRyZXR1cm4gc2VuZERyYWZ0RGF0YS5pbnRlcm5hbFJlY2lwaWVudEtleURhdGEuZXZlcnkoKHJlY2lwaWVudERhdGEpID0+IHJlY2lwaWVudERhdGEucHJvdG9jb2xWZXJzaW9uID09PSBDcnlwdG9Qcm90b2NvbFZlcnNpb24uVFVUQV9DUllQVClcblx0fVxuXG5cdHByaXZhdGUgZ2V0Q29udGFjdFBhc3N3b3JkKGNvbnRhY3Q6IENvbnRhY3QgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0cmV0dXJuIGNvbnRhY3Q/LnByZXNoYXJlZFBhc3N3b3JkID8/IG51bGxcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgdGhhdCBhbiBleHRlcm5hbCB1c2VyIGluc3RhbmNlIHdpdGggYSBtYWlsIGJveCBleGlzdHMgZm9yIHRoZSBnaXZlbiByZWNpcGllbnQuIElmIGl0IGRvZXMgbm90IGV4aXN0LCBpdCBpcyBjcmVhdGVkLlxuXHQgKiBSZXR1cm5zIHRoZSB1c2VyIGdyb3VwIGtleSBhbmQgdGhlIHVzZXIgbWFpbCBncm91cCBrZXkgb2YgdGhlIGV4dGVybmFsIHJlY2lwaWVudC5cblx0ICogQHBhcmFtIHJlY2lwaWVudE1haWxBZGRyZXNzXG5cdCAqIEBwYXJhbSBleHRlcm5hbFVzZXJLZGZUeXBlIHRoZSBrZGYgdHlwZSB1c2VkIHRvIGRlcml2ZSBleHRlcm5hbFVzZXJQd0tleVxuXHQgKiBAcGFyYW0gZXh0ZXJuYWxVc2VyUHdLZXkgVGhlIGV4dGVybmFsIHVzZXIncyBwYXNzd29yZCBrZXkuXG5cdCAqIEBwYXJhbSB2ZXJpZmllciBUaGUgZXh0ZXJuYWwgdXNlcidzIHZlcmlmaWVyLCBiYXNlNjQgZW5jb2RlZC5cblx0ICogQHJldHVybiBSZXNvbHZlcyB0byB0aGUgZXh0ZXJuYWwgdXNlcidzIGdyb3VwIGtleSBhbmQgdGhlIGV4dGVybmFsIHVzZXIncyBtYWlsIGdyb3VwIGtleSwgcmVqZWN0ZWQgaWYgYW4gZXJyb3Igb2NjdXJyZWRcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZ2V0RXh0ZXJuYWxHcm91cEtleXMoXG5cdFx0cmVjaXBpZW50TWFpbEFkZHJlc3M6IHN0cmluZyxcblx0XHRleHRlcm5hbFVzZXJLZGZUeXBlOiBLZGZUeXBlLFxuXHRcdGV4dGVybmFsVXNlclB3S2V5OiBBZXNLZXksXG5cdFx0dmVyaWZpZXI6IFVpbnQ4QXJyYXksXG5cdCk6IFByb21pc2U8eyBjdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXk6IFZlcnNpb25lZEtleTsgY3VycmVudEV4dGVybmFsTWFpbEdyb3VwS2V5OiBWZXJzaW9uZWRLZXkgfT4ge1xuXHRcdGNvbnN0IGdyb3VwUm9vdCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRSb290KEdyb3VwUm9vdFR5cGVSZWYsIHRoaXMudXNlckZhY2FkZS5nZXRVc2VyR3JvdXBJZCgpKVxuXHRcdGNvbnN0IGNsZWFuZWRNYWlsQWRkcmVzcyA9IHJlY2lwaWVudE1haWxBZGRyZXNzLnRyaW0oKS50b0xvY2FsZUxvd2VyQ2FzZSgpXG5cdFx0Y29uc3QgbWFpbEFkZHJlc3NJZCA9IHN0cmluZ1RvQ3VzdG9tSWQoY2xlYW5lZE1haWxBZGRyZXNzKVxuXG5cdFx0bGV0IGV4dGVybmFsVXNlclJlZmVyZW5jZTogRXh0ZXJuYWxVc2VyUmVmZXJlbmNlXG5cdFx0dHJ5IHtcblx0XHRcdGV4dGVybmFsVXNlclJlZmVyZW5jZSA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoRXh0ZXJuYWxVc2VyUmVmZXJlbmNlVHlwZVJlZiwgW2dyb3VwUm9vdC5leHRlcm5hbFVzZXJSZWZlcmVuY2VzLCBtYWlsQWRkcmVzc0lkXSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuY3JlYXRlRXh0ZXJuYWxVc2VyKGNsZWFuZWRNYWlsQWRkcmVzcywgZXh0ZXJuYWxVc2VyS2RmVHlwZSwgZXh0ZXJuYWxVc2VyUHdLZXksIHZlcmlmaWVyKVxuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblxuXHRcdGNvbnN0IGV4dGVybmFsVXNlciA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoVXNlclR5cGVSZWYsIGV4dGVybmFsVXNlclJlZmVyZW5jZS51c2VyKVxuXHRcdGNvbnN0IGV4dGVybmFsVXNlckdyb3VwSWQgPSBleHRlcm5hbFVzZXJSZWZlcmVuY2UudXNlckdyb3VwXG5cdFx0Y29uc3QgZXh0ZXJuYWxNYWlsR3JvdXBJZCA9IGFzc2VydE5vdE51bGwoXG5cdFx0XHRleHRlcm5hbFVzZXIubWVtYmVyc2hpcHMuZmluZCgobSkgPT4gbS5ncm91cFR5cGUgPT09IEdyb3VwVHlwZS5NYWlsKSxcblx0XHRcdFwibm8gbWFpbCBncm91cCBtZW1iZXJzaGlwIG9uIGV4dGVybmFsIHVzZXJcIixcblx0XHQpLmdyb3VwXG5cblx0XHRjb25zdCBleHRlcm5hbE1haWxHcm91cCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBUeXBlUmVmLCBleHRlcm5hbE1haWxHcm91cElkKVxuXHRcdGNvbnN0IGV4dGVybmFsVXNlckdyb3VwID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChHcm91cFR5cGVSZWYsIGV4dGVybmFsVXNlckdyb3VwSWQpXG5cdFx0Y29uc3QgcmVxdWlyZWRJbnRlcm5hbFVzZXJHcm91cEtleVZlcnNpb24gPSBOdW1iZXIoZXh0ZXJuYWxVc2VyR3JvdXAuYWRtaW5Hcm91cEtleVZlcnNpb24gPz8gMClcblx0XHRjb25zdCByZXF1aXJlZEV4dGVybmFsVXNlckdyb3VwS2V5VmVyc2lvbiA9IE51bWJlcihleHRlcm5hbE1haWxHcm91cC5hZG1pbkdyb3VwS2V5VmVyc2lvbiA/PyAwKVxuXHRcdGNvbnN0IGludGVybmFsVXNlckVuY0V4dGVybmFsVXNlcktleSA9IGFzc2VydE5vdE51bGwoZXh0ZXJuYWxVc2VyR3JvdXAuYWRtaW5Hcm91cEVuY0dLZXksIFwibm8gYWRtaW5Hcm91cEVuY0dLZXkgb24gZXh0ZXJuYWwgdXNlciBncm91cFwiKVxuXHRcdGNvbnN0IGV4dGVybmFsVXNlckVuY0V4dGVybmFsTWFpbEtleSA9IGFzc2VydE5vdE51bGwoZXh0ZXJuYWxNYWlsR3JvdXAuYWRtaW5Hcm91cEVuY0dLZXksIFwibm8gYWRtaW5Hcm91cEVuY0dLZXkgb24gZXh0ZXJuYWwgbWFpbCBncm91cFwiKVxuXHRcdGNvbnN0IHJlcXVpcmVkSW50ZXJuYWxVc2VyR3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkodGhpcy51c2VyRmFjYWRlLmdldFVzZXJHcm91cElkKCksIHJlcXVpcmVkSW50ZXJuYWxVc2VyR3JvdXBLZXlWZXJzaW9uKVxuXHRcdGNvbnN0IGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleSA9IHtcblx0XHRcdG9iamVjdDogZGVjcnlwdEtleShyZXF1aXJlZEludGVybmFsVXNlckdyb3VwS2V5LCBpbnRlcm5hbFVzZXJFbmNFeHRlcm5hbFVzZXJLZXkpLFxuXHRcdFx0dmVyc2lvbjogTnVtYmVyKGV4dGVybmFsVXNlckdyb3VwLmdyb3VwS2V5VmVyc2lvbiksXG5cdFx0fVxuXHRcdGNvbnN0IHJlcXVpcmVkRXh0ZXJuYWxVc2VyR3JvdXBLZXkgPSBhd2FpdCB0aGlzLmtleUxvYWRlckZhY2FkZS5sb2FkU3ltR3JvdXBLZXkoXG5cdFx0XHRleHRlcm5hbFVzZXJHcm91cElkLFxuXHRcdFx0cmVxdWlyZWRFeHRlcm5hbFVzZXJHcm91cEtleVZlcnNpb24sXG5cdFx0XHRjdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXksXG5cdFx0KVxuXHRcdGNvbnN0IGN1cnJlbnRFeHRlcm5hbE1haWxHcm91cEtleSA9IHtcblx0XHRcdG9iamVjdDogZGVjcnlwdEtleShyZXF1aXJlZEV4dGVybmFsVXNlckdyb3VwS2V5LCBleHRlcm5hbFVzZXJFbmNFeHRlcm5hbE1haWxLZXkpLFxuXHRcdFx0dmVyc2lvbjogTnVtYmVyKGV4dGVybmFsTWFpbEdyb3VwLmdyb3VwS2V5VmVyc2lvbiksXG5cdFx0fVxuXHRcdHJldHVybiB7XG5cdFx0XHRjdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXksXG5cdFx0XHRjdXJyZW50RXh0ZXJuYWxNYWlsR3JvdXBLZXksXG5cdFx0fVxuXHR9XG5cblx0Z2V0UmVjaXBpZW50S2V5RGF0YShtYWlsQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxQdWJsaWNLZXlHZXRPdXQgfCBudWxsPiB7XG5cdFx0cmV0dXJuIHRoaXMuc2VydmljZUV4ZWN1dG9yXG5cdFx0XHQuZ2V0KFxuXHRcdFx0XHRQdWJsaWNLZXlTZXJ2aWNlLFxuXHRcdFx0XHRjcmVhdGVQdWJsaWNLZXlHZXRJbih7XG5cdFx0XHRcdFx0aWRlbnRpZmllclR5cGU6IFB1YmxpY0tleUlkZW50aWZpZXJUeXBlLk1BSUxfQUREUkVTUyxcblx0XHRcdFx0XHRpZGVudGlmaWVyOiBtYWlsQWRkcmVzcyxcblx0XHRcdFx0XHR2ZXJzaW9uOiBudWxsLCAvLyBnZXQgdGhlIGN1cnJlbnQgdmVyc2lvbiBmb3IgZW5jcnlwdGlvblxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaChvZkNsYXNzKE5vdEZvdW5kRXJyb3IsICgpID0+IG51bGwpKVxuXHR9XG5cblx0ZW50aXR5RXZlbnRzUmVjZWl2ZWQoZGF0YTogRW50aXR5VXBkYXRlW10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gcHJvbWlzZU1hcChkYXRhLCAodXBkYXRlKSA9PiB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMuZGVmZXJyZWREcmFmdFVwZGF0ZSAhPSBudWxsICYmXG5cdFx0XHRcdHRoaXMuZGVmZXJyZWREcmFmdElkICE9IG51bGwgJiZcblx0XHRcdFx0dXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5VUERBVEUgJiZcblx0XHRcdFx0aXNTYW1lVHlwZVJlZkJ5QXR0cihNYWlsVHlwZVJlZiwgdXBkYXRlLmFwcGxpY2F0aW9uLCB1cGRhdGUudHlwZSkgJiZcblx0XHRcdFx0aXNTYW1lSWQodGhpcy5kZWZlcnJlZERyYWZ0SWQsIFt1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHVwZGF0ZS5pbnN0YW5jZUlkXSlcblx0XHRcdCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnRcblx0XHRcdFx0XHQubG9hZChNYWlsVHlwZVJlZiwgdGhpcy5kZWZlcnJlZERyYWZ0SWQpXG5cdFx0XHRcdFx0LnRoZW4oKG1haWwpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGRlZmVycmVkUHJvbWlzZVdyYXBwZXIgPSBhc3NlcnROb3ROdWxsKHRoaXMuZGVmZXJyZWREcmFmdFVwZGF0ZSwgXCJkZWZlcnJlZERyYWZ0VXBkYXRlIHdlbnQgYXdheT9cIilcblx0XHRcdFx0XHRcdHRoaXMuZGVmZXJyZWREcmFmdFVwZGF0ZSA9IG51bGxcblx0XHRcdFx0XHRcdGRlZmVycmVkUHJvbWlzZVdyYXBwZXIucmVzb2x2ZShtYWlsKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBDb3VsZCBub3QgZmluZCB1cGRhdGVkIG1haWwgJHtKU09OLnN0cmluZ2lmeShbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF0pfWApXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fSkudGhlbihub09wKVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSBtYXJrZXJzIG9ubHkgcGhpc2hpbmcgKG5vdCBzcGFtKSBtYXJrZXJzIHdpbGwgYmUgc2VudCBhcyBldmVudCBidXMgdXBkYXRlc1xuXHQgKi9cblx0cGhpc2hpbmdNYXJrZXJzVXBkYXRlUmVjZWl2ZWQobWFya2VyczogUmVwb3J0ZWRNYWlsRmllbGRNYXJrZXJbXSkge1xuXHRcdGZvciAoY29uc3QgbWFya2VyIG9mIG1hcmtlcnMpIHtcblx0XHRcdGlmIChtYXJrZXIuc3RhdHVzID09PSBQaGlzaGluZ01hcmtlclN0YXR1cy5JTkFDVElWRSkge1xuXHRcdFx0XHR0aGlzLnBoaXNoaW5nTWFya2Vycy5kZWxldGUobWFya2VyLm1hcmtlcilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMucGhpc2hpbmdNYXJrZXJzLmFkZChtYXJrZXIubWFya2VyKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY3JlYXRlRXh0ZXJuYWxVc2VyKGNsZWFuZWRNYWlsQWRkcmVzczogc3RyaW5nLCBleHRlcm5hbFVzZXJLZGZUeXBlOiBLZGZUeXBlLCBleHRlcm5hbFVzZXJQd0tleTogQWVzS2V5LCB2ZXJpZmllcjogVWludDhBcnJheSkge1xuXHRcdGNvbnN0IGludGVybmFsVXNlckdyb3VwS2V5ID0gdGhpcy51c2VyRmFjYWRlLmdldEN1cnJlbnRVc2VyR3JvdXBLZXkoKVxuXHRcdGNvbnN0IGludGVybmFsTWFpbEdyb3VwS2V5ID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KHRoaXMudXNlckZhY2FkZS5nZXRHcm91cElkKEdyb3VwVHlwZS5NYWlsKSlcblxuXHRcdGNvbnN0IGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleSA9IGZyZXNoVmVyc2lvbmVkKGFlczI1NlJhbmRvbUtleSgpKVxuXHRcdGNvbnN0IGN1cnJlbnRFeHRlcm5hbE1haWxHcm91cEtleSA9IGZyZXNoVmVyc2lvbmVkKGFlczI1NlJhbmRvbUtleSgpKVxuXHRcdGNvbnN0IGV4dGVybmFsVXNlckdyb3VwSW5mb1Nlc3Npb25LZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdGNvbnN0IGV4dGVybmFsTWFpbEdyb3VwSW5mb1Nlc3Npb25LZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdGNvbnN0IHR1dGFub3RhUHJvcGVydGllc1Nlc3Npb25LZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdGNvbnN0IG1haWxib3hTZXNzaW9uS2V5ID0gYWVzMjU2UmFuZG9tS2V5KClcblx0XHRjb25zdCBleHRlcm5hbFVzZXJFbmNFbnRyb3B5ID0gZW5jcnlwdEJ5dGVzKGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleS5vYmplY3QsIHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoMzIpKVxuXG5cdFx0Y29uc3QgaW50ZXJuYWxVc2VyRW5jR3JvdXBLZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShpbnRlcm5hbFVzZXJHcm91cEtleSwgY3VycmVudEV4dGVybmFsVXNlckdyb3VwS2V5Lm9iamVjdClcblx0XHRjb25zdCB1c2VyR3JvdXBEYXRhID0gY3JlYXRlQ3JlYXRlRXh0ZXJuYWxVc2VyR3JvdXBEYXRhKHtcblx0XHRcdG1haWxBZGRyZXNzOiBjbGVhbmVkTWFpbEFkZHJlc3MsXG5cdFx0XHRleHRlcm5hbFB3RW5jVXNlckdyb3VwS2V5OiBlbmNyeXB0S2V5KGV4dGVybmFsVXNlclB3S2V5LCBjdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXkub2JqZWN0KSxcblx0XHRcdGludGVybmFsVXNlckVuY1VzZXJHcm91cEtleTogaW50ZXJuYWxVc2VyRW5jR3JvdXBLZXkua2V5LFxuXHRcdFx0aW50ZXJuYWxVc2VyR3JvdXBLZXlWZXJzaW9uOiBpbnRlcm5hbFVzZXJFbmNHcm91cEtleS5lbmNyeXB0aW5nS2V5VmVyc2lvbi50b1N0cmluZygpLFxuXHRcdH0pXG5cblx0XHRjb25zdCBleHRlcm5hbFVzZXJFbmNVc2VyR3JvdXBJbmZvU2Vzc2lvbktleSA9IGVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleSwgZXh0ZXJuYWxVc2VyR3JvdXBJbmZvU2Vzc2lvbktleSlcblx0XHRjb25zdCBleHRlcm5hbFVzZXJFbmNNYWlsR3JvdXBLZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShjdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXksIGN1cnJlbnRFeHRlcm5hbE1haWxHcm91cEtleS5vYmplY3QpXG5cdFx0Y29uc3QgZXh0ZXJuYWxVc2VyRW5jVHV0YW5vdGFQcm9wZXJ0aWVzU2Vzc2lvbktleSA9IGVuY3J5cHRLZXlXaXRoVmVyc2lvbmVkS2V5KGN1cnJlbnRFeHRlcm5hbFVzZXJHcm91cEtleSwgdHV0YW5vdGFQcm9wZXJ0aWVzU2Vzc2lvbktleSlcblxuXHRcdGNvbnN0IGV4dGVybmFsTWFpbEVuY01haWxHcm91cEluZm9TZXNzaW9uS2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoY3VycmVudEV4dGVybmFsTWFpbEdyb3VwS2V5LCBleHRlcm5hbE1haWxHcm91cEluZm9TZXNzaW9uS2V5KVxuXHRcdGNvbnN0IGV4dGVybmFsTWFpbEVuY01haWxCb3hTZXNzaW9uS2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoY3VycmVudEV4dGVybmFsTWFpbEdyb3VwS2V5LCBtYWlsYm94U2Vzc2lvbktleSlcblxuXHRcdGNvbnN0IGludGVybmFsTWFpbEVuY1VzZXJHcm91cEluZm9TZXNzaW9uS2V5ID0gZW5jcnlwdEtleVdpdGhWZXJzaW9uZWRLZXkoaW50ZXJuYWxNYWlsR3JvdXBLZXksIGV4dGVybmFsVXNlckdyb3VwSW5mb1Nlc3Npb25LZXkpXG5cdFx0Y29uc3QgaW50ZXJuYWxNYWlsRW5jTWFpbEdyb3VwSW5mb1Nlc3Npb25LZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShpbnRlcm5hbE1haWxHcm91cEtleSwgZXh0ZXJuYWxNYWlsR3JvdXBJbmZvU2Vzc2lvbktleSlcblxuXHRcdGNvbnN0IGV4dGVybmFsVXNlckRhdGEgPSBjcmVhdGVFeHRlcm5hbFVzZXJEYXRhKHtcblx0XHRcdHZlcmlmaWVyLFxuXHRcdFx0dXNlckdyb3VwRGF0YSxcblx0XHRcdGtkZlZlcnNpb246IGV4dGVybmFsVXNlcktkZlR5cGUsXG5cblx0XHRcdGV4dGVybmFsVXNlckVuY0VudHJvcHksXG5cdFx0XHRleHRlcm5hbFVzZXJFbmNVc2VyR3JvdXBJbmZvU2Vzc2lvbktleTogZXh0ZXJuYWxVc2VyRW5jVXNlckdyb3VwSW5mb1Nlc3Npb25LZXkua2V5LFxuXHRcdFx0ZXh0ZXJuYWxVc2VyRW5jTWFpbEdyb3VwS2V5OiBleHRlcm5hbFVzZXJFbmNNYWlsR3JvdXBLZXkua2V5LFxuXHRcdFx0ZXh0ZXJuYWxVc2VyRW5jVHV0YW5vdGFQcm9wZXJ0aWVzU2Vzc2lvbktleTogZXh0ZXJuYWxVc2VyRW5jVHV0YW5vdGFQcm9wZXJ0aWVzU2Vzc2lvbktleS5rZXksXG5cblx0XHRcdGV4dGVybmFsTWFpbEVuY01haWxHcm91cEluZm9TZXNzaW9uS2V5OiBleHRlcm5hbE1haWxFbmNNYWlsR3JvdXBJbmZvU2Vzc2lvbktleS5rZXksXG5cdFx0XHRleHRlcm5hbE1haWxFbmNNYWlsQm94U2Vzc2lvbktleTogZXh0ZXJuYWxNYWlsRW5jTWFpbEJveFNlc3Npb25LZXkua2V5LFxuXG5cdFx0XHRpbnRlcm5hbE1haWxFbmNVc2VyR3JvdXBJbmZvU2Vzc2lvbktleTogaW50ZXJuYWxNYWlsRW5jVXNlckdyb3VwSW5mb1Nlc3Npb25LZXkua2V5LFxuXHRcdFx0aW50ZXJuYWxNYWlsRW5jTWFpbEdyb3VwSW5mb1Nlc3Npb25LZXk6IGludGVybmFsTWFpbEVuY01haWxHcm91cEluZm9TZXNzaW9uS2V5LmtleSxcblx0XHRcdGludGVybmFsTWFpbEdyb3VwS2V5VmVyc2lvbjogaW50ZXJuYWxNYWlsR3JvdXBLZXkudmVyc2lvbi50b1N0cmluZygpLFxuXHRcdH0pXG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChFeHRlcm5hbFVzZXJTZXJ2aWNlLCBleHRlcm5hbFVzZXJEYXRhKVxuXHRcdHJldHVybiB7XG5cdFx0XHRjdXJyZW50RXh0ZXJuYWxVc2VyR3JvdXBLZXksXG5cdFx0XHRjdXJyZW50RXh0ZXJuYWxNYWlsR3JvdXBLZXksXG5cdFx0fVxuXHR9XG5cblx0X2dldE1haWxHcm91cElkRm9yTWFpbEFkZHJlc3ModXNlcjogVXNlciwgbWFpbEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8SWQ+IHtcblx0XHRyZXR1cm4gcHJvbWlzZUZpbHRlcihnZXRVc2VyR3JvdXBNZW1iZXJzaGlwcyh1c2VyLCBHcm91cFR5cGUuTWFpbCksIChncm91cE1lbWJlcnNoaXApID0+IHtcblx0XHRcdHJldHVybiB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwVHlwZVJlZiwgZ3JvdXBNZW1iZXJzaGlwLmdyb3VwKS50aGVuKChtYWlsR3JvdXApID0+IHtcblx0XHRcdFx0aWYgKG1haWxHcm91cC51c2VyID09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnQubG9hZChHcm91cEluZm9UeXBlUmVmLCBncm91cE1lbWJlcnNoaXAuZ3JvdXBJbmZvKS50aGVuKChtYWlsR3JvdXBJbmZvKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gY29udGFpbnMoZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNGb3JHcm91cEluZm8obWFpbEdyb3VwSW5mbyksIG1haWxBZGRyZXNzKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lSWQobWFpbEdyb3VwLnVzZXIsIHVzZXIuX2lkKSkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEdyb3VwSW5mb1R5cGVSZWYsIHVzZXIudXNlckdyb3VwLmdyb3VwSW5mbykudGhlbigodXNlckdyb3VwSW5mbykgPT4ge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNvbnRhaW5zKGdldEVuYWJsZWRNYWlsQWRkcmVzc2VzRm9yR3JvdXBJbmZvKHVzZXJHcm91cEluZm8pLCBtYWlsQWRkcmVzcylcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG5vdCBzdXBwb3J0ZWRcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KS50aGVuKChmaWx0ZXJlZE1lbWJlcnNoaXBzKSA9PiB7XG5cdFx0XHRpZiAoZmlsdGVyZWRNZW1iZXJzaGlwcy5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIGZpbHRlcmVkTWVtYmVyc2hpcHNbMF0uZ3JvdXBcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBOb3RGb3VuZEVycm9yKFwiZ3JvdXAgZm9yIG1haWwgYWRkcmVzcyBub3QgZm91bmQgXCIgKyBtYWlsQWRkcmVzcylcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0YXN5bmMgY2xlYXJGb2xkZXIoZm9sZGVySWQ6IElkVHVwbGUpIHtcblx0XHRjb25zdCBkZWxldGVNYWlsRGF0YSA9IGNyZWF0ZURlbGV0ZU1haWxEYXRhKHtcblx0XHRcdGZvbGRlcjogZm9sZGVySWQsXG5cdFx0XHRtYWlsczogW10sXG5cdFx0fSlcblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5kZWxldGUoTWFpbFNlcnZpY2UsIGRlbGV0ZU1haWxEYXRhKVxuXHR9XG5cblx0YXN5bmMgdW5zdWJzY3JpYmUobWFpbElkOiBJZFR1cGxlLCByZWNpcGllbnQ6IHN0cmluZywgaGVhZGVyczogc3RyaW5nW10pIHtcblx0XHRjb25zdCBwb3N0RGF0YSA9IGNyZWF0ZUxpc3RVbnN1YnNjcmliZURhdGEoe1xuXHRcdFx0bWFpbDogbWFpbElkLFxuXHRcdFx0cmVjaXBpZW50LFxuXHRcdFx0aGVhZGVyczogaGVhZGVycy5qb2luKFwiXFxuXCIpLFxuXHRcdH0pXG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChMaXN0VW5zdWJzY3JpYmVTZXJ2aWNlLCBwb3N0RGF0YSlcblx0fVxuXG5cdGFzeW5jIGxvYWRBdHRhY2htZW50cyhtYWlsOiBNYWlsKTogUHJvbWlzZTxUdXRhbm90YUZpbGVbXT4ge1xuXHRcdGlmIChtYWlsLmF0dGFjaG1lbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXHRcdGNvbnN0IGF0dGFjaG1lbnRzTGlzdElkID0gbGlzdElkUGFydChtYWlsLmF0dGFjaG1lbnRzWzBdKVxuXHRcdGNvbnN0IGF0dGFjaG1lbnRFbGVtZW50SWRzID0gbWFpbC5hdHRhY2htZW50cy5tYXAoZWxlbWVudElkUGFydClcblxuXHRcdGNvbnN0IGJ1Y2tldEtleSA9IG1haWwuYnVja2V0S2V5XG5cdFx0bGV0IG93bmVyRW5jU2Vzc2lvbktleVByb3ZpZGVyOiBPd25lckVuY1Nlc3Npb25LZXlQcm92aWRlciB8IHVuZGVmaW5lZFxuXHRcdGlmIChidWNrZXRLZXkpIHtcblx0XHRcdGNvbnN0IHR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKEZpbGVUeXBlUmVmKVxuXHRcdFx0Y29uc3QgcmVzb2x2ZWRTZXNzaW9uS2V5cyA9IGF3YWl0IHRoaXMuY3J5cHRvLnJlc29sdmVXaXRoQnVja2V0S2V5KGFzc2VydE5vdE51bGwobWFpbC5idWNrZXRLZXkpLCBtYWlsLCB0eXBlTW9kZWwpXG5cdFx0XHRvd25lckVuY1Nlc3Npb25LZXlQcm92aWRlciA9IGFzeW5jIChpbnN0YW5jZUVsZW1lbnRJZDogSWQpOiBQcm9taXNlPFZlcnNpb25lZEVuY3J5cHRlZEtleT4gPT4ge1xuXHRcdFx0XHRjb25zdCBpbnN0YW5jZVNlc3Npb25LZXkgPSBhc3NlcnROb3ROdWxsKFxuXHRcdFx0XHRcdHJlc29sdmVkU2Vzc2lvbktleXMuaW5zdGFuY2VTZXNzaW9uS2V5cy5maW5kKChpbnN0YW5jZVNlc3Npb25LZXkpID0+IGluc3RhbmNlRWxlbWVudElkID09PSBpbnN0YW5jZVNlc3Npb25LZXkuaW5zdGFuY2VJZCksXG5cdFx0XHRcdClcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRrZXk6IGluc3RhbmNlU2Vzc2lvbktleS5zeW1FbmNTZXNzaW9uS2V5LFxuXHRcdFx0XHRcdGVuY3J5cHRpbmdLZXlWZXJzaW9uOiBOdW1iZXIoaW5zdGFuY2VTZXNzaW9uS2V5LnN5bUtleVZlcnNpb24pLFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkTXVsdGlwbGUoRmlsZVR5cGVSZWYsIGF0dGFjaG1lbnRzTGlzdElkLCBhdHRhY2htZW50RWxlbWVudElkcywgb3duZXJFbmNTZXNzaW9uS2V5UHJvdmlkZXIpXG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIG1haWwgaW4gY2FzZSBpdCBpcyBhIG1haWxEZXRhaWxzQmxvYlxuXHQgKi9cblx0YXN5bmMgbG9hZE1haWxEZXRhaWxzQmxvYihtYWlsOiBNYWlsKTogUHJvbWlzZTxNYWlsRGV0YWlscz4ge1xuXHRcdC8vIGlmIGlzRHJhZnRcblx0XHRpZiAobWFpbC5tYWlsRGV0YWlsc0RyYWZ0ICE9IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwibm90IHN1cHBvcnRlZCwgbXVzdCBiZSBtYWlsIGRldGFpbHMgYmxvYlwiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBtYWlsRGV0YWlsc0Jsb2JJZCA9IGFzc2VydE5vdE51bGwobWFpbC5tYWlsRGV0YWlscylcblxuXHRcdFx0Y29uc3QgbWFpbERldGFpbHNCbG9icyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRNdWx0aXBsZShcblx0XHRcdFx0TWFpbERldGFpbHNCbG9iVHlwZVJlZixcblx0XHRcdFx0bGlzdElkUGFydChtYWlsRGV0YWlsc0Jsb2JJZCksXG5cdFx0XHRcdFtlbGVtZW50SWRQYXJ0KG1haWxEZXRhaWxzQmxvYklkKV0sXG5cdFx0XHRcdHRoaXMua2V5UHJvdmlkZXJGcm9tSW5zdGFuY2UobWFpbCksXG5cdFx0XHQpXG5cdFx0XHRpZiAobWFpbERldGFpbHNCbG9icy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0dGhyb3cgbmV3IE5vdEZvdW5kRXJyb3IoYE1haWxEZXRhaWxzQmxvYiAke21haWxEZXRhaWxzQmxvYklkfWApXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWFpbERldGFpbHNCbG9ic1swXS5kZXRhaWxzXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBrZXlQcm92aWRlckZyb21JbnN0YW5jZShtYWlsOiBNYWlsKSB7XG5cdFx0cmV0dXJuIGFzeW5jICgpID0+ICh7XG5cdFx0XHRrZXk6IGFzc2VydE5vdE51bGwobWFpbC5fb3duZXJFbmNTZXNzaW9uS2V5KSxcblx0XHRcdGVuY3J5cHRpbmdLZXlWZXJzaW9uOiBOdW1iZXIobWFpbC5fb3duZXJLZXlWZXJzaW9uKSxcblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIEBwYXJhbSBtYWlsIGluIGNhc2UgaXQgaXMgYSBtYWlsRGV0YWlsc0RyYWZ0XG5cdCAqL1xuXHRhc3luYyBsb2FkTWFpbERldGFpbHNEcmFmdChtYWlsOiBNYWlsKTogUHJvbWlzZTxNYWlsRGV0YWlscz4ge1xuXHRcdC8vIGlmIG5vdCBpc0RyYWZ0XG5cdFx0aWYgKG1haWwubWFpbERldGFpbHNEcmFmdCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIm5vdCBzdXBwb3J0ZWQsIG11c3QgYmUgbWFpbCBkZXRhaWxzIGRyYWZ0XCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGRldGFpbHNEcmFmdElkID0gYXNzZXJ0Tm90TnVsbChtYWlsLm1haWxEZXRhaWxzRHJhZnQpXG5cblx0XHRcdGNvbnN0IG1haWxEZXRhaWxzRHJhZnRzID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKFxuXHRcdFx0XHRNYWlsRGV0YWlsc0RyYWZ0VHlwZVJlZixcblx0XHRcdFx0bGlzdElkUGFydChkZXRhaWxzRHJhZnRJZCksXG5cdFx0XHRcdFtlbGVtZW50SWRQYXJ0KGRldGFpbHNEcmFmdElkKV0sXG5cdFx0XHRcdHRoaXMua2V5UHJvdmlkZXJGcm9tSW5zdGFuY2UobWFpbCksXG5cdFx0XHQpXG5cdFx0XHRpZiAobWFpbERldGFpbHNEcmFmdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHRocm93IG5ldyBOb3RGb3VuZEVycm9yKGBNYWlsRGV0YWlsc0RyYWZ0ICR7ZGV0YWlsc0RyYWZ0SWR9YClcblx0XHRcdH1cblx0XHRcdHJldHVybiBtYWlsRGV0YWlsc0RyYWZ0c1swXS5kZXRhaWxzXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIGxhYmVsIChha2EgTWFpbFNldCBha2Ege0BsaW5rIE1haWxGb2xkZXJ9IG9mIGtpbmQge0BsaW5rIE1haWxTZXRLaW5kLkxBQkVMfSkgZm9yIHRoZSBncm91cCB7QHBhcmFtIG1haWxHcm91cElkfS5cblx0ICovXG5cdGFzeW5jIGNyZWF0ZUxhYmVsKG1haWxHcm91cElkOiBJZCwgbGFiZWxEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9KSB7XG5cdFx0Y29uc3QgbWFpbEdyb3VwS2V5ID0gYXdhaXQgdGhpcy5rZXlMb2FkZXJGYWNhZGUuZ2V0Q3VycmVudFN5bUdyb3VwS2V5KG1haWxHcm91cElkKVxuXHRcdGNvbnN0IHNrID0gYWVzMjU2UmFuZG9tS2V5KClcblx0XHRjb25zdCBvd25lckVuY1Nlc3Npb25LZXkgPSBlbmNyeXB0S2V5V2l0aFZlcnNpb25lZEtleShtYWlsR3JvdXBLZXksIHNrKVxuXG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IucG9zdChcblx0XHRcdE1hbmFnZUxhYmVsU2VydmljZSxcblx0XHRcdGNyZWF0ZU1hbmFnZUxhYmVsU2VydmljZVBvc3RJbih7XG5cdFx0XHRcdG93bmVyR3JvdXA6IG1haWxHcm91cElkLFxuXHRcdFx0XHRvd25lckVuY1Nlc3Npb25LZXk6IG93bmVyRW5jU2Vzc2lvbktleS5rZXksXG5cdFx0XHRcdG93bmVyS2V5VmVyc2lvbjogU3RyaW5nKG93bmVyRW5jU2Vzc2lvbktleS5lbmNyeXB0aW5nS2V5VmVyc2lvbiksXG5cdFx0XHRcdGRhdGE6IGNyZWF0ZU1hbmFnZUxhYmVsU2VydmljZUxhYmVsRGF0YSh7XG5cdFx0XHRcdFx0bmFtZTogbGFiZWxEYXRhLm5hbWUsXG5cdFx0XHRcdFx0Y29sb3I6IGxhYmVsRGF0YS5jb2xvcixcblx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHRcdHtcblx0XHRcdFx0c2Vzc2lvbktleTogc2ssXG5cdFx0XHR9LFxuXHRcdClcblx0fVxuXG5cdC8qXG5cdCAqIFVwZGF0ZSBhIGxhYmVsLCBpZiBuZWVkZWRcblx0ICogQHBhcmFtIGxhYmVsIGV4aXN0aW5nIGxhYmVsXG5cdCAqIEBwYXJhbSBuYW1lIHBvc3NpYmxlIG5ldyBuYW1lIGZvciBsYWJlbFxuXHQgKiBAcGFyYW0gY29sb3IgcG9zc2libGUgbmV3IGNvbG9yIGZvciBsYWJlbFxuXHQgKi9cblx0YXN5bmMgdXBkYXRlTGFiZWwobGFiZWw6IE1haWxGb2xkZXIsIG5hbWU6IHN0cmluZywgY29sb3I6IHN0cmluZykge1xuXHRcdGlmIChuYW1lICE9PSBsYWJlbC5uYW1lIHx8IGNvbG9yICE9IGxhYmVsLmNvbG9yKSB7XG5cdFx0XHRsYWJlbC5uYW1lID0gbmFtZVxuXHRcdFx0bGFiZWwuY29sb3IgPSBjb2xvclxuXHRcdFx0YXdhaXQgdGhpcy5lbnRpdHlDbGllbnQudXBkYXRlKGxhYmVsKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGRlbGV0ZUxhYmVsKGxhYmVsOiBNYWlsRm9sZGVyKSB7XG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZGVsZXRlKFxuXHRcdFx0TWFuYWdlTGFiZWxTZXJ2aWNlLFxuXHRcdFx0Y3JlYXRlTWFuYWdlTGFiZWxTZXJ2aWNlRGVsZXRlSW4oe1xuXHRcdFx0XHRsYWJlbDogbGFiZWwuX2lkLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgYXBwbHlMYWJlbHMobWFpbHM6IHJlYWRvbmx5IE1haWxbXSwgYWRkZWRMYWJlbHM6IHJlYWRvbmx5IE1haWxGb2xkZXJbXSwgcmVtb3ZlZExhYmVsczogcmVhZG9ubHkgTWFpbEZvbGRlcltdKSB7XG5cdFx0Y29uc3QgcG9zdEluID0gY3JlYXRlQXBwbHlMYWJlbFNlcnZpY2VQb3N0SW4oe1xuXHRcdFx0bWFpbHM6IG1haWxzLm1hcCgobWFpbCkgPT4gbWFpbC5faWQpLFxuXHRcdFx0YWRkZWRMYWJlbHM6IGFkZGVkTGFiZWxzLm1hcCgobGFiZWwpID0+IGxhYmVsLl9pZCksXG5cdFx0XHRyZW1vdmVkTGFiZWxzOiByZW1vdmVkTGFiZWxzLm1hcCgobGFiZWwpID0+IGxhYmVsLl9pZCksXG5cdFx0fSlcblx0XHRhd2FpdCB0aGlzLnNlcnZpY2VFeGVjdXRvci5wb3N0KEFwcGx5TGFiZWxTZXJ2aWNlLCBwb3N0SW4pXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBoaXNoaW5nTWFya2VyVmFsdWUodHlwZTogUmVwb3J0ZWRNYWlsRmllbGRUeXBlLCB2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcblx0cmV0dXJuIHR5cGUgKyBtdXJtdXJIYXNoKHZhbHVlLnJlcGxhY2UoL1xccy9nLCBcIlwiKSlcbn1cblxuZnVuY3Rpb24gcGFyc2VVcmwobGluazogc3RyaW5nKTogVVJMIHwgbnVsbCB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIG5ldyBVUkwobGluaylcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiBudWxsXG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0VXJsRG9tYWluKGxpbms6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuXHRjb25zdCB1cmwgPSBwYXJzZVVybChsaW5rKVxuXHRyZXR1cm4gdXJsICYmIHVybC5ob3N0bmFtZVxufVxuXG5mdW5jdGlvbiByZWNpcGllbnRUb0RyYWZ0UmVjaXBpZW50KHJlY2lwaWVudDogUGFydGlhbFJlY2lwaWVudCk6IERyYWZ0UmVjaXBpZW50IHtcblx0cmV0dXJuIGNyZWF0ZURyYWZ0UmVjaXBpZW50KHtcblx0XHRuYW1lOiByZWNpcGllbnQubmFtZSA/PyBcIlwiLFxuXHRcdG1haWxBZGRyZXNzOiByZWNpcGllbnQuYWRkcmVzcyxcblx0fSlcbn1cblxuZnVuY3Rpb24gcmVjaXBpZW50VG9FbmNyeXB0ZWRNYWlsQWRkcmVzcyhyZWNpcGllbnQ6IFBhcnRpYWxSZWNpcGllbnQpOiBFbmNyeXB0ZWRNYWlsQWRkcmVzcyB7XG5cdHJldHVybiBjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyh7XG5cdFx0bmFtZTogcmVjaXBpZW50Lm5hbWUgPz8gXCJcIixcblx0XHRhZGRyZXNzOiByZWNpcGllbnQuYWRkcmVzcyxcblx0fSlcbn1cblxuLyoqXG4gKiBWZXJpZnkgYWxsIGF0dGFjaG1lbnRzIGNvbnRhaW4gY29ycmVjdGx5IGZvcm1hdHRlZCBNSU1FIHR5cGVzLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGV5IGNhbiBiZSBzZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IHZlcmlmeSB0aGF0IHRoZSBtaW1lIHR5cGUgYWN0dWFsbHkgY29ycmVzcG9uZHMgdG8gYSBrbm93biBNSU1FIHR5cGUuXG4gKiBAcGFyYW0gYXR0YWNobWVudHNcbiAqIEB0aHJvd3Mge1Byb2dyYW1taW5nRXJyb3J9IGlmIGEgTUlNRSB0eXBlIGlzIHNvbWVob3cgbm90IGNvcnJlY3RseSBmb3JtYXR0ZWQgZm9yIGF0IGxlYXN0IG9uZSBhdHRhY2htZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU1pbWVUeXBlc0ZvckF0dGFjaG1lbnRzKGF0dGFjaG1lbnRzOiBBdHRhY2htZW50cykge1xuXHRjb25zdCByZWdleCA9IC9eXFx3K1xcL1tcXHcuKy1dKz8oO1xccypbXFx3ListXSs9KFtcXHcuKy1dK3xcIltcXHdcXHMsListXStcIikpKiQvZ1xuXHRmb3IgKGNvbnN0IGF0dGFjaG1lbnQgb2YgYXR0YWNobWVudHMpIHtcblx0XHRpZiAoaXNEYXRhRmlsZShhdHRhY2htZW50KSB8fCBpc0ZpbGVSZWZlcmVuY2UoYXR0YWNobWVudCkpIHtcblx0XHRcdGlmICghYXR0YWNobWVudC5taW1lVHlwZS5tYXRjaChyZWdleCkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYCR7YXR0YWNobWVudC5taW1lVHlwZX0gaXMgbm90IGEgY29ycmVjdGx5IGZvcm1hdHRlZCBtaW1ldHlwZSAoJHthdHRhY2htZW50Lm5hbWV9KWApXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iXSwibWFw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