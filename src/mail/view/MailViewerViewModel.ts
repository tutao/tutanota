import {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {MailBody, MailBodyTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {File as TutanotaFile, FileTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {CalendarEvent} from "../../api/entities/tutanota/TypeRefs.js"
import {
	CalendarMethod,
	ConversationType,
	ExternalImageRule,
	FeatureType,
	MailAuthenticationStatus,
	MailFolderType,
	MailMethod,
	mailMethodToCalendarMethod,
	MailPhishingStatus,
	MailReportType,
	MailState,
} from "../../api/common/TutanotaConstants"
import {EntityClient} from "../../api/common/EntityClient"
import {MailboxDetail, MailModel} from "../model/MailModel"
import {ContactModel} from "../../contacts/model/ContactModel"
import {ConfigurationDatabase} from "../../api/worker/facades/ConfigurationDatabase"
import {InlineImages} from "./MailViewer"
import {isDesktop} from "../../api/common/Env"
import {Request} from "../../api/common/MessageDispatcher"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {addAll, contains, defer, DeferredObject, downcast, neverNull, noOp, ofClass, startsWith} from "@tutao/tutanota-utils"
import {lang} from "../../misc/LanguageViewModel"
import {
	getArchiveFolder,
	getDefaultSender,
	getEnabledMailAddresses,
	getFolder,
	getFolderName,
	getMailboxName,
	isExcludedMailAddress,
	isTutanotaTeamMail
} from "../model/MailUtils"
import {LoginController} from "../../api/main/LoginController"
import m from "mithril"
import {ConversationEntryTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {ConnectionError, LockedError, NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {NativeInterface} from "../../native/common/NativeInterface"
import {elementIdPart, listIdPart} from "../../api/common/utils/EntityUtils"
import {getReferencedAttachments, loadInlineImages, moveMails, revokeInlineImages} from "./MailGuiUtils"
import {locator} from "../../api/main/MainLocator"
import {SanitizeResult} from "../../misc/HtmlSanitizer"
import {stringifyFragment} from "../../gui/HtmlUtils"
import {CALENDAR_MIME_TYPE, FileController} from "../../file/FileController"
import {createMailAddress, MailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import {getMailBodyText, getMailHeaders} from "../../api/common/utils/Utils"
import {MailHeadersTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {createEncryptedMailAddress, EncryptedMailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import {exportMails} from "../export/Exporter.js"
import {FileFacade} from "../../api/worker/facades/FileFacade"
import {IndexingNotSupportedError} from "../../api/common/error/IndexingNotSupportedError"
import {FileOpenError} from "../../api/common/error/FileOpenError"
import {Dialog} from "../../gui/base/Dialog"
import {createListUnsubscribeData} from "../../api/entities/tutanota/TypeRefs.js"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import {formatDateTime, urlEncodeHtmlTags} from "../../misc/Formatter"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {ResponseMailParameters} from "../editor/SendMailModel"
import {GroupInfo} from "../../api/entities/sys/TypeRefs.js"
import {CustomerTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {MailRestriction} from "../../api/entities/tutanota/TypeRefs.js"
import {LoadingStateTracker} from "../../offline/LoadingState"
import {IServiceExecutor} from "../../api/common/ServiceRequest"
import {ListUnsubscribeService} from "../../api/entities/tutanota/Services"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"


export const enum ContentBlockingStatus {
	Block = "0",
	Show = "1",
	AlwaysShow = "2",
	NoExternalContent = "3",
	AlwaysBlock = "4",
}

export class MailViewerViewModel {
	private mailBody: MailBody | null = null
	private contrastFixNeeded: boolean = false

	// always sanitized in this.setSanitizedMailBodyFromMail
	private sanitizeResult: SanitizeResult | null = null
	private loadingAttachments: boolean = false

	private attachments: TutanotaFile[] = []

	private contentBlockingStatus: ContentBlockingStatus | null = null
	private errorOccurred: boolean = false
	private loadedInlineImages: InlineImages | null = null
	private suspicious: boolean = false

	private folderText: string | null
	private readonly filesExpanded: Stream<boolean>

	private warningDismissed: boolean = false

	private calendarEventAttachment: {
		event: CalendarEvent
		method: CalendarMethod
		recipient: string
	} | null = null

	private readonly loadingState = new LoadingStateTracker()

	private renderIsDelayed: boolean = true

	constructor(
		public readonly mail: Mail,
		showFolder: boolean,
		/**
		 * This exists for a single purpose: making opening emails smooth in a single column layout. When the app is in a single-column layout and the email
		 * is selected from the list then there is an animation of switching between columns. This paramter will delay sanitizing of mail body and rendering
		 * of progress indicator until the animation is done.
		 */
		private readonly delayBodyRenderingUntil: Promise<void>,
		readonly entityClient: EntityClient,
		public readonly mailModel: MailModel,
		readonly contactModel: ContactModel,
		private readonly configFacade: ConfigurationDatabase,
		native: NativeInterface | null,
		private readonly fileFacade: FileFacade,
		private readonly fileController: FileController,
		readonly logins: LoginController,
		readonly service: IServiceExecutor
	) {
		this.delayBodyRenderingUntil.then(() => {
				this.renderIsDelayed = false
				m.redraw()
			}
		)
		if (isDesktop()) {
			// Notify the admin client about the mail being selected
			native?.invokeNative(
				new Request("sendSocketMessage", [
					{
						mailAddress: mail.sender.address,
					},
				]),
			)
		}

		this.folderText = null
		this.filesExpanded = stream(false)

		if (showFolder) {
			const folder = this.mailModel.getMailFolder(mail._id[0])

			if (folder) {
				this.mailModel.getMailboxDetailsForMail(mail).then(mailboxDetails => {
					this.folderText = `${lang.get("location_label")}: ${getMailboxName(logins, mailboxDetails)} / ${getFolderName(folder)}`.toUpperCase()
					m.redraw()
				})
			}
		}
	}

	async dispose() {
		const inlineImages = await this.getLoadedInlineImages()
		revokeInlineImages(inlineImages)
	}

	async loadAll() {
		await this.loadingState.trackPromise(
			this.loadMailBody(this.mail)
				.then((inlineImageCids) => this.loadAttachments(this.mail, inlineImageCids))
		).catch(ofClass(ConnectionError, noOp))

		m.redraw()

		// We need the conversation entry in order to reply to the message.
		// We don't want the user to have to wait for it to load when they click reply,
		// So we load it here pre-emptively to make sure it is in the cache.
		this.entityClient
			.load(ConversationEntryTypeRef, this.mail.conversationEntry)
			.catch(ofClass(NotFoundError, e => console.log("could load conversation entry as it has been moved/deleted already", e)))
			.catch(ofClass(ConnectionError, e => console.log("failed to load conversation entry, because of a lost connection", e)))
	}

	isLoading(): boolean {
		return this.loadingState.isLoading()
	}

	isConnectionLost(): boolean {
		return this.loadingState.isConnectionLost()
	}

	getAttachments(): Array<TutanotaFile> {
		return this.attachments
	}

	getInlineCids(): Array<string> {
		return this.sanitizeResult?.inlineImageCids ?? []
	}

	getLoadedInlineImages(): InlineImages {
		return this.loadedInlineImages ?? new Map()
	}

	isContrastFixNeeded(): boolean {
		return this.contrastFixNeeded
	}

	isDraftMail() {
		return this.mail.state === MailState.DRAFT
	}

	isReceivedMail() {
		return this.mail.state === MailState.RECEIVED
	}


	isLoadingAttachments(): boolean {
		return this.loadingAttachments
	}

	getFolderText(): string | null {
		return this.folderText
	}

	getSubject(): string {
		return this.mail.subject
	}

	isConfidential(): boolean {
		return this.mail.confidential
	}

	isMailSuspicious(): boolean {
		return this.suspicious
	}

	getMailId(): IdTuple {
		return this.mail._id
	}

	getSanitizedMailBody(): string | null {
		return this.sanitizeResult?.text ?? null
	}

	getMailBody(): string {
		if (this.mailBody) {
			return getMailBodyText(this.mailBody)
		} else {
			return ""
		}
	}

	getSentDate(): Date {
		return this.mail.sentDate
	}

	getToRecipients(): Array<MailAddress> {
		return this.mail.toRecipients
	}

	getCcRecipients(): Array<MailAddress> {
		return this.mail.ccRecipients
	}

	getBccRecipients(): Array<MailAddress> {
		return this.mail.bccRecipients
	}

	getReplyTos(): Array<EncryptedMailAddress> {
		return this.mail.replyTos
	}

	getSender(): MailAddress {
		return this.mail.sender
	}

	getPhishingStatus(): MailPhishingStatus {
		return this.mail.phishingStatus as MailPhishingStatus
	}

	setPhishingStatus(status: MailPhishingStatus) {
		this.mail.phishingStatus = status
	}

	isMailAuthenticated() {
		return this.mail.authStatus === MailAuthenticationStatus.AUTHENTICATED
	}

	setAuthenticationStatus(status: MailAuthenticationStatus) {
		this.mail.authStatus = status
	}

	canCreateSpamRule(): boolean {
		return this.logins.isGlobalAdminUserLoggedIn() && !this.logins.isEnabled(FeatureType.InternalCommunication)
	}

	didErrorsOccur(): boolean {
		return this.errorOccurred || typeof this.mail._errors !== 'undefined' || (this.mailBody != null && typeof this.mailBody._errors !== 'undefined')
	}

	isTutanotaTeamMail(): boolean {
		return isTutanotaTeamMail(this.mail)
	}

	isShowingExternalContent(): boolean {
		return this.contentBlockingStatus === ContentBlockingStatus.Show || this.contentBlockingStatus === ContentBlockingStatus.AlwaysShow
	}

	isBlockingExternalImages(): boolean {
		return this.contentBlockingStatus === ContentBlockingStatus.Block || this.contentBlockingStatus === ContentBlockingStatus.AlwaysBlock
	}

	getDifferentEnvelopeSender(): string | null {
		return this.mail.differentEnvelopeSender
	}

	getCalendarEventAttachment(): MailViewerViewModel["calendarEventAttachment"] {
		return this.calendarEventAttachment
	}

	getContentBlockingStatus(): ContentBlockingStatus | null {
		return this.contentBlockingStatus
	}

	isWarningDismissed() {
		return this.warningDismissed
	}

	setWarningDismissed(dismissed: boolean) {
		this.warningDismissed = dismissed
	}

	getRestrictions(): MailRestriction | null {
		return this.mail.restrictions
	}

	async setContentBlockingStatus(status: ContentBlockingStatus): Promise<void> {
		// We can only be set to NoExternalContent when initially loading the mailbody (_loadMailBody)
		// so we ignore it here, and don't do anything if we were already set to NoExternalContent
		if (status === ContentBlockingStatus.NoExternalContent
			|| this.contentBlockingStatus === ContentBlockingStatus.NoExternalContent
			|| this.contentBlockingStatus === status
		) {
			return
		}

		if (status === ContentBlockingStatus.AlwaysShow) {
			this.configFacade.addExternalImageRule(this.getSender().address, ExternalImageRule.Allow).catch(ofClass(IndexingNotSupportedError, noOp))
		} else if (status === ContentBlockingStatus.AlwaysBlock) {
			this.configFacade.addExternalImageRule(this.getSender().address, ExternalImageRule.Block).catch(ofClass(IndexingNotSupportedError, noOp))
		} else {
			// we are going from allow or block to something else it means we're resetting to the default rule for the given sender
			this.configFacade.addExternalImageRule(this.getSender().address, ExternalImageRule.None).catch(ofClass(IndexingNotSupportedError, noOp))
		}

		this.contentBlockingStatus = status

		// We don't check mail authentication status here because the user has manually called this

		this.sanitizeResult = await this.setSanitizedMailBodyFromMail(this.mail, this.isBlockingExternalImages())
	}

	async markAsNotPhishing(): Promise<void> {
		const oldStatus = this.getPhishingStatus()

		if (oldStatus === MailPhishingStatus.WHITELISTED) {
			return
		}

		this.setPhishingStatus(MailPhishingStatus.WHITELISTED)

		await this.entityClient
				  .update(this.mail)
				  .catch(e => this.setPhishingStatus(oldStatus))
	}

	async reportMail(reportType: MailReportType): Promise<void> {
		try {

			await this.mailModel.reportMails(reportType, [this.mail])
			if (reportType === MailReportType.PHISHING) {
				this.setPhishingStatus(MailPhishingStatus.SUSPICIOUS)
				await this.entityClient.update(this.mail)
			}
			const mailboxDetails = await this.mailModel.getMailboxDetailsForMail(this.mail)
			const spamFolder = getFolder(mailboxDetails.folders, MailFolderType.SPAM)
			// do not report moved mails again
			await moveMails({mailModel: this.mailModel, mails: [this.mail], targetMailFolder: spamFolder, isReportable: false})
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("mail already moved")
			} else {
				throw e
			}
		}
	}

	async exportMail(): Promise<void> {
		await exportMails([this.mail], this.entityClient, this.fileController)
	}

	async getHeaders(): Promise<string | null> {
		if (!this.mail.headers) {
			return null
		}

		return this.entityClient
				   .load(MailHeadersTypeRef, this.mail.headers)
				   .then(headers => getMailHeaders(headers) ?? null)
				   .catch(ofClass(NotFoundError, () => null))
	}

	isUnread(): boolean {
		return this.mail.unread
	}

	setUnread(unread: boolean) {
		this.mail.unread = unread

		this.entityClient
			.update(this.mail)
			.catch(ofClass(LockedError, () => console.log("could not update mail read state: ", lang.get("operationStillActive_msg"))))
			.catch(ofClass(NotFoundError, noOp))
	}

	isListUnsubscribe(): boolean {
		return this.mail.listUnsubscribe
	}

	isAnnouncement(): boolean {
		return isExcludedMailAddress(this.getSender().address)
	}

	async unsubscribe(): Promise<boolean> {

		if (!this.isListUnsubscribe()) {
			return false
		}

		return this.getHeaders().then(mailHeaders => {
			if (!mailHeaders) {
				return false
			}

			let headers = mailHeaders
				.split("\n")
				.filter(headerLine => headerLine.toLowerCase().startsWith("list-unsubscribe"))

			if (headers.length > 0) {
				return this.getSenderOfResponseMail().then(recipient => {
					const postData = createListUnsubscribeData({
						mail: this.getMailId(),
						recipient,
						headers: headers.join("\n"),
					})
					return this.service.post(ListUnsubscribeService, postData).then(() => true)
				})
			} else {
				return false
			}
		})
	}

	private getMailboxDetails(): Promise<MailboxDetail> {
		return this.mailModel.getMailboxDetailsForMail(this.mail)
	}

	/** @return list of inline referenced cid */
	private async loadMailBody(mail: Mail): Promise<string[]> {
		// Short-circuit if we already loaded everything. Will avoid resetting contentBlockingStatus or mail body.
		if (this.sanitizeResult) {
			return this.sanitizeResult.inlineImageCids
		}

		try {
			this.mailBody = await this.entityClient.load(MailBodyTypeRef, mail.body)
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could load mail body as it has been moved/deleted already", e)
				this.errorOccurred = true
				return []
			}

			if (e instanceof NotAuthorizedError) {
				console.log("could load mail body as the permission is missing", e)
				this.errorOccurred = true
				return []
			}

			throw e
		}

		const externalImageRule = await this.configFacade.getExternalImageRule(mail.sender.address).catch(e => {
			console.log("Error getting external image rule:", e)
			return ExternalImageRule.None
		})
		const isAllowedAndAuthenticatedExternalSender =
			externalImageRule === ExternalImageRule.Allow && mail.authStatus === MailAuthenticationStatus.AUTHENTICATED
		// We should not try to sanitize body while we still animate because it's a heavy operation.
		await this.delayBodyRenderingUntil

		this.sanitizeResult = await this.setSanitizedMailBodyFromMail(mail, !isAllowedAndAuthenticatedExternalSender)

		this.checkMailForPhishing(mail, this.sanitizeResult.links)

		this.contentBlockingStatus =
			externalImageRule === ExternalImageRule.Block
				? ContentBlockingStatus.AlwaysBlock
				: isAllowedAndAuthenticatedExternalSender
					? ContentBlockingStatus.AlwaysShow
					: this.sanitizeResult.externalContent.length > 0
						? ContentBlockingStatus.Block
						: ContentBlockingStatus.NoExternalContent
		m.redraw()
		return this.sanitizeResult.inlineImageCids
	}

	private async loadAttachments(mail: Mail, inlineCids: string[]) {
		if (mail.attachments.length === 0) {
			this.loadingAttachments = false
		} else {
			this.loadingAttachments = true
			const attachmentsListId = listIdPart(mail.attachments[0])
			const attachmentElementIds = mail.attachments.map(attachment => elementIdPart(attachment))

			try {
				const files = await this.entityClient.loadMultiple(FileTypeRef, attachmentsListId, attachmentElementIds)

				this.handleCalendarFile(files, mail)

				this.attachments = files
				this.loadingAttachments = false
				m.redraw()

				// We can load any other part again because they are cached but inline images are fileData e.g. binary blobs so we don't cache them like
				// entities. So instead we check here whether we need to load them.
				if (this.loadedInlineImages == null) {
					this.loadedInlineImages = await loadInlineImages(this.fileController, files, inlineCids)
				}
				m.redraw()
			} catch (e) {
				if (e instanceof NotFoundError) {
					console.log("could load attachments as they have been moved/deleted already", e)
				} else {
					throw e
				}
			}
		}
	}

	private checkMailForPhishing(mail: Mail, links: Array<HTMLElement>) {
		if (mail.phishingStatus === MailPhishingStatus.SUSPICIOUS) {
			this.suspicious = true
		} else if (mail.phishingStatus === MailPhishingStatus.UNKNOWN) {
			const linkObjects = links.map(link => {
				return {
					href: link.getAttribute("href") || "",
					innerHTML: link.innerHTML,
				}
			})

			this.mailModel.checkMailForPhishing(mail, linkObjects).then(isSuspicious => {
				if (isSuspicious) {
					this.suspicious = true
					mail.phishingStatus = MailPhishingStatus.SUSPICIOUS

					this.entityClient
						.update(mail)
						.catch(ofClass(LockedError, e => console.log("could not update mail phishing status as mail is locked")))
						.catch(ofClass(NotFoundError, e => console.log("mail already moved")))

					m.redraw()
				}
			})
		}
	}

	/**
	 * Check if the list of files contain an iCal file which we can then load and display details for. An calendar notification
	 * should contain only one iCal attachment so we only process the first matching one.
	 */
	private handleCalendarFile(files: Array<TutanotaFile>, mail: Mail): void {
		const calendarFile = files.find(a => a.mimeType && a.mimeType.startsWith(CALENDAR_MIME_TYPE))

		if (calendarFile && (mail.method === MailMethod.ICAL_REQUEST || mail.method === MailMethod.ICAL_REPLY) && mail.state === MailState.RECEIVED) {
			Promise.all([
				import("../../calendar/date/CalendarInvites").then(({getEventFromFile}) => getEventFromFile(calendarFile)),
				this.getSenderOfResponseMail(),
			]).then(([event, recipient]) => {
				this.calendarEventAttachment = event && {
					event,
					method: mailMethodToCalendarMethod(downcast(mail.method)),
					recipient,
				}
				m.redraw()
			})
		}
	}

	private getSenderOfResponseMail(): Promise<string> {
		return this.mailModel.getMailboxDetailsForMail(this.mail).then(mailboxDetails => {
			const myMailAddresses = getEnabledMailAddresses(mailboxDetails)
			const addressesInMail: MailAddress[] = []
			addAll(addressesInMail, this.mail.toRecipients)
			addAll(addressesInMail, this.mail.ccRecipients)
			addAll(addressesInMail, this.mail.bccRecipients)
			addressesInMail.push(this.mail.sender)
			const foundAddress = addressesInMail.find(address => contains(myMailAddresses, address.address.toLowerCase()))
			if (foundAddress) {
				return foundAddress.address.toLowerCase()
			} else {
				return getDefaultSender(this.logins, mailboxDetails)
			}
		})
	}

	/** @throws UserError */
	async forward(): Promise<void> {
		const sendAllowed = await checkApprovalStatus(this.logins, false)
		if (sendAllowed) {
			const args = await this.createResponseMailArgsForForwarding([], [], true)
			const [mailboxDetails, {newMailEditorAsResponse}] = await Promise.all([this.getMailboxDetails(), import("../editor/MailEditor")])
			// Call this again to make sure everything is loaded, including inline images because this can be called earlier than all the parts are loaded.
			await this.loadAll()
			const editor = await newMailEditorAsResponse(args, this.isBlockingExternalImages(), this.getLoadedInlineImages(), mailboxDetails)
			editor.show()
		}
	}


	private createResponseMailArgsForForwarding(recipients: MailAddress[], replyTos: EncryptedMailAddress[], addSignature: boolean): Promise<ResponseMailParameters> {
		let infoLine = lang.get("date_label") + ": " + formatDateTime(this.mail.sentDate) + "<br>"
		infoLine += lang.get("from_label") + ": " + this.getSender().address + "<br>"

		if (this.getToRecipients().length > 0
		) {
			infoLine += lang.get("to_label") + ": " + this.getToRecipients().map(recipient => recipient.address).join(", ")
			infoLine += "<br>"
		}

		if (this.getCcRecipients().length > 0) {
			infoLine += lang.get("cc_label") + ": " + this.getCcRecipients().map(recipient => recipient.address).join(", ")
			infoLine += "<br>"
		}

		const mailSubject = this.getSubject() || ""
		infoLine += lang.get("subject_label") + ": " + urlEncodeHtmlTags(mailSubject)
		let body = infoLine + '<br><br><blockquote class="tutanota_quote">' + this.getMailBody() + "</blockquote>"
		return Promise.all([this.getSenderOfResponseMail(), import("../signature/Signature")]).then(([senderMailAddress, {prependEmailSignature}]) => {
			return {
				previousMail: this.mail,
				conversationType: ConversationType.FORWARD,
				senderMailAddress,
				toRecipients: recipients,
				ccRecipients: [],
				bccRecipients: [],
				attachments: this.attachments.slice(),
				subject: "FWD: " + mailSubject,
				bodyText: addSignature ? prependEmailSignature(body, this.logins) : body,
				replyTos,
			}
		})
	}

	async reply(replyAll: boolean): Promise<void> {
		if (this.isAnnouncement()) {
			return Promise.resolve()
		}

		const sendAllowed = await checkApprovalStatus(this.logins, false)

		if (sendAllowed) {
			const mailboxDetails = await this.mailModel.getMailboxDetailsForMail(this.mail)
			let prefix = "Re: "
			const mailSubject = this.getSubject()
			let subject = mailSubject ? (startsWith(mailSubject.toUpperCase(), prefix.toUpperCase()) ? mailSubject : prefix + mailSubject) : ""
			let infoLine = formatDateTime(this.getSentDate()) + " " + lang.get("by_label") + " " + this.getSender().address + ":"
			let body = infoLine + '<br><blockquote class="tutanota_quote">' + this.getMailBody() + "</blockquote>"
			let toRecipients: MailAddress[] = []
			let ccRecipients: MailAddress[] = []
			let bccRecipients: MailAddress[] = []

			if (!this.logins.getUserController().isInternalUser() && this.isReceivedMail()) {
				toRecipients.push(this.getSender())
			} else if (this.isReceivedMail()) {
				if (this.getReplyTos().filter(address => !downcast(address)._errors).length > 0) {
					addAll(toRecipients, this.getReplyTos())
				} else {
					toRecipients.push(this.getSender())
				}

				if (replyAll) {
					let myMailAddresses = getEnabledMailAddresses(mailboxDetails)
					addAll(
						ccRecipients,
						this.getToRecipients().filter(recipient => !contains(myMailAddresses, recipient.address.toLowerCase())),
					)
					addAll(
						ccRecipients,
						this.getCcRecipients().filter(recipient => !contains(myMailAddresses, recipient.address.toLowerCase())),
					)
				}
			} else {
				// this is a sent email, so use the to recipients as new recipients
				addAll(toRecipients, this.getToRecipients())

				if (replyAll) {
					addAll(ccRecipients, this.getCcRecipients())
					addAll(bccRecipients, this.getBccRecipients())
				}
			}

			const {prependEmailSignature} = await import("../signature/Signature.js")
			const {newMailEditorAsResponse} = await import("../editor/MailEditor")

			await this.loadAll()
			// It should be there after loadAll() but if not we just give up
			const inlineImageCids = this.sanitizeResult?.inlineImageCids ?? []

			const [senderMailAddress, referencedCids] = await Promise.all([this.getSenderOfResponseMail(), inlineImageCids])

			const attachmentsForReply = getReferencedAttachments(this.attachments, referencedCids)
			try {

				const editor = await newMailEditorAsResponse(
					{
						previousMail: this.mail,
						conversationType: ConversationType.REPLY,
						senderMailAddress,
						toRecipients,
						ccRecipients,
						bccRecipients,
						attachments: attachmentsForReply,
						subject,
						bodyText: prependEmailSignature(body, this.logins),
						replyTos: [],
					},
					this.isBlockingExternalImages(),
					this.getLoadedInlineImages(),
					mailboxDetails,
				)
				editor.show()
			} catch (e) {
				if (e instanceof UserError) {
					showUserError(e)
				} else {
					throw e
				}
			}
		}
	}

	private async setSanitizedMailBodyFromMail(mail: Mail, blockExternalContent: boolean): Promise<SanitizeResult> {
		const {htmlSanitizer} = await import("../../misc/HtmlSanitizer")
		const sanitizeResult = htmlSanitizer.sanitizeFragment(this.getMailBody(), {
			blockExternalContent,
			allowRelativeLinks: isTutanotaTeamMail(mail),
		})
		const {html, inlineImageCids, links, externalContent} = sanitizeResult

		/**
		 * Check if we need to improve contrast for dark theme. We apply the contrast fix if any of the following is contained in
		 * the html body of the mail
		 *  * any tag with a style attribute that has the color property set (besides "inherit")
		 *  * any tag with a style attribute that has the background-color set (besides "inherit")
		 *  * any font tag with the color attribute set
		 */
		this.contrastFixNeeded =
			Array.from(html.querySelectorAll("*[style]"), e => (e as HTMLElement).style).some(
				s => (s.color && s.color !== "inherit") || (s.backgroundColor && s.backgroundColor !== "inherit"),
			) || html.querySelectorAll("font[color]").length > 0
		const text = await locator.worker.urlify(stringifyFragment(html))
		m.redraw()
		return {
			text,
			inlineImageCids,
			links,
			externalContent,
		}
	}

	private async getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			const customer = await this.entityClient.load(CustomerTypeRef, neverNull(this.logins.getUserController().user.customer))
			const {loadGroupInfos} = await import("../../settings/LoadingUtils")
			const groupInfos = await loadGroupInfos(
				participantGroupInfos.filter(groupInfoId => {
					return neverNull(customer.contactFormUserGroups).list !== groupInfoId[0]
				}),
			)
			return groupInfos.filter(groupInfo => groupInfo.deleted == null)
		} else {
			return []
		}
	}

	async assignMail(userGroupInfo: GroupInfo): Promise<boolean> {
		if (!this.canAssignMails()) {
			throw new ProgrammingError("Cannot assign mails")
		}
		const recipient = createMailAddress()
		recipient.address = neverNull(userGroupInfo.mailAddress)
		recipient.name = userGroupInfo.name
		let newReplyTos

		if (this.getReplyTos().length > 0) {
			newReplyTos = this.getReplyTos()
		} else {
			newReplyTos = [createEncryptedMailAddress()]
			newReplyTos[0].address = this.getSender().address
			newReplyTos[0].name = this.getSender().name
		}

		const args = await this.createResponseMailArgsForForwarding([recipient], newReplyTos, false)
		const [mailboxDetails, {defaultSendMailModel}] = await Promise.all([this.getMailboxDetails(), import("../editor/SendMailModel")])
		// Make sure inline images are loaded
		await this.loadAll()
		const model = await defaultSendMailModel(mailboxDetails).initAsResponse(args, this.getLoadedInlineImages())
		await model.send(MailMethod.NONE)
		const folders = await this.mailModel.getMailboxFolders(this.mail)
		return moveMails({mailModel: this.mailModel, mails: [this.mail], targetMailFolder: getArchiveFolder(folders)})
	}

	async downloadAll(): Promise<void> {
		// If we have attachments it is safe to assume that we already have body and referenced cids from it
		const inlineFileIds = this.sanitizeResult?.inlineImageCids ?? []
		const nonInlineFiles = this.attachments.filter(a => a.cid == null || !inlineFileIds.includes(a.cid))
		await this.fileController.downloadAll(nonInlineFiles)
	}

	downloadAndOpenAttachment(file: TutanotaFile, open: boolean): void {
		locator.fileController
			   .downloadAndOpen(file, open)
			   .catch(
				   ofClass(FileOpenError, e => {
					   console.warn("FileOpenError", e)
					   Dialog.message("canNotOpenFileOnDevice_msg")
				   }),
			   )
			   .catch(e => {
				   const msg = e || "unknown error"
				   console.error("could not open file:", msg)
				   return Dialog.message("errorDuringFileOpen_msg")
			   })
	}

	/** Special feature for contact forms with shared mailboxes. */
	canAssignMails(): boolean {
		// do not allow re-assigning from personal mailbox
		return this.logins.getUserController().isInternalUser() &&
			this.areParticipantsRestricted() &&
			this.logins.getUserController().getUserMailGroupMembership().group !== this.getMailOwnerGroup()
	}

	private areParticipantsRestricted(): boolean {
		const restrictions = this.getRestrictions()
		return restrictions != null && restrictions.participantGroupInfos.length > 0
	}

	canReplyAll(): boolean {
		return this.logins.getUserController().isInternalUser() &&
			this.getToRecipients().length + this.getCcRecipients().length + this.getBccRecipients().length > 1 &&
			!this.areParticipantsRestricted()
	}

	canForwardOrMove(): boolean {
		return this.logins.getUserController().isInternalUser() && !this.areParticipantsRestricted()
	}

	shouldDelayRendering(): boolean {
		return this.renderIsDelayed
	}

	async getAssignmentGroupInfos(): Promise<GroupInfo[]> {
		// remove the current mailbox/owner from the recipients list.
		const userOrMailGroupInfos = await this.getAssignableMailRecipients()
		return userOrMailGroupInfos
			.filter(userOrMailGroupInfo => {
				if (this.logins.getUserController().getUserMailGroupMembership().group === this.getMailOwnerGroup()) {
					return userOrMailGroupInfo.group !== this.logins.getUserController().userGroupInfo.group && userOrMailGroupInfo.group !== this.mail._ownerGroup
				} else {
					return userOrMailGroupInfo.group !== this.mail._ownerGroup
				}
			})

	}

	private getMailOwnerGroup(): Id | null {
		return this.mail._ownerGroup
	}
}