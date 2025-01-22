import { applyInboxRulesToEntries, LoadedMail, MailSetListModel, resolveMailSetEntries } from "./MailSetListModel"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import { Mail, MailFolder, MailFolderTypeRef, MailSetEntry, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { ListFilter, ListModel } from "../../../common/misc/ListModel"
import Stream from "mithril/stream"
import { ConversationPrefProvider } from "../view/ConversationViewModel"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { MailModel } from "./MailModel"
import { InboxRuleHandler } from "./InboxRuleHandler"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import {
	CUSTOM_MAX_ID,
	customIdToUint8array,
	deconstructMailSetEntryId,
	elementIdPart,
	firstBiggerThanSecondCustomId,
	getElementId,
	isSameId,
	listIdPart,
} from "../../../common/api/common/utils/EntityUtils"
import { assertNotNull, compare, first, last, lastThrow, mapWithout, memoizedWithHiddenArgument, remove } from "@tutao/tutanota-utils"
import { ListFetchResult } from "../../../common/gui/base/ListUtils"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { OperationType } from "../../../common/api/common/TutanotaConstants"

/**
 * @VisibleForTesting
 */
export interface LoadedConversation {
	// list ID of the conversation
	readonly conversationId: Id

	// element ID of the latest MailSetEntry of the conversation
	readonly latestMail: Id
}

/**
 * Organizes mails into conversations and handles state upkeep.
 */
export class ConversationListModel implements MailSetListModel {
	// Id = MailSetEntry element id (of latest conversation entry element)
	// We want to use this as it ensures that conversations are still sorted in order of latest received email
	private readonly listModel: ListModel<LoadedConversation, Id>

	// Map conversation IDs (to ensure unique conversations)
	private readonly conversationMap: Map<Id, LoadedConversation> = new Map()

	// The last fetched mail set entry id; the list model does not track mailsets but conversations, thus we can't rely
	// on it to give us the oldest retrieved mail.
	private lastFetchedMailSetEntryId: Id | null = null

	// keep a reverse map for going from Mail element id -> LoadedMail
	private mailMap: ReadonlyMap<Id, LoadedMail> = new Map()

	// we may select a mail in a conversation that isn't the latest one (i.e. navigating to an older mail via URL); by
	// default, we would show the latest mail, but in this case, we will want to present the older mail
	//
	// this is cleared upon changing the selection
	private olderDisplayedSelectedMailOverride: Id | null = null

	constructor(
		private readonly mailSet: MailFolder,
		private readonly conversationPrefProvider: ConversationPrefProvider,
		private readonly entityClient: EntityClient,
		private readonly mailModel: MailModel,
		private readonly inboxRuleHandler: InboxRuleHandler,
		private readonly cacheStorage: ExposedCacheStorage,
	) {
		this.listModel = new ListModel({
			fetch: async (_, count) => {
				const lastFetchedId = this.lastFetchedMailSetEntryId ?? CUSTOM_MAX_ID
				return this.loadMails([mailSet.entries, lastFetchedId], count)
			},

			sortCompare: (item1, item2) => this.reverseSortConversation(item1, item2),

			getItemId: (item) => this.listModelIdOfConversation(item),

			isSameId: (id1, id2) => id1 === id2,

			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior(),
		})
	}

	get lastItem(): Mail | null {
		const lastItem = last(this.listModel.state.items) ?? null
		return lastItem ? this.getLatestMailForConversation(lastItem).mail : null
	}

	areAllSelected(): boolean {
		return this.listModel.areAllSelected()
	}

	cancelLoadAll(): void {
		this.listModel.cancelLoadAll()
	}

	enterMultiselect(): void {
		this.listModel.enterMultiselect()
	}

	getLabelsForMail(mail: Mail): ReadonlyArray<MailFolder> {
		return this.getLoadedMail(getElementId(mail))?.labels ?? []
	}

	getMail(mailId: Id): Mail | null {
		return this.getLoadedMail(mailId)?.mail ?? null
	}

	private getLoadedMail(mailId: Id): LoadedMail | null {
		return this.mailMap.get(mailId) ?? null
	}

	private getMailIdForConversation(conversation: LoadedConversation): Id {
		return deconstructMailSetEntryId(conversation.latestMail).mailId
	}

	private getLatestMailForConversation(conversation: LoadedConversation): LoadedMail {
		return assertNotNull(this.getLoadedMail(this.getMailIdForConversation(conversation)))
	}

	readonly getSelectedAsArray = memoizedWithHiddenArgument(
		() => this.listModel.getSelectedAsArray(),
		(conversations) => conversations.map((conversation) => this.getLatestMailForConversation(conversation).mail),
	)

	async handleEntityUpdate(update: EntityUpdateData) {
		if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
			if (update.operation === OperationType.UPDATE) {
				this.handleMailFolderUpdate(update)
			}
		} else if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(this.mailSet.entries, update.instanceListId)) {
			if (update.operation === OperationType.DELETE) {
				await this.handleMailSetEntryDeletion(update)
			} else if (update.operation === OperationType.CREATE) {
				await this.handleMailSetEntryCreation(update)
			}
		} else if (isUpdateForTypeRef(MailTypeRef, update)) {
			// We only need to handle updates for Mail.
			// Mail deletion will also be handled in MailSetEntry delete/create.
			const mailItem = this.mailMap.get(update.instanceId)
			if (mailItem != null && (update.operation === OperationType.UPDATE || update.operation === OperationType.CREATE)) {
				await this.handleMailUpdate(update, mailItem)
			}
		}
	}

	private handleMailFolderUpdate(update: EntityUpdateData) {
		// If a label is modified, we want to update all mails that reference it, which requires linearly iterating
		// through all mails. There are more efficient ways we could do this, such as by keeping track of each label
		// we've retrieved from the database and just update that, but we want to avoid adding more maps that we
		// have to maintain.
		const mailSetId: IdTuple = [update.instanceListId, update.instanceId]
		const mailsToUpdate: LoadedMail[] = []
		for (const loadedMail of this.mailMap.values()) {
			const hasMailSet = loadedMail.labels.some((label) => isSameId(mailSetId, label._id))
			if (!hasMailSet) {
				continue
			}
			// MailModel's entity event listener should have been fired first
			const labels = this.mailModel.getLabelsForMail(loadedMail.mail)
			const newMailEntry = {
				...loadedMail,
				labels,
			}
			mailsToUpdate.push(newMailEntry)
		}
		this._updateMails(mailsToUpdate)
	}

	private async handleMailUpdate(update: EntityUpdateData, mailItem: LoadedMail) {
		const newMailData = await this.entityClient.load(MailTypeRef, [update.instanceListId, update.instanceId])
		const labels = this.mailModel.getLabelsForMail(newMailData) // in case labels were added/removed
		const loadedMail = {
			...mailItem,
			labels,
			mail: newMailData,
		}
		this._updateMails([loadedMail])

		// force an update for the conversation
		const conversation = this.getConversationForMail(newMailData)
		if (conversation != null && this.getLatestMailForConversation(conversation) === loadedMail) {
			this.listModel.updateLoadedItem(conversation)
		}
	}

	private async handleMailSetEntryCreation(update: EntityUpdateData) {
		const loadedMail = await this.loadSingleMail([update.instanceListId, update.instanceId])
		const addedMail = loadedMail.addedItems[0]
		if (addedMail == null) {
			return
		}
		return await this.listModel.waitLoad(async () => {
			if (this.listModel.canInsertItem(addedMail)) {
				this.listModel.insertLoadedItem(addedMail)
			}
			for (const oldEntry of loadedMail.deletedItems) {
				const id = this.listModelIdOfConversation(oldEntry)
				const wasSelected = this.listModel.isItemSelected(id)
				const inMultiselect = this.isInMultiselect()
				const selection = this.listModel.getSelectedAsArray()

				// ensure the selection does not change
				if (wasSelected) {
					if (inMultiselect) {
						for (const s of selection) {
							if (this.listModelIdOfConversation(s) !== this.listModelIdOfConversation(oldEntry)) {
								this.listModel.onSingleInclusiveSelection(s)
							}
						}
						this.listModel.onSingleInclusiveSelection(addedMail)
					} else {
						this.listModel.onSingleSelection(addedMail)
					}
				}

				await this.listModel.deleteLoadedItem(id)
			}
		})
	}

	private async handleMailSetEntryDeletion(update: EntityUpdateData) {
		const { mailId } = deconstructMailSetEntryId(update.instanceId)
		const conversation = this.getConversationForMailById(mailId)
		if (!conversation) {
			return
		}

		await this.listModel.deleteLoadedItem(this.listModelIdOfConversation(conversation))
		this.deleteSingleMail(mailId)

		// The state changed in the meantime. We should not touch the conversation map.
		if (this.conversationMap.get(conversation.conversationId)?.latestMail != conversation.latestMail) {
			return
		}
		this.conversationMap.delete(conversation.conversationId)

		// If there is an earlier mail in the conversation that is in this mail set, we want it to take this one's place.
		let latestMail: LoadedMail | null = null
		for (const mail of this.mailMap.values()) {
			if (isSameId(listIdPart(mail.mail.conversationEntry), conversation.conversationId)) {
				if (latestMail == null || firstBiggerThanSecondCustomId(elementIdPart(mail.mailSetEntryId), elementIdPart(latestMail.mailSetEntryId))) {
					// Important: Map iterates in insertion order, which does not correspond to list sorting. As
					// such, we can't break here, as there may be even newer mails after this.
					latestMail = mail
				}
			}
		}

		if (latestMail) {
			const newConversation = {
				...conversation,
				latestMail: elementIdPart(latestMail.mailSetEntryId),
			}
			this.conversationMap.set(conversation.conversationId, newConversation)
			this.listModel.waitLoad(() => {
				if (this.conversationMap.get(conversation.conversationId) === newConversation && this.listModel.canInsertItem(newConversation)) {
					this.listModel.insertLoadedItem(newConversation)
				}
			})
		}
	}

	// @VisibleForTesting
	_updateMails(loadedMails: ReadonlyArray<LoadedMail>) {
		const newMap = new Map(this.mailMap)
		for (const mail of loadedMails) {
			newMap.set(getElementId(mail.mail), mail)
		}
		this.mailMap = newMap
	}

	// Evict a mail from the list cache.
	private deleteSingleMail(mailId: Id) {
		this.mailMap = mapWithout(this.mailMap, mailId)
	}

	private async loadSingleMail(id: IdTuple): Promise<{
		addedItems: LoadedConversation[]
		deletedItems: LoadedConversation[]
	}> {
		const mailSetEntry = await this.entityClient.load(MailSetEntryTypeRef, id)
		const loadedMails = await this.resolveMailSetEntries([mailSetEntry], this.defaultMailProvider)
		return this.filterAndUpdateMails(loadedMails)
	}

	isEmptyAndDone(): boolean {
		return this.listModel.isEmptyAndDone()
	}

	isInMultiselect(): boolean {
		return this.listModel.state.inMultiselect
	}

	isItemSelected(mailId: Id): boolean {
		const conversation = this.getConversationForMailById(mailId)
		return conversation != null && this.listModel.isItemSelected(this.listModelIdOfConversation(conversation))
	}

	isLoadingAll(): boolean {
		return this.listModel.state.loadingAll
	}

	get items(): ReadonlyArray<Mail> {
		return this._items()
	}

	get mails(): ReadonlyArray<Mail> {
		return this._mails()
	}

	async loadAll() {
		await this.listModel.loadAll()
	}

	async loadAndSelect(mailId: string, shouldStop: () => boolean): Promise<Mail | null> {
		const mailFinder = (loadedConversation: LoadedConversation) => isSameId(this.getMailIdForConversation(loadedConversation), mailId)

		// conversation listing has a special case: we may want to select an item that isn't on the list but is part of
		// a conversation that is actually in the list; as such, we should disregard what listModel says
		const stop = () => this.getMail(mailId) != null || shouldStop()
		await this.listModel.loadAndSelect(mailFinder, stop)

		const selectedMail = this.getMail(mailId)
		if (selectedMail != null) {
			const selectedMailId = getElementId(selectedMail)
			const conversation = assertNotNull(this.getConversationForMailById(selectedMailId))
			if (!isSameId(this.getMailIdForConversation(conversation), selectedMailId)) {
				this.olderDisplayedSelectedMailOverride = selectedMailId
				this.listModel.onSingleSelection(conversation)
			}
		}
		return selectedMail
	}

	async loadInitial() {
		return this.listModel.loadInitial()
	}

	async loadMore() {
		await this.listModel.loadMore()
	}

	get loadingStatus(): ListLoadingState {
		return this.listModel.state.loadingStatus
	}

	onSingleInclusiveSelection(mail: Mail, clearSelectionOnMultiSelectStart?: boolean): void {
		this.listModel.onSingleInclusiveSelection(assertNotNull(this.getConversationForMail(mail)), clearSelectionOnMultiSelectStart)
	}

	onSingleSelection(mail: Mail): void {
		this.listModel.onSingleSelection(assertNotNull(this.getConversationForMail(mail)))
	}

	async retryLoading() {
		await this.listModel.retryLoading()
	}

	selectAll(): void {
		this.listModel.selectAll()
	}

	selectNext(multiSelect: boolean): void {
		this.listModel.selectNext(multiSelect)
	}

	selectNone(): void {
		this.listModel.selectNone()
	}

	selectPrevious(multiSelect: boolean): void {
		this.listModel.selectPrevious(multiSelect)
	}

	selectRangeTowards(mail: Mail): void {
		this.listModel.selectRangeTowards(assertNotNull(this.getConversationForMail(mail)))
	}

	setFilter(filterType: ListFilter<Mail> | null): void {
		this.listModel.setFilter(filterType && ((conversation: LoadedConversation) => filterType(this.getLatestMailForConversation(conversation).mail)))
	}

	get stateStream(): Stream<ListState<Mail>> {
		return this.listModel.stateStream.map((state) => {
			if (this.olderDisplayedSelectedMailOverride) {
				const olderMail = this.getMail(this.olderDisplayedSelectedMailOverride)
				if (
					olderMail == null ||
					state.selectedItems.size !== 1 ||
					state.inMultiselect ||
					[...state.selectedItems][0].conversationId !== listIdPart(olderMail.conversationEntry)
				) {
					this.olderDisplayedSelectedMailOverride = null
				}
			}
			const newState: ListState<Mail> = {
				...state,
				items: this.items,
				selectedItems: new Set(this.getSelectedAsArray()),
			}
			return newState
		})
	}

	stopLoading(): void {
		this.listModel.stopLoading()
	}

	onSingleExclusiveSelection(mail: Mail): void {
		this.listModel.onSingleExclusiveSelection(assertNotNull(this.getConversationForMail(mail)))
	}

	getDisplayedMail(): Mail | null {
		if (this.olderDisplayedSelectedMailOverride != null) {
			return this.getMail(this.olderDisplayedSelectedMailOverride)
		} else if (this.isInMultiselect()) {
			return null
		} else {
			return first(this.getSelectedAsArray())
		}
	}

	/**
	 * Gets the conversation if this mail is the latest of that conversation.
	 *
	 * Note: We do not care about older mails in the conversation - only the mail that is going to be shown in the list.
	 */
	private getConversationForMailById(mailId: Id): LoadedConversation | null {
		const mail = this.mailMap.get(mailId)
		if (mail == null) {
			return null
		}
		return this.conversationMap.get(listIdPart(mail.mail.conversationEntry)) ?? null
	}

	private getConversationForMail(mail: Mail): LoadedConversation | null {
		return this.getConversationForMailById(getElementId(mail))
	}

	/**
	 * This is the list model ID in the conversation.
	 */
	private listModelIdOfConversation(item: LoadedConversation): Id {
		return item.latestMail
	}

	/**
	 * Load mails, applying inbox rules as needed
	 */
	private async loadMails(startingId: IdTuple, count: number): Promise<ListFetchResult<LoadedConversation>> {
		let items: LoadedMail[] = []
		let complete = false

		try {
			const mailSetEntries = await this.entityClient.loadRange(MailSetEntryTypeRef, listIdPart(startingId), elementIdPart(startingId), count, true)

			// Check for completeness before loading/filtering mails, as we may end up with even fewer mails than retrieved in either case
			complete = mailSetEntries.length < count
			if (mailSetEntries.length > 0) {
				this.lastFetchedMailSetEntryId = getElementId(lastThrow(mailSetEntries))
				items = await this.resolveMailSetEntries(mailSetEntries, this.defaultMailProvider)
				items = await this.applyInboxRulesToEntries(items)
			}
		} catch (e) {
			if (isOfflineError(e)) {
				// Attempt loading from the cache if we failed to get mails and/or mailset entries
				// Note that we may have items if it was just inbox rules that failed
				if (items.length === 0) {
					// Set the request as incomplete so that we make another request later (see `loadMailsFromCache` comment)
					complete = false
					items = await this.loadMailsFromCache(startingId, count)
					if (items.length === 0) {
						throw e // we couldn't get anything from the cache!
					}
				}
			} else {
				throw e
			}
		}

		return {
			// there should be no deleted items since we're loading older mails
			items: this.filterAndUpdateMails(items)?.addedItems,
			complete,
		}
	}

	private async applyInboxRulesToEntries(entries: LoadedMail[]): Promise<LoadedMail[]> {
		return applyInboxRulesToEntries(entries, this.mailSet, this.mailModel, this.inboxRuleHandler)
	}

	private filterAndUpdateMails(mails: LoadedMail[]): {
		addedItems: LoadedConversation[]
		deletedItems: LoadedConversation[]
	} {
		const addedItems: LoadedConversation[] = []
		const deletedItems: LoadedConversation[] = []

		// store all mails to be loaded later
		this._updateMails(mails)

		for (const mail of mails) {
			const conversation = {
				conversationId: listIdPart(mail.mail.conversationEntry),
				latestMail: elementIdPart(mail.mailSetEntryId),
			}

			const existingConversation = this.conversationMap.get(conversation.conversationId)
			if (existingConversation != null && this.reverseSortConversation(conversation, existingConversation) >= 0) {
				continue
			}

			if (existingConversation != null) {
				deletedItems.push(existingConversation)
				remove(addedItems, existingConversation)
			}

			this.conversationMap.set(conversation.conversationId, conversation)
			addedItems.push(conversation)
		}

		return { addedItems, deletedItems }
	}

	private async resolveMailSetEntries(
		mailSetEntries: MailSetEntry[],
		mailProvider: (listId: Id, elementIds: Id[]) => Promise<Mail[]>,
	): Promise<LoadedMail[]> {
		return resolveMailSetEntries(mailSetEntries, mailProvider, this.mailModel)
	}

	private reverseSortConversation(item1: LoadedConversation, item2: LoadedConversation): number {
		// Mail set entry ID has the timestamp and mail element ID
		const item1Id = this.listModelIdOfConversation(item1)
		const item2Id = this.listModelIdOfConversation(item2)

		// Sort in reverse order to ensure newer mails are first
		return compare(customIdToUint8array(item2Id), customIdToUint8array(item1Id))
	}

	/**
	 * Load mails from the cache rather than remotely
	 */
	private async loadMailsFromCache(startId: IdTuple, count: number): Promise<LoadedMail[]> {
		// The way the cache works is that it tries to fulfill the API contract of returning as many items as requested as long as it can.
		// This is problematic for offline where we might not have the full page of emails loaded (e.g. we delete part as it's too old, or we move emails
		// around). Because of that cache will try to load additional items from the server in order to return `count` items. If it fails to load them,
		// it will not return anything and instead will throw an error.
		// This is generally fine but in case of offline we want to display everything that we have cached. For that we fetch directly from the cache,
		// give it to the list and let list make another request (and almost certainly fail that request) to show a retry button. This way we both show
		// the items we have and also show that we couldn't load everything.
		const mailSetEntries = await this.cacheStorage.provideFromRange(MailSetEntryTypeRef, listIdPart(startId), elementIdPart(startId), count, true)
		return await this.resolveMailSetEntries(mailSetEntries, (list, elements) => this.cacheStorage.provideMultiple(MailTypeRef, list, elements))
	}

	private readonly defaultMailProvider = (listId: Id, elements: Id[]): Promise<Mail[]> => {
		return this.entityClient.loadMultiple(MailTypeRef, listId, elements)
	}

	private readonly _items = memoizedWithHiddenArgument(
		() => this.listModel.state.items,
		(conversations) => conversations.map((conversation) => this.getLatestMailForConversation(conversation).mail),
	)

	private _mails = memoizedWithHiddenArgument(
		() => this.mailMap,
		(mailMap) => Array.from(mailMap.values()).map(({ mail }) => mail),
	)

	// @VisibleForTesting
	_getMailMap(): ReadonlyMap<Id, LoadedMail> {
		return this.mailMap
	}
}
