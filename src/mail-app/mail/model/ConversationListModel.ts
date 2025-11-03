import { applyInboxRulesAndSpamPrediction, LoadedMail, MailSetListModel, resolveMailSetEntries } from "./MailSetListModel"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import { Mail, MailFolder, MailFolderTypeRef, MailSetEntry, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { ListFilter, ListModel } from "../../../common/misc/ListModel"
import Stream from "mithril/stream"
import { ConversationPrefProvider } from "../view/ConversationViewModel"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { MailModel } from "./MailModel"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import {
	CUSTOM_MAX_ID,
	customIdToUint8array,
	deconstructMailSetEntryId,
	elementIdPart,
	getElementId,
	isSameId,
	listIdPart,
} from "../../../common/api/common/utils/EntityUtils"
import {
	assertNotNull,
	compare,
	findAllAndRemove,
	first,
	insertIntoSortedArray,
	isEmpty,
	isNotNull,
	last,
	lastThrow,
	mapWithout,
	memoizedWithHiddenArgument,
} from "@tutao/tutanota-utils"
import { ListFetchResult } from "../../../common/gui/base/ListUtils"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { OperationType } from "../../../common/api/common/TutanotaConstants"
import { ProcessInboxHandler } from "./ProcessInboxHandler"

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

	// keep a map for going from Mail element id -> conversation Id
	private mailToConversationMap: ReadonlyMap<Id, Id> = new Map()

	// keep the current filter
	private currentFilter: ListFilter<Mail> | null = null

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
		private readonly processInboxHandler: ProcessInboxHandler,
		private readonly cacheStorage: ExposedCacheStorage,
	) {
		this.listModel = new ListModel({
			fetch: async (_, count) => {
				const lastFetchedId = this.lastFetchedMailSetEntryId ?? CUSTOM_MAX_ID
				return this.loadMails([mailSet.entries, lastFetchedId], count)
			},

			sortCompare: (item1, item2) => this.reverseSortConversation(item1, item2),

			getItemId: (item) => item.conversationId,

			isSameId: (id1, id2) => id1 === id2,

			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior(),
		})

		// Filtering is handled on the conversation's side, as it has access to all of its mails. We just need to hide
		// conversations that are completely filtered out (i.e. no mail in it fits the filter)
		this.listModel.setFilter((conversation: LoadedConversation) => conversation.getMainMail() != null)
	}

	get lastItem(): Mail | null {
		return last(this.items) ?? null
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
		return this._getLoadedMail(getElementId(mail))?.labels ?? []
	}

	getMail(mailId: Id): Mail | null {
		return this._getLoadedMail(mailId)?.mail ?? null
	}

	readonly getSelectedAsArray: () => readonly Mail[] = memoizedWithHiddenArgument(
		() => this.listModel.getSelectedAsArray(),
		(conversations) => this.getDisplayedMailsOfConversations(conversations),
	)

	async handleEntityUpdate(update: EntityUpdateData) {
		if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
			if (update.operation === OperationType.UPDATE) {
				this.handleMailFolderUpdate([update.instanceListId, update.instanceId])
			}
		} else if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(this.mailSet.entries, update.instanceListId)) {
			if (update.operation === OperationType.DELETE) {
				await this.handleMailSetEntryDeletion(update)
			} else if (update.operation === OperationType.CREATE) {
				await this.handleMailSetEntryCreation([update.instanceListId, update.instanceId])
			}
		} else if (isUpdateForTypeRef(MailTypeRef, update)) {
			// We only need to handle updates for Mail.
			// Mail deletion will also be handled in MailSetEntry delete/create.
			const mailItem = this._getLoadedMail(update.instanceId)
			if (mailItem != null && (update.operation === OperationType.UPDATE || update.operation === OperationType.CREATE)) {
				await this.handleMailUpdate([update.instanceListId, update.instanceId], mailItem)
			}
		}
	}

	private handleMailFolderUpdate(mailSetId: IdTuple) {
		// If a label is modified, we want to update all mails that reference it, which requires linearly iterating
		// through all mails. There are more efficient ways we could do this, such as by keeping track of each label
		// we've retrieved from the database and just update that, but we want to avoid adding more maps that we
		// have to maintain.

		for (const conversation of this.conversationMap.values()) {
			for (const loadedMail of conversation.conversationMails) {
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
				conversation.insertOrUpdateMail(newMailEntry)
			}
			this.updateConversation(conversation)
		}
	}

	private async handleMailUpdate(mailId: IdTuple, mailItem: LoadedMail) {
		const newMailData = await this.entityClient.load(MailTypeRef, mailId)
		const conversation = this.getConversationForMail(newMailData)

		if (conversation != null) {
			const labels = this.mailModel.getLabelsForMail(newMailData) // in case labels were added/removed
			const loadedMail = {
				...mailItem,
				labels,
				mail: newMailData,
			}

			conversation.insertOrUpdateMail(loadedMail)
			this.updateConversation(conversation)
			this.reinitMailArrays() // break referential equality since mails was changed
		}
	}

	private async handleMailSetEntryCreation(mailSetEntryId: IdTuple) {
		const loadedMail = await this.loadSingleMail(mailSetEntryId)
		const addedMail = loadedMail.addedItems[0]
		return await this.listModel.waitLoad(async () => {
			if (addedMail != null) {
				if (!this.listModel.canInsertItem(addedMail)) {
					return
				}
				this.listModel.insertLoadedItem(addedMail)
			}
		})
	}

	private async handleMailSetEntryDeletion(update: EntityUpdateData) {
		const { mailId } = deconstructMailSetEntryId(update.instanceId)
		await this.deleteMailByMailElementId(mailId)
	}

	/**
	 * Remove a mail from its conversation entry.
	 *
	 * If the conversation is empty, this will also prune it.
	 * @private
	 */
	private async deleteMailByMailElementId(mailId: Id) {
		const conversation = this.getConversationForMailById(mailId)
		if (conversation == null) {
			return
		}

		this.deleteMailToConversationMapping(mailId)

		if (conversation.conversationMails.length === 1) {
			// It's the last mail in the conversation, so we will want to remove the conversation instead of the mail.
			// This is so we can still have sorting so the list model can determine what the next conversation is (for
			// the move mail behavior).
			this.conversationMap.delete(conversation.conversationId)
			await this.listModel.deleteLoadedItem(conversation.conversationId)
		} else {
			conversation.deleteMail(mailId)
			this.updateConversation(conversation)
		}
	}

	/**
	 * Map a mail. This should always be done last when adding a mail.
	 */
	private insertMailToConversationMappings(loadedMails: Iterable<LoadedMail>) {
		const newMap = new Map(this.mailToConversationMap)
		for (const mail of loadedMails) {
			newMap.set(getElementId(mail.mail), listIdPart(mail.mail.conversationEntry))
		}
		this.mailToConversationMap = newMap
	}

	/**
	 * Unmap a mail. This should always be done first when removing a mail.
	 */
	private deleteMailToConversationMapping(mailId: Id) {
		this.mailToConversationMap = mapWithout(this.mailToConversationMap, mailId)
	}

	private async loadSingleMail(id: IdTuple): Promise<{
		addedItems: LoadedConversation[]
	}> {
		const mailSetEntry = await this.entityClient.load(MailSetEntryTypeRef, id)
		const loadedMails = await this.resolveMailSetEntries([mailSetEntry], this.defaultMailProvider)
		return this._insertOrUpdateLoadedMails(loadedMails)
	}

	isEmptyAndDone(): boolean {
		return this.listModel.isEmptyAndDone()
	}

	isInMultiselect(): boolean {
		return this.listModel.state.inMultiselect
	}

	isItemSelected(mailId: Id): boolean {
		const conversation = this.getConversationForMailById(mailId)
		return conversation != null && this.listModel.isItemSelected(conversation.conversationId)
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

	async loadAndSelect(mailId: Id, shouldStop: () => boolean): Promise<Mail | null> {
		// If we already have it loaded, let's return it.
		const alreadyLoadedMail = this.getMail(mailId)
		if (alreadyLoadedMail != null) {
			return alreadyLoadedMail
		}

		// Conversation listing has a special case: we may want to select an item that isn't on the list but is part of
		// a conversation that is actually in the list.
		//
		// Essentially, we keep loading until that mail is loaded and manually select its conversation once it's found
		// rather than using loadAndSelect's return value.
		const stop = () => this.getMail(mailId) != null || shouldStop()
		await this.listModel.loadAndSelect(() => false, stop)

		const selectedMail = this.getMail(mailId)
		if (selectedMail != null) {
			const selectedMailId = getElementId(selectedMail)
			const conversation = assertNotNull(
				this.getConversationForMailById(selectedMailId),
				"somehow selecting a mail for a conversation that doesn't exist",
			)

			// The mail is not the latest in the conversation. This is a problem. To fix this, we use this fun override
			// variable so that the conversation can be selected, but then the mail we wanted is actually displayed.
			if (!isSameId(conversation.getMainMailId(), selectedMailId)) {
				this.olderDisplayedSelectedMailOverride = selectedMailId
			}

			// We aren't letting ListModel's loadAndSelect do the actual selection since the above case can happen, so
			// we'll just select it here (as this is what ListModel would have done if it found it)
			this.listModel.onSingleSelection(conversation)
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

	setFilter(filterTypes: ReadonlyArray<ListFilter<Mail>>): void {
		if (isEmpty(filterTypes)) {
			this.currentFilter = null
		} else {
			this.currentFilter = (item: Mail) => {
				for (const filter of filterTypes) {
					if (!filter(item)) {
						return false
					}
				}
				return true
			}
		}

		// statically apply the filter here, as we don't want to re-apply the filter on the same conversation multiple times (e.g. when sorting)
		// and we want to use this result for what mail we display
		for (const convo of this.conversationMap.values()) {
			convo.applyFilterToConversation(this.currentFilter)
		}

		// filtering can change sort order, since some conversations may move around due to their displayed emails changing receivedDate
		this.listModel.sort()
		this.listModel.reapplyFilter()
	}

	get stateStream(): Stream<ListState<Mail>> {
		return this._stateStream()
	}

	private readonly _stateStream = memoizedWithHiddenArgument(
		() => this.listModel.stateStream,
		(stateStream) =>
			stateStream.map((state) => {
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
			}),
	)

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

	private getConversationForMailById(mailId: Id): LoadedConversation | null {
		const conversationId = this.mailToConversationMap.get(mailId)
		if (conversationId == null) {
			return null
		}

		return assertNotNull(
			this.conversationMap.get(conversationId),

			// When adding a mail, mailToConversationMap is updated last, while when removing a mail, it is updated
			// first. As such, there is no condition where mailToConversationMap has a conversation conversationMap does
			// not.
			"mailToConversationMap contains a stale reference to a conversation that was deleted",
		)
	}

	private getConversationForMail(mail: Mail): LoadedConversation | null {
		return this.getConversationForMailById(getElementId(mail))
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
				items = await this.applyInboxRulesAndSpamPrediction(items)
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
					} else {
						// set the last
						this.lastFetchedMailSetEntryId = elementIdPart(lastThrow(items).mailSetEntryId)
					}
				}
			} else {
				throw e
			}
		}

		return {
			// there should be no deleted items since we're loading older mails
			items: this._insertOrUpdateLoadedMails(items)?.addedItems,
			complete,
		}
	}

	private async applyInboxRulesAndSpamPrediction(entries: LoadedMail[]): Promise<LoadedMail[]> {
		return applyInboxRulesAndSpamPrediction(entries, this.mailSet, this.mailModel, this.processInboxHandler)
	}

	// @VisibleForTesting
	_insertOrUpdateLoadedMails(mails: Iterable<LoadedMail>): {
		addedItems: LoadedConversation[]
	} {
		const addedItems: LoadedConversation[] = []

		for (const mail of mails) {
			const conversationId = listIdPart(mail.mail.conversationEntry)
			const existingConversation = this.conversationMap.get(conversationId)

			if (existingConversation == null) {
				const conversation = new LoadedConversation(conversationId)
				conversation.insertOrUpdateMail(mail)
				conversation.applyFilterToConversation(this.currentFilter)
				addedItems.push(conversation)
				this.conversationMap.set(conversationId, conversation)
			} else {
				existingConversation.insertOrUpdateMail(mail)
				this.updateConversation(existingConversation)
			}
		}
		this.insertMailToConversationMappings(mails)

		return { addedItems }
	}

	private async resolveMailSetEntries(
		mailSetEntries: MailSetEntry[],
		mailProvider: (listId: Id, elementIds: Id[]) => Promise<Mail[]>,
	): Promise<LoadedMail[]> {
		return resolveMailSetEntries(mailSetEntries, mailProvider, this.mailModel)
	}

	private reverseSortConversation(item1: LoadedConversation, item2: LoadedConversation): number {
		// Mail set entry ID has the timestamp and mail element ID
		const item1Id = item1.getMainMail()?.mailSetEntryId ?? null
		const item2Id = item2.getMainMail()?.mailSetEntryId ?? null

		// In the case one or both conversations have no displayed mail (due to being filtered out), we want it to be
		// treated by the list model as being on the top of the list so that it isn't considered when checking ranges
		// when adding new mails to the list.
		if (item1Id == null) {
			if (item2Id == null) {
				return 0
			} else {
				return 1
			}
		} else if (item2Id == null) {
			return -1
		}

		return reverseCompareMailSetId(elementIdPart(item1Id), elementIdPart(item2Id))
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

	private _items = this.initItemsArray()

	private _mails = this.initMailsArray()

	/**
	 * (Re)initialize the mails array
	 */
	private initMailsArray(): () => readonly Mail[] {
		this._mails = memoizedWithHiddenArgument(
			() => this.mailToConversationMap,
			(mailMap) =>
				Array.from(mailMap.keys()).map((mail) =>
					assertNotNull(
						this.getMail(mail),

						// When adding a mail, mailToConversationMap is updated last, while when removing a mail, it is updated
						// first. As such, there is no condition where getMail would fail.
						"broken mailMap reference",
					),
				),
		)
		return this._mails
	}

	/**
	 * (Re)initialize the items array
	 */
	private initItemsArray(): () => readonly Mail[] {
		this._items = memoizedWithHiddenArgument(
			() => this.listModel.state.items,
			(conversations) => this.getDisplayedMailsOfConversations(conversations),
		)
		return this._items
	}

	/**
	 * Reinit both mail arrays.
	 *
	 * This can be called manually to break any referential equality with an older array reference.
	 */
	private reinitMailArrays() {
		this.initMailsArray()
		this.initItemsArray()
	}

	private getDisplayedMailsOfConversations(conversations: readonly LoadedConversation[]): Mail[] {
		return conversations.map((conversation) => conversation.getMainMail()?.mail).filter(isNotNull)
	}

	/**
	 * Update the displayed mail for a conversation.
	 *
	 * If this changes the displayed mail, update it in the list model to force a UI update.
	 * @private
	 */
	private updateConversation(conversation: LoadedConversation) {
		if (conversation.updateMainMail()) {
			this.listModel.updateLoadedItem(conversation)
		}
	}

	// @VisibleForTesting
	_getConversationMap(): Map<Id, LoadedConversation> {
		return this.conversationMap
	}

	// @VisibleForTesting
	_getLoadedMail(mailId: Id): LoadedMail | null {
		const conversation = this.getConversationForMailById(mailId)
		if (conversation == null) {
			return null
		}
		return assertNotNull(
			conversation.getLoadedMail(mailId),

			// When adding a mail, mailToConversationMap is updated last, while when removing a mail, it is updated
			// first. As such, there is no condition where a conversation could be missing a mail.
			"tried getting a loaded mail in a conversation that did not have that mail",
		)
	}
}

