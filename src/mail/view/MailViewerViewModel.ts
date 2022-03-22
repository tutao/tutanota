import {Mail} from "../../api/entities/tutanota/Mail"
import {MailBody, MailBodyTypeRef} from "../../api/entities/tutanota/MailBody"
import {File as TutanotaFile, FileTypeRef} from "../../api/entities/tutanota/File"
import {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {
	CalendarMethod,
	ConversationType,
	ExternalImageRule, FeatureType, InboxRuleType,
	MailAuthenticationStatus,
	MailFolderType,
	MailMethod,
	mailMethodToCalendarMethod,
	MailPhishingStatus,
	MailReportType,
	MailState, SpamRuleFieldType, SpamRuleType,
} from "../../api/common/TutanotaConstants"
import {EntityClient} from "../../api/common/EntityClient"
import {MailboxDetail, MailModel} from "../model/MailModel"
import {ContactModel} from "../../contacts/model/ContactModel"
import {ConfigurationDatabase} from "../../api/worker/facades/ConfigurationDatabase"
import {InlineImages} from "./MailViewer"
import {isAndroidApp, isDesktop} from "../../api/common/Env"
import {Request} from "../../api/common/MessageDispatcher"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {addAll, assertNotNull, contains, defer, DeferredObject, downcast, neverNull, noOp, ofClass, startsWith} from "@tutao/tutanota-utils"
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
import {LoginController, logins} from "../../api/main/LoginController"
import m from "mithril"
import {ConversationEntryTypeRef} from "../../api/entities/tutanota/ConversationEntry"
import {LockedError, NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {NativeInterface} from "../../native/common/NativeInterface"
import {elementIdPart, getListId, listIdPart} from "../../api/common/utils/EntityUtils"
import {getReferencedAttachments, loadInlineImages, moveMails, replaceCidsWithInlineImages, revokeInlineImages} from "./MailGuiUtils"
import {locator} from "../../api/main/MainLocator"
import {Link} from "../../misc/HtmlSanitizer"
import {stringifyFragment} from "../../gui/HtmlUtils"
import {CALENDAR_MIME_TYPE, FileController} from "../../file/FileController"
import {createMailAddress, MailAddress} from "../../api/entities/tutanota/MailAddress"
import {getMailBodyText, getMailHeaders} from "../../api/common/utils/Utils"
import {MailHeadersTypeRef} from "../../api/entities/tutanota/MailHeaders"
import {createEncryptedMailAddress, EncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import {exportMails} from "../export/Exporter.js"
import {FileFacade} from "../../api/worker/facades/FileFacade"
import {IndexingNotSupportedError} from "../../api/common/error/IndexingNotSupportedError"
import {FileOpenError} from "../../api/common/error/FileOpenError"
import {Dialog} from "../../gui/base/Dialog"
import {getCoordsOfMouseOrTouchEvent} from "../../gui/base/GuiUtils"
import {showDropdownAtPosition} from "../../gui/base/DropdownN"
import {ButtonType} from "../../gui/base/ButtonN"
import {createListUnsubscribeData} from "../../api/entities/tutanota/ListUnsubscribeData"
import {serviceRequestVoid} from "../../api/main/ServiceRequest"
import {TutanotaService} from "../../api/entities/tutanota/Services"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import {formatDateTime, formatStorageSize, urlEncodeHtmlTags} from "../../misc/Formatter"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {ResponseMailParameters} from "../editor/SendMailModel"
import {GroupInfo} from "../../api/entities/sys/GroupInfo"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {MailRestriction} from "../../api/entities/tutanota/MailRestriction"
import {animations, DomMutation, scroll} from "../../gui/animation/Animations"
import {createDropDownButton, DomRectReadOnlyPolyfilled, PosRect} from "../../gui/base/Dropdown"
import {ease} from "../../gui/animation/Easing"
import {createEmailSenderListElement} from "../../api/entities/sys/EmailSenderListElement"
import {isNewMailActionAvailable} from "../../gui/nav/NavFunctions"
import {CancelledError} from "../../api/common/error/CancelledError"
import {Button} from "../../gui/base/Button"
import {Icons} from "../../gui/base/icons/Icons"
import {size} from "../../gui/size"
import {Contact} from "../../api/entities/tutanota/Contact"

const SCROLL_FACTOR = 4 / 5

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
	private sanitizedMailBody: string | null = null
	private loadingAttachments: boolean = false

	public readonly deferredAttachments: DeferredObject<null> = defer()
	private attachments: TutanotaFile[] = []
	private inlineCids: Array<string> = []

	private contentBlockingStatus: ContentBlockingStatus = ContentBlockingStatus.NoExternalContent
	private errorOccurred: boolean = false
	private referencedCids: Promise<Array<string>>
	private readonly loadedInlineImages: Promise<InlineImages>
	private suspicious: boolean = false

	private folderText: string | null
	private readonly filesExpanded: Stream<boolean>

	private warningDismissed: boolean = false

	private calendarEventAttachment: {
		event: CalendarEvent
		method: CalendarMethod
		recipient: string
	} | null = null

	private domBodyDeferred: DeferredObject<HTMLElement> = defer()
	private domBody: HTMLElement | null = null

	// Initialize with NoExternalContent so that the banner doesn't flash, this will be set later in _loadMailBody
	private domMailViewer: HTMLElement | null = null
	private scrollAnimation: Promise<void> | null = null
	private domForScrolling: HTMLElement | null = null

	constructor(
		public readonly mail: Mail,
		showFolder: boolean,
		public readonly delayBodyRenderingUntil: Promise<void>,
		readonly entityClient: EntityClient,
		public readonly mailModel: MailModel,
		readonly contactModel: ContactModel,
		private readonly configFacade: ConfigurationDatabase,
		native: NativeInterface | null,
		private readonly fileFacade: FileFacade,
		private readonly fileController: FileController,
		readonly logins: LoginController,
	) {

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

		// We call those sequentially as _loadAttachments() waits for _inlineFileIds to resolve
		this.referencedCids = this.loadMailBody(mail)
		this.loadedInlineImages = this.loadAttachments(mail)

		this.loadedInlineImages.then(() => {
			// load the conversation entry here because we expect it to be loaded immediately when responding to this email
			this.entityClient
				.load(ConversationEntryTypeRef, mail.conversationEntry)
				.catch(ofClass(NotFoundError, e => console.log("could load conversation entry as it has been moved/deleted already", e)))
		})
	}

	clearDomBody() {
		this.domBodyDeferred = defer()
		this.domBody = null
	}

	revokeInlineImages(): Promise<void> {
		return this.loadedInlineImages.then(inlineImages => {
			revokeInlineImages(inlineImages)
		})
	}

	getAttachments(): Array<TutanotaFile> {
		return this.attachments
	}

	getInlineCids(): Array<string> {
		return this.inlineCids
	}

	getLoadedInlineImages(): Promise<InlineImages> {
		return this.loadedInlineImages
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
		return this.sanitizedMailBody
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

	getMailOwnerGroup(): Id | null {
		return this.mail._ownerGroup
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

	async getResolvedDomBody(): Promise<HTMLElement> {
		return this.domBodyDeferred.promise
	}

	setDomBody(dom: HTMLElement) {
		this.domBodyDeferred.resolve(dom)
		this.domBody = dom
	}

	getContentBlockingStatus(): ContentBlockingStatus {
		return this.contentBlockingStatus
	}

	getDomBody() {
		return this.domBody
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

	setMailViewerDom(dom: HTMLElement) {
		this.domMailViewer = dom
	}

	setScrollDom(scrollDom: HTMLElement) {
		this.domForScrolling = scrollDom
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
		await this.setSanitizedMailBodyFromMail(this.mail, this.isBlockingExternalImages())

		this.domBodyDeferred = defer()
		this.domBody = null

		this.replaceInlineImages()
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
			await moveMails({mailModel : this.mailModel, mails : [this.mail], targetMailFolder : spamFolder, isReportable : false})
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("mail already moved")
			} else {
				throw e
			}
		}
	}

	async exportMail(): Promise<void> {
		await exportMails([this.mail], this.entityClient, this.fileFacade)
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
					return serviceRequestVoid(TutanotaService.ListUnsubscribeService, HttpMethod.POST, postData).then(() => true)
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
	private async loadMailBody(mail: Mail): Promise<Array<string>> {
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
		const sanitizeResult = await this.setSanitizedMailBodyFromMail(mail, !isAllowedAndAuthenticatedExternalSender)

		this.checkMailForPhishing(mail, sanitizeResult.links)

		this.contentBlockingStatus =
			externalImageRule === ExternalImageRule.Block
				? ContentBlockingStatus.AlwaysBlock
				: isAllowedAndAuthenticatedExternalSender
					? ContentBlockingStatus.AlwaysShow
					: sanitizeResult.externalContent.length > 0
						? ContentBlockingStatus.Block
						: ContentBlockingStatus.NoExternalContent
		m.redraw()
		return sanitizeResult.inlineImageCids
	}

	private async loadAttachments(mail: Mail): Promise<InlineImages> {
		if (mail.attachments.length === 0) {
			this.loadingAttachments = false
			return Promise.resolve(new Map())
		} else {
			//We wait for _inlineFileIds to resolve in order to make the server requests sequentially
			return this.referencedCids.then(inlineCids => {
				this.loadingAttachments = true
				const attachmentsListId = listIdPart(mail.attachments[0])
				const attachmentElementIds = mail.attachments.map(attachment => elementIdPart(attachment))
				return this.entityClient
						   .loadMultiple(FileTypeRef, attachmentsListId, attachmentElementIds)
						   .then(async files => {
							   this.handleCalendarFile(files, mail)

							   this.attachments = files
							   this.inlineCids = inlineCids
							   this.deferredAttachments.resolve(null)
							   this.loadingAttachments = false
							   const inlineImages = await loadInlineImages(this.fileFacade, files, inlineCids)
							   m.redraw()
							   return inlineImages
						   })
						   .catch(
							   ofClass(NotFoundError, e => {
								   console.log("could load attachments as they have been moved/deleted already", e)
								   return new Map()
							   }),
						   )
			})
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
				return getDefaultSender(logins, mailboxDetails)
			}
		})
	}

	forward(): Promise<void> {
		return checkApprovalStatus(logins, false).then(sendAllowed => {
			if (sendAllowed) {
				return this.createResponseMailArgsForForwarding([], [], true).then(args => {
					return Promise.all([this.getMailboxDetails(), import("../editor/MailEditor")])
								  .then(([mailboxDetails, {newMailEditorAsResponse}]) => {
									  return newMailEditorAsResponse(args, this.isBlockingExternalImages(), this.loadedInlineImages, mailboxDetails)
								  })
								  .then(editor => {
									  editor.show()
								  })
								  .catch(ofClass(UserError, showUserError))
				})
			}
		})
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
				bodyText: addSignature ? prependEmailSignature(body, logins) : body,
				replyTos,
			}
		})
	}

	async reply(replyAll: boolean): Promise<void> {
		if (this.isAnnouncement()) {
			return Promise.resolve()
		}

		const sendAllowed = await checkApprovalStatus(logins, false)

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

			if (!logins.getUserController().isInternalUser() && this.isReceivedMail()) {
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

			return Promise.all([this.getSenderOfResponseMail(), import("../signature/Signature"), import("../editor/MailEditor"), this.referencedCids])
						  .then(([senderMailAddress, {prependEmailSignature}, {newMailEditorAsResponse}, referencedCids]) => {
							  const attachmentsForReply = getReferencedAttachments(this.attachments, referencedCids)
							  return newMailEditorAsResponse(
								  {
									  previousMail: this.mail,
									  conversationType: ConversationType.REPLY,
									  senderMailAddress,
									  toRecipients,
									  ccRecipients,
									  bccRecipients,
									  attachments: attachmentsForReply,
									  subject,
									  bodyText: prependEmailSignature(body, logins),
									  replyTos: [],
								  },
								  this.isBlockingExternalImages(),
								  this.loadedInlineImages,
								  mailboxDetails,
							  )
						  })
						  .then(editor => {
							  editor.show()
						  })
						  .catch(ofClass(UserError, showUserError))
		}
	}

	async setSanitizedMailBodyFromMail(mail: Mail, blockExternalContent: boolean):
		Promise<{
			inlineImageCids: Array<string>,
			links: Array<Link>,
			externalContent: Array<string>
		}> {
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
		this.sanitizedMailBody = await locator.worker.urlify(stringifyFragment(html))
		m.redraw()
		return {
			inlineImageCids,
			links,
			externalContent,
		}
	}

	async replaceInlineImages() {
		const [loadedInlineImages, domBody] = await Promise.all([this.loadedInlineImages, this.domBodyDeferred.promise])

		replaceCidsWithInlineImages(domBody, loadedInlineImages, (cid, event, dom) => {
			const inlineAttachment = this.attachments.find(attachment => attachment.cid === cid)

			if (inlineAttachment) {
				const coords = getCoordsOfMouseOrTouchEvent(event)
				showDropdownAtPosition(
					[
						{
							label: "download_action",
							click: () => this.downloadAndOpenAttachment(inlineAttachment, false),
							type: ButtonType.Dropdown,
						},
						{
							label: "open_action",
							click: () => this.downloadAndOpenAttachment(inlineAttachment, true),
							type: ButtonType.Dropdown,
						},
					],
					coords.x,
					coords.y,
				)
			}
		})
	}

	async getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			const customer = await this.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
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

	assignMail(userGroupInfo: GroupInfo): Promise<boolean> {
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

		return this.createResponseMailArgsForForwarding([recipient], newReplyTos, false)
				   .then(args => {
					   return Promise.all([this.getMailboxDetails(), import("../editor/SendMailModel")]).then(([mailboxDetails, {defaultSendMailModel}]) => {
						   return defaultSendMailModel(mailboxDetails)
							   .initAsResponse(args, this.loadedInlineImages)
							   .then(model => model.send(MailMethod.NONE))
					   })
				   })
				   .then(() => this.mailModel.getMailboxFolders(this.mail))
				   .then(folders => {
					   return moveMails({mailModel : this.mailModel, mails : [this.mail], targetMailFolder : getArchiveFolder(folders)})
				   })
	}

	downloadAll() {
		this.referencedCids
			// Skip inline images (they have cid and it is referenced)
			.then(inlineFileIds => this.attachments.filter(a => a.cid == null || !inlineFileIds.includes(a.cid)))
			.then(nonInlineFiles => showProgressDialog("pleaseWait_msg", this.fileController.downloadAll(nonInlineFiles)))
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

	scrollUp(): void {
		this.scrollIfDomBody(dom => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.max(0, current - toScroll))
		})
	}

	scrollDown(): void {
		this.scrollIfDomBody(dom => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.min(dom.scrollHeight - dom.offsetHeight, dom.scrollTop + toScroll))
		})
	}

	scrollToTop(): void {
		this.scrollIfDomBody(dom => {
			return scroll(dom.scrollTop, 0)
		})
	}

	scrollToBottom(): void {
		this.scrollIfDomBody(dom => {
			const end = dom.scrollHeight - dom.offsetHeight
			return scroll(dom.scrollTop, end)
		})
	}

	getBounds(): PosRect | null {
		return this.domMailViewer && this.domMailViewer.getBoundingClientRect()
	}

	private scrollIfDomBody(cb: (dom: HTMLElement) => DomMutation) {
		if (this.domForScrolling) {
			const dom = this.domForScrolling

			if (!this.scrollAnimation) {
				this.scrollAnimation = animations
					.add(dom, cb(dom), {
						easing: ease.inOut,
					})
					.then(() => {
						this.scrollAnimation = null
					})
			}
		}
	}

	handleAnchorClick(event: Event, shouldDispatchSyntheticClick: boolean): void {
		let target = event.target as any

		if (target && target.closest
		) {
			const anchorElement = target.closest("a")

			if (anchorElement && startsWith(anchorElement.href, "mailto:")) {
				event.preventDefault()

				if (isNewMailActionAvailable()) {
					// disable new mails for external users.
					import("../editor/MailEditor").then(({newMailtoUrlMailEditor}) => {
						newMailtoUrlMailEditor(anchorElement.href, !logins.getUserController().props.defaultUnconfidential)
							.then(editor => editor.show())
							.catch(ofClass(CancelledError, noOp))
					})
				}
			} // Navigate to the settings menu if they are linked within an email.
			else if (anchorElement && isSettingsLink(anchorElement, this.mail)) {
				let newRoute = anchorElement.href.substr(anchorElement.href.indexOf("/settings/"))
				m.route.set(newRoute)
				event.preventDefault()
			} else if (anchorElement && shouldDispatchSyntheticClick) {
				let newClickEvent: MouseEvent & {
					synthetic?: boolean
				} = new MouseEvent("click")
				newClickEvent.synthetic = true
				anchorElement.dispatchEvent(newClickEvent)
			}
		}
	}
}

/**
 * support and invoice mails can contain links to the settings page.
 * we don't want normal mails to be able to link places in the app, though.
 * */
function isSettingsLink(anchor: HTMLAnchorElement, mail: Mail): boolean {
	return (anchor.getAttribute("href")?.startsWith("/settings/") ?? false) && isTutanotaTeamMail(mail)
}