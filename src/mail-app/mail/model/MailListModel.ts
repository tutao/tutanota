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
import { assertNotNull, compare, promiseFilter } from "@tutao/tutanota-utils"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import Stream from "mithril/stream"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { MailSetKind, OperationType } from "../../../common/api/common/TutanotaConstants"
import { InboxRuleHandler } from "./InboxRuleHandler"
import { MailModel } from "./MailModel"
import { ListFetchResult } from "../../../common/gui/base/ListUtils"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { ExposedCacheStorage } from "../../../common/api/worker/rest/DefaultEntityRestCache"

assertMainOrNode()

/**
 * Internal representation of a loaded mail
 *
 * @VisibleForTesting
 */
export interface LoadedMail {
	readonly mail: Mail
	readonly mailSetEntry: MailSetEntry
	readonly labels: ReadonlyArray<MailFolder>
}

/**
 * Handles fetching and resolving mail set entries into mails as well as handling sorting.
 */
export class MailListModel {
	// Id = MailSetEntry element id
	private readonly listModel: ListModel<LoadedMail, Id>

	// keep a reverse map for going from Mail element id -> LoadedMail
	private readonly mailMap: Map<Id, LoadedMail> = new Map()

	constructor(
		private readonly mailSet: MailFolder,
		private readonly conversationPrefProvider: ConversationPrefProvider,
		private readonly entityClient: EntityClient,
		private readonly mailModel: MailModel,
		private readonly inboxRuleHandler: InboxRuleHandler,
		private readonly cacheStorage: ExposedCacheStorage,
	) {
		this.listModel = new ListModel({
			fetch: (lastFetchedItem, count) => {
				const lastFetchedId = lastFetchedItem?.mailSetEntry?._id ?? [mailSet.entries, CUSTOM_MAX_ID]
				return this.loadMails(lastFetchedId, count)
			},

			sortCompare: (item1, item2) => {
				// Mail set entry ID has the timestamp and mail element ID
				const item1Id = getElementId(item1.mailSetEntry)
				const item2Id = getElementId(item2.mailSetEntry)

				// Sort in reverse order to ensure newer mails are first
				return compare(customIdToUint8array(item2Id), customIdToUint8array(item1Id))
			},

			getItemId: (item) => getElementId(item.mailSetEntry),

			isSameId: (id1, id2) => id1 === id2,

			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior(),
		})
	}

	get items(): Mail[] {
		return this._loadedMails().map((mail) => mail.mail)
	}

	get loadingStatus(): ListLoadingState {
		return this.listModel.state.loadingStatus
	}

	get stateStream(): Stream<ListState<Mail>> {
		return this.listModel.stateStream.map((state) => {
			const items = state.items.map((item) => item.mail)
			const selectedItems: Set<Mail> = new Set()
			for (const item of state.selectedItems) {
				selectedItems.add(item.mail)
			}
			const newState: ListState<Mail> = {
				...state,
				items,
				selectedItems,
			}
			return newState
		})
	}

	isLoadingAll(): boolean {
		return this.listModel.state.loadingAll
	}

	isItemSelected(mailId: Id): boolean {
		const loadedMail = this.mailMap.get(mailId)
		if (loadedMail == null) {
			return false
		}
		return this.listModel.isItemSelected(getElementId(loadedMail.mailSetEntry))
	}

	getMail(mailElementId: Id): Mail | null {
		return this.getLoadedMailByMailId(mailElementId)?.mail ?? null
	}

	getLabelsForMail(mail: Mail): ReadonlyArray<MailFolder> {
		return this.getLoadedMailByMailInstance(mail)?.labels ?? []
	}

	getMailSetEntry(mailSetEntryId: Id): MailSetEntry | null {
		return this.getLoadedMailByMailSetId(mailSetEntryId)?.mailSetEntry ?? null
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

	getSelectedAsArray(): Array<Mail> {
		return this.listModel.getSelectedAsArray().map(({ mail }) => mail)
	}

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
				if (mail) {
					this.mailMap.delete(getElementId(mail.mail))
				}
				await this.listModel.deleteLoadedItem(update.instanceId)
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
			if (mailItem != null && update.operation === OperationType.UPDATE) {
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

	setFilter(filter: ListFilter<Mail> | null) {
		this.listModel.setFilter(filter && ((loadedMail: LoadedMail) => filter(loadedMail.mail)))
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

	/**
	 * Apply inbox rules to an array of mails, returning all mails that were not moved
	 */
	private async applyInboxRulesToEntries(entries: LoadedMail[]): Promise<LoadedMail[]> {
		if (this.mailSet.folderType !== MailSetKind.INBOX || entries.length === 0) {
			return entries
		}
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(this.mailSet)
		if (!mailboxDetail) {
			return entries
		}
		return await promiseFilter(entries, async (entry) => {
			const ruleApplied = await this.inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, entry.mail, true)
			return ruleApplied == null
		})
	}

	private async loadSingleMail(id: IdTuple): Promise<LoadedMail> {
		const mailSetEntry = await this.entityClient.load(MailSetEntryTypeRef, id)
		const loadedMails = await this.resolveMailSetEntries([mailSetEntry], this.defaultMailProvider)
		this.updateMailMap(loadedMails)
		return assertNotNull(loadedMails[0])
	}

	/**
	 * Loads all Mail instances for each MailSetEntry, returning a tuple of each
	 */
	private async resolveMailSetEntries(
		mailSetEntries: MailSetEntry[],
		mailProvider: (listId: Id, elementIds: Id[]) => Promise<Mail[]>,
	): Promise<LoadedMail[]> {
		// Sort all mails into mailbags so we can retrieve them with loadMultiple
		const mailListMap: Map<Id, Id[]> = new Map()
		for (const entry of mailSetEntries) {
			const mailBag = listIdPart(entry.mail)
			const mailElementId = elementIdPart(entry.mail)
			let mailIds = mailListMap.get(mailBag)
			if (!mailIds) {
				mailIds = []
				mailListMap.set(mailBag, mailIds)
			}
			mailIds.push(mailElementId)
		}

		// Retrieve all mails by mailbag
		const allMails: Map<Id, Mail> = new Map()
		for (const [list, elements] of mailListMap) {
			const mails = await mailProvider(list, elements)
			for (const mail of mails) {
				allMails.set(getElementId(mail), mail)
			}
		}

		// Build our array
		const loadedMails: LoadedMail[] = []
		for (const mailSetEntry of mailSetEntries) {
			const mail = allMails.get(elementIdPart(mailSetEntry.mail))

			// Mail may have been deleted in the meantime
			if (!mail) {
				continue
			}

			// Resolve labels
			const labels: MailFolder[] = this.mailModel.getLabelsForMail(mail)
			loadedMails.push({ mailSetEntry, mail, labels })
		}

		return loadedMails
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
}
