import { ListModel } from "../../../common/misc/ListModel.js"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
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
	memoizedWithHiddenArgument,
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
import { NotAuthorizedError, NotFoundError, PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import Stream from "mithril/stream"
import { InboxRuleHandler } from "../model/InboxRuleHandler.js"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { ListFetchResult } from "../../../common/gui/base/ListUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { MailModel } from "../model/MailModel.js"
import { assertSystemFolderOfType } from "../model/MailUtils.js"
import { getMailFilterForType, MailFilterType } from "./MailViewerUtils.js"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient.js"
import { isOfTypeOrSubfolderOf, isSpamOrTrashFolder, isSubfolderOfType } from "../model/MailChecks.js"

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
	private stickyMailId: IdTuple | null = null
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
		private readonly mailboxModel: MailboxModel,
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

	/** Map from element id of MailSetEntry to an entry itself. Needed to react to entity updates. Reset on folder change. */
	private mailSetEntries: () => Map<Id, MailSetEntry> = memoizedWithHiddenArgument(
		() => this._folder?._id?.[1],
		() => new Map(),
	)

	get filterType(): MailFilterType | null {
		return this._filterType
	}

	setFilter(filter: MailFilterType | null) {
		this._filterType = filter
		this.listModel?.setFilter(getMailFilterForType(filter))
	}

	async showMailWithFolderId(folderId?: Id, mailId?: Id): Promise<void> {
		if (folderId) {
			const folderStructures = this.mailModel.folders()
			for (const folders of Object.values(folderStructures)) {
				const folder = folders.getFolderById(folderId)
				if (folder) {
					return this.showMail(folder, mailId)
				}
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

		if (!isSameId(this.stickyMailId, fullMailId)) return

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

		if (!isSameId(this.stickyMailId, [listId, mailId])) {
			console.log(TAG, "target mail id changed 1", mailId, this.stickyMailId)
			return
		}

		let mail: Mail | null
		try {
			mail = await this.entityClient.load(MailTypeRef, [listId, mailId], { cacheMode: CacheMode.Bypass })
		} catch (e) {
			if (isOfflineError(e)) {
				return
			} else if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
				mail = null
			} else {
				throw e
			}
		}

		if (!isSameId(this.stickyMailId, [listId, mailId])) {
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
		const mailboxDetail = await this.mailboxModel.getUserMailboxDetails()
		const folders = this.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
		return assertSystemFolderOfType(folders, MailSetKind.INBOX)
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
		// Capture state to avoid race conditions.
		// We need to populate mail set entries cache when loading mails so that we can react to updates later.
		const mailSetEntries = this.mailSetEntries()
		const folder = assertNotNull(this._folder)
		return new ListModel<Mail>({
			fetch: async (lastFetchedMail, count) => {
				// in case the folder is a new MailSet folder we need to load via the MailSetEntry index indirection
				let startId: Id
				if (folder.isMailSet) {
					startId = lastFetchedMail == null ? CUSTOM_MAX_ID : constructMailSetEntryId(lastFetchedMail.receivedDate, getElementId(lastFetchedMail))
				} else {
					startId = lastFetchedMail == null ? GENERATED_MAX_ID : getElementId(lastFetchedMail)
				}

				const { complete, items } = await this.loadMailRange(folder, startId, count, mailSetEntries)

				if (complete) {
					this.fixCounterIfNeeded(folder, [])
				}
				return { complete, items }
			},
			loadSingle: async (listId: Id, elementId: Id): Promise<Mail | null> => {
				// we already populate `mailSetEntries` in entity update handler so it's not necessary here
				return this.entityClient.load(MailTypeRef, [listId, elementId]).catch(
					ofClass(NotFoundError, () => {
						console.log(`Could not find updated mail ${JSON.stringify([listId, elementId])}`)
						return null
					}),
				)
			},
			sortCompare: folder.isMailSet ? sortCompareMailSetMails : sortCompareByReverseId,
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
			? newState.items.find((item) => isSameId(this.stickyMailId, item._id))
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
			this.router.routeTo("/mail/:folderId/:mailId", this.addStickyMailParam({ folderId, mailId, mail: stickyMail }))
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

	private async entityEventsReceivedForLegacy(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailTypeRef, update) && update.instanceListId === this._folder?.mails) {
				if (this.stickyMailId && update.instanceId === elementIdPart(this.stickyMailId) && update.operation === OperationType.DELETE) {
					// Reset target before we dispatch event to the list so that our handler in onListStateChange() has up-to-date state.
					this.stickyMailId = null
				}
				await this.listModel?.entityEventReceived(update.instanceListId, update.instanceId, update.operation)
			}
		}
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		// capturing the state so that if we switch folders we won't run into race conditions
		const folder = this._folder
		const listModel = this.listModel
		const mailSetEntries = this.mailSetEntries()

		if (!folder || !listModel) {
			return
		}
		if (!folder.isMailSet) {
			return this.entityEventsReceivedForLegacy(updates)
		}

		for (const update of updates) {
			if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(folder.entries, update.instanceListId)) {
				if (update.operation === OperationType.DELETE) {
					const mailId = mailSetEntries.get(update.instanceId)?.mail
					if (mailId) {
						// Reset target before we dispatch event to the list so that our handler in onListStateChange() has up-to-date state.
						if (this.stickyMailId && isSameId(mailId, this.stickyMailId)) {
							this.stickyMailId = null
						}
						mailSetEntries.delete(update.instanceId)
						await listModel.entityEventReceived(listIdPart(mailId), elementIdPart(mailId), OperationType.DELETE)
					}
				} else if (update.operation === OperationType.CREATE) {
					const setEntry = await this.entityClient.load(MailSetEntryTypeRef, [update.instanceListId, update.instanceId])
					mailSetEntries.set(update.instanceId, setEntry)
					await listModel.entityEventReceived(listIdPart(setEntry.mail), elementIdPart(setEntry.mail), OperationType.CREATE)
				}
			} else if (isUpdateForTypeRef(MailTypeRef, update) && OperationType.UPDATE) {
				const mailWasInThisFolder = listModel.state.items.some((item) => isSameId(item._id, [update.instanceListId, update.instanceId]))
				if (mailWasInThisFolder) {
					await listModel.entityEventReceived(update.instanceListId, update.instanceId, OperationType.UPDATE)
				}
			}
		}
	}

	private async loadMailRange(folder: MailFolder, start: Id, count: number, mailSetEntriesToPopulate: Map<Id, MailSetEntry>): Promise<ListFetchResult<Mail>> {
		if (folder.isMailSet) {
			return await this.loadMailSetMailRange(folder, start, count, mailSetEntriesToPopulate)
		} else {
			return await this.loadLegacyMailRange(folder, start, count)
		}
	}

	private async loadMailSetMailRange(
		folder: MailFolder,
		startId: string,
		count: number,
		mailSetEntriesToPopulate: Map<Id, MailSetEntry>,
	): Promise<ListFetchResult<Mail>> {
		try {
			const loadMailSetEntries = () => this.entityClient.loadRange(MailSetEntryTypeRef, folder.entries, startId, count, true)
			const loadMails = (listId: Id, mailIds: Array<Id>) => this.entityClient.loadMultiple(MailTypeRef, listId, mailIds)

			const { mails, mailIdToSetEntry } = await this.acquireMails(loadMailSetEntries, loadMails)
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			// For inbox rules there are two points where we might want to apply them. The first one is MailModel which applied inbox rules as they are received
			// in real time. The second one is here, when we load emails in inbox. If they are unread we want to apply inbox rules to them. If inbox rule
			// applies, the email is moved out of the inbox, and we don't return it here.
			let filteredMails: Mail[]
			if (mailboxDetail) {
				filteredMails = await promiseFilter(mails, async (mail) => {
					const wasMatched = await this.inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)
					return !wasMatched
				})
			} else {
				filteredMails = mails
			}
			for (const mail of filteredMails) {
				const entry = assertNotNull(mailIdToSetEntry.get(getElementId(mail)))
				mailSetEntriesToPopulate.set(getElementId(entry), entry)
			}
			// It should be enough to check whether we got back fewer emails than we requested, but it is possible that some of them got moved by inbox rules
			// while we've been loading them and they were removed from the cache so in the end the cache will give back fewer emails than we requested.
			//
			// A more reliable solution would be to figure out if the list is loaded completely in the cache (it already does this but does not propagate
			// this information).
			const complete = mails.length === 0
			if (complete) {
				console.log("MailVM", "loaded folder completely", folder._id, "mails", mails.length, "count", count)
			}
			return { items: filteredMails, complete: complete }
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
				const { mails, mailIdToSetEntry } = await this.acquireMails(loadMailSetEntries, loadMails)
				for (const mailSetEntry of mailIdToSetEntry.values()) {
					mailSetEntriesToPopulate.set(getElementId(mailSetEntry), mailSetEntry)
				}
				if (mails.length === 0) throw e
				return { items: mails, complete: false }
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
	): Promise<{ mails: Array<Mail>; mailIdToSetEntry: Map<Id, MailSetEntry> }> {
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
		const mailToSetEntries = new Map<Id, MailSetEntry>()
		for (const mailSetEntry of mailSetEntries) {
			mailToSetEntries.set(elementIdPart(mailSetEntry.mail), mailSetEntry)
		}
		return { mails, mailIdToSetEntry: mailToSetEntries }
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
		if (mailboxDetail == null || mailboxDetail.mailbox.folders == null) {
			return
		}
		const folders = this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
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
		if (selectedFolder && mailboxDetail && mailboxDetail.mailbox.folders) {
			const folders = this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
			return isOfTypeOrSubfolderOf(folders, selectedFolder, MailSetKind.DRAFT)
		} else {
			return false
		}
	}

	async showingTrashOrSpamFolder(): Promise<boolean> {
		const folder = this.getFolder()
		if (folder) {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			if (folder && mailboxDetail && mailboxDetail.mailbox.folders) {
				const folders = this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
				return isSpamOrTrashFolder(folders, folder)
			}
		}
		return false
	}

	private async mailboxDetailForListWithFallback(folder?: MailFolder | null) {
		const mailboxDetailForListId = folder ? await this.mailModel.getMailboxDetailsForMailFolder(folder) : null
		return mailboxDetailForListId ?? (await this.mailboxModel.getUserMailboxDetails())
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
		} else {
			const folders = this.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
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
}
