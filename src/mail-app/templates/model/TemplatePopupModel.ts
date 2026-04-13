import type { LanguageCode } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import { entityUpdateUtils, getElementId, getEtId, isSameId, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typeRefs"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import type { LoginController } from "../../../common/api/main/LoginController"
import { LazyLoaded, promiseMap, SortedArray } from "@tutao/utils"
import type { TemplateGroupInstance } from "./TemplateGroupModel.js"
import { search } from "../../../common/api/common/utils/PlainTextSearch.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { OperationType } from "@tutao/appEnv"

/**
 *   Model that holds main logic for the Template Feature.
 *   Handles things like returning the selected Template, selecting Templates, indexes, scrolling.
 */
export const TEMPLATE_SHORTCUT_PREFIX = "#"
export type NavAction = "previous" | "next"
export const SELECT_NEXT_TEMPLATE = "next"
export const SELECT_PREV_TEMPLATE = "previous"

// sort first by name then by tag
function compareTemplatesForSort(template1: tutanotaTypeRefs.EmailTemplate, template2: tutanotaTypeRefs.EmailTemplate) {
	const titleComparison = template1.title.localeCompare(template2.title)
	return titleComparison === 0 ? template1.tag.localeCompare(template2.tag) : titleComparison
}

export class TemplatePopupModel {
	_allTemplates: SortedArray<tutanotaTypeRefs.EmailTemplate>
	readonly searchResults: Stream<ReadonlyArray<tutanotaTypeRefs.EmailTemplate>>
	readonly selectedTemplate: Stream<tutanotaTypeRefs.EmailTemplate | null>
	initialized: LazyLoaded<TemplatePopupModel>
	readonly _eventController: EventController
	readonly _entityEventReceived: entityUpdateUtils.EntityEventsListener
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
		this.searchResults = stream<ReadonlyArray<tutanotaTypeRefs.EmailTemplate>>([])
		this.selectedTemplate = stream<tutanotaTypeRefs.EmailTemplate | null>(null)
		this._selectedContentLanguage = lang.code
		this._searchFilter = new TemplateSearchFilter()
		this._groupInstances = []

		this._entityEventReceived = {
			onEntityUpdatesReceived: (updates, eventOwnerGroupId) => {
				return this._entityUpdate(updates, eventOwnerGroupId)
			},
			priority: entityUpdateUtils.OnEntityUpdateReceivedPriority.NORMAL,
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

	isSelectedTemplate(template: tutanotaTypeRefs.EmailTemplate): boolean {
		return this.selectedTemplate() === template
	}

	getAllTemplates(): ReadonlyArray<tutanotaTypeRefs.EmailTemplate> {
		return this._allTemplates.array
	}

	getSelectedTemplate(): tutanotaTypeRefs.EmailTemplate | null {
		return this.selectedTemplate()
	}

	getSelectedContent(): tutanotaTypeRefs.EmailTemplateContent | null {
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

	setSelectedTemplate(template: tutanotaTypeRefs.EmailTemplate | null) {
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

	findTemplateWithTag(selectedText: string): tutanotaTypeRefs.EmailTemplate | null {
		const tag = selectedText.substring(TEMPLATE_SHORTCUT_PREFIX.length) // remove TEMPLATE_SHORTCUT_PREFIX from selected text

		return this._allTemplates.array.find((template) => template.tag === tag) ?? null
	}

	_entityUpdate(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>, eventOwnerGroupId: Id): Promise<any> {
		return promiseMap(updates, (update) => {
			if (entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.EmailTemplateTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					return this._entityClient.load(tutanotaTypeRefs.EmailTemplateTypeRef, [update.instanceListId, update.instanceId]).then((template) => {
						this._allTemplates.insert(template)

						this._rerunSearch()

						this.setSelectedTemplate(template)
					})
				} else if (update.operation === OperationType.UPDATE) {
					return this._entityClient.load(tutanotaTypeRefs.EmailTemplateTypeRef, [update.instanceListId, update.instanceId]).then((template) => {
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

export function loadTemplateGroupInstances(memberships: Array<sysTypeRefs.GroupMembership>, entityClient: EntityClient): Promise<Array<TemplateGroupInstance>> {
	return promiseMap(memberships, (membership) => loadTemplateGroupInstance(membership, entityClient))
}

export function loadTemplateGroupInstance(groupMembership: sysTypeRefs.GroupMembership, entityClient: EntityClient): Promise<TemplateGroupInstance> {
	return entityClient.load(sysTypeRefs.GroupInfoTypeRef, groupMembership.groupInfo).then((groupInfo) =>
		entityClient.load(tutanotaTypeRefs.TemplateGroupRootTypeRef, groupInfo.group).then((groupRoot) =>
			entityClient.load(sysTypeRefs.GroupTypeRef, groupInfo.group).then((group) => {
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

function loadTemplates(templateGroups: Array<TemplateGroupInstance>, entityClient: EntityClient): Promise<Array<tutanotaTypeRefs.EmailTemplate>> {
	return promiseMap(templateGroups, (group) => entityClient.loadAll(tutanotaTypeRefs.EmailTemplateTypeRef, group.groupRoot.templates)).then(
		(groupedTemplates) => groupedTemplates.flat(),
	)
}

export function searchInTemplates(input: string, allTemplates: ReadonlyArray<tutanotaTypeRefs.EmailTemplate>): ReadonlyArray<tutanotaTypeRefs.EmailTemplate> {
	if (input.startsWith(TEMPLATE_SHORTCUT_PREFIX)) {
		// search in tag only
		const newQueryString = input.substring(TEMPLATE_SHORTCUT_PREFIX.length)
		return search(newQueryString, allTemplates, ["tag"], false)
	} else {
		return search(input, allTemplates, ["tag", "title", "contents.text"], false)
	}
}

class TemplateSearchFilter {
	lastInput: ReadonlyArray<tutanotaTypeRefs.EmailTemplate>
	lastQuery: string
	lastResults: ReadonlyArray<tutanotaTypeRefs.EmailTemplate>

	constructor() {
		this.lastInput = []
		this.lastQuery = ""
		this.lastResults = []
	}

	filter(query: string, input: ReadonlyArray<tutanotaTypeRefs.EmailTemplate>): ReadonlyArray<tutanotaTypeRefs.EmailTemplate> {
		return this._doFilter(query, input)
	}

	rerunQuery(input: ReadonlyArray<tutanotaTypeRefs.EmailTemplate>): ReadonlyArray<tutanotaTypeRefs.EmailTemplate> {
		return this._doFilter(this.lastQuery, input)
	}

	_doFilter(query: string, input: ReadonlyArray<tutanotaTypeRefs.EmailTemplate>): ReadonlyArray<tutanotaTypeRefs.EmailTemplate> {
		this.lastInput = input.slice()
		this.lastQuery = query
		this.lastResults = query === "" ? this.lastInput : searchInTemplates(query, input)
		return this.lastResults
	}
}
