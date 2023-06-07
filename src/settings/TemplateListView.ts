import m, { Children } from "mithril"
import { Button, ButtonType } from "../gui/base/Button.js"
import { lang } from "../misc/LanguageViewModel"
import type { EntityUpdateData } from "../api/main/EventController"
import { isUpdateForTypeRef } from "../api/main/EventController"
import type { ListConfig, VirtualRow } from "../gui/base/List"
import { List } from "../gui/base/List"
import { size } from "../gui/size"
import type { SettingsView, UpdatableSettingsViewer } from "./SettingsView"
import { TemplateDetailsViewer } from "./TemplateDetailsViewer"
import { showTemplateEditor } from "./TemplateEditor"
import type { EmailTemplate, TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { createEmailTemplate, createEmailTemplateContent, EmailTemplateTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../api/common/EntityClient"
import { GENERATED_MAX_ID, getElementId, isSameId } from "../api/common/utils/EntityUtils"
import { TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import { hasCapabilityOnGroup } from "../sharing/GroupUtils"
import { OperationType, ShareCapability } from "../api/common/TutanotaConstants"
import type { TemplateGroupInstance } from "../templates/model/TemplateGroupModel"
import type { LoginController } from "../api/main/LoginController"
import { ListColumnWrapper } from "../gui/ListColumnWrapper"
import { promiseMap } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../gui/SelectableRowContainer.js"

assertMainOrNode()

/**
 *  List that is rendered within the template Settings
 */
export class TemplateListView implements UpdatableSettingsViewer {
	_list: List<EmailTemplate, TemplateRow>

	constructor(
		private readonly settingsView: SettingsView,
		private readonly templateGroupInstance: TemplateGroupInstance,
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {
		this._list = this._initTemplateList()
	}

	_initTemplateList(): List<EmailTemplate, TemplateRow> {
		const listConfig: ListConfig<EmailTemplate, TemplateRow> = {
			rowHeight: size.list_row_height,
			fetch: async (startId, count) => {
				// fetch works like in ContactListView and KnowledgeBaseListView, because we have a custom sort order there too
				if (startId === GENERATED_MAX_ID) {
					// load all entries at once to apply custom sort order
					const allEntries = await this.entityClient.loadAll(EmailTemplateTypeRef, this.templateListId())
					return { items: allEntries, complete: true }
				} else {
					throw new Error("fetch template entry called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this.entityClient.load<EmailTemplate>(EmailTemplateTypeRef, [this.templateListId(), elementId])
			},
			sortCompare: (a: EmailTemplate, b: EmailTemplate) => {
				const titleA = a.title.toUpperCase()
				const titleB = b.title.toUpperCase()
				return titleA < titleB ? -1 : titleA > titleB ? 1 : 0
			},
			elementSelected: (templates: Array<EmailTemplate>, elementClicked) => {
				if (templates.length > 0) {
					this.settingsView.detailsViewer = new TemplateDetailsViewer(templates[0], this.entityClient, () => !this.userCanEdit())

					this.settingsView.focusSettingsDetailsColumn()
				} else {
					this.settingsView.detailsViewer = null
					m.redraw()
				}
			},
			createVirtualRow: () => {
				return new TemplateRow()
			},
			className: "template-list",
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		}
		const list = new List(listConfig)
		list.loadInitial()
		return list
	}

	view(): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: this.userCanEdit()
					? m(".flex.flex-end.center-vertically.plr-l.list-border-bottom", [
							m(
								".mr-negative-s",
								m(Button, {
									label: "addTemplate_label",
									type: ButtonType.Primary,
									click: () => {
										showTemplateEditor(null, this.templateGroupInstance.groupRoot)
									},
								}),
							),
					  ])
					: null,
			},
			this._list ? m(this._list) : null,
		)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(EmailTemplateTypeRef, update) && isSameId(this.templateListId(), update.instanceListId)) {
				return this._list.entityEventReceived(update.instanceId, update.operation).then(() => {
					const selected = this._list.getSelectedEntities()[0]

					if (update.operation === OperationType.UPDATE && selected && isSameId(getElementId(selected), update.instanceId)) {
						this.settingsView.detailsViewer = new TemplateDetailsViewer(selected, this.entityClient, () => !this.userCanEdit())

						this.settingsView.focusSettingsDetailsColumn()
					} else if (update.operation === OperationType.CREATE) {
						this._list.scrollToIdAndSelect(update.instanceId)
					}
				})
			}
		}).then(m.redraw.bind(m))
	}

	userCanEdit(): boolean {
		return hasCapabilityOnGroup(this.logins.getUserController().user, this.templateGroupInstance.group, ShareCapability.Write)
	}

	templateListId(): Id {
		return this.templateGroupInstance.groupRoot.templates
	}
}

export function createTemplates(gorgiasTemplates: Array<Array<string>>, templateGroupRoot: TemplateGroupRoot, entityClient: EntityClient) {
	// id,title,shortcut,subject,tags,cc,bcc,to,body
	gorgiasTemplates.forEach((gorgiasTemplate) => {
		let template = createEmailTemplate()
		let content
		const gorgiasTitle = gorgiasTemplate[1]
		const gorgiasId = gorgiasTemplate[2]
		const gorgiasTags = gorgiasTemplate[4]
		const gorgiasBody = gorgiasTemplate[8]
		template.title = gorgiasTitle.replace(/(^")|("$)/g, "") // remove quotes at the beginning and at the end

		template.tag = gorgiasId.replace(/(^")|("$)/g, "")

		// if the gorgias templates has tags, check if they include "ger" to create a german emailTemplateContent
		if (gorgiasTags) {
			if (gorgiasTags.includes("ger")) {
				content = createEmailTemplateContent({
					languageCode: "de",
					text: gorgiasBody.replace(/(^")|("$)/g, ""),
				})
				template.contents.push(content)
			} else {
				content = createEmailTemplateContent({
					languageCode: "en",
					text: gorgiasBody.replace(/(^")|("$)/g, ""),
				})
				template.contents.push(content)
			}
		} else {
			// use en as language if there are no tags in gorgias
			content = createEmailTemplateContent({
				languageCode: "en",
				text: gorgiasBody.replace(/(^")|("$)/g, ""),
			})
			template.contents.push(content)
		}

		template._ownerGroup = templateGroupRoot._id
		entityClient.setup(templateGroupRoot.templates, template)
	})
}

export class TemplateRow implements VirtualRow<EmailTemplate> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: EmailTemplate | null = null
	private selectionUpdater!: SelectableRowSelectedSetter
	private titleDom!: HTMLElement
	private idDom!: HTMLElement

	constructor() {
		this.top = 0 // is needed because of the list component
	}

	update(template: EmailTemplate, selected: boolean): void {
		if (!this.domElement) {
			return
		}

		this.selectionUpdater(selected, false)

		this.titleDom.textContent = template.title
		this.idDom.textContent = TEMPLATE_SHORTCUT_PREFIX + template.tag
	}

	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},
			m(".flex.col", [
				m("", [
					m(".text-ellipsis.badge-line-height", {
						oncreate: (vnode) => (this.titleDom = vnode.dom as HTMLElement),
					}),
				]),
				m(".smaller.mt-xxs", {
					oncreate: (vnode) => (this.idDom = vnode.dom as HTMLElement),
				}),
			]),
		)
	}
}
