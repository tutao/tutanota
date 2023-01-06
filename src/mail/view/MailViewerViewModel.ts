import {
	CalendarEvent,
	ConversationEntryTypeRef,
	createEncryptedMailAddress,
	createMailAddress,
	EncryptedMailAddress,
	File as TutanotaFile,
	FileTypeRef,
	Mail,
	MailAddress,
	MailRestriction,
	MailTypeRef,
} from "../../api/entities/tutanota/TypeRefs.js"
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
import { EntityClient } from "../../api/common/EntityClient"
import { MailboxDetail, MailModel } from "../model/MailModel"
import { ContactModel } from "../../contacts/model/ContactModel"
import { ConfigurationDatabase } from "../../api/worker/facades/ConfigurationDatabase"
import { InlineImages } from "./MailViewer"
import { isDesktop } from "../../api/common/Env"
import stream from "mithril/stream"
import { addAll, contains, downcast, filterInt, first, neverNull, noOp, ofClass, startsWith } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import {
	getDefaultSender,
	getEnabledMailAddressesWithUser,
	getMailboxName,
	getPathToFolderString,
	isExcludedMailAddress,
	isTutanotaTeamMail,
	loadMailDetails,
	loadMailHeaders,
} from "../model/MailUtils"
import { LoginController } from "../../api/main/LoginController"
import m from "mithril"
import { LockedError, NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError"
import { elementIdPart, haveSameId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils"
import { getReferencedAttachments, loadInlineImages, moveMails, revokeInlineImages } from "./MailGuiUtils"
import { SanitizedFragment } from "../../misc/HtmlSanitizer"
import { CALENDAR_MIME_TYPE, FileController } from "../../file/FileController"
import { exportMails } from "../export/Exporter.js"
import { FileFacade } from "../../api/worker/facades/FileFacade"
import { IndexingNotSupportedError } from "../../api/common/error/IndexingNotSupportedError"
import { FileOpenError } from "../../api/common/error/FileOpenError"
import { Dialog } from "../../gui/base/Dialog"
import { checkApprovalStatus } from "../../misc/LoginUtils"
import { formatDateTime, urlEncodeHtmlTags } from "../../misc/Formatter"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { CustomerTypeRef, GroupInfo } from "../../api/entities/sys/TypeRefs.js"
import { LoadingStateTracker } from "../../offline/LoadingState"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"
import { InitAsResponseArgs, SendMailModel } from "../editor/SendMailModel"
import { isOfflineError } from "../../api/common/utils/ErrorCheckUtils.js"
import { DesktopSystemFacade } from "../../native/common/generatedipc/DesktopSystemFacade.js"
import { isLegacyMail, MailWrapper } from "../../api/common/MailWrapper.js"
import { EntityUpdateData, EventController, isUpdateForTypeRef } from "../../api/main/EventController.js"
import { WorkerFacade } from "../../api/worker/facades/WorkerFacade.js"
import { SearchModel } from "../../search/model/SearchModel.js"

export const enum ContentBlockingStatus {
	Block = "0",
	Show = "1",
	AlwaysShow = "2",
	NoExternalContent = "3",
	AlwaysBlock = "4",
}

export class MailViewerViewModel {
	private mailWrapper: MailWrapper | null = null
	private contrastFixNeeded: boolean = false

	// always sanitized in this.sanitizeMailBody
	private sanitizeResult: SanitizedFragment | null = null
	private loadingAttachments: boolean = false

	private attachments: TutanotaFile[] = []

	private contentBlockingStatus: ContentBlockingStatus | null = null
	private errorOccurred: boolean = false
	private loadedInlineImages: InlineImages | null = null

	private folderText: string | null
	/** @see getRelevantRecipient */
	private relevantRecipient: MailAddress | null = null

	private warningDismissed: boolean = false

	private calendarEventAttachment: {
		event: CalendarEvent
		method: CalendarMethod
		recipient: string
	} | null = null

	private readonly loadingState = new LoadingStateTracker()

	private renderIsDelayed: boolean = true

	readonly loadCompleteNotification = stream<null>()
	private renderedMail: Mail | null = null

	private loading: Promise<void> = Promise.resolve()

	get mail(): Mail {
		return this._mail
	}

	constructor(
		private _mail: Mail,
		showFolder: boolean,
		/**
		 * This exists for a single purpose: making opening emails smooth in a single column layout. When the app is in a single-column layout and the email
		 * is selected from the list then there is an animation of switching between columns. This parameter will delay sanitizing of mail body and rendering
		 * of progress indicator until the animation is done.
		 */
		private delayBodyRenderingUntil: Promise<void>,
		readonly entityClient: EntityClient,
		public readonly mailModel: MailModel,
		readonly contactModel: ContactModel,
		private readonly configFacade: ConfigurationDatabase,
		desktopSystemFacade: DesktopSystemFacade | null,
		private readonly fileFacade: FileFacade,
		private readonly fileController: FileController,
		readonly logins: LoginController,
		private sendMailModelFactory: (mailboxDetails: MailboxDetail) => Promise<SendMailModel>,
		private readonly eventController: EventController,
		private readonly workerFacade: WorkerFacade,
		private readonly searchModel: SearchModel,
	) {
		this.delayBodyRenderingUntil.then(() => {
			this.renderIsDelayed = false
			m.redraw()
		})
		if (isDesktop()) {
			// Notify the admin client about the mail being selected
			desktopSystemFacade?.sendSocketMessage(this.mail.sender.address)
		}

		this.folderText = null
		if (showFolder) {
			this.showFolder()
		}
		this.eventController.addEntityListener(this.entityListener)
	}

	private readonly entityListener = async (events: EntityUpdateData[]) => {
		for (const update of events) {
			if (isUpdateForTypeRef(MailTypeRef, update)) {
				const { instanceListId, instanceId, operation } = update
				if (isSameId(this.mail._id, [instanceListId, instanceId])) {
					try {
						const updatedMail = await this.entityClient.load(MailTypeRef, this.mail._id)
						this.updateMail({ mail: updatedMail })
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log(`Could not find updated mail ${JSON.stringify([instanceListId, instanceId])}`)
						} else {
							throw e
						}
					}
				}
			}
		}
	}

	private async determineRelevantRecipient() {
		// The idea is that if there are multiple recipients then we should display the one which belongs to one of our mailboxes and then fall back to any
		// other one
		const mailboxDetails = await this.mailModel.getMailboxDetailsForMail(this.mail)
		const enabledMailAddresses = new Set(getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo))
		const mailWrapper = this.mailWrapper
		if (mailWrapper == null) {
			// we could not load the mail body for some reason
			return
		}
		this.relevantRecipient =
			mailWrapper.getToRecipients().find((r) => enabledMailAddresses.has(r.address)) ??
			mailWrapper.getCcRecipients().find((r) => enabledMailAddresses.has(r.address)) ??
			mailWrapper.getBccRecipients().find((r) => enabledMailAddresses.has(r.address)) ??
			first(mailWrapper.getToRecipients()) ??
			first(mailWrapper.getCcRecipients()) ??
			first(mailWrapper.getBccRecipients())
		m.redraw()
	}

	private showFolder() {
		this.folderText = null
		const folder = this.mailModel.getMailFolder(this.mail._id[0])

		if (folder) {
			this.mailModel.getMailboxDetailsForMail(this.mail).then((mailboxDetails) => {
				const name = getPathToFolderString(mailboxDetails.folders, folder)
				this.folderText = `${getMailboxName(this.logins, mailboxDetails)} / ${name}`
				m.redraw()
			})
		}
	}

	dispose() {
		const inlineImages = this.getLoadedInlineImages()
		revokeInlineImages(inlineImages)
		this.eventController.removeEntityListener(this.entityListener)
	}

	async loadAll(
		{
			notify,
		}: {
			notify: boolean
		} = { notify: true },
	) {
		await this.loading
		try {
			this.loading = this.loadAndProcessAdditionalMailInfo(this.mail)
				.then((inlineImageCids) => {
					this.determineRelevantRecipient()
					return inlineImageCids
				})
				.then((inlineImageCids) => this.loadAttachments(this.mail, inlineImageCids))
			await this.loadingState.trackPromise(this.loading)

			if (notify) this.loadCompleteNotification(null)
		} catch (e) {
			if (!isOfflineError(e)) {
				throw e
			}
		}

		m.redraw()

		// We need the conversation entry in order to reply to the message.
		// We don't want the user to have to wait for it to load when they click reply,
		// So we load it here pre-emptively to make sure it is in the cache.
		this.entityClient.load(ConversationEntryTypeRef, this.mail.conversationEntry).catch((e) => {
			if (e instanceof NotFoundError) {
				console.log("could load conversation entry as it has been moved/deleted already", e)
			} else if (isOfflineError(e)) {
				console.log("failed to load conversation entry, because of a lost connection", e)
			} else {
				throw e
			}
		})
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
		return this.mail.phishingStatus === MailPhishingStatus.SUSPICIOUS
	}

	getMailId(): IdTuple {
		return this.mail._id
	}

	getSanitizedMailBody(): DocumentFragment | null {
		return this.sanitizeResult?.fragment ?? null
	}

	getMailBody(): string {
		if (this.mailWrapper) {
			return this.mailWrapper.getMailBodyText()
		} else {
			return ""
		}
	}

	getDate(): Date {
		return this.mail.receivedDate
	}

	getToRecipients(): Array<MailAddress> {
		if (this.mailWrapper === null) {
			return []
		}
		return this.mailWrapper.getToRecipients()
	}

	getCcRecipients(): Array<MailAddress> {
		if (this.mailWrapper === null) {
			return []
		}
		return this.mailWrapper.getCcRecipients()
	}

	getBccRecipients(): Array<MailAddress> {
		if (this.mailWrapper === null) {
			return []
		}
		return this.mailWrapper.getBccRecipients()
	}

	/** Get the recipient which is relevant the most for the current mailboxes. */
	getRelevantRecipient(): MailAddress | null {
		return this.relevantRecipient
	}

	getNumberOfRecipients(): number {
		if (isLegacyMail(this.mail)) {
			return this.mail.toRecipients.length + this.mail.ccRecipients.length + this.mail.bccRecipients.length
		} else {
			return filterInt(this.mail.recipientCount)
		}
	}

	getReplyTos(): Array<EncryptedMailAddress> {
		if (this.mailWrapper === null) {
			return []
		}
		return this.mailWrapper.getReplyTos()
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
		let bodyErrors = false
		if (this.mailWrapper) {
			const mailWrapper = this.mailWrapper
			if (mailWrapper.isLegacy()) {
				bodyErrors = typeof mailWrapper.getBody()._errors !== "undefined"
			} else {
				bodyErrors = typeof downcast(mailWrapper.getDetails().body)._errors !== "undefined"
			}
		}
		return this.errorOccurred || typeof this.mail._errors !== "undefined" || bodyErrors
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
		if (
			status === ContentBlockingStatus.NoExternalContent ||
			this.contentBlockingStatus === ContentBlockingStatus.NoExternalContent ||
			this.contentBlockingStatus === status
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

		// We don't check mail authentication status here because the user has manually called this
		this.sanitizeResult = await this.sanitizeMailBody(this.mail, status === ContentBlockingStatus.Block || status === ContentBlockingStatus.AlwaysBlock)
		//follow-up actions resulting from a changed blocking status must start after sanitization finished
		this.contentBlockingStatus = status
	}

	async markAsNotPhishing(): Promise<void> {
		const oldStatus = this.getPhishingStatus()

		if (oldStatus === MailPhishingStatus.WHITELISTED) {
			return
		}

		this.setPhishingStatus(MailPhishingStatus.WHITELISTED)

		await this.entityClient.update(this.mail).catch(() => this.setPhishingStatus(oldStatus))
	}

	async reportMail(reportType: MailReportType): Promise<void> {
		try {
			await this.mailModel.reportMails(reportType, [this.mail])
			if (reportType === MailReportType.PHISHING) {
				this.setPhishingStatus(MailPhishingStatus.SUSPICIOUS)
				await this.entityClient.update(this.mail)
			}
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMail(this.mail)
			const spamFolder = mailboxDetail.folders.getSystemFolderByType(MailFolderType.SPAM)
			// do not report moved mails again
			await moveMails({ mailModel: this.mailModel, mails: [this.mail], targetMailFolder: spamFolder, isReportable: false })
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("mail already moved")
			} else {
				throw e
			}
		}
	}

	canExport(): boolean {
		return !this.isAnnouncement() && !this.logins.isEnabled(FeatureType.DisableMailExport)
	}

	canPrint(): boolean {
		return !this.logins.isEnabled(FeatureType.DisableMailExport)
	}

	canReport(): boolean {
		return this.getPhishingStatus() === MailPhishingStatus.UNKNOWN && !this.isTutanotaTeamMail() && this.logins.isInternalUserLoggedIn()
	}

	canShowHeaders(): boolean {
		return this.logins.isInternalUserLoggedIn()
	}

	canPersistBlockingStatus(): boolean {
		return this.searchModel.indexingSupported
	}

	async exportMail(): Promise<void> {
		await exportMails([this.mail], this.entityClient, this.fileController)
	}

	async getHeaders(): Promise<string | null> {
		// make sure that the wrapper is loaded
		const wrapper = await this.loadMailWrapper()
		return loadMailHeaders(this.entityClient, wrapper)
	}

	private loadMailWrapper() {
		return loadMailDetails(this.entityClient, this.mail)
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

		const mailHeaders = await this.getHeaders()
		if (!mailHeaders) {
			return false
		}
		const unsubHeaders = mailHeaders.split("\n").filter((headerLine) => headerLine.toLowerCase().startsWith("list-unsubscribe"))
		if (unsubHeaders.length > 0) {
			const recipient = await this.getSenderOfResponseMail()
			await this.mailModel.unsubscribe(this.mail, recipient, unsubHeaders)
			return true
		} else {
			return false
		}
	}

	private getMailboxDetails(): Promise<MailboxDetail> {
		return this.mailModel.getMailboxDetailsForMail(this.mail)
	}

	/** @return list of inline referenced cid */
	private async loadAndProcessAdditionalMailInfo(mail: Mail): Promise<string[]> {
		// If the mail is a non-draft and we have loaded it before, we don't need to reload it because it cannot have been edited, so we return early
		// drafts however can be edited, and we want to receive the changes, so for drafts we will always reload
		if (this.renderedMail != null && haveSameId(mail, this.renderedMail) && mail.state !== MailState.DRAFT && this.sanitizeResult != null) {
			return this.sanitizeResult.inlineImageCids
		}

		try {
			this.mailWrapper = await this.loadMailWrapper()
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

		const externalImageRule = await this.configFacade.getExternalImageRule(mail.sender.address).catch((e) => {
			console.log("Error getting external image rule:", e)
			return ExternalImageRule.None
		})
		const isAllowedAndAuthenticatedExternalSender =
			externalImageRule === ExternalImageRule.Allow && mail.authStatus === MailAuthenticationStatus.AUTHENTICATED
		// We should not try to sanitize body while we still animate because it's a heavy operation.
		await this.delayBodyRenderingUntil

		this.sanitizeResult = await this.sanitizeMailBody(mail, !isAllowedAndAuthenticatedExternalSender)

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
		this.renderedMail = this.mail
		return this.sanitizeResult.inlineImageCids
	}

	private async loadAttachments(mail: Mail, inlineCids: string[]): Promise<void> {
		if (mail.attachments.length === 0) {
			this.loadingAttachments = false
			m.redraw()
		} else {
			this.loadingAttachments = true
			const attachmentsListId = listIdPart(mail.attachments[0])
			const attachmentElementIds = mail.attachments.map((attachment) => elementIdPart(attachment))

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
		if (mail.phishingStatus === MailPhishingStatus.UNKNOWN) {
			const linkObjects = links.map((link) => {
				return {
					href: link.getAttribute("href") || "",
					innerHTML: link.innerHTML,
				}
			})

			this.mailModel.checkMailForPhishing(mail, linkObjects).then((isSuspicious) => {
				if (isSuspicious) {
					mail.phishingStatus = MailPhishingStatus.SUSPICIOUS

					this.entityClient
						.update(mail)
						.catch(ofClass(LockedError, (e) => console.log("could not update mail phishing status as mail is locked")))
						.catch(ofClass(NotFoundError, (e) => console.log("mail already moved")))

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
		const calendarFile = files.find((a) => a.mimeType && a.mimeType.startsWith(CALENDAR_MIME_TYPE))

		if (calendarFile && (mail.method === MailMethod.ICAL_REQUEST || mail.method === MailMethod.ICAL_REPLY) && mail.state === MailState.RECEIVED) {
			Promise.all([
				import("../../calendar/date/CalendarInvites").then(({ getEventFromFile }) => getEventFromFile(calendarFile)),
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
		return this.mailModel.getMailboxDetailsForMail(this.mail).then(async (mailboxDetails) => {
			const myMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo)
			const addressesInMail: MailAddress[] = []
			const mailWrapper = await this.loadMailWrapper()
			addressesInMail.push(...mailWrapper.getToRecipients())
			addressesInMail.push(...mailWrapper.getCcRecipients())
			addressesInMail.push(...mailWrapper.getBccRecipients())
			addressesInMail.push(this.mail.sender)
			const foundAddress = addressesInMail.find((address) => contains(myMailAddresses, address.address.toLowerCase()))
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
			const [mailboxDetails, { newMailEditorAsResponse }] = await Promise.all([this.getMailboxDetails(), import("../editor/MailEditor")])
			// Call this again to make sure everything is loaded, including inline images because this can be called earlier than all the parts are loaded.
			await this.loadAll({ notify: false })
			const editor = await newMailEditorAsResponse(args, this.isBlockingExternalImages(), this.getLoadedInlineImages(), mailboxDetails)
			editor.show()
		}
	}

	private async createResponseMailArgsForForwarding(
		recipients: MailAddress[],
		replyTos: EncryptedMailAddress[],
		addSignature: boolean,
	): Promise<InitAsResponseArgs> {
		let infoLine = lang.get("date_label") + ": " + formatDateTime(this.mail.receivedDate) + "<br>"
		infoLine += lang.get("from_label") + ": " + this.getSender().address + "<br>"

		if (this.getToRecipients().length > 0) {
			infoLine +=
				lang.get("to_label") +
				": " +
				this.getToRecipients()
					.map((recipient) => recipient.address)
					.join(", ")
			infoLine += "<br>"
		}

		if (this.getCcRecipients().length > 0) {
			infoLine +=
				lang.get("cc_label") +
				": " +
				this.getCcRecipients()
					.map((recipient) => recipient.address)
					.join(", ")
			infoLine += "<br>"
		}

		const mailSubject = this.getSubject() || ""
		infoLine += lang.get("subject_label") + ": " + urlEncodeHtmlTags(mailSubject)
		let body = infoLine + '<br><br><blockquote class="tutanota_quote">' + this.getMailBody() + "</blockquote>"
		const { prependEmailSignature } = await import("../signature/Signature")
		const senderMailAddress = await this.getSenderOfResponseMail()
		return {
			previousMail: this.mail,
			conversationType: ConversationType.FORWARD,
			senderMailAddress,
			recipients,
			attachments: this.attachments.slice(),
			subject: "FWD: " + mailSubject,
			bodyText: addSignature ? prependEmailSignature(body, this.logins) : body,
			replyTos,
		}
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
			let infoLine = formatDateTime(this.getDate()) + " " + lang.get("by_label") + " " + this.getSender().address + ":"
			let body = infoLine + '<br><blockquote class="tutanota_quote">' + this.getMailBody() + "</blockquote>"
			let toRecipients: MailAddress[] = []
			let ccRecipients: MailAddress[] = []
			let bccRecipients: MailAddress[] = []

			if (!this.logins.getUserController().isInternalUser() && this.isReceivedMail()) {
				toRecipients.push(this.getSender())
			} else if (this.isReceivedMail()) {
				if (this.getReplyTos().some((address) => !downcast(address)._errors)) {
					addAll(toRecipients, this.getReplyTos())
				} else {
					toRecipients.push(this.getSender())
				}

				if (replyAll) {
					let myMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo)
					addAll(
						ccRecipients,
						this.getToRecipients().filter((recipient) => !contains(myMailAddresses, recipient.address.toLowerCase())),
					)
					addAll(
						ccRecipients,
						this.getCcRecipients().filter((recipient) => !contains(myMailAddresses, recipient.address.toLowerCase())),
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

			const { prependEmailSignature } = await import("../signature/Signature.js")
			const { newMailEditorAsResponse } = await import("../editor/MailEditor")

			await this.loadAll({ notify: false })
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
						recipients: {
							to: toRecipients,
							cc: ccRecipients,
							bcc: bccRecipients,
						},
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

	private async sanitizeMailBody(mail: Mail, blockExternalContent: boolean): Promise<SanitizedFragment> {
		const { htmlSanitizer } = await import("../../misc/HtmlSanitizer")
		const rawBody = this.getMailBody()
		const urlified = await this.workerFacade.urlify(rawBody).catch((e) => {
			console.warn("Failed to urlify mail body!", e)
			return rawBody
		})
		const sanitizeResult = htmlSanitizer.sanitizeFragment(urlified, {
			blockExternalContent,
			allowRelativeLinks: isTutanotaTeamMail(mail),
		})
		const { fragment, inlineImageCids, links, externalContent } = sanitizeResult

		/**
		 * Check if we need to improve contrast for dark theme. We apply the contrast fix if any of the following is contained in
		 * the html body of the mail
		 *  * any tag with a style attribute that has the color property set (besides "inherit")
		 *  * any tag with a style attribute that has the background-color set (besides "inherit")
		 *  * any font tag with the color attribute set
		 */
		this.contrastFixNeeded =
			Array.from(fragment.querySelectorAll("*[style]"), (e) => (e as HTMLElement).style).some(
				(s) => (s.color && s.color !== "inherit") || (s.backgroundColor && s.backgroundColor !== "inherit"),
			) || fragment.querySelectorAll("font[color]").length > 0

		m.redraw()
		return {
			// We want to stringify and return the fragment here, because once a fragment is appended to a DOM Node, it's children are moved
			// and the fragment is left empty. If we cache the fragment and then append that directly to the DOM tree when rendering, there are cases where
			// we would try to do so twice, and on the second pass the mail body will be left blank
			fragment,
			inlineImageCids,
			links,
			externalContent,
		}
	}

	private async getAssignableMailRecipients(): Promise<GroupInfo[]> {
		if (this.mail.restrictions != null && this.mail.restrictions.participantGroupInfos.length > 0) {
			const participantGroupInfos = this.mail.restrictions.participantGroupInfos
			const customer = await this.entityClient.load(CustomerTypeRef, neverNull(this.logins.getUserController().user.customer))
			const { loadGroupInfos } = await import("../../settings/LoadingUtils")
			const groupInfos = await loadGroupInfos(
				participantGroupInfos.filter((groupInfoId) => {
					return neverNull(customer.contactFormUserGroups).list !== groupInfoId[0]
				}),
			)
			return groupInfos.filter((groupInfo) => groupInfo.deleted == null)
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
		const mailboxDetails = await this.getMailboxDetails()
		// Make sure inline images are loaded
		await this.loadAll({ notify: false })
		const model = await this.sendMailModelFactory(mailboxDetails)
		await model.initAsResponse(args, this.getLoadedInlineImages())
		await model.send(MailMethod.NONE)
		const folders = await this.mailModel.getMailboxFolders(this.mail)
		return moveMails({ mailModel: this.mailModel, mails: [this.mail], targetMailFolder: folders.getSystemFolderByType(MailFolderType.ARCHIVE) })
	}

	getNonInlineAttachments(): TutanotaFile[] {
		// If we have attachments it is safe to assume that we already have body and referenced cids from it
		const inlineFileIds = this.sanitizeResult?.inlineImageCids ?? []
		return this.attachments.filter((a) => a.cid == null || !inlineFileIds.includes(a.cid))
	}

	async downloadAll(): Promise<void> {
		try {
			await this.fileController.downloadAll(this.getNonInlineAttachments())
		} catch (e) {
			if (e instanceof FileOpenError) {
				console.warn("FileOpenError", e)
				await Dialog.message("canNotOpenFileOnDevice_msg")
			} else {
				console.error("could not open file:", e.message ?? "unknown error")
				await Dialog.message("errorDuringFileOpen_msg")
			}
		}
	}

	async downloadAndOpenAttachment(file: TutanotaFile, open: boolean) {
		try {
			if (open) {
				await this.fileController.open(file)
			} else {
				await this.fileController.download(file)
			}
		} catch (e) {
			if (e instanceof FileOpenError) {
				console.warn("FileOpenError", e)
				await Dialog.message("canNotOpenFileOnDevice_msg")
			} else {
				console.error("could not open file:", e.message ?? "unknown error")
				await Dialog.message("errorDuringFileOpen_msg")
			}
		}
	}

	/** Special feature for contact forms with shared mailboxes. */
	canAssignMails(): boolean {
		// do not allow re-assigning from personal mailbox
		return (
			this.logins.getUserController().isInternalUser() &&
			this.areParticipantsRestricted() &&
			this.logins.getUserController().getUserMailGroupMembership().group !== this.getMailOwnerGroup()
		)
	}

	private areParticipantsRestricted(): boolean {
		const restrictions = this.getRestrictions()
		return restrictions != null && restrictions.participantGroupInfos.length > 0
	}

	canReplyAll(): boolean {
		return (
			this.logins.getUserController().isInternalUser() &&
			this.getToRecipients().length + this.getCcRecipients().length + this.getBccRecipients().length > 1 &&
			!this.areParticipantsRestricted()
		)
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
		return userOrMailGroupInfos.filter((userOrMailGroupInfo) => {
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

	private updateMail({ mail, delayBodyRenderingUntil, showFolder }: { mail: Mail; delayBodyRenderingUntil?: Promise<void>; showFolder?: boolean }) {
		if (!isSameId(mail._id, this.mail._id)) {
			throw new ProgrammingError(
				`Trying to update MailViewerViewModel with unrelated email ${JSON.stringify(this.mail._id)} ${JSON.stringify(mail._id)} ${m.route.get()}`,
			)
		}
		this._mail = mail

		if (delayBodyRenderingUntil) {
			this.delayBodyRenderingUntil = delayBodyRenderingUntil
			this.renderIsDelayed = true
			this.delayBodyRenderingUntil.then(() => {
				this.renderIsDelayed = false
				m.redraw()
			})
		}

		this.folderText = null
		if (showFolder) {
			this.showFolder()
		}

		this.relevantRecipient = null
		this.determineRelevantRecipient()

		this.loadAll({ notify: true })
	}
}
