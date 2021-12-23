//@flow
import type {LanguageCode} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {searchInTemplates} from "./TemplateSearchFilter"
import type {EmailTemplate} from "../../api/entities/tutanota/EmailTemplate"
import {EmailTemplateTypeRef} from "../../api/entities/tutanota/EmailTemplate"
import type {EntityEventsListener, EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {OperationType} from "../../api/common/TutanotaConstants"
import stream from "mithril/stream/stream.js"
import type {EntityClient} from "../../api/common/EntityClient"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import {getElementId, getEtId, isSameId} from "../../api/common/utils/EntityUtils"
import type {EmailTemplateContent} from "../../api/entities/tutanota/EmailTemplateContent"
import type {GroupMembership} from "../../api/entities/sys/GroupMembership"
import {flat, LazyLoaded, promiseMap, SortedArray} from "@tutao/tutanota-utils"
import {GroupInfoTypeRef} from "../../api/entities/sys/GroupInfo"
import {TemplateGroupRootTypeRef} from "../../api/entities/tutanota/TemplateGroupRoot"
import type {TemplateGroupInstance} from "./TemplateGroupModel"
import {GroupTypeRef} from "../../api/entities/sys/Group"
import {UserTypeRef} from "../../api/entities/sys/User"

/**
 *   Model that holds main logic for the Template Feature.
 *   Handles things like returning the selected Template, selecting Templates, indexes, scrolling.
 */

export const TEMPLATE_SHORTCUT_PREFIX = "#"

export type NavAction = "previous" | "next";

export const SELECT_NEXT_TEMPLATE = "next";
export const SELECT_PREV_TEMPLATE = "previous";


// sort first by name then by tag
function compareTemplatesForSort(template1: EmailTemplate, template2: EmailTemplate) {
	const titleComparison = template1.title.localeCompare(template2.title)

	return titleComparison === 0
		? template1.tag.localeCompare(template2.tag)
		: titleComparison
}

export class TemplatePopupModel {
	_allTemplates: SortedArray<EmailTemplate>
	+searchResults: Stream<$ReadOnlyArray<EmailTemplate>>
	+selectedTemplate: Stream<?EmailTemplate>
	initialized: LazyLoaded<TemplatePopupModel>
	+_eventController: EventController;
	+_entityEventReceived: EntityEventsListener;
	+_logins: LoginController;
	+_entityClient: EntityClient;
	_groupInstances: Array<TemplateGroupInstance>

	_selectedContentLanguage: LanguageCode

	_searchFilter: TemplateSearchFilter

	constructor(eventController: EventController, logins: LoginController, entityClient: EntityClient) {
		this._eventController = eventController
		this._logins = logins
		this._entityClient = entityClient
		this._allTemplates = new SortedArray(compareTemplatesForSort)
		this.searchResults = stream([])
		this.selectedTemplate = stream(null)
		this._selectedContentLanguage = lang.code
		this._searchFilter = new TemplateSearchFilter()
		this._groupInstances = []

		this._entityEventReceived = (updates) => {
			return this._entityUpdate(updates)
		}

		this.initialized = new LazyLoaded(() => {
			const templateMemberships = this._logins.getUserController().getTemplateMemberships()
			return loadTemplateGroupInstances(templateMemberships, this._entityClient)
				.then(templateGroupInstances => loadTemplates(templateGroupInstances, this._entityClient)
					.then(templates => {
						this._allTemplates.insertAll(templates)
						this._groupInstances = templateGroupInstances
					}))
				.then(() => {
					this.searchResults(this._searchFilter.filter("", this._allTemplates.array))
					this.setSelectedTemplate(this.searchResults()[0])
					return this
				})
		})

		this._eventController.addEntityListener(this._entityEventReceived)
	}

	init(): Promise<TemplatePopupModel> {
		return this.initialized.getAsync()
	}

	isLoaded(): boolean {
		return this.initialized.isLoaded()
	}

	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived)
	}

	isSelectedTemplate(template: EmailTemplate): boolean {
		return (this.selectedTemplate() === template)
	}

	getAllTemplates(): $ReadOnlyArray<EmailTemplate> {
		return this._allTemplates.array
	}

	getSelectedTemplate(): ?EmailTemplate {
		return this.selectedTemplate()
	}

	getSelectedContent(): ?EmailTemplateContent {
		const selectedTemplate = this.selectedTemplate()
		return selectedTemplate &&
			(selectedTemplate.contents.find(contents => contents.languageCode === this._selectedContentLanguage)
				|| selectedTemplate.contents.find(contents => contents.languageCode === lang.code)
				|| selectedTemplate.contents[0])
	}

	getSelectedTemplateIndex(): number {
		return this.searchResults().indexOf(this.selectedTemplate())
	}

	setSelectedTemplate(template: ?EmailTemplate) {
		this.selectedTemplate(template)
	}

	setSelectedContentLanguage(langCode: LanguageCode) {
		this._selectedContentLanguage = langCode
	}

	search(query: string): void {
		this.searchResults(this._searchFilter.filter(query, this._allTemplates.array))
		this.setSelectedTemplate(this.searchResults()[0])
	}

	_rerunSearch(): void {
		this.searchResults(this._searchFilter.rerunQuery(this._allTemplates.array))
		this.setSelectedTemplate(this.searchResults()[0])
	}

	/**
	 * Increments or decrements the selection, unless it would go past the beginning or end of the search results
	 * @param action
	 * @returns true if the selection changed
	 */
	selectNextTemplate(action: NavAction): boolean {
		const selectedIndex = this.getSelectedTemplateIndex()
		const nextIndex = selectedIndex + (action === SELECT_NEXT_TEMPLATE ? 1 : -1)
		if (nextIndex >= 0 && nextIndex < this.searchResults().length) {
			const nextSelectedTemplate = this.searchResults()[nextIndex]
			this.setSelectedTemplate(nextSelectedTemplate)
			return true
		}
		return false
	}

	findTemplateWithTag(selectedText: string): ?EmailTemplate {
		const tag = selectedText.substring(TEMPLATE_SHORTCUT_PREFIX.length) // remove TEMPLATE_SHORTCUT_PREFIX from selected text
		return this._allTemplates.array.find(template => template.tag === tag)
	}

	_entityUpdate(updates: $ReadOnlyArray<EntityUpdateData>): Promise<*> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(EmailTemplateTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					return this._entityClient.load(EmailTemplateTypeRef, [update.instanceListId, update.instanceId])
					           .then((template) => {
						           this._allTemplates.insert(template)
						           this._rerunSearch()
						           this.setSelectedTemplate(template)
					           })

				} else if (update.operation === OperationType.UPDATE) {
					return this._entityClient.load(EmailTemplateTypeRef, [update.instanceListId, update.instanceId])
					           .then((template) => {
						           this._allTemplates.removeFirst((t) => isSameId(getElementId(t), update.instanceId))
						           this._allTemplates.insert(template)
						           this._rerunSearch()
						           this.setSelectedTemplate(template)
					           })
				} else if (update.operation === OperationType.DELETE) {
					// Try select the next or the previous template
					// if neither option is possible, it means we are deleting the last template, so clear the selection
					if (!this.selectNextTemplate("next") && !this.selectNextTemplate("previous")) {
						this.setSelectedTemplate(null)
					}
					this._allTemplates.removeFirst((t) => isSameId(getElementId(t), update.instanceId))
					this._rerunSearch()
				}
			} else if (isUpdateForTypeRef(UserTypeRef, update) && isSameId(update.instanceId, logins.getUserController().user._id)) {
				// template group memberships may have changed
				if (this._groupInstances.length !== logins.getUserController().getTemplateMemberships().length) {
					this.initialized.reset()
					return this.initialized.getAsync().then(() => this._rerunSearch())
				}
			}
		})
	}

	getTemplateGroupInstances(): Array<TemplateGroupInstance> {
		return this._groupInstances
	}

	getSelectedTemplateGroupInstance(): ?TemplateGroupInstance {
		const selected = this.getSelectedTemplate()
		return selected
			? this._groupInstances.find(instance => isSameId(getEtId(instance.group), selected._ownerGroup))
			: null
	}
}

