import { ListModel } from "../../../common/misc/ListModel.js"
import { MailboxDetail, MailModel } from "../../../common/mailFunctionality/MailModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { Mail, MailFolder, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { firstBiggerThanSecond, GENERATED_MAX_ID, getElementId, isSameId, sortCompareByReverseId } from "../../../common/api/common/utils/EntityUtils.js"
import { assertNotNull, count, debounce, lastThrow, lazyMemoized, mapWith, mapWithout, memoized, ofClass, promiseFilter } from "@tutao/tutanota-utils"
import { ListState } from "../../../common/gui/base/List.js"
import { ConversationPrefProvider, ConversationViewModel, ConversationViewModelFactory } from "./ConversationViewModel.js"
import { CreateMailViewerOptions } from "./MailViewer.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { MailFolderType } from "../../../common/api/common/TutanotaConstants.js"
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
import { assertSystemFolderOfType, getMailFilterForType, MailFilterType } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { isOfTypeOrSubfolderOf } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { isSpamOrTrashFolder, isSubfolderOfType } from "../../../common/api/common/CommonMailUtils.js"

export interface MailOpenedListener {
	onEmailOpened(mail: Mail): unknown
}

/** ViewModel for the overall mail view. */
export class MailViewModel {
	private _listId: Id | null = null
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
	private mailListToSelectedMail: ReadonlyMap<Id, Id> = new Map()
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

	async showMail(listId?: Id, mailId?: Id) {
		// an optimization to not open an email that we already display
		if (listId != null && mailId != null && this.conversationViewModel && isSameId(this.conversationViewModel.primaryMail._id, [listId, mailId])) {
			return
		}

		// important to set it early enough because setting listId will trigger URL update.
		// if we don't set this one before setListId, url update will cause this function to be called again but without target mail and we will lose the
		// target URL
		this.targetMailId = typeof mailId === "string" ? mailId : null

		let listIdToUse
		if (typeof listId === "string") {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailListId(listId)
			if (mailboxDetail) {
				listIdToUse = listId
			} else {
				listIdToUse = await this.getListIdForUserInbox()
			}
		} else {
			listIdToUse = this._listId ?? (await this.getListIdForUserInbox())
		}

		await this.setListId(listIdToUse)

		// if there is a target id and we are not loading for this id already then start loading towards that id
		if (this.targetMailId && this.targetMailId != this.loadingToTargetId) {
			this.mailListToSelectedMail = mapWith(this.mailListToSelectedMail, listIdToUse, this.targetMailId)
			try {
				this.loadingToTargetId = this.targetMailId
				await this.loadAndSelectMail([listIdToUse, this.targetMailId])
			} finally {
				this.loadingToTargetId = null
				this.targetMailId = null
			}
		} else {
			// update URL if the view was just opened without any url params
			// setListId might not have done it if the list didn't change for us internally but is changed for the view
			if (listId == null) this.updateUrl()
		}
	}

	private async loadAndSelectMail([listId, mailId]: IdTuple) {
		const foundMail = await this.listModel?.loadAndSelect(
			mailId,
			() =>
				// if we changed the list, stop
				this.getListId() !== listId ||
				// if listModel is gone for some reason, stop
				!this.listModel ||
				// if the target mail has changed, stop
				this.targetMailId !== mailId ||
				// if we loaded past the target item we won't find it, stop
				(this.listModel.state.items.length > 0 && firstBiggerThanSecond(mailId, getElementId(lastThrow(this.listModel.state.items)))),
		)
		if (foundMail == null) {
			console.log("did not find mail", listId, mailId)
		}
	}

	private async getListIdForUserInbox(): Promise<Id> {
		const mailboxDetail = await this.mailModel.getUserMailboxDetails()
		return assertSystemFolderOfType(mailboxDetail.folders, MailFolderType.INBOX).mails
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
		return this._listId ? this._listModel(this._listId) : null
	}

	getMailListToSelectedMail(): ReadonlyMap<Id, Id> {
		return this.mailListToSelectedMail
	}

	getListId(): Id | null {
		return this._listId
	}

	private async setListId(id: Id) {
		if (id === this._listId) {
			return
		}
		// Cancel old load all
		this.listModel?.cancelLoadAll()
		this._filterType = null

		this._listId = id
		this.listStreamSubscription?.end(true)
		this.listStreamSubscription = this.listModel!.stateStream.map((state) => this.onListStateChange(state))
		await this.listModel!.loadInitial()
	}

	getConversationViewModel(): ConversationViewModel | null {
		return this.conversationViewModel
	}

	private _listModel = memoized((listId: Id) => {
		return new ListModel<Mail>({
			topId: GENERATED_MAX_ID,
			fetch: async (startId, count) => {
				const { complete, items } = await this.loadMailRange(listId, startId, count)
				if (complete) {
					this.fixCounterIfNeeded(listId, [])
				}
				return { complete, items }
			},
			loadSingle: (elementId: Id): Promise<Mail | null> => this.entityClient.load(MailTypeRef, [listId, elementId]),
			sortCompare: sortCompareByReverseId,
			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior(),
		})
	})

