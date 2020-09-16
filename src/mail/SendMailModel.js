// @flow
import type {ConversationTypeEnum, MailMethodEnum} from "../api/common/TutanotaConstants"
import {ConversationType, MAX_ATTACHMENT_SIZE, OperationType, ReplyType} from "../api/common/TutanotaConstants"
import {load, setup, update} from "../api/main/Entity"
import {worker} from "../api/main/WorkerClient"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {isExternal} from "../api/common/RecipientInfo"
import {
	AccessBlockedError,
	LockedError,
	NotAuthorizedError,
	NotFoundError,
	PreconditionFailedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {UserError} from "../api/common/error/UserError"
import {assertMainOrNode} from "../api/Env"
import {getPasswordStrength} from "../misc/PasswordUtils"
import {assertNotNull, downcast, neverNull} from "../api/common/utils/Utils"
import {
	createRecipientInfo,
	getDefaultSender,
	getEmailSignature,
	getEnabledMailAddressesWithUser,
	getMailboxName,
	getSenderNameForUser,
	resolveRecipientInfo,
	resolveRecipientInfoContact
} from "./MailUtils"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import {FileTypeRef} from "../api/entities/tutanota/File"
import {ConversationEntryTypeRef} from "../api/entities/tutanota/ConversationEntry"
import type {Mail} from "../api/entities/tutanota/Mail"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import type {Contact} from "../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {isSameId, stringToCustomId} from "../api/common/EntityFunctions"
import {FileNotFoundError} from "../api/common/error/FileNotFoundError"
import type {LoginController} from "../api/main/LoginController"
import type {MailAddress} from "../api/entities/tutanota/MailAddress"
import type {MailboxDetail} from "./MailModel"
import {MailModel} from "./MailModel"
import {LazyContactListId} from "../contacts/ContactUtils"
import {RecipientNotResolvedError} from "../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream/stream.js"
import type {EntityEventsListener} from "../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../api/main/EventController"
import type {InlineImages} from "./MailViewer"
import {isMailAddress} from "../misc/FormatValidator"
import {createApprovalMail} from "../api/entities/monitor/ApprovalMail"
import type {EncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {remove} from "../api/common/utils/ArrayUtils"
import type {ContactModel} from "../contacts/ContactModel"
import {getAvailableLanguageCode, lang} from "../misc/LanguageViewModel"
import {RecipientsNotFoundError} from "../api/common/error/RecipientsNotFoundError"
import {checkApprovalStatus} from "../misc/LoginUtils"

assertMainOrNode()

export type Recipient = {name: ?string, address: string, contact?: ?Contact}
export type RecipientList = $ReadOnlyArray<Recipient>
export type Recipients = {to?: RecipientList, cc?: RecipientList, bcc?: RecipientList}

// Because MailAddress does not have contact of the right type (event when renamed on Recipient) MailAddress <: Recipient does not hold
function toRecipient({address, name}: MailAddress): Recipient {
	return {name, address}
}

type EditorAttachment = TutanotaFile | DataFile | FileReference
type RecipientField = "to" | "cc" | "bcc"

/**
 * Model which allows sending mails interactively - including resolving of recipients and handling of drafts.
 */
export class SendMailModel {
	draft: ?Mail;
	recipientsChanged: Stream<void>;
	_logins: LoginController;
	_contactModel: ContactModel;
	_mailModel: MailModel;
	_eventController: EventController;
	_senderAddress: string;
	_selectedNotificationLanguage: string;
	_toRecipients: Array<RecipientInfo>;
	_ccRecipients: Array<RecipientInfo>;
	_bccRecipients: Array<RecipientInfo>;
	_replyTos: Array<RecipientInfo>;
	_subject: Stream<string>;
	_body: string; // only defined till the editor is initialized
	_conversationType: ConversationTypeEnum;
	_previousMessageId: ?Id; // only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	_confidentialButtonState: boolean;

	_attachments: Array<EditorAttachment>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_mailChanged: boolean;
	_previousMail: ?Mail;
	_entityEventReceived: EntityEventsListener;
	_mailboxDetails: MailboxDetail;

	_objectURLs: Array<string>;
	_blockExternalContent: boolean;
	_mentionedInlineImages: Array<string>
	// TODO handle inline images when using SendMailModel for MailEditor
	/** HTML elements which correspond to inline images. We need them to check that they are removed/remove them later */
	_inlineImageElements: Array<HTMLElement>;

	/**
	 * Creates a new draft message. Invoke initAsResponse or initFromDraft if this message should be a response
	 * to an existing message or edit an existing draft.
	 *
	 */
	constructor(logins: LoginController, mailModel: MailModel, contactModel: ContactModel, eventController: EventController,
	            mailboxDetails: MailboxDetail) {
		this._logins = logins
		this._mailModel = mailModel
		this._contactModel = contactModel
		this._eventController = eventController
		this._conversationType = ConversationType.NEW
		this._toRecipients = []
		this._ccRecipients = []
		this._bccRecipients = []
		this._replyTos = []
		this._attachments = []
		this._mailChanged = false
		this._previousMail = null
		this.draft = null
		this._mailboxDetails = mailboxDetails
		this._objectURLs = []
		this._blockExternalContent = true
		this._mentionedInlineImages = []
		this._inlineImageElements = []
		this.recipientsChanged = stream(undefined)

		let props = this._logins.getUserController().props

		this._senderAddress = getDefaultSender(logins, this._mailboxDetails)

		this._entityEventReceived = (updates) => {
			return Promise.each(updates, update => {
				return this._handleEntityEvent(update)
			}).return()
		}

		this._eventController.addEntityListener(this._entityEventReceived)

		// TODO allow selecting notification language when changing MailEditor
		// let sortedLanguages = languages.slice().sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		this._selectedNotificationLanguage = getAvailableLanguageCode(props.notificationMailLanguage || lang.code)

		// getTemplateLanguages(this._logins, sortedLanguages)
		// 	.then((filteredLanguages) => {
		// 		if (filteredLanguages.length > 0) {
		// 			const languageCodes = filteredLanguages.map(l => l.code)
		// 			this._selectedNotificationLanguage = _getSubstitutedLanguageCode(props.notificationMailLanguage
		// 				|| lang.code, languageCodes) || languageCodes[0]
		// 			sortedLanguages = filteredLanguages
		// 		}
		// 	})

		this._confidentialButtonState = !props.defaultUnconfidential
		this._subject = stream("")

		// TODO detect changes
		this._subject.map(() => this._mailChanged = true)

		this._mailChanged = false
	}

	setSubject(subject: string) {
		this._subject(subject)
	}

	selectSender(senderAddress: string) {
		this._senderAddress = senderAddress
	}

	getPasswordStrength(recipientInfo: RecipientInfo) {
		const contact = assertNotNull(recipientInfo.contact)
		let reserved = getEnabledMailAddressesWithUser(this._mailboxDetails, this._logins.getUserController().userGroupInfo).concat(
			getMailboxName(this._logins, this._mailboxDetails),
			recipientInfo.mailAddress,
			recipientInfo.name
		)
		return Math.min(100, getPasswordStrength(contact.presharedPassword || "", reserved) / 0.8)
	}

	initAsResponse({
		               previousMail, conversationType, senderMailAddress, recipients, attachments, subject, bodyText, replyTos,
		               addSignature, inlineImages, blockExternalContent
	               }: {
		previousMail: Mail,
		conversationType: ConversationTypeEnum,
		senderMailAddress: string,
		recipients: Recipients,
		attachments: TutanotaFile[],
		subject: string,
		bodyText: string,
		replyTos: EncryptedMailAddress[],
		addSignature: boolean,
		inlineImages?: ?Promise<InlineImages>,
		blockExternalContent: boolean
	}): Promise<void> {
		this._blockExternalContent = blockExternalContent
		if (addSignature) {
			bodyText = "<br/><br/><br/>" + bodyText
			let signature = getEmailSignature()
			if (this._logins.getUserController().isInternalUser() && signature) {
				bodyText = signature + bodyText
			}
		}
		let previousMessageId: ?string = null
		return load(ConversationEntryTypeRef, previousMail.conversationEntry)
			.then(ce => {
				previousMessageId = ce.messageId
			})
			.catch(NotFoundError, e => {
				console.log("could not load conversation entry", e);
			})
			.then(() => {
				return this._setMailData(previousMail, previousMail.confidential, conversationType, previousMessageId, senderMailAddress,
					recipients, attachments, subject, bodyText, replyTos)
			})
	}

	initWithTemplate(recipients: Recipients, subject: string, bodyText: string, confidential: ?boolean, senderMailAddress?: string): Promise<void> {
		const sender = senderMailAddress ? senderMailAddress : this._senderAddress

		this._setMailData(null, confidential, ConversationType.NEW, null, sender, recipients, [], subject, bodyText, [])
		return Promise.resolve()
	}

	initFromDraft({draftMail, attachments, bodyText, inlineImages, blockExternalContent}: {
		draftMail: Mail,
		attachments: TutanotaFile[],
		bodyText: string,
		blockExternalContent: boolean,
		inlineImages?: Promise<InlineImages>
	}): Promise<void> {
		let conversationType: ConversationTypeEnum = ConversationType.NEW
		let previousMessageId: ?string = null
		let previousMail: ?Mail = null
		this.draft = draftMail
		this._blockExternalContent = blockExternalContent

		return load(ConversationEntryTypeRef, draftMail.conversationEntry).then(ce => {
			conversationType = downcast(ce.conversationType)
			if (ce.previous) {
				return load(ConversationEntryTypeRef, ce.previous).then(previousCe => {
					previousMessageId = previousCe.messageId
					if (previousCe.mail) {
						return load(MailTypeRef, previousCe.mail).then(mail => {
							previousMail = mail
						})
					}
				}).catch(NotFoundError, e => {
					// ignore
				})
			}
		}).then(() => {
			const {confidential, sender, toRecipients, ccRecipients, bccRecipients, subject, replyTos} = draftMail
			const recipients: Recipients = {
				to: toRecipients.map(toRecipient),
				cc: ccRecipients.map(toRecipient),
				bcc: bccRecipients.map(toRecipient),
			}
			// We don't want to wait for the editor to be initialized, otherwise it will never be shown
			return this._setMailData(previousMail, confidential, conversationType, previousMessageId, sender.address, recipients, attachments,
				subject, bodyText, replyTos)
		})
	}

	_setMailData(previousMail: ?Mail, confidential: ?boolean, conversationType: ConversationTypeEnum, previousMessageId: ?string,
	             senderMailAddress: string, recipients: Recipients, attachments: $ReadOnlyArray<TutanotaFile>, subject: string,
	             body: string, replyTos: EncryptedMailAddress[]): Promise<void> {
		this._previousMail = previousMail
		this._conversationType = conversationType
		this._previousMessageId = previousMessageId
		if (confidential != null) {
			this._confidentialButtonState = confidential
		}
		this._senderAddress = senderMailAddress
		this._subject(subject)
		this._attachments = []

		this.attachFiles(attachments)
		const makeRecipientInfo = (r: Recipient) => this._createRecipientInfo(r.name, r.address, r.contact, false)

		const {to = [], cc = [], bcc = []} = recipients
		this._toRecipients = to.filter(r => isMailAddress(r.address, false))
		                       .map(makeRecipientInfo)
		this._ccRecipients = cc.filter(r => isMailAddress(r.address, false))
		                       .map(makeRecipientInfo)
		this._bccRecipients = bcc.filter(r => isMailAddress(r.address, false))
		                         .map(makeRecipientInfo)
		this._replyTos = replyTos.map(ema => {
			const ri = createRecipientInfo(ema.address, ema.name, null)
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this._logins.getUserController().user)
					.then(() => this.recipientsChanged(undefined))
			}
			return ri
		})
		this._mailChanged = false
		return Promise.resolve()
	}

	_createRecipientInfo(name: ?string, address: string, contact: ?Contact, resolveLazily: boolean): RecipientInfo {
		const ri = createRecipientInfo(address, name, contact)
		if (!resolveLazily) {
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this._logins.getUserController().user)
					.then(() => this.recipientsChanged(undefined))
			}
			resolveRecipientInfo(this._mailModel, ri).then(() => this.recipientsChanged(undefined))
		}
		return ri
	}

	addRecipient(type: RecipientField, recipient: Recipient, resolveLazily: boolean = false): RecipientInfo {
		const recipientInfo = this._createRecipientInfo(recipient.name, recipient.address, recipient.contact, resolveLazily)
		this._recipientList(type).push(recipientInfo)
		this._mailChanged = true
		this.recipientsChanged(undefined)
		return recipientInfo
	}

	removeRecipient(type: RecipientField, recipient: RecipientInfo) {
		remove(this._recipientList(type), recipient)
		this.recipientsChanged(undefined)
	}

	setPassword(recipient: RecipientInfo, password: string) {
		if (recipient.contact) {
			recipient.contact.presharedPassword = password
		}
		this.recipientsChanged(undefined)
		return recipient
	}

	_recipientList(type: RecipientField): Array<RecipientInfo> {
		if (type === "to") {
			return this._toRecipients
		} else if (type === "cc") {
			return this._ccRecipients
		} else if (type === "bcc") {
			return this._bccRecipients
		}
		throw new Error()
	}


	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived)
	}

	/** @throws UserError in case files are too big to add */
	attachFiles(files: $ReadOnlyArray<EditorAttachment>): void {
		let totalSize = 0
		this._attachments.forEach(file => {
			totalSize += Number(file.size)
		})
		const tooBigFiles: Array<string> = [];
		files.forEach(file => {
			if (totalSize + Number(file.size) > MAX_ATTACHMENT_SIZE) {
				tooBigFiles.push(file.name)
			} else {
				totalSize += Number(file.size)
				this._attachments.push(file)
			}
		})
		if (tooBigFiles.length > 0) {
			throw new UserError(() => lang.get("tooBigAttachment_msg") + tooBigFiles.join(", "))
		}
		this._mailChanged = true
	}

	/**
	 * Saves the draft.
	 * @param saveAttachments True if also the attachments shall be saved, false otherwise.
	 * @returns {Promise} When finished.
	 * @throws FileNotFoundError when one of the attachments could not be opened
	 * @throws PreconditionFailedError when the draft is locked
	 */
	saveDraft(body: string, saveAttachments: boolean, mailMethod: MailMethodEnum): Promise<void> {
		const attachments = (saveAttachments) ? this._attachments : null
		const {draft} = this
		return Promise.resolve(draft == null
			? this._createDraft(body, attachments, mailMethod)
			: this._updateDraft(body, attachments, draft)
		).then((draft) => {
			this.draft = draft
			return Promise.map(draft.attachments, fileId => load(FileTypeRef, fileId)).then(attachments => {
				this._attachments = [] // attachFiles will push to existing files but we want to overwrite them
				this.attachFiles(attachments)
				this._mailChanged = false
			})
		})
	}

	_getSenderName() {
		return getSenderNameForUser(this._mailboxDetails, this._logins.getUserController())
	}

	_updateDraft(body: string, attachments: ?$ReadOnlyArray<EditorAttachment>, draft: Mail) {
		return worker
			.updateMailDraft(this._subject(), body, this._senderAddress, this._getSenderName(), this._toRecipients,
				this._ccRecipients, this._bccRecipients, attachments, this.isConfidential(), draft)
			.catch(LockedError, (e) => {
				console.log("updateDraft: operation is still active", e)
				throw new UserError("operationStillActive_msg")
			})
			.catch(NotFoundError, () => {
				console.log("draft has been deleted, creating new one")
				return this._createDraft(body, attachments, downcast(draft.method))
			})
	}

	_createDraft(body: string, attachments: ?$ReadOnlyArray<EditorAttachment>, mailMethod: MailMethodEnum): Promise<Mail> {
		return worker.createMailDraft(this._subject(), body,
			this._senderAddress, this._getSenderName(), this._toRecipients, this._ccRecipients, this._bccRecipients, this._conversationType,
			this._previousMessageId, attachments, this.isConfidential(), this._replyTos, mailMethod)
	}

	isConfidential(): boolean {
		return this._confidentialButtonState || !this._containsExternalRecipients()
	}

	setConfidential(confidentialButtonState: boolean): void {
		this._confidentialButtonState = confidentialButtonState
	}

	_containsExternalRecipients(): boolean {
		return (this._allRecipients().find(r => isExternal(r)) != null)
	}

	/**
	 * @param calendarFileMethods map from file id to calendar method
	 * @reject {RecipientNotResolvedError}
	 * @reject {RecipientsNotFoundError}
	 * @reject {TooManyRequestsError}
	 * @reject {AccessBlockedError}
	 * @reject {FileNotFoundError}
	 * @reject {PreconditionFailedError}
	 * @reject {LockedError}
	 * @reject {UserError}
	 */
	send(body: string, mailMethod: MailMethodEnum): Promise<*> {
		return Promise
			.resolve()
			.then(() => {
				if (this._toRecipients.length === 0 && this._ccRecipients.length === 0 && this._bccRecipients.length === 0) {
					throw new UserError("noRecipients_msg")
				}
			})
			.then(() => {
				return this
					._waitForResolvedRecipients() // Resolve all added recipients before trying to send it
					.then((recipients) => {
						if (recipients.length === 1 && recipients[0].mailAddress.toLowerCase().trim() === "approval@tutao.de") {
							return [recipients, true]
						} else {
							return this.saveDraft(body, /*saveAttachments*/true, mailMethod)
							           .return([recipients, false])
						}
					})
					.then(([resolvedRecipients, isApprovalMail]) => {
						if (isApprovalMail) {
							return this._sendApprovalMail(body)
						} else {
							let externalRecipients = resolvedRecipients.filter(r => isExternal(r))
							if (this._confidentialButtonState && externalRecipients.length > 0
								&& externalRecipients.some(r => r.contact
									&& (r.contact.presharedPassword == null || r.contact.presharedPassword.trim() === ""))) {
								throw new UserError("noPreSharedPassword_msg")
							}

							let sendMailConfirm = Promise.resolve(true)

							return sendMailConfirm.then(ok => {
								if (ok) {
									return this._updateContacts(resolvedRecipients)
									           .then(() => worker.sendMailDraft(
										           neverNull(this.draft),
										           resolvedRecipients,
										           this._selectedNotificationLanguage,
									           ))
									           .then(() => this._updatePreviousMail())
									           .then(() => this._updateExternalLanguage())
									           .catch(LockedError, () => {throw new UserError("operationStillActive_msg")})
								}
							})
						}
					})

					.catch(RecipientNotResolvedError, () => {throw new UserError("tooManyAttempts_msg")})
					.catch(RecipientsNotFoundError, (e) => {
						let invalidRecipients = e.message.join("\n")
						throw new UserError(() => lang.get("invalidRecipients_msg") + "\n" + invalidRecipients)
					})
					.catch(TooManyRequestsError, () => {throw new UserError("tooManyMails_msg")})
					.catch(AccessBlockedError, e => {
						// special case: the approval status is set to SpamSender, but the update has not been received yet, so use SpamSender as default
						return checkApprovalStatus(true, "4")
							.then(() => {
								console.log("could not send mail (blocked access)", e)
							})
					})
					.catch(FileNotFoundError, () => {throw new UserError("couldNotAttachFile_msg")})
					.catch(PreconditionFailedError, () => {throw new UserError("operationStillActive_msg")})
			})
	}

	_sendApprovalMail(body: string) {
		const listId = "---------c--";
		const m = createApprovalMail({
			_id: [listId, stringToCustomId(this._senderAddress)],
			_ownerGroup: this._logins.getUserController().user.userGroup.group,
			text: `Subject: ${this._subject()}<br>${body}`,
		})
		return setup(listId, m)
			.catch(NotAuthorizedError, e => console.log("not authorized for approval message"))
	}

	_updateExternalLanguage() {
		let props = this._logins.getUserController().props
		if (props.notificationMailLanguage !== this._selectedNotificationLanguage) {
			props.notificationMailLanguage = this._selectedNotificationLanguage
			update(props)
		}
	}

	_updatePreviousMail(): Promise<void> {
		if (this._previousMail) {
			if (this._previousMail.replyType === ReplyType.NONE && this._conversationType === ConversationType.REPLY) {
				this._previousMail.replyType = ReplyType.REPLY
			} else if (this._previousMail.replyType === ReplyType.NONE
				&& this._conversationType === ConversationType.FORWARD) {
				this._previousMail.replyType = ReplyType.FORWARD
			} else if (this._previousMail.replyType === ReplyType.FORWARD
				&& this._conversationType === ConversationType.REPLY) {
				this._previousMail.replyType = ReplyType.REPLY_FORWARD
			} else if (this._previousMail.replyType === ReplyType.REPLY
				&& this._conversationType === ConversationType.FORWARD) {
				this._previousMail.replyType = ReplyType.REPLY_FORWARD
			} else {
				return Promise.resolve()
			}
			return update(this._previousMail).catch(NotFoundError, e => {
				// ignore
			})
		} else {
			return Promise.resolve();
		}
	}

	_updateContacts(resolvedRecipients: RecipientInfo[]): Promise<any> {
		return Promise.all(resolvedRecipients.map(r => {
			const {contact} = r
			if (contact) {
				if (!contact._id
					&& (!this._logins.getUserController().props.noAutomaticContacts || (isExternal(r) && this._confidentialButtonState))
				) {
					if (isExternal(r) && this._confidentialButtonState) {
						contact.presharedPassword = this._getPassword(r).trim()
					}
					return LazyContactListId.getAsync().then(listId => {
						return setup(listId, contact)
					})
				} else if (contact._id
					&& isExternal(r)
					&& this._confidentialButtonState
					&& contact.presharedPassword !== this._getPassword(r).trim()
				) {
					contact.presharedPassword = this._getPassword(r).trim()
					return update(contact)
				} else {
					return Promise.resolve()
				}
			} else {
				return Promise.resolve()
			}
		}))
	}

	_getPassword(r: RecipientInfo): string {
		return r.contact && r.contact.presharedPassword || ""
	}

	_allRecipients(): Array<RecipientInfo> {
		return this._toRecipients
		           .concat(this._ccRecipients)
		           .concat(this._bccRecipients)
	}

	/**
	 * Makes sure the recipient type and contact are resolved.
	 */
	_waitForResolvedRecipients(): Promise<RecipientInfo[]> {
		return Promise.all(this._allRecipients().map(recipientInfo => {
			return resolveRecipientInfo(this._mailModel, recipientInfo).then(recipientInfo => {
				if (recipientInfo.resolveContactPromise) {
					return recipientInfo.resolveContactPromise.return(recipientInfo)
				} else {
					return recipientInfo
				}
			})
		})).catch(TooManyRequestsError, () => {
			throw new RecipientNotResolvedError()
		})
	}

	_handleEntityEvent(update: EntityUpdateData): Promise<void> {
		const {operation, instanceId, instanceListId} = update
		if (isUpdateForTypeRef(ContactTypeRef, update)
			&& (operation === OperationType.UPDATE || operation === OperationType.DELETE)) {
			let contactId: IdTuple = [neverNull(instanceListId), instanceId]

			this._allRecipients().forEach(recipient => {
				if (recipient.contact && recipient.contact._id && isSameId(recipient.contact._id, contactId)) {
					if (operation === OperationType.UPDATE) {
						// TODO
						// this._updateBubble(bubbles, bubble, contactId)
					} else {
						// TODO
						// this._removeBubble(bubble)
					}
				}
			})
		}
		return Promise.resolve()
	}
}