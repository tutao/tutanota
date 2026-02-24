import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import {
	ImportedMailTypeRef,
	ImportMailState,
	ImportMailStateTypeRef,
	Mail,
	MailBox,
	MailSet,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailSetTypeRef,
	MailTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { elementIdPart, getElementId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { $Promisable, assertNotNull, count, debounce, groupBy, isEmpty, lazyMemoized, mapWith, mapWithout, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { ListLoadingState, ListState } from "../../../common/gui/base/List.js"
import { ConversationPrefProvider, ConversationViewModel, ConversationViewModelFactory } from "./ConversationViewModel.js"
import { CreateMailViewerOptions } from "./MailViewer.js"
import { isExpectedErrorForSynchronization, isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { getMailSetKind, ImportStatus, MailSetKind, OperationType, SystemFolderType } from "../../../common/api/common/TutanotaConstants.js"
import { WsConnectionState } from "../../../common/api/main/WorkerClient.js"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel.js"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import { NotAuthorizedError, NotFoundError, PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import Stream from "mithril/stream"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { EntityUpdateData, isUpdateForTypeRef, OnEntityUpdateReceivedPriority, PrefetchStatus } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { MailModel, MoveMode } from "../model/MailModel.js"
import { assertSystemFolderOfType } from "../model/MailUtils.js"
import { getMailFilterForType, MailFilterType } from "./MailViewerUtils.js"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient.js"
import { isOfTypeOrSubfolderOf, isSpamOrTrashFolder, isSubfolderOfType } from "../model/MailChecks.js"
import { MailListModel } from "../model/MailListModel"
import { MailSetListModel } from "../model/MailSetListModel"
import { ConversationListModel } from "../model/ConversationListModel"
import { MailListDisplayMode } from "../../../common/misc/DeviceConfig"
import { client } from "../../../common/misc/ClientDetector"
import { ProcessInboxHandler } from "../model/ProcessInboxHandler"
import { mailLocator } from "../../mailLocator"
import { moveMails } from "./MailGuiUtils"
import { locator } from "../../../common/api/main/CommonLocator"
import { UndoModel } from "../../UndoModel"

export interface MailOpenedListener {
	onEmailOpened(mail: Mail): unknown
}

const TAG = "MailVM"

/**
 * These mailSets will always use the mail list model instead of the conversation list model regardless of the user's
 * settings.
 */
const MAIL_LIST_FOLDERS: ReadonlyArray<MailSetKind> = Object.freeze([MailSetKind.DRAFT, MailSetKind.SENT, MailSetKind.SCHEDULED])

export interface UndoAction {
	exec: () => $Promisable<unknown>
	onClear: () => unknown
}

/** ViewModel for the overall mail view. */
export class MailViewModel {
	/** Beware: this can be a label. */
	private _folder: MailSet | null = null
	private _listModel: MailSetListModel | null = null
	/** id of the mail requested to be displayed, independent of the list state. */
	private stickyMailId: IdTuple | null = null
	/**
	 * When the URL contains both folder id and mail id, we will try to select that mail, but we might need to load the list until we find it.
	 * This is that mail id that we are loading.
	 */
	private loadingTargetId: Id | null = null
	private conversationViewModel: ConversationViewModel | null = null
	private _filterType: ReadonlySet<MailFilterType> = new Set()

	/**
	 * We remember the last URL used for each folder, so if we switch between mailSets, we can keep the selected mail.
	 * There's a similar (but different) hacky mechanism where we store the last URL but per each top-level view: navButtonRoutes. This one is per folder.
	 */
	private mailFolderElementIdToSelectedMailId: ReadonlyMap<Id, Id> = new Map()
	private listStreamSubscription: Stream<unknown> | null = null
	private conversationPref: boolean = false
	private mailListDisplayModePref: boolean = false
	/** A slightly hacky marker to avoid concurrent URL updates. */
	private currentShowTargetMarker: object = {}
	/* We only attempt counter fixup once after switching mailSets and loading the list fully. */
	private shouldAttemptCounterFixup: boolean = true

	constructor(
		private readonly mailboxModel: MailboxModel,
		private readonly mailModel: MailModel,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly connectivityModel: WebsocketConnectivityModel,
		private readonly cacheStorage: ExposedCacheStorage,
		private readonly conversationViewModelFactory: ConversationViewModelFactory,
		private readonly mailOpenedListener: MailOpenedListener,
		private readonly conversationPrefProvider: ConversationPrefProvider,
		private readonly processInboxHandler: ProcessInboxHandler,
		private readonly router: Router,
		private readonly updateUi: () => unknown,
	) {}

	getSelectedMailSetKind(): MailSetKind | null {
		return this._folder ? getMailSetKind(this._folder) : null
	}

	get filterType(): ReadonlySet<MailFilterType> {
		return this._filterType
	}

	setFilter(filter: ReadonlySet<MailFilterType>) {
		this._filterType = filter
		const filterFunctions = Array.from(filter).map(getMailFilterForType)
		this.listModel?.setFilter(filterFunctions)
	}

	async showMailWithMailSetId(mailSetId?: Id, mailId?: Id): Promise<void> {
		const showMailMarker = {}
		this.currentShowTargetMarker = showMailMarker
		if (mailSetId) {
			const mailSet = await this.mailModel.getMailSetById(mailSetId)
			if (showMailMarker !== this.currentShowTargetMarker) {
				return
			}
			if (mailSet) {
				return this.showMail(mailSet, mailId)
			}
		}
		return this.showMail(null, mailId)
	}

	async showStickyMail(fullMailId: IdTuple, onMissingExplicitMailTarget: () => unknown): Promise<void> {
		const [listId, elementId] = fullMailId
		// If we are already displaying the requested email, do nothing
		if (this.conversationViewModel && isSameId(this.conversationViewModel.primaryMail._id, elementId)) {
			return
		}
		if (isSameId(this.stickyMailId, fullMailId)) {
			return
		}

		console.log(TAG, "Loading sticky mail", listId, elementId)
		this.stickyMailId = fullMailId

		// This should be very quick as we only wait for the cache,
		await this.loadExplicitMailTarget(listId, elementId, onMissingExplicitMailTarget)
	}

	private async resetOrInitializeList(mail: Mail) {
		if (this._folder != null) {
			// If we already have a folder, deselect.
			this.listModel?.selectNone()
		} else {
			// Otherwise, load the inbox as fallback so that it won't be empty on mobile when you try to go back.
			// However, we try to always display the folder the mail is actually in.
			const userInbox = await this.getFolderForUserInbox()
			const folderForMail = this.mailModel.getMailFolderForMail(mail)

			if (this.didStickyMailChange(mail._id, "after loading user inbox ID")) {
				return
			}

			if (folderForMail) {
				this.setListId(folderForMail)
			} else {
				this.setListId(userInbox)
			}
		}
	}

	private async showMail(folder?: MailSet | null, mailId?: Id) {
		// an optimization to not open an email that we already display
		if (
			folder != null &&
			mailId != null &&
			this._folder &&
			isSameId(folder._id, this._folder._id) &&
			this.conversationViewModel &&
			isSameId(elementIdPart(this.conversationViewModel.primaryMail._id), mailId)
		) {
			return
		}
		// If we are already loading towards the email passed to us in the URL, then we don't need to do anything.
		// We already updated the URL on the previous call.
		if (
			folder != null &&
			mailId != null &&
			this._folder &&
			this.loadingTargetId &&
			isSameId(folder._id, this._folder._id) &&
			isSameId(this.loadingTargetId, mailId)
		) {
			return
		}

		console.log(TAG, "showMail", folder?._id, mailId)

		// important: to set it early enough because setting listId will trigger URL update.
		// if we don't set this one before setListId, url update will cause this function to be called again but without target mail, and we will lose the
		// target id
		const loadingTargetId = mailId ?? null
		this.loadingTargetId = loadingTargetId

		// if the URL has changed, then we probably want to reset the explicitly shown email
		this.stickyMailId = null

		const folderToUse = await this.selectFolderToUse(folder ?? null)
		// Selecting a folder is async, check that the target hasn't changed in between
		if (this.loadingTargetId !== loadingTargetId) return

		// This will cause a URL update indirectly
		this.setListId(folderToUse)

		// If we have a mail that should be selected, start loading towards it.
		// We already checked in the beginning that we are not loading to the same target. We set the loadingTarget early so there should be no races.
		if (loadingTargetId) {
			// Record the selected mail for the folder
			this.mailFolderElementIdToSelectedMailId = mapWith(this.mailFolderElementIdToSelectedMailId, getElementId(folderToUse), loadingTargetId)
			try {
				await this.loadAndSelectMail(folderToUse, loadingTargetId)
			} finally {
				// We either selected the mail, and we don't need the target anymore, or we didn't find it, and we should remove the target
				this.loadingTargetId = null
			}
		} else {
			// update URL if the view was just opened without any url params
			// setListId might not have done it if the list didn't change for us internally but is changed for the view
			if (folder == null) this.updateUrl()
		}
	}

	private async selectFolderToUse(folderArgument: MailSet | null): Promise<MailSet> {
		if (folderArgument) {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folderArgument)
			if (mailboxDetail) {
				return folderArgument
			} else {
				return await this.getFolderForUserInbox()
			}
		} else {
			return this._folder ?? (await this.getFolderForUserInbox())
		}
	}

	private async loadExplicitMailTarget(listId: Id, mailId: Id, onMissingTargetEmail: () => unknown) {
		const expectedStickyMailId: IdTuple = [listId, mailId]

		// First, try getting the mail from the list.
		// We don't need to do anything more if we can simply select it, as getting the mail is completely synchronous.
		const mailInList = this.listModel?.getMail(mailId)
		if (mailInList) {
			console.log(TAG, "opening mail from listModel list", mailId)
			this.listModel?.onSingleSelection(mailInList)
			return
		}

		// Load the cached mail, if available, to display it sooner
		const cached = await this.cacheStorage.get(MailTypeRef, listId, mailId)
		if (this.didStickyMailChange(expectedStickyMailId, "after loading mail from cache")) {
			return
		} else if (cached) {
			console.log(TAG, "displaying mail from cache", mailId)
			await this.displayExplicitMailTarget(cached)
			return
		}

		let mail: Mail | null
		try {
			mail = await this.entityClient.load(MailTypeRef, [listId, mailId], { cacheMode: CacheMode.WriteOnly })
		} catch (e) {
			if (isOfflineError(e)) {
				return
			} else if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
				mail = null
			} else {
				throw e
			}
		}

		if (this.didStickyMailChange(expectedStickyMailId, "after loading mail from entity client")) {
			return
		} else if (mail) {
			console.log(TAG, "displaying mail from entity client", mailId)
			await this.displayExplicitMailTarget(mail)
		} else {
			console.log(TAG, "explicit mail target not found", listId, mailId)
			onMissingTargetEmail()

			// We already know that email is not there, we can reset the target here and avoid list loading
			this.stickyMailId = null
			this.updateUrl()
		}
	}

	private async displayExplicitMailTarget(mail: Mail) {
		await this.resetOrInitializeList(mail)
		this.createConversationViewModel({ mail, showFolder: false, loadLatestMail: this.groupMailsByConversation() })
		this.updateUi()
	}

	private didStickyMailChange(expectedId: IdTuple, message: string): boolean {
		const changed = !isSameId(this.stickyMailId, expectedId)
		if (changed) {
			console.log(TAG, "target mail id changed", message, expectedId, this.stickyMailId)
		}
		return changed
	}

	private async loadAndSelectMail(folder: MailSet, mailId: Id) {
		let pagesLoaded = 0
		const foundMail = await this.listModel?.loadAndSelect(
			mailId,
			() =>
				// if we changed the list, stop
				this.getFolder() !== folder ||
				// if listModel is gone for some reason, stop
				!this.listModel ||
				// if the target mail has changed, stop
				this.loadingTargetId !== mailId ||
				// if the selected mail has deleted or changed folder, stop
				pagesLoaded++ >= 10,
		)
		if (foundMail == null) {
			console.log("did not find mail", folder, mailId)
		}
	}

	/**
	 * Base mails to apply actions too. To finally apply the action to the whole conversation (if necessary) it is
	 * still necessary to call {@link MailViewModel#getResolvedMails()}.
	 * @return {Mail[]} that are displayed in the viewer
	 */
	getActionableMails(): readonly Mail[] {
		// conversationViewModel is not there if we are in multiselect or if nothing is selected.
		// it should also cover the sticky mail case.
		if (this.conversationViewModel == null) {
			return this.listModel?.getSelectedAsArray() ?? []
		} else {
			// conversationMails() might not return the whole conversation if it's still loading, it is fine; we need
			// this function to be sync to reflect the displayed mails. As long as getResolvedMails() is called to
			// actually apply the action, this does not cause any issues. Once the conversation is loaded, the UI will
			// be updated as well, so this only affects the displayed state temporarily.
			return this.groupMailsByConversation() ? this.conversationViewModel.conversationMails() : [this.conversationViewModel.primaryMail]
		}
	}

	/**
	 * If ConversationInListView is active in the current folder, Ids of all mails in the conversation are returned
	 * If not, only the ID of the primary mail is returned
	 */
	async getResolvedMails(mails: readonly Mail[]): Promise<readonly IdTuple[]> {
		if (this.groupMailsByConversation()) {
			return this.mailModel.resolveConversationsForMails(mails)
		} else {
			return mails.map((m) => m._id)
		}
	}

	/**
	 * Returns the mails that the action should finally apply too. This might include the whole conversations if
	 * grouping by conversation is enabled.
	 */
	async getResolvedActionableMails(): Promise<readonly IdTuple[]> {
		const actionableMails = this.getActionableMails()
		if (isEmpty(actionableMails)) {
			return []
		}

		return await this.getResolvedMails(actionableMails)
	}

	clearStickyMail() {
		if (this.stickyMailId) {
			this.stickyMailId = null
			this.clearConversationViewModel()
		}
	}

	/**
	 * Permanent delete is only allowed when the mail is in the current folder, and the current folder is Trash/Spam.
	 */
	isPermanentDeleteAllowed(): boolean {
		const primaryMailFolder = this.conversationViewModel != null ? this.mailModel.getMailFolderForMail(this.conversationViewModel.primaryMail) : null
		const currentFolder = this.getFolder()

		if (primaryMailFolder != null && currentFolder != null && !isSameId(currentFolder._id, primaryMailFolder._id)) {
			return false
		} else {
			return currentFolder != null && (currentFolder.folderType === MailSetKind.TRASH || currentFolder.folderType === MailSetKind.SPAM)
		}
	}

	isExportingMailsAllowed(): boolean {
		return this.mailModel.isExportingMailsAllowed() && !client.isMobileDevice()
	}

	private async getFolderForUserInbox(): Promise<MailSet> {
		const mailboxDetail = await this.mailboxModel.getUserMailboxDetails()
		const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		return assertSystemFolderOfType(folders, MailSetKind.INBOX)
	}

	/** init is called every time the view is opened */
	init() {
		this.onceInit()
		const conversationDisabled = this.conversationPrefProvider.getConversationViewShowOnlySelectedMail()
		const mailListModePref = !conversationDisabled && this.conversationPrefProvider.getMailListDisplayMode() === MailListDisplayMode.CONVERSATIONS
		if (this.conversationViewModel && this.conversationPref !== conversationDisabled) {
			const mail = this.conversationViewModel.primaryMail
			this.createConversationViewModel({
				mail,
				showFolder: false,
				loadLatestMail: this.groupMailsByConversation(),
				delayBodyRenderingUntil: Promise.resolve(),
			})
			this.mailOpenedListener.onEmailOpened(mail)
		}

		this.conversationPref = conversationDisabled

		const oldGroupMailsByConversationPref = this.mailListDisplayModePref
		this.mailListDisplayModePref = mailListModePref
		if (oldGroupMailsByConversationPref !== mailListModePref) {
			// if the preference for conversation in the list has changed, we need to re-create the list model
			this.updateListModel()
		}
	}

	private readonly onceInit = lazyMemoized(() => {
		this.eventController.addEntityListener({
			onEntityUpdatesReceived: (updates) => this.entityEventsReceived(updates),
			priority: OnEntityUpdateReceivedPriority.NORMAL,
		})
	})

	get listModel(): MailSetListModel | null {
		return this._listModel
	}

	getMailFolderToSelectedMail(): ReadonlyMap<Id, Id> {
		return this.mailFolderElementIdToSelectedMailId
	}

	/**
	 * Beware: this can return a label.
	 */
	getFolder(): MailSet | null {
		return this._folder
	}

	getLabelsForMail(mail: Mail): ReadonlyArray<MailSet> {
		return this.listModel?.getLabelsForMail(mail) ?? []
	}

	async applyLabelToMails(mails: readonly IdTuple[], label: MailSet): Promise<void> {
		await this.mailModel.applyLabels(mails, [label], [])
	}

	private setListId(folder: MailSet) {
		const oldFolderId = this._folder?._id
		// update the folder just in case, maybe it got updated
		this._folder = folder

		// only re-create list things if it's actually another folder
		if (!oldFolderId || !isSameId(oldFolderId, folder._id)) {
			// Cancel old load all
			this.listModel?.cancelLoadAll()
			this._filterType = new Set()

			// the open folder has changed, which means we need another list model with data for this list
			this.updateListModel()
		}
	}

	getConversationViewModel(): ConversationViewModel | null {
		return this.conversationViewModel
	}

	// deinit the old list model if it exists and create and init a new one
	private updateListModel() {
		if (this._folder == null) {
			this.listStreamSubscription?.end(true)
			this.listStreamSubscription = null
			this._listModel = null
		} else {
			// Capture state to avoid race conditions.
			// We need to populate the mail set entries cache when loading mails so that we can react to updates later.
			const folder = this._folder

			let listModel: MailSetListModel
			if (this.groupMailsByConversation(folder)) {
				listModel = new ConversationListModel(
					folder,
					this.conversationPrefProvider,
					this.entityClient,
					this.mailModel,
					this.processInboxHandler,
					this.cacheStorage,
					this.connectivityModel,
				)
			} else {
				listModel = new MailListModel(
					folder,
					this.conversationPrefProvider,
					this.entityClient,
					this.mailModel,
					this.processInboxHandler,
					this.cacheStorage,
					this.connectivityModel,
				)
			}
			this.listStreamSubscription?.end(true)
			this.listStreamSubscription = listModel.stateStream.map((state: ListState<Mail>) => this.onListStateChange(listModel, state))
			void listModel.loadInitial()
			this._listModel = listModel
		}

		this.shouldAttemptCounterFixup = true
	}

	private fixCounterIfNeeded: (folder: MailSet, loadedMailsWhenCalled: ReadonlyArray<Mail>) => void = debounce(
		2000,
		async (folder: MailSet, loadedMailsWhenCalled: ReadonlyArray<Mail>) => {
			// If mailSets are changed, the list won't have the data we need.
			// Do not rely on counters if we are not connected.
			// We can't know the correct unreadMailCount if some unread mails are filtered out.
			const ourFolder = this.getFolder()
			const listHasAllUnreadMails = this.filterType.size === 0 || (this.filterType.size === 1 && this.filterType.has(MailFilterType.Unread))
			if (
				ourFolder == null ||
				!isSameId(getElementId(ourFolder), getElementId(folder)) ||
				this.connectivityModel.wsConnection()() !== WsConnectionState.connected ||
				!listHasAllUnreadMails
			) {
				return
			}

			// If the list was modified in the meantime, we cannot be sure that we will fix counters correctly (e.g., because of the inbox rules)
			if (this.listModel?.mails !== loadedMailsWhenCalled) {
				console.log("list changed, trying again later")
				return this.fixCounterIfNeeded(folder, this.listModel?.mails ?? [])
			}

			const unreadMailsCount = count(this.listModel.mails, (e) => e.unread)

			const counterValue = await this.mailModel.getCounterValue(folder)
			if (counterValue != null && counterValue !== unreadMailsCount) {
				console.log(`fixing up counter for folder ${folder._id}`)
				await this.mailModel.fixupCounterForFolder(folder, unreadMailsCount)
			} else {
				console.log(`same counter, no fixup on folder ${folder._id}`)
			}
		},
	)

	private onListStateChange(listModel: MailSetListModel, newState: ListState<Mail>) {
		// Fixup isn't needed for labels since only mailSets have counters.
		// A counter fixup with a partially loaded list will set the counter to an incorrect value.
		const folder = this.getFolder()
		if (this.shouldAttemptCounterFixup && folder != null && folder.folderType !== MailSetKind.LABEL && newState.loadingStatus === ListLoadingState.Done) {
			this.fixCounterIfNeeded(folder, newState.items)
			this.shouldAttemptCounterFixup = false
		}

		// If we are already displaying sticky mail, just leave it alone, no matter what's happening to the list.
		// User actions and URL updated do reset sticky mail id.
		const displayedMailId = this.conversationViewModel?.primaryViewModel()?.mail._id
		if (!(displayedMailId && isSameId(displayedMailId, this.stickyMailId))) {
			const targetItem = this.stickyMailId ? newState.items.find((item) => isSameId(this.stickyMailId, item._id)) : listModel.getDisplayedMail()
			if (targetItem != null) {
				// Always write the targetItem in case it was not written before but already being displayed (sticky mail)
				this.mailFolderElementIdToSelectedMailId = mapWith(
					this.mailFolderElementIdToSelectedMailId,
					getElementId(assertNotNull(this.getFolder())),
					getElementId(targetItem),
				)
				if (!this.conversationViewModel || !isSameId(this.conversationViewModel?.primaryMail._id, targetItem._id)) {
					this.createConversationViewModel({
						mail: targetItem,
						showFolder: false,
						loadLatestMail: this.groupMailsByConversation(),
					})
					this.mailOpenedListener.onEmailOpened(targetItem)
				}
			} else {
				this.clearConversationViewModel()
			}
		}
		this.updateUrl()
		this.updateUi()
	}

	private clearConversationViewModel() {
		this.conversationViewModel?.dispose()
		this.conversationViewModel = null
		this.mailFolderElementIdToSelectedMailId = mapWithout(this.mailFolderElementIdToSelectedMailId, getElementId(assertNotNull(this.getFolder())))
	}

	private updateUrl() {
		const folder = this._folder
		const folderId = folder ? getElementId(folder) : null
		// If we are loading towards an email, we want to keep it in the URL, otherwise we will reset it.
		// Otherwise, if we have a single selected email, then that should be in the URL.
		const mailId = this.loadingTargetId ?? (folderId ? this.getMailFolderToSelectedMail().get(folderId) : null)
		const stickyMail = this.stickyMailId

		if (mailId != null) {
			this.router.routeTo(
				"/mail/:folderId/:mailId",
				this.addStickyMailParam({
					folderId,
					mailId,
					mail: stickyMail,
				}),
			)
		} else {
			this.router.routeTo("/mail/:folderId", this.addStickyMailParam({ folderId: folderId ?? "" }))
		}
	}

	private addStickyMailParam(params: Record<string, unknown>): typeof params {
		if (this.stickyMailId) {
			params.mail = this.stickyMailId.join(",")
		}
		return params
	}

	private createConversationViewModel(viewModelParams: CreateMailViewerOptions) {
		this.conversationViewModel?.dispose()
		this.conversationViewModel = this.conversationViewModelFactory(viewModelParams)
	}

	public async reapplyInboxRulesForMails(actionableMails: Mail[], undoModel: UndoModel) {
		if (isEmpty(actionableMails)) {
			return
		}

		const currentFolder = this.getFolder()
		if (currentFolder == null) {
			return
		}

		const inboxRuleHandler = mailLocator.processInboxHandler()
		const mailboxDetails = await this.getMailboxDetails()
		const targetFolderIdToFolderMailMap = new Map<Id, { folder: MailSet; mails: Mail[] }>()

		// preload mailDetails, to cache in one request
		await mailLocator.bulkMailLoader.loadMailDetails(actionableMails)

		for (const mail of actionableMails) {
			const folder = await inboxRuleHandler.processInboxRulesOnly(mail, currentFolder, mailboxDetails)
			const folderId = getElementId(folder)
			if (!targetFolderIdToFolderMailMap.has(folderId)) {
				targetFolderIdToFolderMailMap.set(folderId, { folder, mails: [] })
			}
			targetFolderIdToFolderMailMap.get(folderId)!.mails.push(mail)
		}

		let movedMailIds: IdTuple[] = []
		for (const folderId of targetFolderIdToFolderMailMap.keys()) {
			let { folder: targetFolder, mails } = assertNotNull(targetFolderIdToFolderMailMap.get(folderId))
			if (isSameId(currentFolder._id, targetFolder._id)) {
				continue
			}

			const resolvedMails: readonly IdTuple[] = await this.getResolvedMails(mails)
			await moveMails({
				targetFolder,
				mailboxModel: locator.mailboxModel,
				mailModel: mailLocator.mailModel,
				mailIds: resolvedMails,
				moveMode: this.getMoveMode(currentFolder),
				undoModel,
				contactModel: mailLocator.contactModel,
			})
			movedMailIds.push(...resolvedMails)
		}

		return movedMailIds.flat()
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		// capturing the state so that if we switch mailSets, we won't run into race conditions
		const folder = this._folder
		const listModel = this.listModel

		if (!folder || !listModel) {
			return
		}

		let importMailStateUpdates: Array<EntityUpdateData<ImportMailState>> = []
		for (const update of updates) {
			if (update.operation === OperationType.CREATE) {
				if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
					importMailStateUpdates.push(update)
				}
			} else if (update.operation === OperationType.UPDATE) {
				if (isUpdateForTypeRef(MailTypeRef, update) && isSameId(this.stickyMailId, [update.instanceListId, update.instanceId])) {
					const mailId: IdTuple = [update.instanceListId, update.instanceId]
					const mail = await this.entityClient.load(MailTypeRef, mailId)
					const folderForMail = this.mailModel.getMailFolderForMail(mail)
					if (folderForMail && !this.didStickyMailChange(mailId, "after loading mail from cache on entity update")) {
						this.setListId(folderForMail)
					}
				} else if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
					importMailStateUpdates.push(update)
				}
			}

			await listModel.handleEntityUpdate(update)

			for (let importMailStateUpdate of importMailStateUpdates) {
				await this.processImportedMails(importMailStateUpdate)
			}
		}
	}

	private async processImportedMails(update: EntityUpdateData<ImportMailState>) {
		const importMailState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId])
		let status = parseInt(importMailState.status) as ImportStatus

		if (status === ImportStatus.Finished || status === ImportStatus.Canceled) {
			let importedFolder
			try {
				importedFolder = await this.entityClient.load(MailSetTypeRef, importMailState.targetFolder)
			} catch (e) {
				if (isExpectedErrorForSynchronization(e)) {
					// in case the import folder was deleted, we can return
					return Promise.resolve()
				}
				throw e
			}

			let importedMailEntries = await this.entityClient.loadAll(ImportedMailTypeRef, importMailState.importedMails)
			if (isEmpty(importedMailEntries)) {
				return Promise.resolve()
			}

			const mailSetEntryIds = importedMailEntries.map((importedMail) => elementIdPart(importedMail.mailSetEntry))
			const mailSetEntryListId = listIdPart(importedMailEntries[0].mailSetEntry)
			const importedMailSetEntries = await this.entityClient.loadMultiple(MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryIds)
			if (isEmpty(importedMailSetEntries)) {
				return Promise.resolve()
			}

			// put mails into the cache before the list model downloads them one by one
			await this.preloadMails(importedMailSetEntries)

			const listModelOfImport = assertNotNull(this._listModel)
			await promiseMap(importedMailSetEntries, (importedMailSetEntry) => {
				return listModelOfImport.handleEntityUpdate({
					instanceId: elementIdPart(importedMailSetEntry._id),
					instanceListId: importedFolder.entries as NonEmptyString,
					operation: OperationType.CREATE,
					typeRef: MailSetEntryTypeRef,
					instance: null,
					patches: null,
					prefetchStatus: PrefetchStatus.Prefetched,
				})
			})
		}
	}

	private async preloadMails(importedMailSetEntries: MailSetEntry[]) {
		const mailIds = importedMailSetEntries.map((mse) => mse.mail)
		const mailsByList = groupBy(mailIds, (m) => listIdPart(m))
		for (const [listId, mailIds] of mailsByList.entries()) {
			const mailElementIds = mailIds.map((m) => elementIdPart(m))
			await this.entityClient.loadMultiple(MailTypeRef, listId, mailElementIds)
		}
	}

	async switchToFolder(folderType: SystemFolderType): Promise<void> {
		const state = {}
		this.currentShowTargetMarker = state
		const mailboxDetail = assertNotNull(await this.getMailboxDetails())
		if (this.currentShowTargetMarker !== state) {
			return
		}
		if (mailboxDetail == null) {
			return
		}
		const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		if (this.currentShowTargetMarker !== state) {
			return
		}
		const folder = assertSystemFolderOfType(folders, folderType)
		await this.showMail(folder, this.mailFolderElementIdToSelectedMailId.get(getElementId(folder)))
	}

	async getMailboxDetails(): Promise<MailboxDetail> {
		const folder = this.getFolder()
		return await this.mailboxDetailForListWithFallback(folder)
	}

	async showingDraftsFolder(): Promise<boolean> {
		if (!this._folder) return false
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(this._folder)
		const selectedFolder = this.getFolder()
		if (selectedFolder && mailboxDetail) {
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
			return isOfTypeOrSubfolderOf(folders, selectedFolder, MailSetKind.DRAFT)
		} else {
			return false
		}
	}

	async showingTrashOrSpamFolder(): Promise<boolean> {
		const folder = this.getFolder()
		if (folder) {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			if (folder && mailboxDetail) {
				const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
				return isSpamOrTrashFolder(folders, folder)
			}
		}
		return false
	}

	private async mailboxDetailForListWithFallback(folder?: MailSet | null) {
		const mailboxDetailForListId = folder ? await this.mailModel.getMailboxDetailsForMailFolder(folder) : null
		return mailboxDetailForListId ?? (await this.mailboxModel.getUserMailboxDetails())
	}

	async finallyDeleteAllMailsInSelectedFolder(folder: MailSet): Promise<void> {
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.listModel?.selectNone()

		const mailboxDetail = await this.getMailboxDetails()

		// the request is handled a little differently if it is the system folder vs. a subfolder
		if (folder.folderType === MailSetKind.TRASH || folder.folderType === MailSetKind.SPAM) {
			return this.mailModel.clearFolder(folder).catch(
				ofClass(PreconditionFailedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			)
		} else {
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
			if (isSubfolderOfType(folders, folder, MailSetKind.TRASH) || isSubfolderOfType(folders, folder, MailSetKind.SPAM)) {
				return this.mailModel.finallyDeleteCustomMailFolder(folder).catch(
					ofClass(PreconditionFailedError, () => {
						throw new UserError("operationStillActive_msg")
					}),
				)
			} else {
				throw new ProgrammingError(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`)
			}
		}
	}

	onSingleSelection(mail: Mail) {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.onSingleSelection(mail)
	}

	areAllSelected(): boolean {
		return this.listModel?.areAllSelected() ?? false
	}

	selectNone(): void {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.selectNone()
	}

	selectAll(): void {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.selectAll()
	}

	onSingleInclusiveSelection(mail: Mail, clearSelectionOnMultiSelectStart?: boolean) {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.onSingleInclusiveSelection(mail, clearSelectionOnMultiSelectStart)
	}

	onRangeSelectionTowards(mail: Mail) {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.selectRangeTowards(mail)
	}

	selectPrevious(multiselect: boolean) {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.selectPrevious(multiselect)
	}

	selectNext(multiselect: boolean) {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.selectNext(multiselect)
	}

	onSingleExclusiveSelection(mail: Mail) {
		this.stickyMailId = null
		this.loadingTargetId = null
		this.listModel?.onSingleExclusiveSelection(mail)
	}

	async createLabel(mailbox: MailBox, labelData: { name: string; color: string }) {
		await this.mailModel.createLabel(assertNotNull(mailbox._ownerGroup), labelData)
	}

	async editLabel(label: MailSet, newData: { name: string; color: string }) {
		await this.mailModel.updateLabel(label, newData)
	}

	async deleteLabel(label: MailSet) {
		await this.mailModel.deleteLabel(label)
	}

	/**
	 * Returns true if mails should be grouped by conversation in the mail list based on user preference and a folder
	 * @param folder the folder to check or, by default, the current folder
	 */
	groupMailsByConversation(folder: MailSet | null = this._folder) {
		return this.mailModel.canUseConversationView() && listByConversationInFolder(this.conversationPrefProvider, folder)
	}

	getMoveMode(folder: MailSet): MoveMode {
		return this.groupMailsByConversation(folder) ? MoveMode.Conversation : MoveMode.Mails
	}
}

/**
 * @return true if mails should be grouped by conversation in the mail list based on user preference and a given {@param folder}
 */
export function listByConversationInFolder(conversationPrefProvider: ConversationPrefProvider, folder: MailSet | null): boolean {
	const onlySelectedMailInViewer = conversationPrefProvider.getConversationViewShowOnlySelectedMail()
	const prefersConversationInList = !onlySelectedMailInViewer && conversationPrefProvider.getMailListDisplayMode() === MailListDisplayMode.CONVERSATIONS

	if (folder != null) {
		return prefersConversationInList && !MAIL_LIST_FOLDERS.includes(folder.folderType as MailSetKind)
	} else {
		return prefersConversationInList
	}
}
