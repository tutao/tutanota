// @flow
import type {ConversationTypeEnum, MailMethodEnum} from "../../api/common/TutanotaConstants"
import {
	ApprovalStatus,
	ConversationType,
	MailFolderType,
	MAX_ATTACHMENT_SIZE,
	OperationType,
	ReplyType
} from "../../api/common/TutanotaConstants"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import {isExternal} from "../../api/common/RecipientInfo"
import {
	AccessBlockedError,
	LockedError,
	NotAuthorizedError,
	NotFoundError,
	PayloadTooLargeError,
	PreconditionFailedError,
	TooManyRequestsError
} from "../../api/common/error/RestError"
import {UserError} from "../../api/main/UserError"
import {assertMainOrNode} from "../../api/common/Env"
import {getPasswordStrengthForUser, isSecurePassword, PASSWORD_MIN_SECURE_VALUE} from "../../misc/PasswordUtils"
import {downcast, neverNull, noOp} from "../../api/common/utils/Utils"
import {
	createRecipientInfo,
	getDefaultSender,
	getEnabledMailAddressesWithUser,
	getSenderNameForUser,
	getTemplateLanguages,
	resolveRecipientInfo,
	resolveRecipientInfoContact
} from "../model/MailUtils"
import type {File as TutanotaFile} from "../../api/entities/tutanota/File"
import {FileTypeRef} from "../../api/entities/tutanota/File"
import {ConversationEntryTypeRef} from "../../api/entities/tutanota/ConversationEntry"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {MailTypeRef} from "../../api/entities/tutanota/Mail"
import type {Contact} from "../../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import type {MailAddress} from "../../api/entities/tutanota/MailAddress"
import type {MailboxDetail, MailModel} from "../model/MailModel"
import {RecipientNotResolvedError} from "../../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream/stream.js"
import type {EntityEventsListener, EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {isMailAddress} from "../../misc/FormatValidator"
import {createApprovalMail} from "../../api/entities/monitor/ApprovalMail"
import type {EncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {deduplicate, remove} from "../../api/common/utils/ArrayUtils"
import type {ContactModel} from "../../contacts/model/ContactModel"
import type {Language, TranslationKey} from "../../misc/LanguageViewModel"
import {_getSubstitutedLanguageCode, getAvailableLanguageCode, lang, languages} from "../../misc/LanguageViewModel"
import type {IUserController} from "../../api/main/UserController"
import {cleanMatch} from "../../api/common/utils/StringUtils"
import type {WorkerClient} from "../../api/main/WorkerClient"
import {worker} from "../../api/main/WorkerClient"
import {RecipientsNotFoundError} from "../../api/common/error/RecipientsNotFoundError"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import {EntityClient} from "../../api/common/EntityClient"
import {locator} from "../../api/main/MainLocator"
import {getFromMap} from "../../api/common/utils/MapUtils"
import {CancelledError} from "../../api/common/error/CancelledError"
import {getContactDisplayName} from "../../contacts/model/ContactUtils"
import {getListId, isSameId, stringToCustomId} from "../../api/common/utils/EntityUtils";

assertMainOrNode()

export const TOO_MANY_VISIBLE_RECIPIENTS = 10;

export type Recipient = {name: ?string, address: string, contact?: ?Contact}
export type RecipientList = $ReadOnlyArray<Recipient>
export type Recipients = {to?: RecipientList, cc?: RecipientList, bcc?: RecipientList}

export function makeRecipient(address: string, name: ?string, contact: ?Contact): Recipient {
	return {name, address, contact}
}

export function makeRecipients(to: RecipientList, cc: RecipientList, bcc: RecipientList): Recipients {
	return {
		to, cc, bcc
	}
}

// Because MailAddress does not have contact of the right type (event when renamed on Recipient) MailAddress <: Recipient does not hold
export function mailAddressToRecipient({address, name}: MailAddress): Recipient {
	return {name, address}
}

export type Attachment = TutanotaFile | DataFile | FileReference
export type RecipientField = "to" | "cc" | "bcc"

export type ResponseMailParameters = {
	previousMail: Mail,
	conversationType: ConversationTypeEnum,
	senderMailAddress: string,
	toRecipients: MailAddress[],
	ccRecipients: MailAddress[],
	bccRecipients: MailAddress[],
	attachments: TutanotaFile[],
	subject: string,
	bodyText: string,
	replyTos: EncryptedMailAddress[],
}

/**
 * Model which allows sending mails interactively - including resolving of recipients and handling of drafts.
 */
export class SendMailModel {
	_worker: WorkerClient
	_entity: EntityClient;
	_logins: LoginController;
	_mailModel: MailModel;
	_contactModel: ContactModel;
	_eventController: EventController;
	_mailboxDetails: MailboxDetail;

	_conversationType: ConversationTypeEnum;
	_subject: string;// we're setting subject to the value of the subject TextField in the MailEditor
	_body: string;
	_draft: ?Mail;
	_recipients: Map<RecipientField, Array<RecipientInfo>>
	_senderAddress: string;
	_isConfidential: boolean;
	_attachments: Array<Attachment>; // contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	_replyTos: Array<RecipientInfo>;
	_previousMessageId: ?Id; // only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	_previousMail: ?Mail;

	_selectedNotificationLanguage: string;
	_availableNotificationTemplateLanguages: Array<Language>

	_entityEventReceived: EntityEventsListener;
	_mailChanged: boolean;

	_passwords: Map<string, string>

	onMailChanged: Stream<boolean>

	onRecipientDeleted: Stream<?{field: RecipientField, recipient: RecipientInfo}>

	onBeforeSend: () => mixed


	/**
	 * creates a new empty draft message. calling an init method will fill in all the blank data
	 * @param worker
	 * @param logins
	 * @param mailModel
	 * @param contactModel
	 * @param eventController
	 * @param entity
	 * @param mailboxDetails
	 */
	constructor(worker: WorkerClient, logins: LoginController, mailModel: MailModel, contactModel: ContactModel, eventController: EventController, entity: EntityClient,
	            mailboxDetails: MailboxDetail) {
		this._worker = worker
		this._entity = entity
		this._logins = logins
		this._mailModel = mailModel
		this._contactModel = contactModel
		this._eventController = eventController
		this._mailboxDetails = mailboxDetails

		const userProps = logins.getUserController().props

		this._conversationType = ConversationType.NEW
		this._subject = ""
		this._body = ""
		this._draft = null
		this._recipients = new Map()
		this._senderAddress = this._getDefaultSender()
		this._isConfidential = !userProps.defaultUnconfidential
		this._attachments = []
		this._replyTos = []
		this._previousMessageId = null
		this._previousMail = null


		this._selectedNotificationLanguage = getAvailableLanguageCode(userProps.notificationMailLanguage || lang.code)
		// sort list of all languages alphabetically
		// then we see if the user has custom notification templates,
		// in which case we replace the list with just the templates that the user has specified
		this._availableNotificationTemplateLanguages = languages.slice().sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		getTemplateLanguages(this._availableNotificationTemplateLanguages, this._entity, this._logins)
			.then((filteredLanguages) => {
				if (filteredLanguages.length > 0) {
					const languageCodes = filteredLanguages.map(l => l.code)
					this._selectedNotificationLanguage =
						_getSubstitutedLanguageCode(userProps.notificationMailLanguage || lang.code, languageCodes)
						|| languageCodes[0]
					this._availableNotificationTemplateLanguages = filteredLanguages
				}
			})

		this._entityEventReceived = (updates) => {
			return Promise.each(updates, update => {
				return this._handleEntityEvent(update)
			}).return()
		}
		this._eventController.addEntityListener(this._entityEventReceived)

		this._passwords = new Map()

		this._mailChanged = false
		this.onMailChanged = stream(false)

		this.onRecipientDeleted = stream(null)

		this.onBeforeSend = noOp
	}

	logins(): LoginController {
		return this._logins
	}

	user(): IUserController {
		return this.logins().getUserController()
	}

	contacts(): ContactModel {
		return this._contactModel
	}

	mails(): MailModel {
		return this._mailModel
	}

	worker(): WorkerClient {
		return this._worker
	}

	events(): EventController {
		return this._eventController
	}

	entity(): EntityClient {
		return this._entity
	}

	getPreviousMail(): ?Mail {
		return this._previousMail
	}

	getMailboxDetails(): MailboxDetail {
		return this._mailboxDetails
	}

	getConversationType(): ConversationTypeEnum {
		return this._conversationType
	}

	setPassword(mailAddress: string, password: string) {
		this._passwords.set(mailAddress, password)
		this.setMailChanged(true)
	}

	getPassword(mailAddress: string): string {
		return this._passwords.get(mailAddress) || ""
	}


	getSubject(): string {
		return this._subject
	}

	setSubject(subject: string) {
		this._mailChanged = subject !== this._subject
		this._subject = subject

	}

	getBody(): string {
		return this._body
	}

	setBody(body: string) {
		this._body = body
		this.setMailChanged(true)
	}

	setSender(senderAddress: string) {
		this._senderAddress = senderAddress
		this.setMailChanged(true)
	}

	getSender(): string {
		return this._senderAddress
	}


	/**
	 * Returns the strength indicator for the recipients password
	 * @param recipientInfo
	 * @returns value between 0 and 100
	 */
	getPasswordStrength(recipientInfo: RecipientInfo): number {
		return getPasswordStrengthForUser(this.getPassword(recipientInfo.mailAddress), recipientInfo, this._mailboxDetails, this._logins)
	}

	getEnabledMailAddresses(): Array<string> {
		return getEnabledMailAddressesWithUser(this._mailboxDetails, this.user().userGroupInfo)
	}

	hasMailChanged(): boolean {
		return this._mailChanged
	}

	setMailChanged(hasChanged: boolean) {
		this._mailChanged = hasChanged
		this.onMailChanged(hasChanged) // if this method is called wherever state gets changed, onMailChanged should function properly
	}


	/**
	 *
	 * @param recipients
	 * @param subject
	 * @param bodyText
	 * @param attachments
	 * @param confidential
	 * @param senderMailAddress
	 * @returns {Promise<SendMailModel>}
	 */
	initWithTemplate(
		recipients: Recipients,
		subject: string,
		bodyText: string,
		attachments?: $ReadOnlyArray<Attachment>,
		confidential: ?boolean,
		senderMailAddress?: string): Promise<SendMailModel> {
		return this._init({
			conversationType: ConversationType.NEW,
			subject,
			bodyText,
			recipients,
			attachments,
			confidential,
			senderMailAddress
		})
	}

	initAsResponse(args: ResponseMailParameters): Promise<SendMailModel> {
		const {
			previousMail,
			conversationType,
			senderMailAddress,
			toRecipients,
			ccRecipients,
			bccRecipients,
			attachments,
			subject,
			bodyText,
			replyTos,
		} = args

		const recipients = {
			to: toRecipients.map(mailAddressToRecipient),
			cc: ccRecipients.map(mailAddressToRecipient),
			bcc: bccRecipients.map(mailAddressToRecipient)
		}

		let previousMessageId: ?string = null
		return this._entity.load(ConversationEntryTypeRef, previousMail.conversationEntry)
		           .then(ce => {
			           previousMessageId = ce.messageId
		           })
		           .catch(NotFoundError, e => {
			           console.log("could not load conversation entry", e);
		           })
		           .then(() => {
			           return this._init({
				           conversationType,
				           subject,
				           bodyText,
				           recipients,
				           senderMailAddress,
				           confidential: previousMail.confidential,
				           attachments,
				           replyTos,
				           previousMail,
				           previousMessageId
			           })
		           })
	}

	initWithDraft(draft: Mail, attachments: TutanotaFile[], bodyText: string,): Promise<SendMailModel> {
		let conversationType: ConversationTypeEnum = ConversationType.NEW
		let previousMessageId: ?string = null
		let previousMail: ?Mail = null

		return this._entity.load(ConversationEntryTypeRef, draft.conversationEntry).then(ce => {
			conversationType = downcast(ce.conversationType)
			if (ce.previous) {
				return this._entity.load(ConversationEntryTypeRef, ce.previous).then(previousCe => {
					previousMessageId = previousCe.messageId
					if (previousCe.mail) {
						return this._entity.load(MailTypeRef, previousCe.mail).then(mail => {
							previousMail = mail
						})
					}
				}).catch(NotFoundError, e => {
					// ignore
				})
			}
		}).then(() => {
			const {confidential, sender, toRecipients, ccRecipients, bccRecipients, subject, replyTos} = draft
			const recipients: Recipients = {
				to: toRecipients.map(mailAddressToRecipient),
				cc: ccRecipients.map(mailAddressToRecipient),
				bcc: bccRecipients.map(mailAddressToRecipient),
			}
			return this._init({
				conversationType: conversationType,
				subject,
				bodyText,
				recipients,
				draft,
				senderMailAddress: sender.address,
				confidential,
				attachments,
				replyTos,
				previousMail,
				previousMessageId
			})
		})
	}


	_init({
		      conversationType,
		      subject,
		      bodyText,
		      draft,
		      recipients,
		      senderMailAddress,
		      confidential,
		      attachments,
		      replyTos,
		      previousMail,
		      previousMessageId,
	      }: {|
		conversationType: ConversationTypeEnum,
		subject: string,
		bodyText: string,
		recipients: Recipients,
		confidential: ?boolean,
		draft?: ?Mail,
		senderMailAddress?: string,
		attachments?: $ReadOnlyArray<Attachment>,
		replyTos?: EncryptedMailAddress[],
		previousMail?: ?Mail,
		previousMessageId?: ?string,
	|}): Promise<SendMailModel> {
		this._conversationType = conversationType
		this._subject = subject
		this._body = bodyText
		this._draft = draft || null
		const {to = [], cc = [], bcc = []} = recipients

		const makeRecipientInfo = (r: Recipient) => {
			const [recipient] = this._createAndResolveRecipientInfo(r.name, r.address, r.contact, false)
			if (recipient.resolveContactPromise) {
				recipient.resolveContactPromise.then(() => this._mailChanged = false)
			} else {
				this._mailChanged = false
			}
			return recipient
		}
		const recipientsTransform = (recipientList) => {
			return deduplicate(recipientList.filter(r => isMailAddress(r.address, false)), (a, b) => a.address === b.address)
				.map(makeRecipientInfo)
		}
		this._recipients.set("to", recipientsTransform(to))
		this._recipients.set("cc", recipientsTransform(cc))
		this._recipients.set("bcc", recipientsTransform(bcc))

		this._senderAddress = senderMailAddress || this._getDefaultSender()
		this._isConfidential = confidential == null ? !this.user().props.defaultUnconfidential : confidential
		this._attachments = []
		if (attachments) {
			this.attachFiles(attachments)
			this._mailChanged = false
		}

		this._replyTos = (replyTos || []).map(ema => {

			const ri = createRecipientInfo(ema.address, ema.name, null)
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this.user().user)
					.then(() => {
						this.onMailChanged(true);
					})
			}
			return ri
		})

		this._previousMail = previousMail || null
		this._previousMessageId = previousMessageId || null

		this._mailChanged = false
		return Promise.resolve(this)
	}

	_getDefaultSender(): string {
		return getDefaultSender(this._logins, this._mailboxDetails)
	}

	getRecipientList(type: RecipientField): Array<RecipientInfo> {
		return getFromMap(this._recipients, type, () => [])
	}

	toRecipients(): Array<RecipientInfo> {
		return this.getRecipientList("to")
	}

	ccRecipients(): Array<RecipientInfo> {
		return this.getRecipientList("cc")
	}

	bccRecipients(): Array<RecipientInfo> {
		return this.getRecipientList("bcc")
	}

	/**
	 * Either creates and inserts a new recipient to the list if a recipient with the same mail address doesn't already exist
	 * Otherwise it returns the existing recipient info - recipients which also have the same contact are prioritized
	 *
	 * Note: Duplication is only avoided per recipient field (to, cc, bcc), but a recipient may be duplicated between them
	 * @param type
	 * @param recipient
	 * @param skipResolveContact
	 * @param notify: whether or not to notify onRecipientAdded listeners
	 * @returns {RecipientInfo}
	 */
	addOrGetRecipient(type: RecipientField, recipient: Recipient, skipResolveContact: boolean = false): [RecipientInfo, Promise<RecipientInfo>] {
		// if recipients with same mail address exist
		//      if one of them also has the same contact, use that one
		//      else use an arbitrary one
		// else make a new one and give it to the model
		const sameAddressRecipients = this.getRecipientList(type).filter(r => r.mailAddress === recipient.address)
		const perfectMatch = sameAddressRecipients.find(r => recipient.contact && r.contact
			&& isSameId(recipient.contact._id, r.contact._id))

		let recipientInfo = perfectMatch || sameAddressRecipients[0]

		// if the contact has a password, add it to the password map, but don't override it if one exists for that mailaddress already
		if (recipient.contact && !this._passwords.has(recipient.address)) {
			this._passwords.set(recipient.address, recipient.contact.presharedPassword || "")
		}

		// make a new recipient info if we don't have one for that recipient
		if (!recipientInfo) {
			let p: Promise<RecipientInfo>
			[
				recipientInfo, p
			] = this._createAndResolveRecipientInfo(recipient.name, recipient.address, recipient.contact, skipResolveContact)
			this.getRecipientList(type).push(recipientInfo)
			this.setMailChanged(true)
			return [recipientInfo, p]
		} else {
			return [recipientInfo, Promise.resolve(recipientInfo)]
		}
	}

	_createAndResolveRecipientInfo(name: ?string, address: string, contact: ?Contact, skipResolveContact: boolean): [RecipientInfo, Promise<RecipientInfo>] {
		const ri = createRecipientInfo(address, name, contact)
		let p: Promise<RecipientInfo>
		if (!skipResolveContact) {
			if (this._logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this._contactModel, this.user().user)
					.then(contact => {
						if (!this._passwords.has(address)) {
							this.setPassword(address, contact.presharedPassword || "")
						}
					})
			}
			p = resolveRecipientInfo(this._worker, ri).then((resolved) => {
				this.setMailChanged(true)
				return resolved
			})
		} else {
			p = Promise.resolve(ri)
		}
		return [ri, p]
	}

	removeRecipient(recipient: RecipientInfo, type: RecipientField, notify: boolean = true): boolean {
		const didRemove = remove(this.getRecipientList(type), recipient)
		this.setMailChanged(didRemove)
		if (didRemove && notify) {
			this.onRecipientDeleted({field: type, recipient})
		}
		return didRemove
	}

	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived)
	}

	/**
	 * @param files
	 * @throws UserError in the case that any files were too big to attach. Small enough files will still have been attached
	 */
	getAttachments(): Array<Attachment> {
		return this._attachments
	}

	/** @throws UserError in case files are too big to add */
	attachFiles(files: $ReadOnlyArray<Attachment>): void {
		let totalSize = this._attachments.reduce((total, file) => total + Number(file.size), 0)
		const tooBigFiles: Array<string> = [];
		files.forEach(file => {
			if (totalSize + Number(file.size) > MAX_ATTACHMENT_SIZE) {
				tooBigFiles.push(file.name)
			} else {
				totalSize += Number(file.size)
				this._attachments.push(file)
			}
		})

		this.setMailChanged(true)

		if (tooBigFiles.length > 0) {
			throw new UserError(() => lang.get("tooBigAttachment_msg") + tooBigFiles.join(", "))
		}

	}

	removeAttachment(file: Attachment): void {
		if (remove(this._attachments, file)) {
			this.setMailChanged(true)
		}
	}

	getSenderName(): string {
		return getSenderNameForUser(this._mailboxDetails, this.user())
	}

	getDraft(): ?$ReadOnly<Mail> {
		return this._draft
	}

	_updateDraft(body: string, attachments: ?$ReadOnlyArray<Attachment>, draft: Mail): Promise<Mail> {
		return this._worker
		           .updateMailDraft(this.getSubject(), body, this._senderAddress, this.getSenderName(), this.toRecipients(),
			           this.ccRecipients(), this.bccRecipients(), attachments, this.isConfidential(), draft)
		           .catch(LockedError, (e) => {
			           console.log("updateDraft: operation is still active", e)
			           throw new UserError("operationStillActive_msg")
		           })
		           .catch(NotFoundError, () => {
			           console.log("draft has been deleted, creating new one")
			           return this._createDraft(body, attachments, downcast(draft.method))
		           })
	}

	_createDraft(body: string, attachments: ?$ReadOnlyArray<Attachment>, mailMethod: MailMethodEnum): Promise<Mail> {
		return this._worker.createMailDraft(this.getSubject(), body,
			this._senderAddress, this.getSenderName(), this.toRecipients(), this.ccRecipients(), this.bccRecipients(), this._conversationType,
			this._previousMessageId, attachments, this.isConfidential(), this._replyTos, mailMethod)
	}

	isConfidential(): boolean {
		return this._isConfidential || !this.containsExternalRecipients()
	}

	isConfidentialExternal(): boolean {
		return this._isConfidential && this.containsExternalRecipients()
	}

	setConfidential(confidential: boolean): void {
		this._isConfidential = confidential
	}

	containsExternalRecipients(): boolean {
		return this.allRecipients().some(r => isExternal(r))
	}

	getExternalRecipients(): Array<RecipientInfo> {
		return this.allRecipients().filter(r => isExternal(r))
	}

	/**
	 * @reject {RecipientsNotFoundError}
	 * @reject {TooManyRequestsError}
	 * @reject {AccessBlockedError}
	 * @reject {FileNotFoundError}
	 * @reject {PreconditionFailedError}
	 * @reject {LockedError}
	 * @reject {UserError}
	 * @param mailMethod
	 * @param getConfirmation
	 * @param waitHandler: Function to call while waiting for email to send
	 * @param tooManyRequestsError
	 * @return true if the send was completed, false if it was aborted (by getConfirmation returning false
	 */
	send(
		mailMethod: MailMethodEnum,
		getConfirmation: (TranslationKey | lazy<string>) => Promise<boolean> = _ => Promise.resolve(true),
		waitHandler: (TranslationKey | lazy<string>, Promise<any>) => Promise<any> = (_, p) => p,
		tooManyRequestsError: TranslationKey = "tooManyMails_msg"): Promise<boolean> {

		this.onBeforeSend()

		if (this.allRecipients().length === 1 && this.allRecipients()[0].mailAddress.toLowerCase().trim()
			=== "approval@tutao.de") {
			return this._sendApprovalMail(this.getBody()).then(() => true)
		}

		if (this.toRecipients().length === 0 && this.ccRecipients().length === 0 && this.bccRecipients().length === 0) {
			return Promise.reject(new UserError("noRecipients_msg"))
		}

		const confirmOrCancel = (needsConfirmation: boolean, message: TranslationKey) =>
			needsConfirmation
				? getConfirmation(message).then(confirmation => {
					if (!confirmation) {
						throw new CancelledError("user cancelled")
					}
				})
				: Promise.resolve()

		const numVisibleRecipients = this.toRecipients().length + this.ccRecipients().length
		const recipientLengthConfirm =
			confirmOrCancel(numVisibleRecipients >= TOO_MANY_VISIBLE_RECIPIENTS, "manyRecipients_msg")

		const subjectConfirm = () => confirmOrCancel(this.getSubject().length === 0, "noSubject_msg")

		return recipientLengthConfirm
			.then(subjectConfirm)
			.then(() => this._waitForResolvedRecipients())
			.then(() => this._externalPasswordConfirm(getConfirmation))
			.then(() => {
				const sendPromise = this.saveDraft(true, mailMethod)
				                        .then(() => this._updateContacts(this.allRecipients()))
				                        .then(() => this._worker.sendMailDraft(
					                        neverNull(this._draft),
					                        this.allRecipients(),
					                        this._selectedNotificationLanguage,
				                        ))
				                        .then(() => this._updatePreviousMail())
				                        .then(() => this._updateExternalLanguage())
				                        .then(() => true)
				                        .catch(LockedError, () => { throw new UserError("operationStillActive_msg")})


				return waitHandler(this.isConfidential() ? "sending_msg" : "sendingUnencrypted_msg", sendPromise)
			})
			.catch(CancelledError, () => false)
			// catch all of the badness
			.catch(RecipientNotResolvedError, () => {throw new UserError("tooManyAttempts_msg")})
			.catch(RecipientsNotFoundError, (e) => {
				let invalidRecipients = e.message
				throw new UserError(() => lang.get("tutanotaAddressDoesNotExist_msg") + " " + lang.get("invalidRecipients_msg") + "\n"
					+ invalidRecipients)
			})
			.catch(TooManyRequestsError, () => {throw new UserError(tooManyRequestsError)})
			.catch(AccessBlockedError, e => {
				// special case: the approval status is set to SpamSender, but the update has not been received yet, so use SpamSender as default
				return checkApprovalStatus(true, ApprovalStatus.SPAM_SENDER)
					.then(() => {
						console.log("could not send mail (blocked access)", e)
					})
			})
			.catch(FileNotFoundError, () => {throw new UserError("couldNotAttachFile_msg")})
			.catch(PreconditionFailedError, () => {throw new UserError("operationStillActive_msg")})
	}

	_externalPasswordConfirm(getConfirmation: (TranslationKey | lazy<string>) => Promise<boolean>): Promise<void> {
		if (this.isConfidentialExternal()
			&& this.getExternalRecipients().some(r => !this.getPassword(r.mailAddress))) {
			throw new UserError("noPreSharedPassword_msg")
		}
		return this.isConfidentialExternal() && this.hasInsecurePasswords()
			? getConfirmation("presharedPasswordNotStrongEnough_msg").then(confirmation => {
				if (!confirmation) {
					throw new CancelledError("password not confirmed")
				}
			})
			: Promise.resolve()
	}

	/**
	 * Whether any of the external recipients have an insecure password.
	 * We don't consider empty passwords, because an empty password will disallow and encrypted email from sending, whereas an insecure password
	 * can still be used
	 * @returns {boolean}
	 */
	hasInsecurePasswords(): boolean {
		const minimalPasswordStrength = this.allRecipients()
		                                    .filter(r => this.getPassword(r.mailAddress) !== "")
		                                    .reduce((min, recipient) => Math.min(min, this.getPasswordStrength(recipient)), PASSWORD_MIN_SECURE_VALUE)
		return !isSecurePassword(minimalPasswordStrength)
	}

	/**
	 * Saves the draft.
	 * @param saveAttachments True if also the attachments shall be saved, false otherwise.
	 * @returns {Promise} When finished.
	 * @throws FileNotFoundError when one of the attachments could not be opened
	 * @throws PreconditionFailedError when the draft is locked
	 */
	saveDraft(
		saveAttachments: boolean,
		mailMethod: MailMethodEnum,
		blockingWaitHandler: (TranslationKey | lazy<string>, Promise<any>) => Promise<any> = (_, p) => p): Promise<void> {
		const attachments = (saveAttachments) ? this._attachments : null
		const {_draft} = this

		// Create new drafts for drafts edited from trash or spam folder
		const doCreateNewDraft = _draft
			? this._mailModel.getMailboxFolders(_draft)
			      .then(folders => folders.filter(f => f.folderType === MailFolderType.TRASH || f.folderType === MailFolderType.SPAM))
			      .then(trashAndMailFolders => trashAndMailFolders.find(folder => isSameId(folder.mails, getListId(_draft))) != null)
			: Promise.resolve(true)

		const savePromise = doCreateNewDraft.then(createNewDraft => createNewDraft
			? this._createDraft(this.getBody(), attachments, mailMethod)
			: this._updateDraft(this.getBody(), attachments, neverNull(_draft))
		).then((draft) => {
			this._draft = draft
			return Promise.map(draft.attachments, fileId => this._entity.load(FileTypeRef, fileId)).then(attachments => {
				this._attachments = [] // attachFiles will push to existing files but we want to overwrite them
				this.attachFiles(attachments)
				this._mailChanged = false
			})
		}).catch(PayloadTooLargeError, () => {
			throw new UserError("requestTooLarge_msg")
		})

		return blockingWaitHandler("save_msg", savePromise)
	}

	_sendApprovalMail(body: string): Promise<void> {
		const listId = "---------c--";
		const m = createApprovalMail({
			_id: [listId, stringToCustomId(this._senderAddress)],
			_ownerGroup: this.user().user.userGroup.group,
			text: `Subject: ${this.getSubject()}<br>${body}`,
		})
		return this._entity.setup(listId, m)
		           .catch(NotAuthorizedError, e => console.log("not authorized for approval message"))
	}

	getAvailableNotificationTemplateLanguages(): Array<Language> {
		return this._availableNotificationTemplateLanguages
	}

	getSelectedNotificationLanguageCode(): string {
		return this._selectedNotificationLanguage
	}

	setSelectedNotificationLanguageCode(code: string) {
		this._selectedNotificationLanguage = code
		this.setMailChanged(true)
	}

	_updateExternalLanguage() {
		let props = this.user().props
		if (props.notificationMailLanguage !== this._selectedNotificationLanguage) {
			props.notificationMailLanguage = this._selectedNotificationLanguage
			this._entity.update(props)
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
			return this._entity.update(this._previousMail).catch(NotFoundError, e => {
				// ignore
			})
		} else {
			return Promise.resolve();
		}
	}


	_updateContacts(resolvedRecipients: RecipientInfo[]): Promise<any> {
		return Promise.all(resolvedRecipients.map(r => {
			const {mailAddress, contact} = r
			if (!contact) return Promise.resolve()

			const isExternalAndConfidential = isExternal(r) && this.isConfidential()

			if (!contact._id && (!this.user().props.noAutomaticContacts || isExternalAndConfidential)) {
				if (isExternalAndConfidential) {
					contact.presharedPassword = this.getPassword(r.mailAddress).trim()
				}
				return this._contactModel.contactListId().then(listId => {
					return this._entity.setup(listId, contact)
				})
			} else if (
				contact._id
				&& isExternalAndConfidential && contact.presharedPassword !== this.getPassword(mailAddress).trim()) {
				contact.presharedPassword = this.getPassword(mailAddress).trim()
				return this._entity.update(contact)
			} else {
				return Promise.resolve()
			}
		}))
	}

	allRecipients(): Array<RecipientInfo> {
		return this.toRecipients()
		           .concat(this.ccRecipients())
		           .concat(this.bccRecipients())
	}

	/**
	 * Makes sure the recipient type and contact are resolved.
	 */
	_waitForResolvedRecipients(): Promise<RecipientInfo[]> {
		return Promise.all(this.allRecipients().map(recipientInfo => {
			return resolveRecipientInfo(this._worker, recipientInfo).then(recipientInfo => {
				if (recipientInfo.resolveContactPromise) {
					return recipientInfo.resolveContactPromise.return(recipientInfo)
				} else {
					return recipientInfo
				}
			})
		})).catch(TooManyRequestsError, () => {
			throw new RecipientNotResolvedError("")
		})
	}

	_handleEntityEvent(update: EntityUpdateData): Promise<void> {
		const {operation, instanceId, instanceListId} = update
		let contactId: IdTuple = [neverNull(instanceListId), instanceId]

		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			if (operation === OperationType.UPDATE) {
				this._entity.load(ContactTypeRef, contactId).then((contact) => {

					for (const fieldType of ["to", "cc", "bcc"]) {
						const matching = this.getRecipientList(fieldType).filter(recipient => recipient.contact
							&& isSameId(recipient.contact._id, contact._id))
						matching.forEach(recipient => {
							// if the mail address no longer exists on the contact then delete the recipient
							if (!contact.mailAddresses.find(ma => cleanMatch(ma.address, recipient.mailAddress))) {
								this.removeRecipient(recipient, fieldType, true)
							} else {
								// else just modify the recipient
								recipient.name = getContactDisplayName(contact)
								recipient.contact = contact
							}
						})
					}
				})
			} else if (operation === OperationType.DELETE) {

				for (const fieldType of ["to", "cc", "bcc"]) {
					const recipients = this.getRecipientList(fieldType)
					const filterFun = recipient => recipient.contact && isSameId(recipient.contact._id, contactId) || false
					const toDelete = recipients.filter(filterFun)
					for (const r of toDelete) {
						this.removeRecipient(r, fieldType, true)
					}
				}
			}
			this.setMailChanged(true)
		}
		return Promise.resolve()
	}

	setOnBeforeSendFunction(fun: () => mixed) {
		this.onBeforeSend = fun
	}
}

export function defaultSendMailModel(mailboxDetails: MailboxDetail): SendMailModel {
	return new SendMailModel(worker, logins, locator.mailModel, locator.contactModel, locator.eventController, locator.entityClient, mailboxDetails)
}
