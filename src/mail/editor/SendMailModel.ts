import {ApprovalStatus, ConversationType, MailFolderType, MailMethod, MAX_ATTACHMENT_SIZE, OperationType, ReplyType} from "../../api/common/TutanotaConstants"
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
import {getPasswordStrengthForUser, isSecurePassword, PASSWORD_MIN_SECURE_VALUE} from "../../misc/passwords/PasswordUtils"
import {cleanMatch, deduplicate, downcast, findAndRemove, getFromMap, neverNull, noOp, ofClass, promiseMap, remove, typedValues} from "@tutao/tutanota-utils"
import {
	checkAttachmentSize,
	getDefaultSender,
	getSenderNameForUser,
	getTemplateLanguages,
	RecipientField,
} from "../model/MailUtils"
import type {File as TutanotaFile, Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {ContactTypeRef, ConversationEntryTypeRef, FileTypeRef, MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import type {MailboxDetail, MailModel} from "../model/MailModel"
import {RecipientNotResolvedError} from "../../api/common/error/RecipientNotResolvedError"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {isMailAddress} from "../../misc/FormatValidator"
import type {ContactModel} from "../../contacts/model/ContactModel"
import type {Language, TranslationKey, TranslationText} from "../../misc/LanguageViewModel"
import {getAvailableLanguageCode, getSubstitutedLanguageCode, lang, languages} from "../../misc/LanguageViewModel"
import type {UserController} from "../../api/main/UserController"
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
import {PartialRecipient, Recipient, RecipientList, Recipients, RecipientType} from "../../api/common/recipients/Recipient"
import {RecipientsModel, ResolvableRecipient, ResolveMode} from "../../api/main/RecipientsModel"
import {createApprovalMail} from "../../api/entities/monitor/TypeRefs"

assertMainOrNode()
export const TOO_MANY_VISIBLE_RECIPIENTS = 10

export type Attachment = TutanotaFile | DataFile | FileReference

export type InitAsResponseArgs = {
	previousMail: Mail
	conversationType: ConversationType
	senderMailAddress: string
	recipients: Recipients
	attachments: TutanotaFile[]
	subject: string
	bodyText: string
	replyTos: RecipientList
}

type InitArgs = {
	conversationType: ConversationType
	subject: string
	bodyText: string
	recipients: Recipients
	confidential: boolean | null
	draft?: Mail | null
	senderMailAddress?: string
	attachments?: ReadonlyArray<Attachment>
	replyTos?: RecipientList
	previousMail?: Mail | null
	previousMessageId?: string | null
}

/**
 * Model which allows sending mails interactively - including resolving of recipients and handling of drafts.
 */
export class SendMailModel {

	onMailChanged: Stream<boolean> = stream(false)
	onRecipientDeleted: Stream<{field: RecipientField, recipient: Recipient} | null> = stream(null)
	onBeforeSend: () => void = noOp
	loadedInlineImages: InlineImages = new Map()

	// Isn't private because used by MinimizedEditorOverlay, refactor?
	draft: Mail | null = null
	private conversationType: ConversationType = ConversationType.NEW
	private subject: string = ""
	private body: string = ""
	private recipients: Map<RecipientField, Array<ResolvableRecipient>> = new Map()
	private senderAddress: string
	private confidential: boolean

	// contains either Files from Tutanota or DataFiles of locally loaded files. these map 1:1 to the _attachmentButtons
	private attachments: Array<Attachment> = []

	private replyTos: Array<ResolvableRecipient> = []

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
		public readonly mailboxDetails: MailboxDetail,
		private readonly recipientsModel: RecipientsModel,
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

	user(): UserController {
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
	 * @returns value between 0 and 100
	 */
	getPasswordStrength(recipient: PartialRecipient): number {
		return getPasswordStrengthForUser(this.getPassword(recipient.address), recipient, this.mailboxDetails, this.logins)
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
			confidential: confidential ?? null,
			senderMailAddress,
		})
	}

	async initAsResponse(args: InitAsResponseArgs, inlineImages: InlineImages): Promise<SendMailModel> {
		const {
			previousMail,
			conversationType,
			senderMailAddress,
			recipients,
			attachments,
			subject,
			bodyText,
			replyTos
		} = args
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
			to: toRecipients,
			cc: ccRecipients,
			bcc: bccRecipients,
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

		let to: RecipientList
		let cc: RecipientList
		let bcc: RecipientList

		if (recipients instanceof Array) {
			to = recipients
			cc = []
			bcc = []
		} else {
			to = recipients.to ?? []
			cc = recipients.cc ?? []
			bcc = recipients.bcc ?? []
		}

		const recipientsFilter = (recipientList: Array<PartialRecipient>) => deduplicate(
			recipientList.filter(r => isMailAddress(r.address, false)),
			(a, b) => a.address === b.address,
		)

		recipientsFilter(to).map(r => this.addRecipient(RecipientField.TO, r))
		recipientsFilter(cc).map(r => this.addRecipient(RecipientField.CC, r))
		recipientsFilter(bcc).map(r => this.addRecipient(RecipientField.BCC, r))

		this.senderAddress = senderMailAddress || this.getDefaultSender()
		this.confidential = confidential ?? !this.user().props.defaultUnconfidential
		this.attachments = []

		if (attachments) {
			this.attachFiles(attachments)
			this.mailChanged = false
		}

		this.replyTos = recipientsFilter(replyTos ?? []).map(recipient => this.recipientsModel.resolve(recipient, ResolveMode.Eager))
		this.previousMail = previousMail || null
		this.previousMessageId = previousMessageId || null
		this.mailChanged = false
		return this
	}

	private getDefaultSender(): string {
		return getDefaultSender(this.logins, this.mailboxDetails)
	}

	getRecipientList(type: RecipientField): Array<ResolvableRecipient> {
		return getFromMap(this.recipients, type, () => [])
	}

	toRecipients(): Array<ResolvableRecipient> {
		return this.getRecipientList(RecipientField.TO)
	}

	toRecipientsResolved(): Promise<Array<Recipient>> {
		return Promise.all(this.toRecipients().map(recipient => recipient.resolved()))
	}

	ccRecipients(): Array<ResolvableRecipient> {
		return this.getRecipientList(RecipientField.CC)
	}

	ccRecipientsResolved(): Promise<Array<Recipient>> {
		return Promise.all(this.ccRecipients().map(recipient => recipient.resolved()))
	}

	bccRecipients(): Array<ResolvableRecipient> {
		return this.getRecipientList(RecipientField.BCC)
	}

	bccRecipientsResolved(): Promise<Array<Recipient>> {
		return Promise.all(this.bccRecipients().map(recipient => recipient.resolved()))
	}

	replyTosResolved(): Promise<Array<Recipient>> {
		return Promise.all(this.replyTos.map(r => r.resolved()))
	}

	/**
	 * Add a new recipient, this method resolves when the recipient resolves
	 */
	async addRecipient(
		fieldType: RecipientField,
		{
			address,
			name,
			type,
			contact
		}: PartialRecipient,
		resolveMode: ResolveMode = ResolveMode.Eager
	): Promise<void> {

		let recipient = this.getRecipientList(fieldType).find(recipient => recipient.address === address)
		// Only add a recipient if it doesn't exist
		if (!recipient) {
			recipient = this.recipientsModel.resolve({
					address,
					name,
					type,
					contact,
				},
				resolveMode
			)

			this.getRecipientList(fieldType).push(recipient)

			recipient.resolved().then(({address, contact}) => {
				if (!this.passwords.has(address) && contact != null) {
					this.setPassword(address, contact.presharedPassword ?? "")
				}
				this.setMailChanged(true)
			})

			this.setMailChanged(true)

		}

		await recipient.resolved()
	}

	getRecipient(type: RecipientField, address: string): ResolvableRecipient | null {
		return this.getRecipientList(type).find(recipient => recipient.address === address) ?? null
	}

	removeRecipientByAddress(address: string, type: RecipientField, notify: boolean = true) {
		const recipient = this.getRecipientList(type).find(recipient => recipient.address === address)
		if (recipient) {
			this.removeRecipient(recipient, type, notify)
		}
	}

	removeRecipient(recipient: Recipient, type: RecipientField, notify: boolean = true): boolean {
		const recipients = this.recipients.get(type) ?? []
		const didRemove = findAndRemove(recipients, r => r.address === recipient.address)
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

	private async updateDraft(body: string, attachments: ReadonlyArray<Attachment> | null, draft: Mail): Promise<Mail> {
		return this.mailFacade
				   .updateDraft(
					   {
						   subject: this.getSubject(),
						   body: body,
						   senderMailAddress: this.senderAddress,
						   senderName: this.getSenderName(),
						   toRecipients: await this.toRecipientsResolved(),
						   ccRecipients: await this.ccRecipientsResolved(),
						   bccRecipients: await this.bccRecipientsResolved(),
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

	private async createDraft(body: string, attachments: ReadonlyArray<Attachment> | null, mailMethod: MailMethod): Promise<Mail> {
		return this.mailFacade.createDraft(
			{
				subject: this.getSubject(),
				bodyText: body,
				senderMailAddress: this.senderAddress,
				senderName: this.getSenderName(),
				toRecipients: await this.toRecipientsResolved(),
				ccRecipients: await this.ccRecipientsResolved(),
				bccRecipients: await this.bccRecipientsResolved(),
				conversationType: this.conversationType,
				previousMessageId: this.previousMessageId,
				attachments: attachments,
				confidential: this.isConfidential(),
				replyTos: await this.replyTosResolved(),
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
		return this.allRecipients().some(r => r.type === RecipientType.EXTERNAL)
	}

	getExternalRecipients(): Array<Recipient> {
		return this.allRecipients().filter(r => r.type === RecipientType.EXTERNAL)
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

		if (this.allRecipients().length === 1 && this.allRecipients()[0].address.toLowerCase().trim() === "approval@tutao.de") {
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
		// So we need to wait for our recipients here
		const recipients = await this.waitForResolvedRecipients()

		// No password in external confidential mail is an error
		if (this.isConfidentialExternal() && this.getExternalRecipients().some(r => !this.getPassword(r.address))) {
			throw new UserError("noPreSharedPassword_msg")
		}

		// Weak password is a warning
		if (this.isConfidentialExternal() && this.hasInsecurePasswords() && !(await getConfirmation("presharedPasswordNotStrongEnough_msg"))) {
			return false
		}

		const doSend = async () => {
			await this.saveDraft(true, mailMethod)
			await this.updateContacts(recipients)
			await this.mailFacade.sendDraft(neverNull(this.draft), recipients, this.selectedNotificationLanguage)
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
											.filter(r => this.getPassword(r.address) !== "")
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

	/**
	 * If contacts have had their passwords changed, we update them before sending
	 */
	private async updateContacts(resolvedRecipients: Recipient[]): Promise<any> {
		for (const {address, contact, type} of resolvedRecipients) {
			if (contact == null) {
				continue
			}

			const isExternalAndConfidential = type === RecipientType.EXTERNAL && this.isConfidential()

			if (!contact._id && (!this.user().props.noAutomaticContacts || isExternalAndConfidential)) {
				if (isExternalAndConfidential) {
					contact.presharedPassword = this.getPassword(address).trim()
				}

				const listId = await this.contactModel.contactListId()
				await this.entity.setup(listId, contact)
			} else if (contact._id && isExternalAndConfidential && contact.presharedPassword !== this.getPassword(address).trim()) {
				contact.presharedPassword = this.getPassword(address).trim()
				await this.entity.update(contact)
			}
		}
	}

	allRecipients(): Array<ResolvableRecipient> {
		return this.toRecipients().concat(this.ccRecipients()).concat(this.bccRecipients())
	}

	/**
	 * Makes sure the recipient type and contact are resolved.
	 */
	waitForResolvedRecipients(): Promise<Recipient[]> {
		return Promise.all(this.allRecipients().map(recipient => recipient.resolved()))
					  .catch(ofClass(TooManyRequestsError, () => {
						  throw new RecipientNotResolvedError("")
					  }))
	}

	handleEntityEvent(update: EntityUpdateData): Promise<void> {
		const {operation, instanceId, instanceListId} = update
		let contactId: IdTuple = [neverNull(instanceListId), instanceId]

		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			if (operation === OperationType.UPDATE) {
				this.entity.load(ContactTypeRef, contactId).then(contact => {
					for (const fieldType of typedValues(RecipientField)) {
						const matching = this.getRecipientList(fieldType).filter(recipient => recipient.contact && isSameId(recipient.contact._id, contact._id))
						matching.forEach(recipient => {
							// if the mail address no longer exists on the contact then delete the recipient
							if (!contact.mailAddresses.find(ma => cleanMatch(ma.address, recipient.address))) {
								this.removeRecipient(recipient, fieldType, true)
							} else {
								// else just modify the recipient
								recipient.setName(getContactDisplayName(contact))
								recipient.setContact(contact)
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
	return new SendMailModel(
		locator.mailFacade,
		locator.entityClient,
		logins,
		locator.mailModel,
		locator.contactModel,
		locator.eventController,
		mailboxDetails,
		locator.recipientsModel
	)
}