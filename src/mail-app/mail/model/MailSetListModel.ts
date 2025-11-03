import { Mail, MailFolder, MailSetEntry } from "../../../common/api/entities/tutanota/TypeRefs"
import { ListFilter } from "../../../common/misc/ListModel"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import Stream from "mithril/stream"
import { MailModel } from "./MailModel"
import { elementIdPart, getElementId, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { groupByAndMap, isEmpty, promiseFilter } from "@tutao/tutanota-utils"
import { ProcessInboxHandler } from "./ProcessInboxHandler"

/**
 * Interface for retrieving and listing mails
 */
export interface MailSetListModel {
	/**
	 * Get all Mail instances displayed in the list model.
	 *
	 * This list is sorted by MailSetEntry ID.
	 *
	 * Depending on implementation, this may or may not be the same thing as calling `this.mails` and may even return
	 * the exact same array. However, this behavior should not be relied upon. You should only call this method if you
	 * want all *displayed* mails, where `this.mails` should be used for getting all loaded mails regardless of if they
	 * are displayed.
	 *
	 * If the items have not changed, then subsequent calls will return the same array instance.
	 */
	get items(): ReadonlyArray<Mail>

	/**
	 * @return the oldest mail displayed in the list model
	 */
	get lastItem(): Mail | null

	/**
	 * Get all loaded Mail instances.
	 *
	 * Unlike `items`, the ordering of the array is implementation-defined and should not be relied upon.
	 *
	 * Additionally, it may return more unique Mail instances than what is actually listed (but never less).
	 *
	 * See the `items` getter for the difference between `mails` and `items`.
	 *
	 * If the items have not changed, then subsequent calls will return the same array instance.
	 */
	get mails(): ReadonlyArray<Mail>

	/**
	 * @return a state stream for subscribing to list updates
	 */
	get stateStream(): Stream<ListState<Mail>>

	/**
	 * @return the current loading state
	 */
	get loadingStatus(): ListLoadingState

	/**
	 * @return true if in multiselect mode
	 */
	isInMultiselect(): boolean

	/**
	 * @return true if the mail is selected
	 */
	isItemSelected(mailId: Id): boolean

	/**
	 * @return true if the list is empty and isn't loading anything (basically, the list is known to contain no mails)
	 */
	isEmptyAndDone(): boolean

	/**
	 * Enter multiselect mode
	 */
	enterMultiselect(): void

	/**
	 * Begin loading the list
	 */
	loadInitial(): Promise<void>

	/**
	 * Get all selected items.
	 *
	 * If the items have not changed, then subsequent calls will return the same array.
	 */
	getSelectedAsArray(): readonly Mail[]

	/**
	 * Set the filter
	 * @param filterTypes filter type to use
	 */
	setFilter(filterTypes: ReadonlyArray<ListFilter<Mail>>): void

	/**
	 * Abort loading. No-op if not loading.
	 */
	stopLoading(): void

	/**
	 * Retry loading.
	 */
	retryLoading(): Promise<void>

	/**
	 * Load older items in the list.
	 */
	loadMore(): Promise<void>

	/**
	 * Deselect all items.
	 */
	selectNone(): void

	/**
	 * Select all loaded items.
	 */
	selectAll(): void

	/**
	 * @return true if all items are selected (i.e. selectAll would do nothing)
	 */
	areAllSelected(): boolean

	/**
	 * Get the mail if it is loaded
	 * @param mailId
	 */
	getMail(mailId: Id): Mail | null

	/**
	 * Handle entity events
	 * @param update
	 */
	handleEntityUpdate(update: EntityUpdateData): Promise<void>

	/**
	 * Select the item in the list
	 * @param mail
	 */
	onSingleSelection(mail: Mail): void

	/**
	 * Attempt to load the mail in the list and select it
	 * @param mailId
	 * @param shouldStop
	 */
	loadAndSelect(mailId: Id, shouldStop: () => boolean): Promise<Mail | null>

	/**
	 * Multi-select, add the mail to the selection
	 * @param mail
	 * @param clearSelectionOnMultiSelectStart
	 */
	onSingleInclusiveSelection(mail: Mail, clearSelectionOnMultiSelectStart?: boolean): void

	/**
	 * Deselect any other item if not in multi-select mode and select the given mail.
	 * @param mail
	 */
	onSingleExclusiveSelection(mail: Mail): void

	/**
	 * Select all mails from the current selection towards this mail.
	 * @param mail
	 */
	selectRangeTowards(mail: Mail): void

	/**
	 * Select the previous mail in the list from what is already selected.
	 * @param multiSelect
	 */
	selectPrevious(multiSelect: boolean): void

	/**
	 * Select the next mail in the list from what is already selected.
	 * @param multiSelect
	 */
	selectNext(multiSelect: boolean): void

	/**
	 * Get all labels for the mail.
	 * @param mail
	 */
	getLabelsForMail(mail: Mail): ReadonlyArray<MailFolder>

	/**
	 * Load the entire list.
	 */
	loadAll(): Promise<void>

	/**
	 * Cancel loading the entire list.
	 */
	cancelLoadAll(): void

	/**
	 * @return true if the entire list is being loaded
	 */
	isLoadingAll(): boolean

	/**
	 * Get the mail to display.
	 *
	 * This may not correspond to the current selection (if a mail was directly selected via URL), and in multiselect
	 * mode, this may not return anything.
	 */
	getDisplayedMail(): Mail | null
}

/**
 * Internal representation of a loaded mail
 */
export interface LoadedMail {
	readonly mail: Mail
	readonly mailSetEntryId: IdTuple
	readonly labels: ReadonlyArray<MailFolder>
}

/**
 * Loads all Mail instances for each MailSetEntry, returning a tuple of each
 */
export async function resolveMailSetEntries(
	mailSetEntries: MailSetEntry[],
	mailProvider: (listId: Id, elementIds: Id[]) => Promise<Mail[]>,
	mailModel: MailModel,
): Promise<LoadedMail[]> {
	// Retrieve all mails by mailbag
	const downloadedMails = await provideAllMails(
		mailSetEntries.map((entry) => entry.mail),
		mailProvider,
	)
	const allMails: Map<Id, Mail> = new Map()
	for (const mail of downloadedMails) {
		allMails.set(getElementId(mail), mail)
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
		const labels: MailFolder[] = mailModel.getLabelsForMail(mail)
		loadedMails.push({ mailSetEntryId: mailSetEntry._id, mail, labels })
	}

	return loadedMails
}

/**
 * Retrieve all mails in as few requests as possible
 * @param ids mails to obtain
 * @param mailProvider mail provider to use that gets mails
 */
export async function provideAllMails(ids: IdTuple[], mailProvider: (listId: Id, elementIds: Id[]) => Promise<Mail[]>): Promise<Mail[]> {
	// MailBag -> Mail element ID
	const mailListMap: Map<Id, Id[]> = groupByAndMap(ids, listIdPart, elementIdPart)

	// Retrieve all mails by mailbag
	const allMails: Mail[] = []
	for (const [list, elements] of mailListMap) {
		const mails = await mailProvider(list, elements)
		allMails.push(...mails)
	}

	return allMails
}

/**
 * Apply inbox rules and run spam prediction on an array of mails, returning all mails that were not moved
 */
export async function applyInboxRulesAndSpamPrediction(
	entries: LoadedMail[],
	sourceFolder: MailFolder,
	mailModel: MailModel,
	processInboxHandler: ProcessInboxHandler,
): Promise<LoadedMail[]> {
	if (isEmpty(entries)) {
		return entries
	}
	if (!(sourceFolder.folderType === MailSetKind.SPAM || sourceFolder.folderType === MailSetKind.INBOX)) {
		return entries
	}
	const mailboxDetail = await mailModel.getMailboxDetailsForMailFolder(sourceFolder)
	if (!mailboxDetail) {
		return entries
	}
	const folderSystem = mailModel.getFolderSystemByGroupId(mailboxDetail.mailGroup._id)
	if (!folderSystem) {
		return entries
	}
	return await promiseFilter(entries, async (entry) => {
		const targetFolder = await processInboxHandler.handleIncomingMail(entry.mail, sourceFolder, mailboxDetail, folderSystem)
		return sourceFolder.folderType === targetFolder.folderType
	})
}
