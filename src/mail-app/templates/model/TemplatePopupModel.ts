import type { LanguageCode } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { EmailTemplateContent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { EmailTemplate, EmailTemplateTypeRef, TemplateGroupRootTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { OperationType } from "../../../common/api/common/TutanotaConstants"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import type { LoginController } from "../../../common/api/main/LoginController"
import { getElementId, getEtId, isSameId } from "../../../common/api/common/utils/EntityUtils"
import type { GroupMembership } from "../../../common/api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import { LazyLoaded, promiseMap, SortedArray } from "@tutao/tutanota-utils"
import type { TemplateGroupInstance } from "./TemplateGroupModel.js"
import { search } from "../../../common/api/common/utils/PlainTextSearch.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"

/**
 *   Model that holds main logic for the Template Feature.
 *   Handles things like returning the selected Template, selecting Templates, indexes, scrolling.
 */
export const TEMPLATE_SHORTCUT_PREFIX = "#"
export type NavAction = "previous" | "next"
export const SELECT_NEXT_TEMPLATE = "next"
export const SELECT_PREV_TEMPLATE = "previous"

// sort first by name then by tag
function compareTemplatesForSort(template1: EmailTemplate, template2: EmailTemplate) {
	const titleComparison = template1.title.localeCompare(template2.title)
	return titleComparison === 0 ? template1.tag.localeCompare(template2.tag) : titleComparison
}

export class TemplatePopupModel {
	_allTemplates: SortedArray<EmailTemplate>
	readonly searchResults: Stream<ReadonlyArray<EmailTemplate>>
	readonly selectedTemplate: Stream<EmailTemplate | null>
	initialized: LazyLoaded<TemplatePopupModel>
	readonly _eventController: EventController
	readonly _entityEventReceived: EntityEventsListener
	readonly _logins: LoginController
	readonly _entityClient: EntityClient
	_groupInstances: Array<TemplateGroupInstance>
	_selectedContentLanguage: LanguageCode
	_searchFilter: TemplateSearchFilter

	constructor(eventController: EventController, logins: LoginController, entityClient: EntityClient) {
		this._eventController = eventController
		this._logins = logins
		this._entityClient = entityClient
		this._allTemplates = SortedArray.empty(compareTemplatesForSort)
		this.searchResults = stream<ReadonlyArray<EmailTemplate>>([])
		this.selectedTemplate = stream<EmailTemplate | null>(null)
		this._selectedContentLanguage = lang.code
		this._searchFilter = new TemplateSearchFilter()
		this._groupInstances = []

		this._entityEventReceived = (updates, eventOwnerGroupId) => {
			return this._entityUpdate(updates, eventOwnerGroupId)
		}

		this.initialized = new LazyLoaded(() => {
			const templateMemberships = this._logins.getUserController().getTemplateMemberships()

			return loadTemplateGroupInstances(templateMemberships, this._entityClient)
				.then((templateGroupInstances) =>
					loadTemplates(templateGroupInstances, this._entityClient).then((templates) => {
						this._allTemplates.insertAll(templates)

						this._groupInstances = templateGroupInstances
					}),
				)
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
		return this.selectedTemplate() === template
	}

	getAllTemplates(): ReadonlyArray<EmailTemplate> {
		return this._allTemplates.array
	}

	getSelectedTemplate(): EmailTemplate | null {
		return this.selectedTemplate()
	}

	getSelectedContent(): EmailTemplateContent | null {
		const selectedTemplate = this.selectedTemplate()
		return (
			selectedTemplate &&
			(selectedTemplate.contents.find((contents) => contents.languageCode === this._selectedContentLanguage) ||
				selectedTemplate.contents.find((contents) => contents.languageCode === lang.code) ||
				selectedTemplate.contents[0])
		)
	}

	getSelectedTemplateIndex(): number {
		const selectedTemplate = this.selectedTemplate()
		if (selectedTemplate == null) {
			return -1
		}
		return this.searchResults().indexOf(selectedTemplate)
	}

	setSelectedTemplate(template: EmailTemplate | null) {
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

	findTemplateWithTag(selectedText: string): EmailTemplate | null {
		const tag = selectedText.substring(TEMPLATE_SHORTCUT_PREFIX.length) // remove TEMPLATE_SHORTCUT_PREFIX from selected text

		return this._allTemplates.array.find((template) => template.tag === tag) ?? null
	}

	_entityUpdate(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<any> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(EmailTemplateTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					return this._entityClient.load(EmailTemplateTypeRef, [update.instanceListId, update.instanceId]).then((template) => {
						this._allTemplates.insert(template)

						this._rerunSearch()

						this.setSelectedTemplate(template)
					})
				} else if (update.operation === OperationType.UPDATE) {
					return this._entityClient.load(EmailTemplateTypeRef, [update.instanceListId, update.instanceId]).then((template) => {
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
			} else if (this._logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				// template group memberships may have changed
				if (this._groupInstances.length !== this._logins.getUserController().getTemplateMemberships().length) {
					this.initialized.reset()
					return this.initialized.getAsync().then(() => this._rerunSearch())
				}
			}
		})
	}

	getTemplateGroupInstances(): Array<TemplateGroupInstance> {
		return this._groupInstances
	}

	getSelectedTemplateGroupInstance(): TemplateGroupInstance | null {
		const selected = this.getSelectedTemplate()
		if (selected == null) {
			return null
		} else {
			return this._groupInstances.find((instance) => isSameId(getEtId(instance.group), selected._ownerGroup)) ?? null
		}
	}
}

export function loadTemplateGroupInstances(memberships: Array<GroupMembership>, entityClient: EntityClient): Promise<Array<TemplateGroupInstance>> {
	return promiseMap(memberships, (membership) => loadTemplateGroupInstance(membership, entityClient))
}

export function loadTemplateGroupInstance(groupMembership: GroupMembership, entityClient: EntityClient): Promise<TemplateGroupInstance> {
	return entityClient.load(GroupInfoTypeRef, groupMembership.groupInfo).then((groupInfo) =>
		entityClient.load(TemplateGroupRootTypeRef, groupInfo.group).then((groupRoot) =>
			entityClient.load(GroupTypeRef, groupInfo.group).then((group) => {
				return {
					groupInfo,
					group,
					groupRoot,
					groupMembership,
				}
			}),
		),
	)
}

function loadTemplates(templateGroups: Array<TemplateGroupInstance>, entityClient: EntityClient): Promise<Array<EmailTemplate>> {
	return promiseMap(templateGroups, (group) => entityClient.loadAll(EmailTemplateTypeRef, group.groupRoot.templates)).then((groupedTemplates) =>
		groupedTemplates.flat(),
	)
}

export function searchInTemplates(input: string, allTemplates: ReadonlyArray<EmailTemplate>): ReadonlyArray<EmailTemplate> {
	if (input.startsWith(TEMPLATE_SHORTCUT_PREFIX)) {
		// search in tag only
		const newQueryString = input.substring(TEMPLATE_SHORTCUT_PREFIX.length)
		return search(newQueryString, allTemplates, ["tag"], false)
	} else {
		return search(input, allTemplates, ["tag", "title", "contents.text"], false)
	}
}

class TemplateSearchFilter {
	lastInput: ReadonlyArray<EmailTemplate>
	lastQuery: string
	lastResults: ReadonlyArray<EmailTemplate>

	constructor() {
		this.lastInput = []
		this.lastQuery = ""
		this.lastResults = []
	}

	filter(query: string, input: ReadonlyArray<EmailTemplate>): ReadonlyArray<EmailTemplate> {
		return this._doFilter(query, input)
	}

	rerunQuery(input: ReadonlyArray<EmailTemplate>): ReadonlyArray<EmailTemplate> {
		return this._doFilter(this.lastQuery, input)
	}

	_doFilter(query: string, input: ReadonlyArray<EmailTemplate>): ReadonlyArray<EmailTemplate> {
		this.lastInput = input.slice()
		this.lastQuery = query
		this.lastResults = query === "" ? this.lastInput : searchInTemplates(query, input)
		return this.lastResults
	}
}
