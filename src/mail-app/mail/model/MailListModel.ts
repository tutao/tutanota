import { ListFilter, ListModel } from "../../../common/misc/ListModel"
import { Mail, MailFolder, MailFolderTypeRef, MailSetEntry, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import {
	CUSTOM_MAX_ID,
	customIdToUint8array,
	deconstructMailSetEntryId,
	elementIdPart,
	getElementId,
	isSameId,
	listIdPart,
} from "../../../common/api/common/utils/EntityUtils"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { ConversationPrefProvider } from "../view/ConversationViewModel"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { assertNotNull, compare, first, last, memoizedWithHiddenArgument } from "@tutao/tutanota-utils"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import Stream from "mithril/stream"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { OperationType } from "../../../common/api/common/TutanotaConstants"
import { MailModel } from "./MailModel"
import { ListFetchResult } from "../../../common/gui/base/ListUtils"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { applyInboxRulesAndSpamPrediction, LoadedMail, MailSetListModel, resolveMailSetEntries } from "./MailSetListModel"
import { ProcessInboxHandler } from "./ProcessInboxHandler"

assertMainOrNode()

/**
 * Handles fetching and resolving mail set entries into mails as well as handling sorting.
 */
export class MailListModel implements MailSetListModel {
	// Id = MailSetEntry element id
	private readonly listModel: ListModel<LoadedMail, Id>

	// keep a reverse map for going from Mail element id -> LoadedMail
	private readonly mailMap: Map<Id, LoadedMail> = new Map()

	constructor(
		private readonly mailSet: MailFolder,
		private readonly conversationPrefProvider: ConversationPrefProvider,
		private readonly entityClient: EntityClient,
		private readonly mailModel: MailModel,
		private readonly processInboxHandler: ProcessInboxHandler,
		private readonly cacheStorage: ExposedCacheStorage,
	) {
		this.listModel = new ListModel({
			fetch: (lastFetchedItem, count) => {
				const lastFetchedId = lastFetchedItem?.mailSetEntryId ?? [mailSet.entries, CUSTOM_MAX_ID]
				return this.loadMails(lastFetchedId, count)
			},

			sortCompare: (item1, item2) => {
				// Mail set entry ID has the timestamp and mail element ID
				const item1Id = elementIdPart(item1.mailSetEntryId)
				const item2Id = elementIdPart(item2.mailSetEntryId)

				// Sort in reverse order to ensure newer mails are first
				return compare(customIdToUint8array(item2Id), customIdToUint8array(item1Id))
			},

			getItemId: (item) => elementIdPart(item.mailSetEntryId),

			isSameId: (id1, id2) => id1 === id2,

			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior(),
		})
	}

	get items(): ReadonlyArray<Mail> {
		return this._items()
	}

	get mails(): ReadonlyArray<Mail> {
		return this.items
	}

	get lastItem(): Mail | null {
		return last(this._loadedMails())?.mail ?? null
	}

	get loadingStatus(): ListLoadingState {
		return this.listModel.state.loadingStatus
	}

	get stateStream(): Stream<ListState<Mail>> {
		return this._stateStream()
	}

	private readonly _stateStream = memoizedWithHiddenArgument(
		() => this.listModel.stateStream,
		(stateStream) =>
			stateStream.map((state) => {
				const newState: ListState<Mail> = {
					...state,
					items: this.items,
					selectedItems: new Set(this.getSelectedAsArray()),
				}
				return newState
			}),
	)

	isLoadingAll(): boolean {
		return this.listModel.state.loadingAll
	}

	isItemSelected(mailId: Id): boolean {
		const loadedMail = this.mailMap.get(mailId)
		if (loadedMail == null) {
			return false
		}
		return this.listModel.isItemSelected(elementIdPart(loadedMail.mailSetEntryId))
	}

	getMail(mailElementId: Id): Mail | null {
		return this.getLoadedMailByMailId(mailElementId)?.mail ?? null
	}

	getLabelsForMail(mail: Mail): ReadonlyArray<MailFolder> {
		return this.getLoadedMailByMailInstance(mail)?.labels ?? []
	}

	async loadAndSelect(mailId: Id, shouldStop: () => boolean): Promise<Mail | null> {
		const mailFinder = (loadedMail: LoadedMail) => isSameId(getElementId(loadedMail.mail), mailId)
		const mail = await this.listModel.loadAndSelect(mailFinder, shouldStop)
		return mail?.mail ?? null
	}

	onSingleSelection(mail: Mail) {
		this.listModel.onSingleSelection(assertNotNull(this.getLoadedMailByMailInstance(mail)))
	}

	selectNone() {
		this.listModel.selectNone()
	}

	cancelLoadAll() {
		this.listModel.cancelLoadAll()
	}

	async loadInitial() {
		await this.listModel.loadInitial()
	}

	readonly getSelectedAsArray: () => readonly Mail[] = memoizedWithHiddenArgument(
		() => this.listModel.getSelectedAsArray(),
		(mails) => mails.map(({ mail }) => mail),
	)

	async handleEntityUpdate(update: EntityUpdateData) {
		if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
			// If a label is modified, we want to update all mails that reference it, which requires linearly iterating
			// through all mails. There are more efficient ways we could do this, such as by keeping track of each label
			// we've retrieved from the database and just update that, but we want to avoid adding more maps that we
			// have to maintain.
			if (update.operation === OperationType.UPDATE) {
				const mailSetId: IdTuple = [update.instanceListId, update.instanceId]
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
					this._updateSingleMail(newMailEntry)
				}
			}
		} else if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(this.mailSet.entries, update.instanceListId)) {
			// Adding/removing to this list (MailSetEntry doesn't have any fields to update, so we don't need to handle this)
			if (update.operation === OperationType.DELETE) {
				const mail = this.getLoadedMailByMailSetId(update.instanceId)
				await this.listModel.deleteLoadedItem(update.instanceId)
				if (mail) {
					this.mailMap.delete(getElementId(mail.mail))
				}
			} else if (update.operation === OperationType.CREATE) {
				const loadedMail = await this.loadSingleMail([update.instanceListId, update.instanceId])
				await this.listModel.waitLoad(async () => {
					if (this.listModel.canInsertItem(loadedMail)) {
						this.listModel.insertLoadedItem(loadedMail)
					}
				})
			}
		} else if (isUpdateForTypeRef(MailTypeRef, update)) {
			// We only need to handle updates for Mail.
			// Mail deletion will also be handled in MailSetEntry delete/create.
			const mailItem = this.mailMap.get(update.instanceId)
			if (mailItem != null && (update.operation === OperationType.UPDATE || update.operation === OperationType.CREATE)) {
				const newMailData = await this.entityClient.load(MailTypeRef, [update.instanceListId, update.instanceId])
				const labels = this.mailModel.getLabelsForMail(newMailData) // in case labels were added/removed
				const newMailItem = {
					...mailItem,
					labels,
					mail: newMailData,
				}
				this._updateSingleMail(newMailItem)
			}
		}
	}

	areAllSelected(): boolean {
		return this.listModel.areAllSelected()
	}

	selectAll() {
		this.listModel.selectAll()
	}

	onSingleInclusiveSelection(mail: Mail, clearSelectionOnMultiSelectStart?: boolean) {
		this.listModel.onSingleInclusiveSelection(assertNotNull(this.getLoadedMailByMailInstance(mail)), clearSelectionOnMultiSelectStart)
	}

	selectRangeTowards(mail: Mail) {
		this.listModel.selectRangeTowards(assertNotNull(this.getLoadedMailByMailInstance(mail)))
	}

	selectPrevious(multiselect: boolean) {
		this.listModel.selectPrevious(multiselect)
	}

	selectNext(multiselect: boolean) {
		this.listModel.selectNext(multiselect)
	}

	onSingleExclusiveSelection(mail: Mail) {
		this.listModel.onSingleExclusiveSelection(assertNotNull(this.getLoadedMailByMailInstance(mail)))
	}

	isInMultiselect(): boolean {
		return this.listModel.state.inMultiselect
	}

	enterMultiselect() {
		this.listModel.enterMultiselect()
	}

	async loadAll() {
		await this.listModel.loadAll()
	}

	setFilter(filterTypes: ReadonlyArray<ListFilter<Mail>>) {
		const filterFunction = (item: Mail) => {
			for (const filter of filterTypes) {
				if (!filter(item)) {
					return false
				}
			}
			return true
		}
		this.listModel.setFilter((loadedMail: LoadedMail) => filterFunction(loadedMail.mail))
	}

	isEmptyAndDone(): boolean {
		return this.listModel.isEmptyAndDone()
	}

	async loadMore() {
		await this.listModel.loadMore()
	}

	async retryLoading() {
		await this.listModel.retryLoading()
	}

	stopLoading() {
		this.listModel.stopLoading()
	}

	getDisplayedMail(): Mail | null {
		if (this.isInMultiselect()) {
			return null
		} else {
			return first(this.getSelectedAsArray())
		}
	}

	private getLoadedMailByMailId(mailId: Id): LoadedMail | null {
		return this.mailMap.get(mailId) ?? null
	}

	private getLoadedMailByMailSetId(mailId: Id): LoadedMail | null {
		return this.mailMap.get(deconstructMailSetEntryId(mailId).mailId) ?? null
	}

	private getLoadedMailByMailInstance(mail: Mail): LoadedMail | null {
		return this.getLoadedMailByMailId(getElementId(mail))
	}

	/**
	 * Load mails, applying inbox rules as needed
	 */
	private async loadMails(startingId: IdTuple, count: number): Promise<ListFetchResult<LoadedMail>> {
		let items: LoadedMail[] = []
		let complete = false

		try {
			const mailSetEntries = await this.entityClient.loadRange(MailSetEntryTypeRef, listIdPart(startingId), elementIdPart(startingId), count, true)

			// Check for completeness before loading/filtering mails, as we may end up with even fewer mails than retrieved in either case
			complete = mailSetEntries.length < count
			if (mailSetEntries.length > 0) {
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
					}
				}
			} else {
				throw e
			}
		}

		this.updateMailMap(items)
		return {
			items,
			complete,
		}
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

	private async applyInboxRulesAndSpamPrediction(entries: LoadedMail[]): Promise<LoadedMail[]> {
		return applyInboxRulesAndSpamPrediction(entries, this.mailSet, this.mailModel, this.processInboxHandler)
	}

	private async loadSingleMail(id: IdTuple): Promise<LoadedMail> {
		const mailSetEntry = await this.entityClient.load(MailSetEntryTypeRef, id)
		const loadedMails = await this.resolveMailSetEntries([mailSetEntry], this.defaultMailProvider)
		this.updateMailMap(loadedMails)
		return assertNotNull(loadedMails[0])
	}

	private async resolveMailSetEntries(
		mailSetEntries: MailSetEntry[],
		mailProvider: (listId: Id, elementIds: Id[]) => Promise<Mail[]>,
	): Promise<LoadedMail[]> {
		return resolveMailSetEntries(mailSetEntries, mailProvider, this.mailModel)
	}

	private updateMailMap(mails: LoadedMail[]) {
		for (const mail of mails) {
			this.mailMap.set(getElementId(mail.mail), mail)
		}
	}

	// @VisibleForTesting
	_updateSingleMail(mail: LoadedMail) {
		this.updateMailMap([mail])
		this.listModel.updateLoadedItem(mail)
	}

	// @VisibleForTesting
	_loadedMails(): readonly LoadedMail[] {
		return this.listModel.state.items
	}

	private readonly defaultMailProvider = (listId: Id, elements: Id[]): Promise<Mail[]> => {
		return this.entityClient.loadMultiple(MailTypeRef, listId, elements)
	}

	private readonly _items = memoizedWithHiddenArgument(
		() => this.listModel.state.items,
		(mails: ReadonlyArray<LoadedMail>) => mails.map((mail) => mail.mail),
	)
}
