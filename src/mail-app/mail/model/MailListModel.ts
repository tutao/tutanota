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
import { assertNotNull, compare } from "@tutao/tutanota-utils"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import Stream from "mithril/stream"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { OperationType } from "../../../common/api/common/TutanotaConstants"

assertMainOrNode()

type LoadedMail = {
	mail: Mail
	mailSetEntry: MailSetEntry
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
	) {
		this.listModel = new ListModel({
			fetch: async (lastFetchedItem, count) => {
				const lastFetchedId = lastFetchedItem?.mailSetEntry?._id ?? [mailSet.entries, CUSTOM_MAX_ID]
				const items = await this.loadMails(lastFetchedId, count)
				return {
					items,
					complete: items.length < count,
				}
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
		return this.loadedMails().map((mail) => mail.mail)
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

	getMail(mailId: Id): Mail | null {
		return this.getLoadedMailByMailId(mailId)?.mail ?? null
	}

	getMailSetEntry(mailSetEntryId: Id): MailSetEntry | null {
		const { mailId } = deconstructMailSetEntryId(mailSetEntryId)
		return this.getLoadedMailByMailId(mailId)?.mailSetEntry ?? null
	}

	loadAndSelect(mailId: Id, shouldStop: () => boolean): Promise<LoadedMail | null> {
		return this.listModel.loadAndSelect(mailId, shouldStop)
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
			// In case labels change trigger a list redraw.
			// We need to do it because labels are passed out of band and are not part of the list state.
			this.reapplyFilter()
		} else if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(this.mailSet.entries, update.instanceListId)) {
			if (update.operation === OperationType.DELETE) {
				await this.listModel.deleteLoadedItem(update.instanceId)
			} else if (update.operation === OperationType.CREATE) {
				const loadedMail = await this.loadSingleMail([update.instanceListId, update.instanceId])
				await this.listModel.waitLoad(async () => {
					if (this.listModel.itemWithinLoadedRange(loadedMail)) {
						this.listModel.insertLoadedItem(loadedMail)
					}
				})
			}
		} else if (isUpdateForTypeRef(MailTypeRef, update)) {
			const mailItem = this.mailMap.get(update.instanceId)
			if (mailItem != null && update.operation === OperationType.UPDATE) {
				const newMailData = await this.entityClient.load(MailTypeRef, [update.instanceListId, update.instanceId])
				// Updating the mail in-place does not require waiting for the underlying list model to finish.
				// We use Object.assign here to ensure references to the mail now have the new mail data
				Object.assign(mailItem.mail, newMailData)
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

	reapplyFilter() {
		this.listModel.reapplyFilter()
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

	private getLoadedMailByMailInstance(mail: Mail): LoadedMail | null {
		return this.getLoadedMailByMailId(getElementId(mail))
	}

	private loadedMails(): readonly LoadedMail[] {
		return this.listModel.state.items
	}

	private async loadMails(id: IdTuple, count: number): Promise<LoadedMail[]> {
		const mailSetEntries = await this.entityClient.loadRange(MailSetEntryTypeRef, listIdPart(id), elementIdPart(id), count, true)
		if (mailSetEntries.length === 0) {
			return []
		}
		const entries = await this.resolveMultipleMailSetEntries(mailSetEntries)
		this.onLoadMails(entries)
		return entries
	}

	private async loadSingleMail(id: IdTuple): Promise<LoadedMail> {
		const mailSetEntry = await this.entityClient.load(MailSetEntryTypeRef, id)
		const mail = await this.entityClient.load(MailTypeRef, mailSetEntry.mail)
		const loadedMail = { mailSetEntry, mail }
		this.onLoadMails([loadedMail])
		return loadedMail
	}

	private async resolveMultipleMailSetEntries(mailSetEntries: MailSetEntry[]): Promise<LoadedMail[]> {
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
			const mails = await this.entityClient.loadMultiple(MailTypeRef, list, elements)
			for (const mail of mails) {
				allMails.set(getElementId(mail), mail)
			}
		}

		// Build our array
		const loadedMails: LoadedMail[] = []
		for (const mailSetEntry of mailSetEntries) {
			const mail = allMails.get(elementIdPart(mailSetEntry.mail))
			// Mail may have been deleted in the meantime
			if (mail) {
				loadedMails.push({ mailSetEntry, mail })
			}
		}

		return loadedMails
	}

	private onLoadMails(mails: LoadedMail[]) {
		for (const mail of mails) {
			this.mailMap.set(getElementId(mail.mail), mail)
		}
	}
}