	private fixCounterIfNeeded: (listId: Id, itemsWhenCalled: ReadonlyArray<Mail>) => void = debounce(
		2000,
		async (listId: Id, itemsWhenCalled: ReadonlyArray<Mail>) => {
			if (this._filterType != null && this.filterType !== MailFilterType.Unread) {
				return
			}

			// If folders are changed, list won't have the data we need.
			// Do not rely on counters if we are not connected
			if (this.getListId() !== listId || this.connectivityModel.wsConnection()() !== WsConnectionState.connected) {
				return
			}

			// If list was modified in the meantime, we cannot be sure that we will fix counters correctly (e.g. because of the inbox rules)
			if (this.listModel?.state.items !== itemsWhenCalled) {
				console.log(`list changed, trying again later`)
				return this.fixCounterIfNeeded(listId, this.listModel?.state.items ?? [])
			}

			const unreadMailsCount = count(this.listModel.state.items, (e) => e.unread)

			const counterValue = await this.mailModel.getCounterValue(listId)
			if (counterValue != null && counterValue !== unreadMailsCount) {
				console.log(`fixing up counter for list ${listId}`)
				await this.mailModel.fixupCounterForMailList(listId, unreadMailsCount)
			} else {
				console.log(`same counter, no fixup on list ${listId}`)
			}
		},
	)

	private onListStateChange(newState: ListState<Mail>) {
		if (!newState.inMultiselect && newState.selectedItems.size === 1) {
			const mail = this.listModel!.getSelectedAsArray()[0]
			if (!this.conversationViewModel || !isSameId(this.conversationViewModel?.primaryMail._id, mail._id)) {
				this.mailListToSelectedMail = mapWith(this.mailListToSelectedMail, assertNotNull(this.getListId()), getElementId(mail))

				this.createConversationViewModel({
					mail,
					showFolder: false,
				})
				this.mailOpenedListener.onEmailOpened(mail)
			}
		} else {
			this.conversationViewModel?.dispose()
			this.conversationViewModel = null
			this.mailListToSelectedMail = mapWithout(this.mailListToSelectedMail, assertNotNull(this.getListId()))
		}
		this.updateUrl()
		this.updateUi()
	}

	private updateUrl() {
		const listId = this._listId
		const mailId = this.targetMailId ?? (listId ? this.getMailListToSelectedMail().get(listId) : null)
		if (mailId != null) {
			this.router.routeTo("/mail/:listId/:mailId", { listId, mailId })
		} else {
			this.router.routeTo("/mail/:listId", { listId: listId ?? "" })
		}
	}

	private createConversationViewModel(viewModelParams: CreateMailViewerOptions) {
		this.conversationViewModel?.dispose()
		this.conversationViewModel = this.conversationViewModelFactory(viewModelParams)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailTypeRef, update) && update.instanceListId === this._listId) {
				await this.listModel?.entityEventReceived(update.instanceId, update.operation)
			}
		}
	}

	private async loadMailRange(listId: Id, start: Id, count: number): Promise<ListFetchResult<Mail>> {
		try {
			const items = await this.entityClient.loadRange(MailTypeRef, listId, start, count, true)
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailListId(listId)
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

	async switchToFolder(folderType: Omit<MailFolderType, MailFolderType.CUSTOM>): Promise<void> {
		const mailboxDetail = assertNotNull(await this.getMailboxDetails())
		const listId = assertSystemFolderOfType(mailboxDetail.folders, folderType).mails
		await this.showMail(listId, this.mailListToSelectedMail.get(listId))
	}

	async getMailboxDetails(): Promise<MailboxDetail> {
		const listId = this.getListId()
		return await this.mailboxDetailForListWithFallback(listId)
	}

	getSelectedFolder(): MailFolder | null {
		const listId = this.getListId()
		return listId ? this.mailModel.getMailFolder(listId) : null
	}

	async showingDraftsFolder(): Promise<boolean> {
		if (!this._listId) return false
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailListId(this._listId)
		const selectedFolder = this.getSelectedFolder()
		if (selectedFolder && mailboxDetail) {
			return isOfTypeOrSubfolderOf(mailboxDetail.folders, selectedFolder, MailFolderType.DRAFT)
		} else {
			return false
		}
	}

	async showingTrashOrSpamFolder(): Promise<boolean> {
		const listId = this._listId
		if (!listId) return false
		const folder = await this.mailModel.getMailFolder(listId)
		if (!folder) {
			return false
		}
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailListId(listId)
		return mailboxDetail != null && isSpamOrTrashFolder(mailboxDetail.folders, folder)
	}

	private async mailboxDetailForListWithFallback(listId?: string | null) {
		const mailboxDetailForListId = typeof listId === "string" ? await this.mailModel.getMailboxDetailsForMailListId(listId) : null
		return mailboxDetailForListId ?? (await this.mailModel.getUserMailboxDetails())
	}

	async finallyDeleteAllMailsInSelectedFolder(folder: MailFolder): Promise<void> {
		// remove any selection to avoid that the next mail is loaded and selected for each deleted mail event
		this.listModel?.selectNone()

		const mailboxDetail = await this.getMailboxDetails()

		// the request is handled a little differently if it is the system folder vs a subfolder
		if (folder.folderType === MailFolderType.TRASH || folder.folderType === MailFolderType.SPAM) {
			return this.mailModel.clearFolder(folder).catch(
				ofClass(PreconditionFailedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			)
		} else if (
			isSubfolderOfType(mailboxDetail.folders, folder, MailFolderType.TRASH) ||
			isSubfolderOfType(mailboxDetail.folders, folder, MailFolderType.SPAM)
		) {
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
