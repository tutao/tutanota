import {
	ApprovalStatus,
	ConversationType,
	FeatureType,
	MailFolderType,
	MailMethod,
	MAX_ATTACHMENT_SIZE,
	OperationType,
	ReplyType
} from "../../api/common/TutanotaConstants"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import {isExternal, makeRecipientDetails} from "../../api/common/RecipientInfo"
import {
	AccessBlockedError,
	LockedError,
	NotAuthorizedError,
	NotFoundError,
	PayloadTooLargeError,
	PreconditionFailedError,
	TooManyRequestsError,
} from "../../api/common/error/RestError"
import {UserError} from "../../api/main/UserError"
import {getPasswordStrengthForUser, isSecurePassword, PASSWORD_MIN_SECURE_VALUE} from "../../misc/PasswordUtils"
import {cleanMatch, deduplicate, downcast, getFromMap, neverNull, noOp, ofClass, promiseMap, remove, typedValues} from "@tutao/tutanota-utils"
import {
	checkAttachmentSize,
	createRecipientInfo,
	getDefaultSender,
	getEnabledMailAddressesWithUser,
	getSenderNameForUser,
	getTemplateLanguages,
	RecipientField,
	recipientInfoToDraftRecipient,
	recipientInfoToEncryptedMailAddress,
	resolveRecipientInfo,
	resolveRecipientInfoContact,
} from "../model/MailUtils"
import type {File as TutanotaFile} from "../../api/entities/tutanota/TypeRefs.js"
import {FileTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {ConversationEntryTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {Contact} from "../../api/entities/tutanota/TypeRefs.js"
import {ContactTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import type {MailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import type {MailboxDetail, MailModel} from "../model/MailModel"
import {RecipientNotResolvedError} from "../../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {EntityEventsListener, EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {isMailAddress} from "../../misc/FormatValidator"
import {createApprovalMail} from "../../api/entities/monitor/TypeRefs.js"
import type {EncryptedMailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import type {ContactModel} from "../../contacts/model/ContactModel"
import type {Language, TranslationKey, TranslationText} from "../../misc/LanguageViewModel"
import {getAvailableLanguageCode, getSubstitutedLanguageCode, lang, languages} from "../../misc/LanguageViewModel"
import type {IUserController} from "../../api/main/UserController"
import {RecipientsNotFoundError} from "../../api/common/error/RecipientsNotFoundError"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import {EntityClient} from "../../api/common/EntityClient"
import {locator} from "../../api/main/MainLocator"
import {getContactDisplayName} from "../../contacts/model/ContactUtils"
import {getListId, isSameId, stringToCustomId} from "../../api/common/utils/EntityUtils"
import {CustomerPropertiesTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {InlineImages} from "../view/MailViewer"
import {cloneInlineImages, revokeInlineImages} from "../view/MailGuiUtils"
import {MailBodyTooLargeError} from "../../api/common/error/MailBodyTooLargeError"
import type {MailFacade} from "../../api/worker/facades/MailFacade"
import {assertMainOrNode} from "../../api/common/Env"
import {DataFile} from "../../api/common/DataFile";
import {FileReference} from "../../api/common/utils/FileUtils"

assertMainOrNode()
export const TOO_MANY_VISIBLE_RECIPIENTS = 10
export type Recipient = {
	name: string | null
	address: string
	contact?: Contact | null
}
export type RecipientList = ReadonlyArray<Recipient>
export type Recipients = {
	to?: RecipientList
	cc?: RecipientList
	bcc?: RecipientList
}

export function makeRecipient(address: string, name: string | null, contact: Contact | null): Recipient {
	return {
		name,
		address,
		contact,
	}
}

export function makeRecipients(to: RecipientList, cc: RecipientList, bcc: RecipientList): Recipients {
	return {
		to,
		cc,
		bcc,
	}
}

// Because MailAddress does not have contact of the right type (event when renamed on Recipient) MailAddress <: Recipient does not hold
export function mailAddressToRecipient({address, name}: MailAddress): Recipient {
	return {
		name,
		address,
	}
}

export type Attachment = TutanotaFile | DataFile | FileReference

export type ResponseMailParameters = {
	previousMail: Mail
	conversationType: ConversationType
	senderMailAddress: string
	toRecipients: MailAddress[]
	ccRecipients: MailAddress[]
	bccRecipients: MailAddress[]
	attachments: TutanotaFile[]
	subject: string
	bodyText: string
	replyTos: EncryptedMailAddress[]
}

type InitArgs = {
	conversationType: ConversationType
	subject: string
	bodyText: string
	recipients: Recipients
	confidential: boolean | null | undefined
	draft?: Mail | null | undefined
	senderMailAddress?: string
	attachments?: ReadonlyArray<Attachment>
	replyTos?: EncryptedMailAddress[]
	previousMail?: Mail | null | undefined
	previousMessageId?: string | null | undefined
}

/**
 * Model which allows sending mails interactively - including resolving of recipients and handling of drafts.
 */
export class SendMailModel {

	onMailChanged: Stream<boolean> = stream(false)
	onRecipientDeleted: Stream<{field: RecipientField, recipient: RecipientInfo} | null> = stream(null)
	onBeforeSend: () => void = noOp
	loadedInlineImages: InlineImages = new Map()

	// Isn't private because used by MinimizedEditorOverlay, refactor?
	draft: Mail | null = null
	private conversationType: ConversationType = ConversationType.NEW
	private subject: string = ""
	private body: string = ""
	private recipients: Map<RecipientField, Array<RecipientInfo>> = new Map()
	private senderAddress: string
	private confidential: boolean

	// contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	private attachments: Array<Attachment> = []

	private replyTos: Array<RecipientInfo> = []

	// only needs to be the correct value if this is a new email. if we are editing a draft, conversationType is not used
	private previousMessageId: Id | null = null

	private previousMail: Mail | null = null
	private selectedNotificationLanguage: string
	private availableNotificationTemplateLanguages: Array<Language> = []
	private mailChanged: boolean = false
	private passwords: Map<string, string> = new Map()

	// The promise for the draft currently being saved
	private currentSavePromise: Promise<void> | null = null

	// If saveDraft is called while the previous call is still running, then flag to call again afterwards
	private doSaveAgain: boolean = false

	/**
	 * creates a new empty draft message. calling an init method will fill in all the blank data
	 */
	constructor(
		public readonly mailFacade: MailFacade,
		public readonly entity: EntityClient,
		public readonly logins: LoginController,
		public readonly mailModel: MailModel,
		public readonly contactModel: ContactModel,
		private readonly eventController: EventController,
		public readonly mailboxDetails: MailboxDetail
	) {
		const userProps = logins.getUserController().props
		this.senderAddress = this.getDefaultSender()
		this.confidential = !userProps.defaultUnconfidential

		this.selectedNotificationLanguage = getAvailableLanguageCode(userProps.notificationMailLanguage || lang.code)
		this.updateAvailableNotificationTemplateLanguages()

		this.eventController.addEntityListener(updates => this.entityEventReceived(updates))
	}

	private async entityEventReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (let update of updates) {
			await this.handleEntityEvent(update)
		}
	}

	/**
	 * Sort list of all languages alphabetically
	 * then we see if the user has custom notification templates
	 * in which case we replace the list with just the templates that the user has specified
	 */
	private async updateAvailableNotificationTemplateLanguages(): Promise<void> {
		this.availableNotificationTemplateLanguages = languages.slice().sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		const filteredLanguages = await getTemplateLanguages(this.availableNotificationTemplateLanguages, this.entity, this.logins)
		if (filteredLanguages.length > 0) {
			const languageCodes = filteredLanguages.map(l => l.code)
			this.selectedNotificationLanguage =
				getSubstitutedLanguageCode(this.logins.getUserController().props.notificationMailLanguage || lang.code, languageCodes) || languageCodes[0]
			this.availableNotificationTemplateLanguages = filteredLanguages
		}
	}

	user(): IUserController {
		return this.logins.getUserController()
	}

	getPreviousMail(): Mail | null {
		return this.previousMail
	}

	getConversationType(): ConversationType {
		return this.conversationType
	}

	setPassword(mailAddress: string, password: string) {
		this.passwords.set(mailAddress, password)

		this.setMailChanged(true)
	}

	getPassword(mailAddress: string): string {
		return this.passwords.get(mailAddress) || ""
	}

	getSubject(): string {
		return this.subject
	}

	setSubject(subject: string) {
		this.mailChanged = subject !== this.subject
		this.subject = subject
	}

	getBody(): string {
		return this.body
	}

	setBody(body: string) {
		this.body = body
		this.setMailChanged(true)
	}

	setSender(senderAddress: string) {
		this.senderAddress = senderAddress
		this.setMailChanged(true)
	}

	getSender(): string {
		return this.senderAddress
	}

	/**
	 * Returns the strength indicator for the recipients password
	 * @param recipientInfo
	 * @returns value between 0 and 100
	 */
	getPasswordStrength(recipientInfo: RecipientInfo): number {
		return getPasswordStrengthForUser(this.getPassword(recipientInfo.mailAddress), recipientInfo, this.mailboxDetails, this.logins)
	}

	getEnabledMailAddresses(): Array<string> {
		return getEnabledMailAddressesWithUser(this.mailboxDetails, this.user().userGroupInfo)
	}

	hasMailChanged(): boolean {
		return this.mailChanged
	}

	setMailChanged(hasChanged: boolean) {
		this.mailChanged = hasChanged
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
		attachments?: ReadonlyArray<Attachment>,
		confidential?: boolean,
		senderMailAddress?: string,
	): Promise<SendMailModel> {
		return this.init({
			conversationType: ConversationType.NEW,
			subject,
			bodyText,
			recipients,
			attachments,
			confidential,
			senderMailAddress,
		})
	}

	async initAsResponse(args: ResponseMailParameters, inlineImages: InlineImages): Promise<SendMailModel> {
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
			replyTos
		} = args
		const recipients = {
			to: toRecipients.map(mailAddressToRecipient),
			cc: ccRecipients.map(mailAddressToRecipient),
			bcc: bccRecipients.map(mailAddressToRecipient),
		}
		let previousMessageId: string | null = null
		await this.entity
				  .load(ConversationEntryTypeRef, previousMail.conversationEntry)
				  .then(ce => {
					  previousMessageId = ce.messageId
				  })
				  .catch(
					  ofClass(NotFoundError, e => {
						  console.log("could not load conversation entry", e)
					  }),
				  )
		// if we reuse the same image references, changing the displayed mail in mail view will cause the minimized draft to lose
		// that reference, because it will be revoked
		this.loadedInlineImages = cloneInlineImages(inlineImages)
		return this.init({
			conversationType,
			subject,
			bodyText,
			recipients,
			senderMailAddress,
			confidential: previousMail.confidential,
			attachments,
			replyTos,
			previousMail,
			previousMessageId,
		})
	}

	async initWithDraft(draft: Mail, attachments: TutanotaFile[], bodyText: string, inlineImages: InlineImages): Promise<SendMailModel> {
		let previousMessageId: string | null = null
		let previousMail: Mail | null = null

		const conversationEntry = await this.entity.load(ConversationEntryTypeRef, draft.conversationEntry)
		const conversationType = downcast<ConversationType>(conversationEntry.conversationType)

		if (conversationEntry.previous) {
			try {
				const previousEntry = await this.entity.load(ConversationEntryTypeRef, conversationEntry.previous)
				previousMessageId = previousEntry.messageId
				if (previousEntry.mail) {
					previousMail = await this.entity.load(MailTypeRef, previousEntry.mail)
				}
			} catch (e) {
				if (e instanceof NotFoundError) {
					// ignore
				} else {
					throw e
				}
			}
		}

		// if we reuse the same image references, changing the displayed mail in mail view will cause the minimized draft to lose
		// that reference, because it will be revoked
		this.loadedInlineImages = cloneInlineImages(inlineImages)
		const {confidential, sender, toRecipients, ccRecipients, bccRecipients, subject, replyTos} = draft
		const recipients: Recipients = {
			to: toRecipients.map(mailAddressToRecipient),
			cc: ccRecipients.map(mailAddressToRecipient),
			bcc: bccRecipients.map(mailAddressToRecipient),
		}
		return this.init({
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
			previousMessageId,
		})
	}

	private async init(
		{
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
		}: InitArgs
	): Promise<SendMailModel> {
		this.conversationType = conversationType
		this.subject = subject
		this.body = bodyText
		this.draft = draft || null
		const {to = [], cc = [], bcc = []} = recipients

		const makeRecipientInfo = (r: Recipient) => {
			const [recipient] = this.createAndResolveRecipientInfo(r.name, r.address, r.contact, false)

			if (recipient.resolveContactPromise) {
				recipient.resolveContactPromise.then(() => (this.mailChanged = false))
			} else {
				this.mailChanged = false
			}

			return recipient
		}

		const recipientsTransform = (recipientList: RecipientList) => {
			return deduplicate(
				recipientList.filter(r => isMailAddress(r.address, false)),
				(a, b) => a.address === b.address,
			).map(makeRecipientInfo)
		}

		this.recipients.set(RecipientField.TO, recipientsTransform(to))
		this.recipients.set(RecipientField.CC, recipientsTransform(cc))
		this.recipients.set(RecipientField.BCC, recipientsTransform(bcc))

		this.senderAddress = senderMailAddress || this.getDefaultSender()
		this.confidential = confidential == null ? !this.user().props.defaultUnconfidential : confidential
		this.attachments = []

		if (attachments) {
			this.attachFiles(attachments)
			this.mailChanged = false
		}

		this.replyTos = (replyTos || []).map(ema => {
			const ri = createRecipientInfo(ema.address, ema.name, null)

			if (this.logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this.contactModel, this.user().user).then(() => {
					this.onMailChanged(true)
				})
			}

			return ri
		})
		this.previousMail = previousMail || null
		this.previousMessageId = previousMessageId || null
		this.mailChanged = false
		return this
	}

	private getDefaultSender(): string {
		return getDefaultSender(this.logins, this.mailboxDetails)
	}

	getRecipientList(type: RecipientField): Array<RecipientInfo> {
		return getFromMap(this.recipients, type, () => [])
	}

	toRecipients(): Array<RecipientInfo> {
		return this.getRecipientList(RecipientField.TO)
	}

	ccRecipients(): Array<RecipientInfo> {
		return this.getRecipientList(RecipientField.CC)
	}

	bccRecipients(): Array<RecipientInfo> {
		return this.getRecipientList(RecipientField.BCC)
	}

	/**
	 * Either creates and inserts a new recipient to the list if a recipient with the same mail address doesn't already exist
	 * Otherwise it returns the existing recipient info - recipients which also have the same contact are prioritized
	 *
	 * Note: Duplication is only avoided per recipient field (to, cc, bcc), but a recipient may be duplicated between them
	 * @param type
	 * @param recipient
	 * @param skipResolveContact
	 * @returns {RecipientInfo}
	 */
	addOrGetRecipient(type: RecipientField, recipient: Recipient, skipResolveContact: boolean = false): [RecipientInfo, Promise<RecipientInfo>] {
		// if recipients with same mail address exist
		//      if one of them also has the same contact, use that one
		//      else use an arbitrary one
		// else make a new one and give it to the model
		const sameAddressRecipients = this.getRecipientList(type).filter(r => r.mailAddress === recipient.address)
		const perfectMatch = sameAddressRecipients.find(r => recipient.contact && r.contact && isSameId(recipient.contact._id, r.contact._id))
		let recipientInfo = perfectMatch || sameAddressRecipients[0]

		// if the contact has a password, add it to the password map, but don't override it if one exists for that mailaddress already
		if (recipient.contact && !this.passwords.has(recipient.address)) {
			this.passwords.set(recipient.address, recipient.contact.presharedPassword || "")
		}

		// make a new recipient info if we don't have one for that recipient
		if (!recipientInfo) {
			let p: Promise<RecipientInfo>
			;[recipientInfo, p] = this.createAndResolveRecipientInfo(recipient.name, recipient.address, recipient.contact, skipResolveContact)
			this.getRecipientList(type).push(recipientInfo)
			this.setMailChanged(true)
			return [recipientInfo, p]
		} else {
			return [recipientInfo, Promise.resolve(recipientInfo)]
		}
	}

	private createAndResolveRecipientInfo(
		name: string | null,
		address: string,
		contact: Contact | null | undefined,
		skipResolveContact: boolean,
	): [RecipientInfo, Promise<RecipientInfo>] {
		const ri = createRecipientInfo(address, name, contact ?? null)
		let p: Promise<RecipientInfo>

		if (!skipResolveContact) {
			if (this.logins.isInternalUserLoggedIn()) {
				resolveRecipientInfoContact(ri, this.contactModel, this.user().user).then(contact => {
					if (!this.passwords.has(address)) {
						this.setPassword(address, contact.presharedPassword || "")
					}
				})
			}

			p = resolveRecipientInfo(this.mailFacade, ri).then(resolved => {
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
			this.onRecipientDeleted({
				field: type,
				recipient,
			})
		}

		return didRemove
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventReceived)

		revokeInlineImages(this.loadedInlineImages)
	}

	/**
	 * @throws UserError in the case that any files were too big to attach. Small enough files will still have been attached
	 */
	getAttachments(): Array<Attachment> {
		return this.attachments
	}

	/** @throws UserError in case files are too big to add */
	attachFiles(files: ReadonlyArray<Attachment>): void {
		let sizeLeft = MAX_ATTACHMENT_SIZE - this.attachments.reduce((total, file) => total + Number(file.size), 0)

		const sizeCheckResult = checkAttachmentSize(files, sizeLeft)

		this.attachments.push(...sizeCheckResult.attachableFiles)

		this.setMailChanged(true)

		if (sizeCheckResult.tooBigFiles.length > 0) {
			throw new UserError(() => lang.get("tooBigAttachment_msg") + "\n" + sizeCheckResult.tooBigFiles.join("\n"))
		}
	}

	removeAttachment(file: Attachment): void {
		if (remove(this.attachments, file)) {
			this.setMailChanged(true)
		}
	}

	getSenderName(): string {
		return getSenderNameForUser(this.mailboxDetails, this.user())
	}

	getDraft(): Readonly<Mail> | null {
		return this.draft
	}

	private updateDraft(body: string, attachments: ReadonlyArray<Attachment> | null, draft: Mail): Promise<Mail> {
		return this.mailFacade
				   .updateDraft(
					   {
						   subject: this.getSubject(),
						   body: body,
						   senderMailAddress: this.senderAddress,
						   senderName: this.getSenderName(),
						   toRecipients: this.toRecipients().map(recipientInfoToDraftRecipient),
						   ccRecipients: this.ccRecipients().map(recipientInfoToDraftRecipient),
						   bccRecipients: this.bccRecipients().map(recipientInfoToDraftRecipient),
						   attachments: attachments,
						   confidential: this.isConfidential(),
						   draft: draft,
					   },
				   )
				   .catch(
					   ofClass(LockedError, e => {
						   console.log("updateDraft: operation is still active", e)
						   throw new UserError("operationStillActive_msg")
					   }),
				   )
				   .catch(
					   ofClass(NotFoundError, e => {
						   console.log("draft has been deleted, creating new one")
						   return this.createDraft(body, attachments, downcast(draft.method))
					   }),
				   )
	}

	private createDraft(body: string, attachments: ReadonlyArray<Attachment> | null, mailMethod: MailMethod): Promise<Mail> {
		return this.mailFacade.createDraft(
			{
				subject: this.getSubject(),
				bodyText: body,
				senderMailAddress: this.senderAddress,
				senderName: this.getSenderName(),
				toRecipients: this.toRecipients().map(recipientInfoToDraftRecipient),
				ccRecipients: this.ccRecipients().map(recipientInfoToDraftRecipient),
				bccRecipients: this.bccRecipients().map(recipientInfoToDraftRecipient),
				conversationType: this.conversationType,
				previousMessageId: this.previousMessageId,
				attachments: attachments,
				confidential: this.isConfidential(),
				replyTos: this.replyTos.map(recipientInfoToEncryptedMailAddress),
				method: mailMethod
			},
		)
	}

	isConfidential(): boolean {
		return this.confidential || !this.containsExternalRecipients()
	}

	isConfidentialExternal(): boolean {
		return this.confidential && this.containsExternalRecipients()
	}

	setConfidential(confidential: boolean): void {
		this.confidential = confidential
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
	 * @param getConfirmation: A callback to get user confirmation
	 * @param waitHandler: A callback to allow UI blocking while the mail is being sent. it seems like wrapping the send call in showProgressDialog causes the confirmation dialogs not to be shown. We should fix this, but this works for now
	 * @param tooManyRequestsError
	 * @return true if the send was completed, false if it was aborted (by getConfirmation returning false
	 */
	async send(
		mailMethod: MailMethod,
		getConfirmation: (arg0: TranslationText) => Promise<boolean> = _ => Promise.resolve(true),
		waitHandler: (arg0: TranslationText, arg1: Promise<any>) => Promise<any> = (_, p) => p,
		tooManyRequestsError: TranslationKey = "tooManyMails_msg",
	): Promise<boolean> {
		this.onBeforeSend()

		if (this.allRecipients().length === 1 && this.allRecipients()[0].mailAddress.toLowerCase().trim() === "approval@tutao.de") {
			await this.sendApprovalMail(this.getBody())
			return true
		}

		if (this.toRecipients().length === 0 && this.ccRecipients().length === 0 && this.bccRecipients().length === 0) {
			throw new UserError("noRecipients_msg")
		}

		const numVisibleRecipients = this.toRecipients().length + this.ccRecipients().length

		// Many recipients is a warning
		if (numVisibleRecipients >= TOO_MANY_VISIBLE_RECIPIENTS && !(await getConfirmation("manyRecipients_msg"))) {
			return false
		}

		// Empty subject is a warning
		if (this.getSubject().length === 0 && !(await getConfirmation("noSubject_msg"))) {
			return false
		}

		// The next check depends on contacts being available
		await this.waitForResolvedRecipients()

		// No password in external confidential mail is an error
		if (this.isConfidentialExternal() && this.getExternalRecipients().some(r => !this.getPassword(r.mailAddress))) {
			throw new UserError("noPreSharedPassword_msg")
		}

		// Weak password is a warning
		if (this.isConfidentialExternal() && this.hasInsecurePasswords() && !(await getConfirmation("presharedPasswordNotStrongEnough_msg"))) {
			return false
		}

		const doSend = async () => {
			await this.saveDraft(true, mailMethod)
			await this.updateContacts(this.allRecipients())
			const allRecipients = this.allRecipients().map(({
																name,
																mailAddress,
																type,
																contact
															}) => makeRecipientDetails(name, mailAddress, type, contact))
			await this.mailFacade.sendDraft(neverNull(this.draft), allRecipients, this.selectedNotificationLanguage)
			await this.updatePreviousMail()
			await this.updateExternalLanguage()
			return true
		}

		return waitHandler(this.isConfidential() ? "sending_msg" : "sendingUnencrypted_msg", doSend())
			.catch(
				ofClass(LockedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			) // catch all of the badness
			.catch(
				ofClass(RecipientNotResolvedError, () => {
					throw new UserError("tooManyAttempts_msg")
				}),
			)
			.catch(
				ofClass(RecipientsNotFoundError, e => {
					if (mailMethod === MailMethod.ICAL_CANCEL) {
						// in case of calendar event cancellation we will remove invalid recipients and then delete the event without sending updates
						throw e
					} else {
						let invalidRecipients = e.message
						throw new UserError(
							() => lang.get("tutanotaAddressDoesNotExist_msg") + " " + lang.get("invalidRecipients_msg") + "\n" + invalidRecipients,
						)
					}
				}),
			)
			.catch(
				ofClass(TooManyRequestsError, () => {
					throw new UserError(tooManyRequestsError)
				}),
			)
			.catch(
				ofClass(AccessBlockedError, e => {
					// special case: the approval status is set to SpamSender, but the update has not been received yet, so use SpamSender as default
					return checkApprovalStatus(this.logins, true, ApprovalStatus.SPAM_SENDER).then(() => {
						console.log("could not send mail (blocked access)", e)
						return false
					})
				}),
			)
			.catch(
				ofClass(FileNotFoundError, () => {
					throw new UserError("couldNotAttachFile_msg")
				}),
			)
			.catch(
				ofClass(PreconditionFailedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			)
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

	saveDraft(
		saveAttachments: boolean,
		mailMethod: MailMethod
	): Promise<void> {

		if (this.currentSavePromise == null) {
			this.currentSavePromise = Promise.resolve().then(async () => {
				try {
					await this.doSaveDraft(saveAttachments, mailMethod)
				} finally {
					// If there is an error, we still need to reset currentSavePromise
					this.currentSavePromise = null
				}
				if (this.mailChanged && this.doSaveAgain) {
					this.doSaveAgain = false
					await this.saveDraft(saveAttachments, mailMethod)
				}
			})
		} else {
			this.doSaveAgain = true
		}

		return this.currentSavePromise
	}

	/**
	 * Saves the draft.
	 * @param saveAttachments True if also the attachments shall be saved, false otherwise.
	 * @param mailMethod
	 * @returns {Promise} When finished.
	 * @throws FileNotFoundError when one of the attachments could not be opened
	 * @throws PreconditionFailedError when the draft is locked
	 */
	private async doSaveDraft(
		saveAttachments: boolean,
		mailMethod: MailMethod,
	): Promise<void> {

		// Allow any changes that might occur while the mail is being saved to be accounted for
		// if saved is called before this has completed
		this.mailChanged = false

		try {
			const attachments = saveAttachments ? this.attachments : null

			// We also want to create new drafts for drafts edited from trash or spam folder
			this.draft = this.draft == null || await this.isMailInTrashOrSpam(this.draft)
				? await this.createDraft(this.getBody(), attachments, mailMethod)
				: await this.updateDraft(this.getBody(), attachments, this.draft)

			const newAttachments = await promiseMap(
				this.draft.attachments,
				fileId => this.entity.load<TutanotaFile>(FileTypeRef, fileId),
				{
					concurrency: 5,
				}
			)

			this.attachments = [] // attachFiles will push to existing files but we want to overwrite them
			this.attachFiles(newAttachments)

		} catch (e) {
			if (e instanceof PayloadTooLargeError) {
				throw new UserError("requestTooLarge_msg")
			} else if (e instanceof MailBodyTooLargeError) {
				throw new UserError("mailBodyTooLarge_msg")
			} else if (e instanceof FileNotFoundError) {
				throw new UserError("couldNotAttachFile_msg")
			} else if (e instanceof PreconditionFailedError) {
				throw new UserError("operationStillActive_msg")
			} else {
				throw e
			}
		}
	}

	private async isMailInTrashOrSpam(draft: Mail) {
		const folders = await this.mailModel.getMailboxFolders(draft)
		const trashAndMailFolders = folders.filter(f => f.folderType === MailFolderType.TRASH || f.folderType === MailFolderType.SPAM)
		return trashAndMailFolders.some(folder => isSameId(folder.mails, getListId(draft)))
	}

	private sendApprovalMail(body: string): Promise<unknown> {
		const listId = "---------c--"
		const m = createApprovalMail({
			_id: [listId, stringToCustomId(this.senderAddress)],
			_ownerGroup: this.user().user.userGroup.group,
			text: `Subject: ${this.getSubject()}<br>${body}`,
		})
		return this.entity.setup(listId, m).catch(ofClass(NotAuthorizedError, e => console.log("not authorized for approval message")))
	}

	getAvailableNotificationTemplateLanguages(): Array<Language> {
		return this.availableNotificationTemplateLanguages
	}

	getSelectedNotificationLanguageCode(): string {
		return this.selectedNotificationLanguage
	}

	setSelectedNotificationLanguageCode(code: string) {
		this.selectedNotificationLanguage = code
		this.setMailChanged(true)
	}

	private updateExternalLanguage() {
		let props = this.user().props

		if (props.notificationMailLanguage !== this.selectedNotificationLanguage) {
			props.notificationMailLanguage = this.selectedNotificationLanguage

			this.entity.update(props)
		}
	}

	private updatePreviousMail(): Promise<void> {
		if (this.previousMail) {
			if (this.previousMail.replyType === ReplyType.NONE && this.conversationType === ConversationType.REPLY) {
				this.previousMail.replyType = ReplyType.REPLY
			} else if (this.previousMail.replyType === ReplyType.NONE && this.conversationType === ConversationType.FORWARD) {
				this.previousMail.replyType = ReplyType.FORWARD
			} else if (this.previousMail.replyType === ReplyType.FORWARD && this.conversationType === ConversationType.REPLY) {
				this.previousMail.replyType = ReplyType.REPLY_FORWARD
			} else if (this.previousMail.replyType === ReplyType.REPLY && this.conversationType === ConversationType.FORWARD) {
				this.previousMail.replyType = ReplyType.REPLY_FORWARD
			} else {
				return Promise.resolve()
			}

			return this.entity.update(this.previousMail).catch(ofClass(NotFoundError, noOp))

		} else {
			return Promise.resolve()
		}
	}

	private updateContacts(resolvedRecipients: RecipientInfo[]): Promise<any> {
		return Promise.all(
			resolvedRecipients.map(r => {
				const {mailAddress, contact} = r
				if (!contact) return Promise.resolve()
				const isExternalAndConfidential = isExternal(r) && this.isConfidential()

				if (!contact._id && (!this.user().props.noAutomaticContacts || isExternalAndConfidential)) {
					if (isExternalAndConfidential) {
						contact.presharedPassword = this.getPassword(r.mailAddress).trim()
					}

					return this.contactModel.contactListId().then(listId => {
						return this.entity.setup(listId, contact)
					})
				} else if (contact._id && isExternalAndConfidential && contact.presharedPassword !== this.getPassword(mailAddress).trim()) {
					contact.presharedPassword = this.getPassword(mailAddress).trim()
					return this.entity.update(contact)
				} else {
					return Promise.resolve()
				}
			}),
		)
	}

	allRecipients(): Array<RecipientInfo> {
		return this.toRecipients().concat(this.ccRecipients()).concat(this.bccRecipients())
	}

	/**
	 * Makes sure the recipient type and contact are resolved.
	 */
	waitForResolvedRecipients(): Promise<RecipientInfo[]> {
		return Promise.all(
			this.allRecipients().map(recipientInfo => {
				return resolveRecipientInfo(this.mailFacade, recipientInfo).then(recipientInfo => {
					if (recipientInfo.resolveContactPromise) {
						return recipientInfo.resolveContactPromise.then(() => recipientInfo)
					} else {
						return recipientInfo
					}
				})
			}),
		).catch(
			ofClass(TooManyRequestsError, () => {
				throw new RecipientNotResolvedError("")
			}),
		)
	}

	private handleEntityEvent(update: EntityUpdateData): Promise<void> {
		const {operation, instanceId, instanceListId} = update
		let contactId: IdTuple = [neverNull(instanceListId), instanceId]

		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			if (operation === OperationType.UPDATE) {
				this.entity.load(ContactTypeRef, contactId).then(contact => {
					for (const fieldType of typedValues(RecipientField)) {
						const matching = this.getRecipientList(fieldType).filter(recipient => recipient.contact && isSameId(recipient.contact._id, contact._id))
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
				for (const fieldType of typedValues(RecipientField)) {
					const recipients = this.getRecipientList(fieldType)

					const toDelete = recipients.filter(recipient => (recipient.contact && isSameId(recipient.contact._id, contactId)) || false)

					for (const r of toDelete) {
						this.removeRecipient(r, fieldType, true)
					}
				}
			}

			this.setMailChanged(true)
		} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update)) {
			this.updateAvailableNotificationTemplateLanguages()
		}

		return Promise.resolve()
	}

	setOnBeforeSendFunction(fun: () => unknown) {
		this.onBeforeSend = fun
	}
}

export function defaultSendMailModel(mailboxDetails: MailboxDetail): SendMailModel {
	return new SendMailModel(locator.mailFacade, locator.entityClient, logins, locator.mailModel, locator.contactModel, locator.eventController, mailboxDetails)
}