export function loadTemplateGroupInstances(memberships: Array<GroupMembership>, entityClient: EntityClient): Promise<Array<TemplateGroupInstance>> {
	return promiseMap(memberships, membership => loadTemplateGroupInstance(membership, entityClient))
}

export function loadTemplateGroupInstance(groupMembership: GroupMembership, entityClient: EntityClient): Promise<TemplateGroupInstance> {
	return entityClient.load(GroupInfoTypeRef, groupMembership.groupInfo)
	                   .then(groupInfo =>
		                   entityClient.load(TemplateGroupRootTypeRef, groupInfo.group)
		                               .then(groupRoot =>
			                               entityClient.load(GroupTypeRef, groupInfo.group)
			                                           .then(group => {
				                                           return {
					                                           groupInfo,
					                                           group,
					                                           groupRoot,
					                                           groupMembership
				                                           }
			                                           })))
}

function loadTemplates(templateGroups: Array<TemplateGroupInstance>, entityClient: EntityClient): Promise<Array<EmailTemplate>> {
	return promiseMap(templateGroups, group => entityClient.loadAll(EmailTemplateTypeRef, group.groupRoot.templates))
		.then(groupedTemplates => flat(groupedTemplates))
}

class TemplateSearchFilter {
	lastInput: $ReadOnlyArray<EmailTemplate>
	lastQuery: string
	lastResults: $ReadOnlyArray<EmailTemplate>

	constructor() {
		this.lastInput = []
		this.lastQuery = ""
		this.lastResults = []
	}

	filter(query: string, input: $ReadOnlyArray<EmailTemplate>): $ReadOnlyArray<EmailTemplate> {
		return this._doFilter(query, input)
	}

	rerunQuery(input: $ReadOnlyArray<EmailTemplate>): $ReadOnlyArray<EmailTemplate> {
		return this._doFilter(this.lastQuery, input)
	}

	_doFilter(query: string, input: $ReadOnlyArray<EmailTemplate>): $ReadOnlyArray<EmailTemplate> {
		this.lastInput = input.slice()
		this.lastQuery = query
		this.lastResults = query === ""
			? this.lastInput
			: searchInTemplates(query, input)
		return this.lastResults
	}

}