function reverseCompareMailSetId(id1: Id, id2: Id): number {
	// Sort in reverse order to ensure newer mails are first
	return compare(customIdToUint8array(id2), customIdToUint8array(id1))
}

/**
 * @VisibleForTesting
 */
export class LoadedConversation {
	readonly conversationMails: LoadedMail[] = []

	// the mainMail is the mail this is shown in preview in the list, and is the mail shown when the list entry is clicked
	private mainMail: LoadedMail | null = null
	private listFilter: ListFilter<Mail> | null = null

	constructor(readonly conversationId: Id) {}

	/**
	 * Inserts or updates the mail in the conversation
	 *
	 * This does not update the displayed mail. To do that, you must call {@link updateMainMail} after adding mail(s).
	 */
	insertOrUpdateMail(mail: LoadedMail) {
		insertIntoSortedArray(
			mail,
			this.conversationMails,
			(a, b) => reverseCompareMailSetId(elementIdPart(a.mailSetEntryId), elementIdPart(b.mailSetEntryId)),
			() => true,
		)
	}

	/**
	 * Removes the mail from the conversation
	 * This does not update the main mail. To do that, you must call {@link updateMainMail} after adding mail(s).
	 *
	 * @param mailElementId mail to delete
	 */
	deleteMail(mailElementId: Id) {
		findAllAndRemove(this.conversationMails, (mail) => getElementId(mail.mail) === mailElementId)
	}

