import {
	createMailAddress,
	EncryptedMailAddress,
	File as TutanotaFile,
	Mail,
	MailAddress,
	MailDetails,
	MailFolder,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	ConversationType,
	EncryptionAuthStatus,
	ExternalImageRule,
	FeatureType,
	MailAuthenticationStatus,
	MailMethod,
	MailPhishingStatus,
	MailReportType,
	MailSetKind,
	MailState,
	OperationType,
} from "../../../common/api/common/TutanotaConstants"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { ConfigurationDatabase } from "../../../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import stream from "mithril/stream"
import {
	addAll,
	assertNonNull,
	assertNotNull,
	contains,
	downcast,
	filterInt,
	first,
	isEmpty,
	lazyAsync,
	noOp,
	Nullable,
	ofClass,
	startsWith,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { lang } from "../../../common/misc/LanguageViewModel"
import { LoginController } from "../../../common/api/main/LoginController"
import m from "mithril"
import { LockedError, NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError"
import { haveSameId, isSameId } from "../../../common/api/common/utils/EntityUtils"
import { getReferencedAttachments, isTutanotaTeamMail, loadInlineImages, moveMails } from "./MailGuiUtils"
import { SanitizedFragment } from "../../../common/misc/HtmlSanitizer"
import { CALENDAR_MIME_TYPE, FileController } from "../../../common/file/FileController"
import { exportMails } from "../export/Exporter.js"
import { IndexingNotSupportedError } from "../../../common/api/common/error/IndexingNotSupportedError"
import { FileOpenError } from "../../../common/api/common/error/FileOpenError"
import { Dialog } from "../../../common/gui/base/Dialog"
import { checkApprovalStatus } from "../../../common/misc/LoginUtils"
import { formatDateTime, urlEncodeHtmlTags } from "../../../common/misc/Formatter"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { LoadingStateTracker } from "../../../common/offline/LoadingState"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { InitAsResponseArgs } from "../../../common/mailFunctionality/SendMailModel.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { WorkerFacade } from "../../../common/api/worker/facades/WorkerFacade.js"
import { SearchModel } from "../../search/model/SearchModel.js"
import { ParsedIcalFileContent } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade.js"
import { AttachmentType, getAttachmentType } from "../../../common/gui/AttachmentBubble.js"
import type { ContactImporter } from "../../contacts/ContactImporter.js"
import { InlineImages, revokeInlineImages } from "../../../common/mailFunctionality/inlineImagesUtils.js"
import { getDefaultSender, getEnabledMailAddressesWithUser, getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { getDisplayedSender, getMailBodyText, MailAddressAndName } from "../../../common/api/common/CommonMailUtils.js"
import { MailModel, MoveMode } from "../model/MailModel.js"
import { isNoReplyTeamAddress, isSystemNotification, loadMailDetails } from "./MailViewerUtils.js"
import { assertSystemFolderOfType, getFolderName, getPathToFolderString, loadMailHeaders } from "../model/MailUtils.js"
import { isDraft } from "../model/MailChecks"
import type { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { mailLocator } from "../../mailLocator.js"
import { UndoModel } from "../../UndoModel"
import { isBrowser } from "../../../common/api/common/Env"
import { CommonSystemFacade } from "../../../common/native/common/generatedipc/CommonSystemFacade"

export const enum ContentBlockingStatus {
	Block = "0",
	Show = "1",
	AlwaysShow = "2",
	NoExternalContent = "3",
	AlwaysBlock = "4",
}

export type UnsubscribeAction = {
	type: UnsubscribeType
	requestUrl: string
}

export const enum UnsubscribeType {
	HTTP_POST_UNSUBSCRIBE = "HTTP_POST_UNSUBSCRIBE",
	HTTP_GET_UNSUBSCRIBE = "HTTP_GET_UNSUBSCRIBE",
	MAILTO_UNSUBSCRIBE = "MAILTO_UNSUBSCRIBE",
}

export const enum FailureBannerType {
	None,
	Phishing,
	MailAuthenticationHardFail,
	MailAuthenticationSoftFail,
	DeprecatedPublicKey,
}

export const LIST_UNSUBSCRIBE_POST_PAYLOAD = "List-Unsubscribe=One-Click"

export class MailViewerViewModel {
	private forceLightMode: boolean = false
	// always sanitized in this.sanitizeMailBody

	private sanitizeResult: SanitizedFragment | null = null
	private loadingAttachments: boolean = false
	private attachments: TutanotaFile[] = []

	private contentBlockingStatus: ContentBlockingStatus | null = null

	private errorOccurredWhileLoadingMailDetails: boolean = false
	private loadedInlineImages: InlineImages | null = null
	/** only loaded when showFolder is set to true */
	private folderMailboxText: string | null

	/** @see getRelevantRecipient */
	private relevantRecipient: MailAddress | null = null
	private warningDismissed: boolean = false

	private calendarEventAttachment: {
		contents: ParsedIcalFileContent
		recipient: string
	} | null = null

	private readonly loadingState = new LoadingStateTracker()

	private renderIsDelayed: boolean = true

	readonly loadCompleteNotification = stream<null>()

	private renderedMail: Mail | null = null
	private loading: Promise<void> | null = null

	private collapsed: boolean = true

	get mail(): Mail {
		return this._mail
	}

	private mailDetails: MailDetails | null = null

	constructor(
		private _mail: Mail,
		showFolder: boolean,
		readonly entityClient: EntityClient,
		public readonly mailboxModel: MailboxModel,
		public readonly mailModel: MailModel,
		public readonly commonSystemFacade: Nullable<CommonSystemFacade>,
		readonly contactModel: ContactModel,
		private readonly configFacade: ConfigurationDatabase,
		private readonly fileController: FileController,
		readonly logins: LoginController,
		private readonly eventController: EventController,
		private readonly workerFacade: WorkerFacade,
		private readonly searchModel: SearchModel,
		private readonly mailFacade: MailFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly contactImporter: lazyAsync<ContactImporter>,
		private readonly highlightedStrings: readonly SearchToken[],
		readonly eventsRepository: CalendarEventsRepository,
		private readonly undoModel: UndoModel,
	) {
		this.folderMailboxText = null
		if (showFolder) {
			this.showFolder()
		}
		this.eventController.addEntityListener(this.entityListener)
	}

	private readonly entityListener = async (events: EntityUpdateData[]) => {
		for (const update of events) {
			if (isUpdateForTypeRef(MailTypeRef, update)) {
				const { instanceListId, instanceId, operation } = update
				// we need to process create events here because update and create events are optimized into a single create event during processing
				// when opening a mail from a notification while offline the view otherwise would not be updated when going online again,
				// and we would keep displaying an outdated view of the mail instance. timeline:
				// CREATE > Loaded and cached > Opened offline > Online > UPDATE (e.g. ownerEncSessionKey) > entity event processing starts
				// CREATE and UPDATE are merged into single CREATE event > CREATE event is processed here
				// and would be ignored even though the update is from after we loaded the mail.
				// This is critical as it also concerns encryptionAuthStatus
				if ((operation === OperationType.UPDATE || operation === OperationType.CREATE) && isSameId(this.mail._id, [instanceListId, instanceId])) {
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
		if (mailboxDetails == null) {
			return
		}
		const enabledMailAddresses = new Set(getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo))
		if (this.mailDetails == null) {
			// we could not load the mailDetails for some reason
			return
		}
		this.relevantRecipient =
			this.mailDetails.recipients.toRecipients.find((r) => enabledMailAddresses.has(r.address)) ??
			this.mailDetails.recipients.ccRecipients.find((r) => enabledMailAddresses.has(r.address)) ??
			this.mailDetails.recipients.bccRecipients.find((r) => enabledMailAddresses.has(r.address)) ??
			first(this.mailDetails.recipients.toRecipients) ??
			first(this.mailDetails.recipients.ccRecipients) ??
			first(this.mailDetails.recipients.bccRecipients)
		m.redraw()
	}

	private showFolder() {
		this.folderMailboxText = null
		const folder = this.mailModel.getMailFolderForMail(this.mail)

		if (folder) {
			this.mailModel.getMailboxDetailsForMail(this.mail).then(async (mailboxDetails) => {
				if (mailboxDetails == null || mailboxDetails.mailbox.folders == null) {
					return
				}
				const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetails.mailbox.folders._id)
				const name = getPathToFolderString(folders, folder)
				this.folderMailboxText = `${getMailboxName(this.logins, mailboxDetails)} / ${name}`
				m.redraw()
			})
		}
	}

	dispose() {
		// currently, the conversation view disposes us twice if our mail is deleted because it's getting disposed itself
		// (from the list selecting a different element) and because it disposes the mailViewerViewModel that got updated
		// this silences the warning about leaking entity event listeners when the listener is removed twice.
		this.dispose = () => console.log("disposed MailViewerViewModel a second time, ignoring")
		this.eventController.removeEntityListener(this.entityListener)
		const inlineImages = this.getLoadedInlineImages()
		revokeInlineImages(inlineImages)
	}

	async loadAll(
		delay: Promise<unknown>,
		{
			notify,
		}: {
			notify: boolean
		} = { notify: true },
	) {
		this.renderIsDelayed = true
		try {
			await this.loading
			try {
				this.loading = this.loadAndProcessAdditionalMailInfo(this.mail, delay)
					.then((inlineImageCids) => {
						this.determineRelevantRecipient()
						return inlineImageCids
					})
					.then((inlineImageCids) => this.loadAttachments(this.mail, inlineImageCids))
				await this.loadingState.trackPromise(this.loading)

				if (notify) this.loadCompleteNotification(null)
			} catch (e) {
				this.loading = null

				if (!isOfflineError(e)) {
					throw e
				}
			}

			m.redraw()
		} finally {
			this.renderIsDelayed = false
		}
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

	setForceLightMode(forceLightMode: boolean) {
		this.forceLightMode = forceLightMode
	}

	getForceLightMode(): boolean {
		return this.forceLightMode
	}

	isDraftMail() {
		return this.mail.state === MailState.DRAFT
	}

	isDeletableMail() {
		const folderType = this.getFolderInfo()?.folderType
		return folderType === MailSetKind.TRASH || folderType === MailSetKind.SPAM
	}

	isReceivedMail() {
		return this.mail.state === MailState.RECEIVED
	}

	isLoadingAttachments(): boolean {
		return this.loadingAttachments
	}

	getFolderMailboxText(): string | null {
		return this.folderMailboxText
	}

	getFolderInfo(): { folderType: MailSetKind; name: string } | null {
		const folder = this.mailModel.getMailFolderForMail(this.mail)
		if (!folder) return null
		return { folderType: folder.folderType as MailSetKind, name: getFolderName(folder) }
	}

	getSubject(): string {
		return this.mail.subject
	}

	isConfidential(): boolean {
		return this.mail.confidential
	}

	private isMailSuspicious(): boolean {
		return this.mail.phishingStatus === MailPhishingStatus.SUSPICIOUS
	}

	private isHardMailAuthenticationFailure(): boolean {
		return (
			(this.mailDetails != null &&
				!this.checkMailAuthenticationStatus(MailAuthenticationStatus.AUTHENTICATED) &&
				!this.checkMailAuthenticationStatus(MailAuthenticationStatus.SOFT_FAIL)) ||
			this.mail.encryptionAuthStatus === EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED
		)
	}

	mustRenderFailureBanner(): FailureBannerType {
		if (this.isMailSuspicious()) {
			return FailureBannerType.Phishing
		} else if (!this.isWarningDismissed()) {
			if (this.isHardMailAuthenticationFailure()) {
				return FailureBannerType.MailAuthenticationHardFail
			} else {
				if (this.mail.encryptionAuthStatus === EncryptionAuthStatus.RSA_DESPITE_TUTACRYPT) {
					return FailureBannerType.DeprecatedPublicKey
				} else if (this.checkMailAuthenticationStatus(MailAuthenticationStatus.SOFT_FAIL)) {
					return FailureBannerType.MailAuthenticationSoftFail
				}
			}
		}
		return FailureBannerType.None
	}

	getMailId(): IdTuple {
		return this.mail._id
	}

	getSanitizedMailBody(): DocumentFragment | null {
		return this.sanitizeResult?.fragment ?? null
	}

	getMailBody(): string {
		if (this.mailDetails) {
			return getMailBodyText(this.mailDetails.body)
		} else {
			return ""
		}
	}

	getDate(): Date {
		return this.mail.receivedDate
	}

	getToRecipients(): Array<MailAddress> {
		if (this.mailDetails === null) {
			return []
		}
		return this.mailDetails.recipients.toRecipients
	}

	getCcRecipients(): Array<MailAddress> {
		if (this.mailDetails === null) {
			return []
		}
		return this.mailDetails.recipients.ccRecipients
	}

	getBccRecipients(): Array<MailAddress> {
		if (this.mailDetails === null) {
			return []
		}
		return this.mailDetails.recipients.bccRecipients
	}

	/** Get the recipient which is relevant the most for the current mailboxes. */
	getRelevantRecipient(): MailAddress | null {
		return this.relevantRecipient
	}

	getNumberOfRecipients(): number {
		return filterInt(this.mail.recipientCount)
	}

	getReplyTos(): Array<EncryptedMailAddress> {
		if (this.mailDetails === null) {
			return []
		}
		return this.mailDetails.replyTos
	}

	getSender(): MailAddress {
		return this.mail.sender
	}

	/**
	 * Can be {@code null} if sender should not be displayed e.g. for system notifications.
	 */
	getDisplayedSender(): MailAddressAndName | null {
		if (isSystemNotification(this.mail)) {
			return null
		} else {
			return getDisplayedSender(this.mail)
		}
	}

	getPhishingStatus(): MailPhishingStatus {
		return this.mail.phishingStatus as MailPhishingStatus
	}

	setPhishingStatus(status: MailPhishingStatus) {
		this.mail.phishingStatus = status
	}

	checkMailAuthenticationStatus(status: MailAuthenticationStatus): boolean {
		if (this.mailDetails != null) {
			return this.mailDetails.authStatus === status
		} else {
			// mailDetails not loaded yet
			return false
		}
	}

	canCreateSpamRule(): boolean {
		return this.logins.isGlobalAdminUserLoggedIn() && !this.logins.isEnabled(FeatureType.InternalCommunication)
	}

	didErrorsOccur(): boolean {
		let bodyErrors = false
		if (this.mailDetails) {
			bodyErrors = typeof downcast(this.mailDetails.body)._errors !== "undefined"
		}
		return this.errorOccurredWhileLoadingMailDetails || typeof this.mail._errors !== "undefined" || bodyErrors
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

	private isWarningDismissed() {
		return this.warningDismissed
	}

	setWarningDismissed(dismissed: boolean) {
		this.warningDismissed = dismissed
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

	async updateMailPhishingStatus(newStatus: MailPhishingStatus): Promise<void> {
		const oldStatus = this.getPhishingStatus()

		if (oldStatus === newStatus) {
			return
		}

		this.setPhishingStatus(newStatus)

		await this.entityClient.update(this.mail).catch(() => this.setPhishingStatus(oldStatus))
	}

	async markAsNotPhishing(): Promise<void> {
		await this.updateMailPhishingStatus(MailPhishingStatus.WHITELISTED)
	}

	async markAsPhishing(): Promise<void> {
		await this.updateMailPhishingStatus(MailPhishingStatus.SUSPICIOUS)
	}

	async reportMail(reportType: MailReportType): Promise<void> {
		try {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMail(this.mail)
			// We should always have a mailbox, the check above throws due AssertNotNull in response.
			if (mailboxDetail == null || mailboxDetail.mailbox.folders == null) {
				return
			}
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
			const spamFolder = assertSystemFolderOfType(folders, MailSetKind.SPAM)

			if (reportType === MailReportType.PHISHING) {
				// When reported as phishing mail is moved to spam, this move can't be undone
				await this.markAsPhishing()
				await this.mailModel.moveMails([this.mail._id], spamFolder, MoveMode.Mails)
				await this.mailModel.reportMails(MailReportType.PHISHING, [this.mail])
			} else {
				// The moving of mails into spam folder will mark them as spam
				await moveMails({
					mailboxModel: this.mailboxModel,
					mailModel: this.mailModel,
					mailIds: [this.mail._id],
					targetFolder: spamFolder,
					moveMode: MoveMode.Mails,
					undoModel: this.undoModel,
				})
			}
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
		await exportMails([this.mail], this.mailFacade, this.entityClient, this.fileController, this.cryptoFacade)
	}

	async getHeaders(): Promise<string | null> {
		// make sure that the mailDetails are loaded
		const mailDetails = await loadMailDetails(this.mailFacade, this.mail)
		return loadMailHeaders(mailDetails)
	}

	isUnread(): boolean {
		return this.mail.unread
	}

	async setUnread(unread: boolean) {
		if (this.mail.unread !== unread) {
			this.mail.unread = unread

			await this.entityClient
				.update(this.mail)
				.catch(ofClass(LockedError, () => console.log("could not update mail read state: ", lang.get("operationStillActive_msg"))))
				.catch(ofClass(NotFoundError, noOp))
		}
	}

	isAnnouncement(): boolean {
		const replyTos = this.mailDetails?.replyTos
		return (
			isSystemNotification(this.mail) &&
			// hide the actions until mailDetails are loaded rather than showing them quickly and then hiding them
			(replyTos == null || replyTos?.length === 0 || (replyTos?.length === 1 && isNoReplyTeamAddress(replyTos[0].address)))
		)
	}

	isListUnsubscribe(): boolean {
		return this.mail.listUnsubscribe
	}

	hasListUnsubscribeHeader(): boolean {
		if (this.mailDetails == null) {
			return false
		}
		const mailHeaders = loadMailHeaders(this.mailDetails)
		if (mailHeaders == null) {
			return false
		}
		const listUnsubscribeHeaders = mailHeaders
			.replaceAll(/\r\n/g, "\n") // replace all CR LF with LF
			.replaceAll(/\n[ \t]/g, "") // join multiline headers to a single line
			.split("\n") // split headers
			.filter((headerLine) => headerLine.toLowerCase().startsWith("list-unsubscribe:"))
		return !isEmpty(listUnsubscribeHeaders)
	}

	private decodeMimeHeader(value: string): string {
		return value.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (_, _charset, encoding, encodedText) => {
			if (encoding.toUpperCase() === "Q") {
				return encodedText.replace(/_/g, " ").replace(/=([A-Fa-f0-9]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
			} else if (encoding.toUpperCase() === "B") {
				try {
					return Buffer.from(encodedText, "base64").toString("utf-8")
				} catch {
					return encodedText
				}
			}
			return encodedText
		})
	}
	async determineUnsubscribeOrder(): Promise<Array<UnsubscribeAction>> {
		const mailHeaders = await this.getHeaders()
		const unsubscribeActions: Array<UnsubscribeAction> = []
		if (!mailHeaders) {
			return unsubscribeActions
		}

		const normalizedHeaders = mailHeaders
			.replaceAll(/\r\n/g, "\n")
			.replaceAll(/\n[ \t]/g, "")
			.split("\n")
			.map((h) => this.decodeMimeHeader(h.trim()))

		const listUnsubscribeHeaders = normalizedHeaders.filter((headerLine) => headerLine.toLowerCase().startsWith("list-unsubscribe:"))

		if (isEmpty(listUnsubscribeHeaders)) {
			return unsubscribeActions
		}

		const unsubPostHeader = normalizedHeaders.find((h) => h.toLowerCase().startsWith("list-unsubscribe-post"))

		const [_, ...value] = listUnsubscribeHeaders[0].split(":")
		const headerValue = value.join(":")
		const links = headerValue.split(/,(?![^<>]*>)/)

		for (const link of links) {
			const trimmedLink = link.trim()
			if (trimmedLink.startsWith("<http") && trimmedLink.endsWith(">")) {
				unsubscribeActions.push({
					type: unsubPostHeader != null ? UnsubscribeType.HTTP_POST_UNSUBSCRIBE : UnsubscribeType.HTTP_GET_UNSUBSCRIBE,
					requestUrl: trimmedLink.slice(1, -1),
				})
			} else if (trimmedLink.startsWith("<mailto:") && trimmedLink.endsWith(">")) {
				unsubscribeActions.push({
					type: UnsubscribeType.MAILTO_UNSUBSCRIBE,
					requestUrl: trimmedLink.slice(1, -1),
				})
			}
		}

		// http links have priority over mailto links
		const sortedActions: UnsubscribeAction[] = []

		const httpAction = unsubscribeActions.find(
			(action) => action.type === UnsubscribeType.HTTP_POST_UNSUBSCRIBE || action.type === UnsubscribeType.HTTP_GET_UNSUBSCRIBE,
		)
		if (httpAction) {
			sortedActions.push(httpAction)
		}

		const mailToAction = unsubscribeActions.find((action) => action.type === UnsubscribeType.MAILTO_UNSUBSCRIBE)
		if (mailToAction) {
			sortedActions.push(mailToAction)
		}

		return sortedActions
	}

	async unsubscribePost(unsubscribeAction: UnsubscribeAction): Promise<boolean> {
		if (!this.isListUnsubscribe()) {
			return false
		}

		if (unsubscribeAction.type !== UnsubscribeType.HTTP_POST_UNSUBSCRIBE) {
			return false
		}

		const unsubscribePostUrl = assertNotNull(unsubscribeAction.requestUrl)
		if (isBrowser()) {
			// In case we are on the webApp we can not execute the POST request directly
			// from the client. However, the user is informed that the list unsubscribe url will
			// be sent to our server in this case.
			await this.mailModel.serverUnsubscribe(this.mail, unsubscribePostUrl)
			return true
		} else {
			const isPostRequestSuccessful = await assertNotNull(this.commonSystemFacade).executePostRequest(unsubscribePostUrl, LIST_UNSUBSCRIBE_POST_PAYLOAD)
			if (isPostRequestSuccessful) {
				this.mail.listUnsubscribe = false
				await this.entityClient.update(this.mail)
			}
			return isPostRequestSuccessful
		}
	}

	getHighlightedStrings(): readonly SearchToken[] {
		return this.highlightedStrings
	}

	getMailboxDetails(): Promise<MailboxDetail | null> {
		return this.mailModel.getMailboxDetailsForMail(this.mail)
	}

	/** @return list of inline referenced cid */
	private async loadAndProcessAdditionalMailInfo(mail: Mail, delayBodyRenderingUntil: Promise<unknown>): Promise<string[]> {
		// If the mail is a non-draft and we have loaded it before, we don't need to reload it because it cannot have been edited, so we return early
		// drafts however can be edited, and we want to receive the changes, so for drafts we will always reload
		let isDraft = mail.state === MailState.DRAFT
		if (this.renderedMail != null && haveSameId(mail, this.renderedMail) && !isDraft && this.sanitizeResult != null) {
			return this.sanitizeResult.inlineImageCids
		}

		try {
			this.mailDetails = await loadMailDetails(this.mailFacade, this.mail)
			this.errorOccurredWhileLoadingMailDetails = false
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could load mail body as it has been moved/deleted already", e)
				this.errorOccurredWhileLoadingMailDetails = true
				return []
			}

			if (e instanceof NotAuthorizedError) {
				console.log("could load mail body as the permission is missing", e)
				this.errorOccurredWhileLoadingMailDetails = true
				return []
			}

			throw e
		}

		const externalImageRule = await this.configFacade.getExternalImageRule(mail.sender.address).catch((e) => {
			console.log("Error getting external image rule:", e)
			return ExternalImageRule.None
		})
		const isAllowedAndAuthenticatedExternalSender =
			externalImageRule === ExternalImageRule.Allow && this.checkMailAuthenticationStatus(MailAuthenticationStatus.AUTHENTICATED)
		// We should not try to sanitize body while we still animate because it's a heavy operation.
		await delayBodyRenderingUntil
		this.renderIsDelayed = false

		this.sanitizeResult = await this.sanitizeMailBody(mail, !isAllowedAndAuthenticatedExternalSender)

		if (!isDraft) {
			this.checkMailForPhishing(mail, this.sanitizeResult.links)
		}

		this.contentBlockingStatus =
			externalImageRule === ExternalImageRule.Block
				? ContentBlockingStatus.AlwaysBlock
				: isAllowedAndAuthenticatedExternalSender
					? ContentBlockingStatus.AlwaysShow
					: this.sanitizeResult.blockedExternalContent > 0
						? ContentBlockingStatus.Block
						: ContentBlockingStatus.NoExternalContent
		m.redraw()
		this.renderedMail = this.mail
		return this.sanitizeResult.inlineImageCids
	}

	private async loadAttachments(mail: Mail, inlineCids: string[]): Promise<void> {
		if (mail.attachments.length === 0) {
			this.loadingAttachments = false
			//Setting attachments to empty when we remove the last attachment from the list
			this.attachments = []
			m.redraw()
		} else {
			this.loadingAttachments = true

			try {
				const files = await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, await this.mailFacade.loadAttachments(mail))

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
						.catch(ofClass(LockedError, (_) => console.log("could not update mail phishing status as mail is locked")))
						.catch(ofClass(NotFoundError, (_) => console.log("mail already moved")))

					m.redraw()
				}
			})
		}
	}

	/**
	 * Check if the list of files contain an iCal file which we can then load and display details for. A calendar notification
	 * should contain only one iCal attachment, so we only process the first matching one.
	 *
	 * (this is not true for ie google calendar, they send the invite twice in each mail, but it's always the same file twice)
	 */
	private handleCalendarFile(files: Array<TutanotaFile>, mail: Mail): void {
		const calendarFile = files.find((a) => a.mimeType && a.mimeType.startsWith(CALENDAR_MIME_TYPE))

		if (calendarFile && (mail.method === MailMethod.ICAL_REQUEST || mail.method === MailMethod.ICAL_REPLY) && mail.state === MailState.RECEIVED) {
			Promise.all([
				import("../../../calendar-app/calendar/view/CalendarInvites.js").then(({ getEventsFromFile }) =>
					getEventsFromFile(calendarFile, mail.confidential),
				),
				this.getSenderOfResponseMail(),
			]).then(([contents, recipient]) => {
				this.calendarEventAttachment =
					contents != null
						? {
								contents,
								recipient,
							}
						: null
				m.redraw()
			})
		}
	}

	private getSenderOfResponseMail(): Promise<string> {
		return this.mailModel.getMailboxDetailsForMail(this.mail).then(async (mailboxDetails) => {
			assertNonNull(mailboxDetails, "Mail list does not exist anymore")
			const myMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo)
			const addressesInMail: MailAddress[] = []
			const mailDetails = await loadMailDetails(this.mailFacade, this.mail)
			addressesInMail.push(...mailDetails.recipients.toRecipients)
			addressesInMail.push(...mailDetails.recipients.ccRecipients)
			addressesInMail.push(...mailDetails.recipients.bccRecipients)

			const mailAddressAndName = this.getDisplayedSender()
			if (mailAddressAndName) {
				addressesInMail.push(
					createMailAddress({
						name: mailAddressAndName.name,
						address: mailAddressAndName.address,
						contact: null,
					}),
				)
			}
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
			if (mailboxDetails == null) {
				return
			}

			const isReloadNeeded = !this.sanitizeResult || this.mail.attachments.length !== this.attachments.length
			if (isReloadNeeded) {
				// Call this again to make sure everything is loaded, including inline images because this can be called earlier than all the parts are loaded.
				await this.loadAll(Promise.resolve(), { notify: true })
			}
			const editor = await newMailEditorAsResponse(args, this.isBlockingExternalImages(), this.getLoadedInlineImages(), mailboxDetails)
			editor?.show()
		}
	}

	private async createResponseMailArgsForForwarding(
		recipients: MailAddress[],
		replyTos: EncryptedMailAddress[],
		addSignature: boolean,
	): Promise<InitAsResponseArgs> {
		let infoLine = lang.get("date_label") + ": " + formatDateTime(this.mail.receivedDate) + "<br>"
		const senderAddress = this.getDisplayedSender()?.address
		if (senderAddress) {
			infoLine += lang.get("from_label") + ": " + senderAddress + "<br>"
		}

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
		const body = infoLine + '<br><br><blockquote class="tutanota_quote">' + this.getMailBody() + "</blockquote>"
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
			return
		}

		const sendAllowed = await checkApprovalStatus(this.logins, false)

		if (sendAllowed) {
			const mailboxDetails = await this.mailModel.getMailboxDetailsForMail(this.mail)
			if (mailboxDetails == null) {
				return
			}

			// We already know it is not an announcement email and we want to get the sender even if it
			// is hidden. It will be replaced with replyTo() anyway
			const mailAddressAndName = getDisplayedSender(this.mail)
			const sender = createMailAddress({
				name: mailAddressAndName.name,
				address: mailAddressAndName.address,
				contact: null,
			})
			const prefix = "Re: "
			const mailSubject = this.getSubject()
			const subject = mailSubject ? (startsWith(mailSubject.toUpperCase(), prefix.toUpperCase()) ? mailSubject : prefix + mailSubject) : ""
			const infoLine = formatDateTime(this.getDate()) + " " + lang.get("by_label") + " " + sender.address + ":"
			const body = infoLine + '<br><blockquote class="tutanota_quote">' + this.getMailBody() + "</blockquote>"
			const toRecipients: MailAddress[] = []
			const ccRecipients: MailAddress[] = []
			const bccRecipients: MailAddress[] = []

			if (!this.logins.getUserController().isInternalUser() && this.isReceivedMail()) {
				toRecipients.push(sender)
			} else if (this.isReceivedMail()) {
				if (this.getReplyTos().some((address) => !downcast(address)._errors)) {
					addAll(toRecipients, this.getReplyTos())
				} else {
					toRecipients.push(sender)
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

			const isReloadNeeded = !this.sanitizeResult || this.mail.attachments.length !== this.attachments.length
			if (isReloadNeeded) {
				await this.loadAll(Promise.resolve(), { notify: true })
			}
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
					this.isBlockingExternalImages() || !this.isShowingExternalContent(),
					this.getLoadedInlineImages(),
					mailboxDetails,
				)
				editor?.show()
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
		const { getHtmlSanitizer } = await import("../../../common/misc/HtmlSanitizer")
		const rawBody = this.getMailBody()
		const urlified = await this.workerFacade.urlify(rawBody).catch((e) => {
			console.warn("Failed to urlify mail body!", e)
			return rawBody
		})
		const sanitizeResult = getHtmlSanitizer().sanitizeFragment(urlified, {
			blockExternalContent,
			allowRelativeLinks: isTutanotaTeamMail(mail),
			highlightedStrings: this.highlightedStrings,
		})
		const { fragment, inlineImageCids, links, blockedExternalContent } = sanitizeResult

		m.redraw()
		return {
			// We want to stringify and return the fragment here, because once a fragment is appended to a DOM Node, it's children are moved
			// and the fragment is left empty. If we cache the fragment and then append that directly to the DOM tree when rendering, there are cases where
			// we would try to do so twice, and on the second pass the mail body will be left blank
			fragment,
			inlineImageCids,
			links,
			blockedExternalContent,
		}
	}

	getNonInlineAttachments(): TutanotaFile[] {
		// If we have attachments it is safe to assume that we already have body and referenced cids from it
		const inlineFileIds = this.sanitizeResult?.inlineImageCids ?? []
		return this.attachments.filter((a) => a.cid == null || !inlineFileIds.includes(a.cid))
	}

	async downloadAll(): Promise<void> {
		const nonInlineAttachments = await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, this.getNonInlineAttachments())
		try {
			await this.fileController.downloadAll(nonInlineAttachments)
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
		file = (await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, [file]))[0]
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

	async importAttachment(file: TutanotaFile) {
		const attachmentType = getAttachmentType(file.mimeType ?? "")
		if (attachmentType === AttachmentType.CONTACT) {
			await this.importContacts(file)
		} else if (attachmentType === AttachmentType.CALENDAR) {
			await this.importCalendar(file)
		}
	}

	private async importContacts(file: TutanotaFile) {
		file = (await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, [file]))[0]
		try {
			const dataFile = await this.fileController.getAsDataFile(file)
			const contactListId = await this.contactModel.getContactListId()
			// this shouldn't happen but if it did we can just bail
			if (contactListId == null) return
			const contactImporter = await this.contactImporter()
			await contactImporter.importContactsFromFile(utf8Uint8ArrayToString(dataFile.data), contactListId)
		} catch (e) {
			console.log(e)
			throw new UserError("errorDuringFileOpen_msg")
		}
	}

	private async importCalendar(file: TutanotaFile) {
		file = (await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, [file]))[0]
		try {
			const { importCalendarFile, parseCalendarFile } = await import("../../../common/calendar/gui/CalendarImporter.js")
			const dataFile = await this.fileController.getAsDataFile(file)
			const data = parseCalendarFile(dataFile)
			await importCalendarFile(await mailLocator.calendarModel(), this.logins.getUserController(), data.contents)
		} catch (e) {
			console.log(e)
			throw new UserError("errorDuringFileOpen_msg")
		}
	}

	canImportFile(file: TutanotaFile): boolean {
		if (!this.logins.isInternalUserLoggedIn() || file.mimeType == null) {
			return false
		}
		const attachmentType = getAttachmentType(file.mimeType)
		return attachmentType === AttachmentType.CONTACT || attachmentType === AttachmentType.CALENDAR
	}

	canReply(): boolean {
		return !isDraft(this.mail) && !this.isAnnouncement()
	}

	canReplyAll(): boolean {
		return (
			this.logins.getUserController().isInternalUser() &&
			this.getToRecipients().length + this.getCcRecipients().length + this.getBccRecipients().length > 1
		)
	}

	canForward(): boolean {
		return !isDraft(this.mail) && !this.isAnnouncement() && this.logins.getUserController().isInternalUser()
	}

	shouldDelayRendering(): boolean {
		return this.renderIsDelayed
	}

	isCollapsed(): boolean {
		return this.collapsed
	}

	expandMail(delayBodyRendering: Promise<unknown>): void {
		this.loadAll(delayBodyRendering, { notify: true })
		if (this.isUnread()) {
			// When we automatically mark email as read (e.g. opening it from notification) we don't want to run into offline errors, but we still want to mark
			// the email as read once we log in.
			// It is appropriate to show the error when the user marks the email as unread explicitly but less so when they open it and just didn't reach the
			// full login yet.
			this.logins.waitForFullLogin().then(() => this.setUnread(false))
		}
		this.collapsed = false
	}

	collapseMail(): void {
		this.collapsed = true
	}

	getLabels(): readonly MailFolder[] {
		return this.mailModel.getLabelsForMail(this.mail).sort((labelA, labelB) => labelA.name.localeCompare(labelB.name))
	}

	private updateMail({ mail, showFolder }: { mail: Mail; showFolder?: boolean }) {
		if (!isSameId(mail._id, this.mail._id)) {
			throw new ProgrammingError(
				`Trying to update MailViewerViewModel with unrelated email ${JSON.stringify(this.mail._id)} ${JSON.stringify(mail._id)} ${m.route.get()}`,
			)
		}
		this._mail = mail

		this.folderMailboxText = null
		if (showFolder) {
			this.showFolder()
		}

		this.relevantRecipient = null
		this.determineRelevantRecipient()

		this.loadAll(Promise.resolve(), { notify: true })
	}

	isExternalUser() {
		return !this.logins.isInternalUserLoggedIn()
	}
}
