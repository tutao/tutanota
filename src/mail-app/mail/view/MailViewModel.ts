import { ListModel } from "../../../common/misc/ListModel.js"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { Mail, MailFolder, MailSetEntry, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
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
import { PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import Stream from "mithril/stream"
import { InboxRuleHandler } from "../model/InboxRuleHandler.js"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { ListFetchResult } from "../../../common/gui/base/ListUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { getMailFilterForType, MailFilterType } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { assertSystemFolderOfType, isOfTypeOrSubfolderOf, isSpamOrTrashFolder, isSubfolderOfType, MailModel } from "../model/MailModel.js"

export interface MailOpenedListener {
	onEmailOpened(mail: Mail): unknown
}

/** ViewModel for the overall mail view. */
export class MailViewModel {
	private _folder: MailFolder | null = null
	/** id of the mail we are trying to load based on the URL */
	private targetMailId: Id | null = null
	/** needed to prevent parallel target loads*/
	private loadingToTargetId: Id | null = null
	private conversationViewModel: ConversationViewModel | null = null
	private _filterType: MailFilterType | null = null

	/**
	 * We remember the last URL used for each folder so if we switch between folders we can keep the selected mail.
	 * There's a similar (but different) hacky mechanism where we store last URL but per each top-level view: navButtonRoutes. This one is per folder.
	 */
	private mailFolderToSelectedMail: ReadonlyMap<MailFolder, Id> = new Map()
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
			for(const folders of Object.values(folderStructures)) {
				const folder = folders.getFolderById(folderId)
				if(folder) {
					return this.showMail(folder, mailId)
				}
			}
		}
		return this.showMail(null, mailId)
	}

	async showMail(folder?: MailFolder | null, mailId?: Id) {
		// an optimization to not open an email that we already display
		if (folder != null && mailId != null && this.conversationViewModel && isSameId(elementIdPart(this.conversationViewModel.primaryMail._id), mailId)) {
			return
		}

		// important to set it early enough because setting listId will trigger URL update.
		// if we don't set this one before setListId, url update will cause this function to be called again but without target mail and we will lose the
		// target URL
		this.targetMailId = typeof mailId === "string" ? mailId : null

		let folderToUse
		if (folder) {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			if (mailboxDetail) {
				folderToUse = folder
			} else {
				folderToUse = await this.getFolderForUserInbox()
			}
		} else {
			folderToUse = this._folder ?? (await this.getFolderForUserInbox())
		}

		await this.setListId(folderToUse)

		// if there is a target id and we are not loading for this id already then start loading towards that id
		if (this.targetMailId && this.targetMailId != this.loadingToTargetId) {
			this.mailFolderToSelectedMail = mapWith(this.mailFolderToSelectedMail, folderToUse, this.targetMailId)
			try {
				this.loadingToTargetId = this.targetMailId
				await this.loadAndSelectMail(folderToUse, this.targetMailId)
			} finally {
				this.loadingToTargetId = null
				this.targetMailId = null
			}
		} else {
			// update URL if the view was just opened without any url params
			// setListId might not have done it if the list didn't change for us internally but is changed for the view
			if (folder == null) this.updateUrl()
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
				this.targetMailId !== mailId ||
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

	getMailFolderToSelectedMail(): ReadonlyMap<MailFolder, Id> {
		return this.mailFolderToSelectedMail
	}

	getFolder(): MailFolder | null {
		return this._folder
	}

	private async setListId(folder: MailFolder) {
		if (folder === this._folder) {
			return
		}
		// Cancel old load all
		this.listModel?.cancelLoadAll()
		this._filterType = null

		this._folder = folder
		this.listStreamSubscription?.end(true)
		this.listStreamSubscription = this.listModel!.stateStream.map((state) => this.onListStateChange(state))
		await this.listModel!.loadInitial()
	}

	getConversationViewModel(): ConversationViewModel | null {
		return this.conversationViewModel
	}

	private listModelForFolder = memoized((folderId: Id) => {
		return new ListModel<Mail>({
			topId: GENERATED_MAX_ID,
			fetch: async (startId, count) => {
				const folder = assertNotNull(this._folder)
				const { complete, items } = await this.loadMailRange(folder, startId, count)
				if (complete) {
					this.fixCounterIfNeeded(folder, [])
				}
				return { complete, items }
			},
			loadSingle: (listId: Id, elementId: Id): Promise<Mail | null> => {
				return this.entityClient.load(MailTypeRef, [listId, elementId])
			},
			sortCompare: sortCompareByReverseId,
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
		if (!newState.inMultiselect && newState.selectedItems.size === 1) {
			const mail = this.listModel!.getSelectedAsArray()[0]
			if (!this.conversationViewModel || !isSameId(this.conversationViewModel?.primaryMail._id, mail._id)) {
				this.mailFolderToSelectedMail = mapWith(this.mailFolderToSelectedMail, assertNotNull(this.getFolder()), getElementId(mail))

				this.createConversationViewModel({
					mail,
					showFolder: false,
				})
				this.mailOpenedListener.onEmailOpened(mail)
			}
		} else {
			this.conversationViewModel?.dispose()
			this.conversationViewModel = null
			this.mailFolderToSelectedMail = mapWithout(this.mailFolderToSelectedMail, assertNotNull(this.getFolder()))
		}
		this.updateUrl()
		this.updateUi()
	}

	private updateUrl() {
		const folder = this._folder
		const folderId = folder ? getElementId(folder) : null
		const mailId = this.targetMailId ?? (folder ? this.getMailFolderToSelectedMail().get(folder) : null)
		if (mailId != null) {
			this.router.routeTo("/mail/:folderId/:mailId", { folderId, mailId })
		} else {
			this.router.routeTo("/mail/:folderId", { folderId: folderId ?? "" })
		}
	}

	private createConversationViewModel(viewModelParams: CreateMailViewerOptions) {
		this.conversationViewModel?.dispose()
		this.conversationViewModel = this.conversationViewModelFactory(viewModelParams)
	}

	async entityEventsReceivedForLegacy(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailTypeRef, update) && update.instanceListId === this._folder?.mails) {
				await this.listModel?.entityEventReceived(update.instanceListId, update.instanceId, update.operation)
			}
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		const folder = this._folder
		const listModel = this.listModel

		if (!folder || !listModel) {
			return
		}
		if (!folder.isMailSet) {
			return this.entityEventsReceivedForLegacy(updates)
		}

		let [mailEvent, oldEntryEvent, newEntryEvent]: EntityUpdateData[] = []
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

		if (isSameId(folder.entries, newEntryEvent?.instanceListId)) {
			await this.listModel?.entityEventReceived(mailEvent.instanceListId, mailEvent.instanceId, OperationType.CREATE)
		} else if (isSameId(folder.entries, oldEntryEvent?.instanceListId)) {
			await this.listModel?.entityEventReceived(mailEvent.instanceListId, mailEvent.instanceId, OperationType.DELETE)
		} else if (mailEvent && !oldEntryEvent && !newEntryEvent) {
			const mail = await this.entityClient.load(MailTypeRef, [mailEvent.instanceListId, mailEvent.instanceId])
			if (mail.sets.some((id) => isSameId(elementIdPart(id), getElementId(folder)))) {
				await this.listModel?.entityEventReceived(mailEvent.instanceListId, mailEvent.instanceId, mailEvent.operation)
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

	private async loadMailSetMailRange(folder: MailFolder, start: string, count: number) {
		try {
			const loadMailSetEntries = () => this.entityClient.loadRange(MailSetEntryTypeRef, folder.entries, start, count, true)
			const loadMails = (listId: Id, mailIds: Array<Id>) => this.entityClient.loadMultiple(MailTypeRef, listId, mailIds)

			const mails = await this.acquireMails(loadMailSetEntries, loadMails)
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			// For inbox rules there are two points where we might want to apply them. The first one is MailModel which applied inbox rules as they are received
			// in real time. The second one is here, when we load emails in inbox. If they are unread we want to apply inbox rules to them. If inbox rule
			// applies, the email is moved out of the inbox and we don't return it here.
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
			// This is problematic for offline where we might not have the full page of emails loaded (e.g. we delete part as it's too old or we move emails
			// around). Because of that cache will try to load additional items from the server in order to return `count` items. If it fails to load them,
			// it will not return anything and instead will throw an error.
			// This is generally fine but in case of offline we want to display everything that we have cached. For that we fetch directly from the cache,
			// give it to the list and let list make another request (and almost certainly fail that request) to show a retry button. This way we both show
			// the items we have and also show that we couldn't load everything.
			if (isOfflineError(e)) {
				const loadMailSetEntries = () => this.cacheStorage.provideFromRange(MailSetEntryTypeRef, folder.entries, start, count, true)
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
	private async acquireMails(loadMailSetEntries: () => Promise<MailSetEntry[]>, loadMails: (listId: Id, mailIds: Array<Id>) => Promise<Mail[]>) {
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
		mails.sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime())
		return mails
	}

	private async loadLegacyMailRange(folder: MailFolder, start: string, count: number) {
		const listId = folder.mails
		try {
			const items = await this.entityClient.loadRange(MailTypeRef, listId, start, count, true)
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder)
			// For inbox rules there are two points where we might want to apply them. The first one is MailModel which applied inbox rules as they are received
			// in real time. The second one is here, when we load emails in inbox. If they are unread we want to apply inbox rules to them. If inbox rule
			// applies, the email is moved out of the inbox and we don't return it here.
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
			// This is problematic for offline where we might not have the full page of emails loaded (e.g. we delete part as it's too old or we move emails
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
		await this.showMail(folder, this.mailFolderToSelectedMail.get(folder))
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
}