	/**
	 * Gets the mail from the conversation
	 *
	 * @param mailElementId mail to get
	 */
	getLoadedMail(mailElementId: Id): LoadedMail | null {
		return this.conversationMails.find((mail) => getElementId(mail.mail) === mailElementId) ?? null
	}

	/**
	 * Return `true` if the main mail has been replaced with a different mail or is the same mail but state has changed (i.e. read/unread)
	 */
	updateMainMail(): boolean {
		const oldMainMail = this.mainMail

		const filter = this.listFilter
		if (filter == null) {
			this.mainMail = first(this.conversationMails)
		} else {
			// The main mail is only changed to a different mail when the filter is first applied, see applyFilterToConversation
			// While the filter is still applied, we want to keep the same main mail (for example, in the case of
			// filtering for unread mails, if you read one of the mails you still want it to display and not disappear)
			this.mainMail = this.conversationMails.find((mail) => mail.mailSetEntryId[1] === oldMainMail?.mailSetEntryId[1]) ?? null
		}

		return oldMainMail !== this.mainMail
	}

	/**
	 * Updates listFilter and changes the main mail based on the filter
	 *
	 * The main mail needs to be changed so that it is the mail that is relevant to the filter.
	 * For example, if there is one unread mail in a long conversation and the filter is set to Unread,
	 * the main mail should be the unread mail
	 */
	applyFilterToConversation(filter: ListFilter<Mail> | null) {
		this.listFilter = filter

		if (filter) {
			this.mainMail = this.conversationMails.find((mail) => filter(mail.mail)) ?? null
		} else {
			this.updateMainMail()
		}
	}

	/**
	 * Get the main mail of the conversation
	 *
	 * This is the latest mail unless there is a filter applied.
	 */
	getMainMail(): LoadedMail | null {
		return this.mainMail
	}

	/**
	 * Return the element ID for the main mail of the conversation
	 *
	 * This is the latest mail unless there is a filter applied
	 */
	getMainMailId(): Id | null {
		const mail = this.getMainMail()?.mail
		return mail != null ? getElementId(mail) : null
	}
}
