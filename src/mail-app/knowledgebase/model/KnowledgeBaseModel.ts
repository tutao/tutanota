import type { EmailTemplate, KnowledgeBaseEntry } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { EmailTemplateTypeRef, KnowledgeBaseEntryTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { knowledgeBaseSearch } from "./KnowledgeBaseSearchFilter.js"
import type { LanguageCode } from "../../../common/misc/LanguageViewModel.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { OperationType, ShareCapability } from "../../../common/api/common/TutanotaConstants.js"
import { downcast, LazyLoaded, noOp, promiseMap, SortedArray } from "@tutao/tutanota-utils"
import { getElementId, getEtId, getLetId, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import type { TemplateGroupInstance } from "../../templates/model/TemplateGroupModel.js"
import { loadTemplateGroupInstance } from "../../templates/model/TemplatePopupModel.js"
import type { UserController } from "../../../common/api/main/UserController.js"
import { hasCapabilityOnGroup } from "../../../common/sharing/GroupUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"

export const SELECT_NEXT_ENTRY = "next"

function compareKnowledgeBaseEntriesForSort(entry1: KnowledgeBaseEntry, entry2: KnowledgeBaseEntry): number {
	return entry1.title.localeCompare(entry2.title)
}

/**
 *   Model that holds main logic for the Knowledgebase.
 */
export class KnowledgeBaseModel {
	_allEntries: SortedArray<KnowledgeBaseEntry>
	filteredEntries: Stream<ReadonlyArray<KnowledgeBaseEntry>>
	selectedEntry: Stream<KnowledgeBaseEntry | null>
	_allKeywords: Array<string>
	_matchedKeywordsInContent: Array<string | null>
	_filterValue: string
	readonly _eventController: EventController
	readonly _entityClient: EntityClient
	readonly _entityEventReceived: EntityEventsListener
	_groupInstances: Array<TemplateGroupInstance>
	_initialized: LazyLoaded<KnowledgeBaseModel>
	readonly userController: UserController

	constructor(eventController: EventController, entityClient: EntityClient, userController: UserController) {
		this._eventController = eventController
		this._entityClient = entityClient
		this.userController = userController
		this._allEntries = SortedArray.empty(compareKnowledgeBaseEntriesForSort)
		this._allKeywords = []
		this._matchedKeywordsInContent = []
		this.filteredEntries = stream(this._allEntries.array)
		this.selectedEntry = stream<KnowledgeBaseEntry | null>(null)
		this._filterValue = ""

		this._entityEventReceived = (updates) => {
			return this._entityUpdate(updates)
		}

		this._eventController.addEntityListener(this._entityEventReceived)

		this._groupInstances = []
		this._allKeywords = []
		this.filteredEntries(this._allEntries.array)
		this.selectedEntry(this.containsResult() ? this.filteredEntries()[0] : null)
		this._initialized = new LazyLoaded(() => {
			const templateMemberships = this.userController.getTemplateMemberships()

			let newGroupInstances: TemplateGroupInstance[] = []
			return promiseMap(templateMemberships, (membership) => loadTemplateGroupInstance(membership, entityClient))
				.then((groupInstances) => {
					newGroupInstances = groupInstances
					return loadKnowledgebaseEntries(groupInstances, entityClient)
				})
				.then((knowledgebaseEntries) => {
					this._allEntries.insertAll(knowledgebaseEntries)

					this._groupInstances = newGroupInstances
					this.initAllKeywords()
					return this
				})
		})
	}

	init(): Promise<KnowledgeBaseModel> {
		return this._initialized.getAsync()
	}

	isInitialized(): boolean {
		return this._initialized.isLoaded()
	}

	getTemplateGroupInstances(): Array<TemplateGroupInstance> {
		return this._groupInstances
	}

	initAllKeywords() {
		this._allKeywords = []
		this._matchedKeywordsInContent = []

		for (const entry of this._allEntries.array) {
			for (const keyword of entry.keywords) {
				this._allKeywords.push(keyword.keyword)
			}
		}
	}

	isSelectedEntry(entry: KnowledgeBaseEntry): boolean {
		return this.selectedEntry() === entry
	}

	containsResult(): boolean {
		return this.filteredEntries().length > 0
	}

	getAllKeywords(): Array<string> {
		return this._allKeywords.sort()
	}

	getMatchedKeywordsInContent(): Array<string | null> {
		return this._matchedKeywordsInContent
	}

	getLanguageFromTemplate(template: EmailTemplate): LanguageCode {
		const clientLanguage = lang.code
		const hasClientLanguage = template.contents.some((content) => content.languageCode === clientLanguage)

		if (hasClientLanguage) {
			return clientLanguage
		}

		return downcast(template.contents[0].languageCode)
	}

	sortEntriesByMatchingKeywords(emailContent: string) {
		this._matchedKeywordsInContent = []
		const emailContentNoTags = emailContent.replace(/(<([^>]+)>)/gi, "") // remove all html tags

		for (const keyword of this._allKeywords) {
			if (emailContentNoTags.includes(keyword)) {
				this._matchedKeywordsInContent.push(keyword)
			}
		}

		this._allEntries = SortedArray.from(this._allEntries.array, (a, b) => this._compareEntriesByMatchedKeywords(a, b))
		this._filterValue = ""
		this.filteredEntries(this._allEntries.array)
	}

	_compareEntriesByMatchedKeywords(entry1: KnowledgeBaseEntry, entry2: KnowledgeBaseEntry): number {
		const difference = this._getMatchedKeywordsNumber(entry2) - this._getMatchedKeywordsNumber(entry1)

		return difference === 0 ? compareKnowledgeBaseEntriesForSort(entry1, entry2) : difference
	}

	_getMatchedKeywordsNumber(entry: KnowledgeBaseEntry): number {
		let matches = 0
		for (const k of entry.keywords) {
			if (this._matchedKeywordsInContent.includes(k.keyword)) {
				matches++
			}
		}
		return matches
	}

	filter(input: string): void {
		this._filterValue = input
		const inputTrimmed = input.trim()

		if (inputTrimmed) {
			this.filteredEntries(knowledgeBaseSearch(inputTrimmed, this._allEntries.array))
		} else {
			this.filteredEntries(this._allEntries.array)
		}
	}

	selectNextEntry(action: string): boolean {
		// returns true if selection is changed
		const selectedIndex = this.getSelectedEntryIndex()
		const nextIndex = selectedIndex + (action === SELECT_NEXT_ENTRY ? 1 : -1)

		if (nextIndex >= 0 && nextIndex < this.filteredEntries().length) {
			const nextSelectedEntry = this.filteredEntries()[nextIndex]
			this.selectedEntry(nextSelectedEntry)
			return true
		}

		return false
	}

	getSelectedEntryIndex(): number {
		const selectedEntry = this.selectedEntry()
		if (selectedEntry == null) {
			return -1
		}
		return this.filteredEntries().indexOf(selectedEntry)
	}

	_removeFromAllKeywords(keyword: string) {
		const index = this._allKeywords.indexOf(keyword)

		if (index > -1) {
			this._allKeywords.splice(index, 1)
		}
	}

	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived)
	}

	loadTemplate(templateId: IdTuple): Promise<EmailTemplate> {
		return this._entityClient.load(EmailTemplateTypeRef, templateId)
	}

	isReadOnly(entry: KnowledgeBaseEntry): boolean {
		const instance = this._groupInstances.find((instance) => isSameId(entry._ownerGroup, getEtId(instance.group)))

		return !instance || !hasCapabilityOnGroup(this.userController.user, instance.group, ShareCapability.Write)
	}

	_entityUpdate(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(KnowledgeBaseEntryTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					return this._entityClient.load(KnowledgeBaseEntryTypeRef, [update.instanceListId, update.instanceId]).then((entry) => {
						this._allEntries.insert(entry)

						this.filter(this._filterValue)
					})
				} else if (update.operation === OperationType.UPDATE) {
					return this._entityClient.load(KnowledgeBaseEntryTypeRef, [update.instanceListId, update.instanceId]).then((updatedEntry) => {
						this._allEntries.removeFirst((e) => isSameId(getElementId(e), update.instanceId))

						this._allEntries.insert(updatedEntry)

						this.filter(this._filterValue)
						const oldSelectedEntry = this.selectedEntry()

						if (oldSelectedEntry && isSameId(oldSelectedEntry._id, updatedEntry._id)) {
							this.selectedEntry(updatedEntry)
						}
					})
				} else if (update.operation === OperationType.DELETE) {
					const selected = this.selectedEntry()

					if (selected && isSameId(getLetId(selected), [update.instanceListId, update.instanceId])) {
						this.selectedEntry(null)
					}

					this._allEntries.removeFirst((e) => isSameId(getElementId(e), update.instanceId))

					this.filter(this._filterValue)
				}
			}
		}).then(noOp)
	}
}

function loadKnowledgebaseEntries(templateGroups: Array<TemplateGroupInstance>, entityClient: EntityClient): Promise<Array<KnowledgeBaseEntry>> {
	return promiseMap(templateGroups, (group) => entityClient.loadAll(KnowledgeBaseEntryTypeRef, group.groupRoot.knowledgeBase)).then((groupedTemplates) =>
		groupedTemplates.flat(),
	)
}
