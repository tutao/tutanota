import m, { Children } from "mithril"
import type { EntityUpdateData } from "../api/main/EventController"
import { isUpdateForTypeRef } from "../api/main/EventController"
import type { VirtualRow } from "../gui/base/List"
import type { UpdatableSettingsViewer } from "./SettingsView"
import { showTemplateEditor } from "./TemplateEditor"
import type { EmailTemplate, TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { createEmailTemplate, createEmailTemplateContent, EmailTemplateTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../api/common/EntityClient"
import { GENERATED_MAX_ID, isSameId } from "../api/common/utils/EntityUtils"
import { searchInTemplates, TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import { hasCapabilityOnGroup } from "../sharing/GroupUtils"
import { ShareCapability } from "../api/common/TutanotaConstants"
import type { TemplateGroupInstance } from "../templates/model/TemplateGroupModel"
import type { LoginController } from "../api/main/LoginController"
import { ListColumnWrapper } from "../gui/ListColumnWrapper"
import { memoized, noOp } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../gui/SelectableRowContainer.js"
import { ListModel } from "../misc/ListModel.js"
import Stream from "mithril/stream"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../gui/theme.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { MultiselectMode, NewList, NewListAttrs, RenderConfig } from "../gui/base/NewList.js"
import { size } from "../gui/size.js"
import { TemplateDetailsViewer } from "./TemplateDetailsViewer.js"
import { onlySingleSelection } from "../gui/base/ListUtils.js"
import { IconButton } from "../gui/base/IconButton.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../gui/base/BaseSearchBar.js"
import { lang } from "../misc/LanguageViewModel.js"

assertMainOrNode()

/**
 *  List that is rendered within the template Settings
 */
export class TemplateListView implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private resultItemIds: ReadonlyArray<IdTuple> = []
	private groupInstance: TemplateGroupInstance
	private entityClient: EntityClient
	private logins: LoginController

	private listModel: ListModel<EmailTemplate>
	private listStateSubscription: Stream<unknown> | null = null
	private readonly renderConfig: RenderConfig<EmailTemplate, TemplateRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const templateRow = new TemplateRow()
			m.render(dom, templateRow.render())
			return templateRow
		},
	}

	constructor(
		private readonly updateDetailsViewer: (viewer: TemplateDetailsViewer | null) => unknown,
		private readonly focusDetailsViewer: () => unknown,
		templateGroupInstance: TemplateGroupInstance,
		entityClient: EntityClient,
		logins: LoginController,
	) {
		this.groupInstance = templateGroupInstance
		this.entityClient = entityClient
		this.logins = logins
		this.listModel = this.makeListModel()

		this.listModel.loadInitial()

		this.view = this.view.bind(this)
	}

	private makeListModel() {
		const listModel = new ListModel<EmailTemplate>({
			topId: GENERATED_MAX_ID,
			sortCompare: (a: EmailTemplate, b: EmailTemplate) => {
				const titleA = a.title.toUpperCase()
				const titleB = b.title.toUpperCase()
				return titleA < titleB ? -1 : titleA > titleB ? 1 : 0
			},
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
		})

		listModel.setFilter((item: EmailTemplate) => this.queryFilter(item))

		this.listStateSubscription?.end(true)
		this.listStateSubscription = listModel.stateStream.map((state) => {
			this.onSelectionChanged(onlySingleSelection(state))
			m.redraw()
		})

		return listModel
	}

	view(): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: m(
					".flex.flex-space-between.center-vertically.plr-l",
					m(BaseSearchBar, {
						text: this.searchQuery,
						onInput: (text) => this.updateQuery(text),
						busy: false,
						onKeyDown: (e) => e.stopPropagation(),
						onClear: () => {
							this.searchQuery = ""
							this.resultItemIds = []
							this.listModel.reapplyFilter()
						},
						placeholder: lang.get("searchTemplates_placeholder"),
					} satisfies BaseSearchBarAttrs),
					this.userCanEdit()
						? m(
								".mr-negative-s",
								m(IconButton, {
									title: "addTemplate_label",
									icon: Icons.Add,
									click: () => {
										showTemplateEditor(null, this.groupInstance.groupRoot)
									},
								}),
						  )
						: null,
				),
			},
			this.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.list_message_bg,
						icon: Icons.ListAlt,
						message: "noEntries_msg",
				  })
				: m(NewList, {
						renderConfig: this.renderConfig,
						state: this.listModel.state,
						onLoadMore: () => this.listModel.loadMore(),
						onRetryLoading: () => this.listModel.retryLoading(),
						onStopLoading: () => this.listModel.stopLoading(),
						onSingleSelection: (item: EmailTemplate) => {
							this.listModel.onSingleSelection(item)
							this.focusDetailsViewer()
						},
						onSingleExclusiveSelection: noOp,
						selectRangeTowards: noOp,
				  } satisfies NewListAttrs<EmailTemplate, TemplateRow>),
		)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(EmailTemplateTypeRef, update) && isSameId(this.templateListId(), update.instanceListId)) {
				await this.listModel.entityEventReceived(update.instanceId, update.operation)
			}

			m.redraw()
		}
	}

	private readonly onSelectionChanged = memoized((item: EmailTemplate | null) => {
		const detailsViewer = item == null ? null : new TemplateDetailsViewer(item, this.entityClient, () => !this.userCanEdit())
		this.updateDetailsViewer(detailsViewer)
	})

	private queryFilter(item: EmailTemplate) {
		return this.resultItemIds.length === 0 && this.searchQuery === "" ? true : this.resultItemIds.includes(item._id)
	}

	private updateQuery(query: string) {
		this.searchQuery = query
		this.resultItemIds = searchInTemplates(this.searchQuery, this.listModel.getUnfilteredAsArray()).map((item) => item._id)
		this.listModel.reapplyFilter()
	}

	userCanEdit(): boolean {
		return hasCapabilityOnGroup(this.logins.getUserController().user, this.groupInstance.group, ShareCapability.Write)
	}

	templateListId(): Id {
		return this.groupInstance.groupRoot.templates
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
	top: number = 0
	domElement: HTMLElement | null = null // set from List

	entity: EmailTemplate | null = null
	private selectionUpdater!: SelectableRowSelectedSetter
	private titleDom!: HTMLElement
	private idDom!: HTMLElement

	constructor() {}

	update(template: EmailTemplate, selected: boolean): void {
		this.entity = template

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
