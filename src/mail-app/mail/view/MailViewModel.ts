import { ListModel } from "../../../common/misc/ListModel.js"
import { MailboxDetail, MailModel } from "../../../common/mailFunctionality/MailModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { Mail, MailFolder, MailSetEntry, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	constructMailSetEntryId,
	CUSTOM_MAX_ID,
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	getElementId,
	isSameId,
	listIdPart,
	sortCompareByReverseId,
} from "../../../common/api/common/utils/EntityUtils.js"
import {
	assertNotNull,
	count,
	debounce,
	first,
	groupByAndMap,
	lastThrow,
	lazyMemoized,
	mapWith,
	mapWithout,
	memoized,
	ofClass,
	promiseFilter,
} from "@tutao/tutanota-utils"
import { ListState } from "../../../common/gui/base/List.js"
import { ConversationPrefProvider, ConversationViewModel, ConversationViewModelFactory } from "./ConversationViewModel.js"
import { CreateMailViewerOptions } from "./MailViewer.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { MailSetKind, OperationType } from "../../../common/api/common/TutanotaConstants.js"
import { WsConnectionState } from "../../../common/api/main/WorkerClient.js"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel.js"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache.js"
import { NotFoundError, PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import Stream from "mithril/stream"
import { InboxRuleHandler } from "../model/InboxRuleHandler.js"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { ListFetchResult } from "../../../common/gui/base/ListUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { assertSystemFolderOfType, getMailFilterForType, isOfTypeOrSubfolderOf, MailFilterType } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { isSpamOrTrashFolder, isSubfolderOfType } from "../../../common/api/common/CommonMailUtils.js"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient.js"

export interface MailOpenedListener {
	onEmailOpened(mail: Mail): unknown
}

/** sort mail set mails in descending order (**reversed**: newest to oldest) according to their receivedDate, not their elementId */
function sortCompareMailSetMails(firstMail: Mail, secondMail: Mail): number {
	const firstMailReceivedTimestamp = firstMail.receivedDate.getTime()
	const secondMailReceivedTimestamp = secondMail.receivedDate.getTime()
	if (firstMailReceivedTimestamp > secondMailReceivedTimestamp) {
		return -1
	} else if (secondMailReceivedTimestamp < firstMailReceivedTimestamp) {
		return 1
	} else {
		if (firstBiggerThanSecond(getElementId(firstMail), getElementId(secondMail))) {
			return -1
		} else if (firstBiggerThanSecond(getElementId(secondMail), getElementId(firstMail))) {
			return 1
		} else {
			return 0
		}
	}
}

const TAG = "MailVM"

/** ViewModel for the overall mail view. */
export class MailViewModel {
	private _folder: MailFolder | null = null
	/** id of the mail that was requested to be displayed, independent of the list state. */
	private stickyMailId: Id | null = null
	/**
	 * When the URL contains both folder id and mail id we will try to select that mail but we might need to load the list until we find it.
	 * This is that mail id that we are loading.
	 */
	private loadingTargetId: Id | null = null
	private conversationViewModel: ConversationViewModel | null = null
	private _filterType: MailFilterType | null = null

	/**
	 * We remember the last URL used for each folder so if we switch between folders we can keep the selected mail.
	 * There's a similar (but different) hacky mechanism where we store last URL but per each top-level view: navButtonRoutes. This one is per folder.
	 */
	private mailFolderElementIdToSelectedMailId: ReadonlyMap<Id, Id> = new Map()
	private listStreamSubscription: Stream<unknown> | null = null
	private conversationPref: boolean = false

	constructor(
		private readonly mailModel: MailModel,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly connectivityModel: WebsocketConnectivityModel,
		private readonly cacheStorage: ExposedCacheStorage,
		private readonly conversationViewModelFactory: ConversationViewModelFactory,
		private readonly mailOpenedListener: MailOpenedListener,
		private readonly conversationPrefProvider: ConversationPrefProvider,
		private readonly inboxRuleHandler: InboxRuleHandler,
		private readonly router: Router,
		private readonly updateUi: () => unknown,
	) {}

	get filterType(): MailFilterType | null {
		return this._filterType
	}

	setFilter(filter: MailFilterType | null) {
		this._filterType = filter
		this.listModel?.setFilter(getMailFilterForType(filter))
	}

	async showMailWithFolderId(folderId?: Id, mailId?: Id): Promise<void> {
		if (folderId) {
			const mailboxDetails = await this.mailModel.getMailboxDetails()
			const mailboxDetail: MailboxDetail | null = mailboxDetails.find((md) => md.folders.getFolderById(folderId)) ?? null
			const folder = mailboxDetail?.folders.getFolderById(folderId)
			return this.showMail(folder, mailId)
		} else {
			return this.showMail(null, mailId)
		}
	}

	async showStickyMail([listId, elementId]: IdTuple, onMissingExplicitMailTarget: () => unknown): Promise<void> {
		// If we are already displaying the requested email, do nothing
		if (this.conversationViewModel && isSameId(this.conversationViewModel.primaryMail._id, elementId)) {
			return
		}
		if (this.stickyMailId === elementId) {
			return
		}

		console.log(TAG, "Loading sticky mail", listId, elementId)
		this.stickyMailId = elementId

		// This should be very quick as we only wait for the cache,
		await this.loadExplicitMailTarget(listId, elementId, onMissingExplicitMailTarget)

		if (this.stickyMailId !== elementId) return

		// Make sure that we display *something* in the list, otherwise it'll be empty on mobile
		// We could try to open the location of the mail, but it might have been moved around soon after
		this.setListId(await this.getFolderForUserInbox())
	}

	private async showMail(folder?: MailFolder | null, mailId?: Id) {
		// an optimization to not open an email that we already display
		if (folder != null && mailId != null && this.conversationViewModel && isSameId(elementIdPart(this.conversationViewModel.primaryMail._id), mailId)) {
			return
		}
		// If we are already loading towards the email that is passed to us in the URL then we don't need to do anything. We already updated URL on the
		// previous call.
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

		// if the URL has changed then we probably want to reset the explicitly shown email
		this.stickyMailId = null

		const folderToUse = await this.selectFolderToUse(folder ?? null)
		// Selecting folder is async, check that the target hasn't changed inbetween
		if (this.loadingTargetId !== loadingTargetId) return

		// This will cause a URL update indirectly
		this.setListId(folderToUse)

		// If we have a mail that should be selected start loading towards it.
		// We already checked in the beginning that we are not loading to the same target. We set the loadingTarget early so there should be no races.
		if (loadingTargetId) {
			// Record the selected mail for the folder
			this.mailFolderElementIdToSelectedMailId = mapWith(this.mailFolderElementIdToSelectedMailId, getElementId(folderToUse), loadingTargetId)
			try {
				await this.loadAndSelectMail(folderToUse, loadingTargetId)
			} finally {
				// We either selected the mail and we don't need the target anymore or we didn't find it and we should remove the target
				this.loadingTargetId = null
			}
		} else {
			// update URL if the view was just opened without any url params
			// setListId might not have done it if the list didn't change for us internally but is changed for the view
			if (folder == null) this.updateUrl()
		}
	}

	private async selectFolderToUse(folderArgument: MailFolder | null): Promise<MailFolder> {
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
		const cached = await this.cacheStorage.get(MailTypeRef, listId, mailId)
		if (cached) {
			console.log(TAG, "opening cached mail", mailId)
			this.createConversationViewModel({ mail: cached, showFolder: false })
			this.listModel?.selectNone()
			this.updateUi()
		}

		if (this.stickyMailId !== mailId) {
			console.log(TAG, "target mail id changed 1", mailId, this.stickyMailId)
			return
		}

		let mail: Mail | null
		try {
			mail = await this.entityClient.load(MailTypeRef, [listId, mailId], { cacheMode: CacheMode.Bypass }).catch(ofClass(NotFoundError, () => null))
		} catch (e) {
			if (isOfflineError(e)) {
				return
			} else {
				throw e
			}
		}

		if (this.stickyMailId !== mailId) {
			console.log(TAG, "target mail id changed 2", mailId, this.stickyMailId)
			return
		}

		if (mail) {
			this.createConversationViewModel({ mail, showFolder: false })
			this.listModel?.selectNone()
			this.updateUi()
		} else {
			console.log(TAG, "Explicit mail target is not found", listId, mailId)
			onMissingTargetEmail()
			// We already know that email is not there, we can reset the target here and avoid list loading
			this.stickyMailId = null
			this.updateUrl()
		}
	}

	private async loadAndSelectMail(folder: MailFolder, mailId: Id) {
		const foundMail = await this.listModel?.loadAndSelect(
			mailId,
			() =>
				// if we changed the list, stop
				this.getFolder() !== folder ||
				// if listModel is gone for some reason, stop
				!this.listModel ||
				// if the target mail has changed, stop
				this.loadingTargetId !== mailId ||
				// if we loaded past the target item we won't find it, stop
				(this.listModel.state.items.length > 0 && firstBiggerThanSecond(mailId, getElementId(lastThrow(this.listModel.state.items)))),
		)
		if (foundMail == null) {
			console.log("did not find mail", folder, mailId)
		}
	}

	private async getFolderForUserInbox(): Promise<MailFolder> {
		const mailboxDetail = await this.mailModel.getUserMailboxDetails()
		return assertSystemFolderOfType(mailboxDetail.folders, MailSetKind.INBOX)
	}

	init() {
		this.singInit()
		const conversationEnabled = this.conversationPrefProvider.getConversationViewShowOnlySelectedMail()
		if (this.conversationViewModel && this.conversationPref !== conversationEnabled) {
			const mail = this.conversationViewModel.primaryMail
			this.createConversationViewModel({
				mail,
				showFolder: false,
				delayBodyRenderingUntil: Promise.resolve(),
			})
			this.mailOpenedListener.onEmailOpened(mail)
		}
		this.conversationPref = conversationEnabled
	}

	private readonly singInit = lazyMemoized(() => {
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates))
	})

	get listModel(): ListModel<Mail> | null {
		return this._folder ? this.listModelForFolder(getElementId(this._folder)) : null
	}

	getMailFolderToSelectedMail(): ReadonlyMap<Id, Id> {
		return this.mailFolderElementIdToSelectedMailId
	}

	getFolder(): MailFolder | null {
		return this._folder
	}

	private setListId(folder: MailFolder) {
		if (folder === this._folder) {
			return
		}
		// Cancel old load all
		this.listModel?.cancelLoadAll()
		this._filterType = null

		this._folder = folder
		this.listStreamSubscription?.end(true)
		this.listStreamSubscription = this.listModel!.stateStream.map((state) => this.onListStateChange(state))
		this.listModel!.loadInitial()
	}

	getConversationViewModel(): ConversationViewModel | null {
		return this.conversationViewModel
	}

	private listModelForFolder = memoized((_folderId: Id) => {
		return new ListModel<Mail>({
			fetch: async (lastFetchedMail, count) => {
				const folder = assertNotNull(this._folder)

				// in case the folder is a new MailSet folder we need to load via the MailSetEntry index indirection
				let startId: Id
				if (folder.isMailSet) {
					startId = lastFetchedMail == null ? CUSTOM_MAX_ID : constructMailSetEntryId(lastFetchedMail.receivedDate, getElementId(lastFetchedMail))
				} else {
					startId = lastFetchedMail == null ? GENERATED_MAX_ID : getElementId(lastFetchedMail)
				}

				const { complete, items } = await this.loadMailRange(folder, startId, count)
				if (complete) {
					this.fixCounterIfNeeded(folder, [])
				}
				return { complete, items }
			},
			loadSingle: async (listId: Id, elementId: Id): Promise<Mail | null> => {
				return this.entityClient.load(MailTypeRef, [listId, elementId])
			},
			sortCompare: (firstMail, secondMail): number =>
				assertNotNull(this._folder).isMailSet ? sortCompareMailSetMails(firstMail, secondMail) : sortCompareByReverseId(firstMail, secondMail),
			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior(),
		})
	})

	private fixCounterIfNeeded: (folder: MailFolder, itemsWhenCalled: ReadonlyArray<Mail>) => void = debounce(
		2000,
		async (folder: MailFolder, itemsWhenCalled: ReadonlyArray<Mail>) => {
			const ourFolder = this.getFolder()
			if (ourFolder == null || (this._filterType != null && this.filterType !== MailFilterType.Unread)) {
				return
			}

			// If folders are changed, list won't have the data we need.
			// Do not rely on counters if we are not connected
			if (!isSameId(getElementId(ourFolder), getElementId(folder)) || this.connectivityModel.wsConnection()() !== WsConnectionState.connected) {
				return
			}

			// If list was modified in the meantime, we cannot be sure that we will fix counters correctly (e.g. because of the inbox rules)
			if (this.listModel?.state.items !== itemsWhenCalled) {
				console.log(`list changed, trying again later`)
				return this.fixCounterIfNeeded(folder, this.listModel?.state.items ?? [])
			}

			const unreadMailsCount = count(this.listModel.state.items, (e) => e.unread)

			const counterValue = await this.mailModel.getCounterValue(folder)
			if (counterValue != null && counterValue !== unreadMailsCount) {
				console.log(`fixing up counter for folder ${folder._id}`)
				await this.mailModel.fixupCounterForFolder(folder, unreadMailsCount)
			} else {
				console.log(`same counter, no fixup on folder ${folder._id}`)
			}
		},
	)

	private onListStateChange(newState: ListState<Mail>) {
		// If we are showing sticky mail ignore the state changes from the list. We will reset the target on user selection, url changes and
		// entity events separately.
		const targetItem = this.stickyMailId
			? newState.items.find((item) => getElementId(item) === this.stickyMailId)
			: !newState.inMultiselect && newState.selectedItems.size === 1
			? first(this.listModel!.getSelectedAsArray())
			: null
		if (targetItem != null) {
			if (!this.conversationViewModel || !isSameId(this.conversationViewModel?.primaryMail._id, targetItem._id)) {
				this.mailFolderElementIdToSelectedMailId = mapWith(
					this.mailFolderElementIdToSelectedMailId,
					getElementId(assertNotNull(this.getFolder())),
					getElementId(targetItem),
				)

				this.createConversationViewModel({
					mail: targetItem,
					showFolder: false,
				})
				this.mailOpenedListener.onEmailOpened(targetItem)
			}
		} else {
			this.conversationViewModel?.dispose()
			this.conversationViewModel = null
			this.mailFolderElementIdToSelectedMailId = mapWithout(this.mailFolderElementIdToSelectedMailId, getElementId(assertNotNull(this.getFolder())))
		}
		this.updateUrl()
		this.updateUi()
	}

	private updateUrl() {
		const folder = this._folder
		const folderId = folder ? getElementId(folder) : null
		// If we are loading towards an email we want to keep it in the URL, otherwise we will reset it.
		// Otherwise, if we have a single selected email then that should be in the URL.
		const mailId = this.loadingTargetId ?? (folderId ? this.getMailFolderToSelectedMail().get(folderId) : null)
		const stickyMail = this.stickyMailId
		if (mailId != null) {
			this.router.routeTo("/mail/:folderId/:mailId", { folderId, mailId, mail: stickyMail })
		} else {
			this.router.routeTo("/mail/:folderId", { folderId: folderId ?? "", mail: stickyMail })
		}
	}

	private createConversationViewModel(viewModelParams: CreateMailViewerOptions) {
		this.conversationViewModel?.dispose()
		this.conversationViewModel = this.conversationViewModelFactory(viewModelParams)
	}

	private async entityEventsReceivedForLegacy(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailTypeRef, update) && update.instanceListId === this._folder?.mails) {
				if (update.instanceId === this.stickyMailId && update.operation === OperationType.DELETE) {
					// Reset target before we dispatch event to the list so that our handler in onListStateChange() has up-to-date state.
					this.stickyMailId = null
				}
				await this.listModel?.entityEventReceived(update.instanceListId, update.instanceId, update.operation)
			}
		}
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		const folder = this._folder
		const listModel = this.listModel

		if (!folder || !listModel) {
			return
		}
		if (!folder.isMailSet) {
			return this.entityEventsReceivedForLegacy(updates)
		}

		let mailEvent: EntityUpdateData | null = null
		let oldEntryEvent: EntityUpdateData | null = null
		let newEntryEvent: EntityUpdateData | null = null
		for (const event of updates) {
			if (isUpdateForTypeRef(MailTypeRef, event)) {
				mailEvent = event
			} else if (isUpdateForTypeRef(MailSetEntryTypeRef, event)) {
				if (event.operation == OperationType.DELETE) {
					oldEntryEvent = event
				} else {
					newEntryEvent = event
				}
			}
		}

		// Mail list only contains Mail's but the contents of the list depend on the MailSetEntry's. When MailSetEntry gets
		// created or deleted we need to dispatch a CREATE or DELETE event as if it happened for the Mail entity.
		if (mailEvent && newEntryEvent && isSameId(folder.entries, newEntryEvent.instanceListId)) {
			await listModel.entityEventReceived(mailEvent.instanceListId, mailEvent.instanceId, OperationType.CREATE)
		} else if (mailEvent && oldEntryEvent && isSameId(folder.entries, oldEntryEvent.instanceListId)) {
			// Reset target before we dispatch event to the list so that our handler in onListStateChange() has up-to-date state.
			if (mailEvent.instanceId === this.stickyMailId) {
				this.stickyMailId = null
			}
			await listModel.entityEventReceived(mailEvent.instanceListId, mailEvent.instanceId, OperationType.DELETE)
		} else if (mailEvent && !oldEntryEvent && !newEntryEvent) {
			// In case it is just a mail update then we need to update not the structure of the list but just one entry in it.
			// We download the email (it should already be downloaded by MailModel for inbox rules) and check if it's still in
			// our folder.
			// If it is, we dispatch the update event for the mail.
			const mail = await this.entityClient.load(MailTypeRef, [mailEvent.instanceListId, mailEvent.instanceId])
			if (mail.sets.some((id) => isSameId(elementIdPart(id), getElementId(folder)))) {
				await listModel.entityEventReceived(mailEvent.instanceListId, mailEvent.instanceId, mailEvent.operation)
			}
		}
	}

	private async loadMailRange(folder: MailFolder, start: Id, count: number): Promise<ListFetchResult<Mail>> {
		if (folder.isMailSet) {
			return await this.loadMailSetMailRange(folder, start, count)
		} else {
			return await this.loadLegacyMailRange(folder, start, count)
		}
	}

	private async loadMailSetMailRange(folder: MailFolder, startId: string, count: number): Promise<ListFetchResult<Mail>> {
		try {
			const loadMailSetEntries = () => this.entityClient.loadRange(MailSetEntryTypeRef, folder.entries, startId, count, true)
			const loadMails = (listId: Id, mailIds: Array<Id>) => this.entityClient.loadMultiple(MailTypeRef, listId, mailIds)

			const mails = await this.acquireMails(loadMailSetEntries, loadMails)
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			// For inbox rules there are two points where we might want to apply them. The first one is MailModel which applied inbox rules as they are received
			// in real time. The second one is here, when we load emails in inbox. If they are unread we want to apply inbox rules to them. If inbox rule
			// applies, the email is moved out of the inbox, and we don't return it here.
			if (mailboxDetail) {
				const mailsToKeepInInbox = await promiseFilter(mails, async (mail) => {
					const wasMatched = await this.inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)
					return !wasMatched
				})
				return { items: mailsToKeepInInbox, complete: mails.length < count }
			} else {
				return { items: mails, complete: mails.length < count }
			}
		} catch (e) {
			// The way the cache works is that it tries to fulfill the API contract of returning as many items as requested as long as it can.
			// This is problematic for offline where we might not have the full page of emails loaded (e.g. we delete part as it's too old, or we move emails
			// around). Because of that cache will try to load additional items from the server in order to return `count` items. If it fails to load them,
			// it will not return anything and instead will throw an error.
			// This is generally fine but in case of offline we want to display everything that we have cached. For that we fetch directly from the cache,
			// give it to the list and let list make another request (and almost certainly fail that request) to show a retry button. This way we both show
			// the items we have and also show that we couldn't load everything.
			if (isOfflineError(e)) {
				const loadMailSetEntries = () => this.cacheStorage.provideFromRange(MailSetEntryTypeRef, folder.entries, startId, count, true)
				const loadMails = (listId: Id, mailIds: Array<Id>) => this.cacheStorage.provideMultiple(MailTypeRef, listId, mailIds)
				const items = await this.acquireMails(loadMailSetEntries, loadMails)
				if (items.length === 0) throw e
				return { items, complete: false }
			} else {
				throw e
			}
		}
	}

	/**
	 * Load mails either from remote or from offline storage. Loader functions must be implemented for each use case.
	 */
	private async acquireMails(
		loadMailSetEntries: () => Promise<MailSetEntry[]>,
		loadMails: (listId: Id, mailIds: Array<Id>) => Promise<Mail[]>,
	): Promise<Array<Mail>> {
		const mailSetEntries = await loadMailSetEntries()
		const mailListIdToMailIds = groupByAndMap(
			mailSetEntries,
			(mse) => listIdPart(mse.mail),
			(mse) => elementIdPart(mse.mail),
		)
		const mails: Array<Mail> = []
		for (const [listId, mailIds] of mailListIdToMailIds) {
			mails.push(...(await loadMails(listId, mailIds)))
		}
		return mails
	}

	private async loadLegacyMailRange(folder: MailFolder, start: string, count: number): Promise<ListFetchResult<Mail>> {
		const listId = folder.mails
		try {
			const items = await this.entityClient.loadRange(MailTypeRef, listId, start, count, true)
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			// For inbox rules there are two points where we might want to apply them. The first one is MailModel which applied inbox rules as they are received
			// in real time. The second one is here, when we load emails in inbox. If they are unread we want to apply inbox rules to them. If inbox rule
			// applies, the email is moved out of the inbox, and we don't return it here.
			if (mailboxDetail) {
				const mailsToKeepInInbox = await promiseFilter(items, async (mail) => {
					const wasMatched = await this.inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)
					return !wasMatched
				})
				return { items: mailsToKeepInInbox, complete: items.length < count }
			} else {
				return { items, complete: items.length < count }
			}
		} catch (e) {
			// The way the cache works is that it tries to fulfill the API contract of returning as many items as requested as long as it can.
			// This is problematic for offline where we might not have the full page of emails loaded (e.g. we delete part as it's too old, or we move emails
			// around). Because of that cache will try to load additional items from the server in order to return `count` items. If it fails to load them,
			// it will not return anything and instead will throw an error.
			// This is generally fine but in case of offline we want to display everything that we have cached. For that we fetch directly from the cache,
			// give it to the list and let list make another request (and almost certainly fail that request) to show a retry button. This way we both show
			// the items we have and also show that we couldn't load everything.
			if (isOfflineError(e)) {
				const items = await this.cacheStorage.provideFromRange(MailTypeRef, listId, start, count, true)
				if (items.length === 0) throw e
				return { items, complete: false }
			} else {
				throw e
			}
		}
	}

	async switchToFolder(folderType: Omit<MailSetKind, MailSetKind.CUSTOM>): Promise<void> {
		const mailboxDetail = assertNotNull(await this.getMailboxDetails())
		const folder = assertSystemFolderOfType(mailboxDetail.folders, folderType)
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
			return isOfTypeOrSubfolderOf(mailboxDetail.folders, selectedFolder, MailSetKind.DRAFT)
		} else {
			return false
		}
	}

	async showingTrashOrSpamFolder(): Promise<boolean> {
		const folder = this.getFolder()
		if (!folder) {
			return false
		}
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
		return mailboxDetail != null && isSpamOrTrashFolder(mailboxDetail.folders, folder)
	}

	private async mailboxDetailForListWithFallback(folder?: MailFolder | null) {
		const mailboxDetailForListId = folder ? await this.mailModel.getMailboxDetailsForMailFolder(folder) : null
		return mailboxDetailForListId ?? (await this.mailModel.getUserMailboxDetails())
	}

	async finallyDeleteAllMailsInSelectedFolder(folder: MailFolder): Promise<void> {
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.listModel?.selectNone()

		const mailboxDetail = await this.getMailboxDetails()

		// the request is handled a little differently if it is the system folder vs a subfolder
		if (folder.folderType === MailSetKind.TRASH || folder.folderType === MailSetKind.SPAM) {
			return this.mailModel.clearFolder(folder).catch(
				ofClass(PreconditionFailedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			)
		} else if (isSubfolderOfType(mailboxDetail.folders, folder, MailSetKind.TRASH) || isSubfolderOfType(mailboxDetail.folders, folder, MailSetKind.SPAM)) {
			return this.mailModel.finallyDeleteCustomMailFolder(folder).catch(
				ofClass(PreconditionFailedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			)
		} else {
			throw new ProgrammingError(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`)
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
}
