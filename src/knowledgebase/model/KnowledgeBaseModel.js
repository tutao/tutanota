//@flow
import type {KnowledgeBaseEntry} from "../../api/entities/tutanota/KnowledgeBaseEntry"
import {KnowledgeBaseEntryTypeRef} from "../../api/entities/tutanota/KnowledgeBaseEntry"
import type {EmailTemplate} from "../../api/entities/tutanota/EmailTemplate"
import {EmailTemplateTypeRef} from "../../api/entities/tutanota/EmailTemplate"
import type {EntityEventsListener, EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {EntityClient} from "../../api/common/EntityClient"
import {knowledgeBaseSearch} from "./KnowledgeBaseSearchFilter"
import type {LanguageCode} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {OperationType, ShareCapability} from "../../api/common/TutanotaConstants"
import {downcast, flat, LazyLoaded, noOp, promiseMap, SortedArray} from "@tutao/tutanota-utils"
import {getElementId, getEtId, getLetId, isSameId} from "../../api/common/utils/EntityUtils"
import type {TemplateGroupInstance} from "../../templates/model/TemplateGroupModel"
import {loadTemplateGroupInstance} from "../../templates/model/TemplatePopupModel"
import type {IUserController} from "../../api/main/UserController"
import {hasCapabilityOnGroup} from "../../sharing/GroupUtils"

export const SELECT_NEXT_ENTRY = "next";

function compareKnowledgeBaseEntriesForSort(entry1: KnowledgeBaseEntry, entry2: KnowledgeBaseEntry): number {
	return entry1.title.localeCompare(entry2.title)
}

/**
 *   Model that holds main logic for the Knowledgebase.
 */
export class KnowledgeBaseModel {
	_allEntries: SortedArray<KnowledgeBaseEntry>
	filteredEntries: Stream<$ReadOnlyArray<KnowledgeBaseEntry>>
	selectedEntry: Stream<?KnowledgeBaseEntry>
	_allKeywords: Array<string>
	_matchedKeywordsInContent: Array<?string>
	_filterValue: string
	+_eventController: EventController;
	+_entityClient: EntityClient;
	+_entityEventReceived: EntityEventsListener;
	_groupInstances: Array<TemplateGroupInstance>
	_initialized: LazyLoaded<KnowledgeBaseModel>
	_userController: IUserController

	constructor(eventController: EventController, entityClient: EntityClient, userController: IUserController) {
		this._eventController = eventController
		this._entityClient = entityClient
		this._userController = userController
		this._allEntries = new SortedArray(compareKnowledgeBaseEntriesForSort)
		this._allKeywords = []
		this._matchedKeywordsInContent = []
		this.filteredEntries = stream(this._allEntries.array)
		this.selectedEntry = stream(null)
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
			const templateMemberships = this._userController.getTemplateMemberships()
			let newGroupInstances = []
			return promiseMap(templateMemberships, membership => loadTemplateGroupInstance(membership, entityClient))
				.then(groupInstances => {
					newGroupInstances = groupInstances
					return loadKnowledgebaseEntries(groupInstances, entityClient)
				}).then(knowledgebaseEntries => {
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
		this._allEntries.array.forEach(entry => {
			entry.keywords.forEach(keyword => {
				this._allKeywords.push(keyword.keyword)
			})
		})

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

	getMatchedKeywordsInContent(): Array<?string> {
		return this._matchedKeywordsInContent
	}

	getLanguageFromTemplate(template: EmailTemplate): LanguageCode {
		const clientLanguage = lang.code
		const hasClientLanguage = template.contents.some(
			(content) => content.languageCode === clientLanguage
		)
		if (hasClientLanguage) {
			return clientLanguage
		}
		return downcast(template.contents[0].languageCode)
	}

	sortEntriesByMatchingKeywords(emailContent: string) {
		this._matchedKeywordsInContent = []
		const emailContentNoTags = emailContent.replace(/(<([^>]+)>)/ig, "") // remove all html tags
		this._allKeywords.forEach(keyword => {
			if (emailContentNoTags.includes(keyword)) {
				this._matchedKeywordsInContent.push(keyword)
			}
		})
		this._allEntries = SortedArray.from(this._allEntries.array, (a, b) => this._compareEntriesByMatchedKeywords(a, b))
		this._filterValue = ""
		this.filteredEntries(this._allEntries.array)
	}

	_compareEntriesByMatchedKeywords(entry1: KnowledgeBaseEntry, entry2: KnowledgeBaseEntry): number {
		const difference = this._getMatchedKeywordsNumber(entry2) - this._getMatchedKeywordsNumber(entry1)
		return difference === 0
			? compareKnowledgeBaseEntriesForSort(entry1, entry2)
			: difference
	}

	_getMatchedKeywordsNumber(entry: KnowledgeBaseEntry): number {
		let matches = 0
		entry.keywords.forEach(k => {
			if (this._matchedKeywordsInContent.includes(k.keyword)) {
				matches++
			}
		})
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

	selectNextEntry(action: string): boolean { // returns true if selection is changed
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
		return this.filteredEntries().indexOf(this.selectedEntry())
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
		const instance = this._groupInstances.find(instance => isSameId(entry._ownerGroup, getEtId(instance.group)))
		return !instance || !hasCapabilityOnGroup(this._userController.user, instance.group, ShareCapability.Write)
	}

	_entityUpdate(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(KnowledgeBaseEntryTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					return this._entityClient.load(KnowledgeBaseEntryTypeRef, [update.instanceListId, update.instanceId])
					           .then((entry) => {
						           this._allEntries.insert(entry)
						           this.filter(this._filterValue)
					           })
				} else if (update.operation === OperationType.UPDATE) {
					return this._entityClient.load(KnowledgeBaseEntryTypeRef, [update.instanceListId, update.instanceId])
					           .then((updatedEntry) => {
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
	return promiseMap(templateGroups, group => entityClient.loadAll(KnowledgeBaseEntryTypeRef, group.groupRoot.knowledgeBase))
		.then(groupedTemplates => flat(groupedTemplates))
}
