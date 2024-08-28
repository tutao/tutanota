import m, { Children } from "mithril"
import type { KnowledgeBaseEntry, TemplateGroupRoot } from "../../common/api/entities/tutanota/TypeRefs.js"
import { KnowledgeBaseEntryTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import { lang } from "../../common/misc/LanguageViewModel"

import { size } from "../../common/gui/size"
import { EntityClient } from "../../common/api/common/EntityClient"
import { isSameId, listIdPart } from "../../common/api/common/utils/EntityUtils"
import { hasCapabilityOnGroup } from "../../common/sharing/GroupUtils"
import { ShareCapability } from "../../common/api/common/TutanotaConstants"
import type { LoginController } from "../../common/api/main/LoginController"
import type { Group } from "../../common/api/entities/sys/TypeRefs.js"
import { ListColumnWrapper } from "../../common/gui/ListColumnWrapper"
import { KnowledgeBaseEntryView } from "../knowledgebase/view/KnowledgeBaseEntryView"
import { memoized, NBSP, noOp } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../common/api/common/Env"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../../common/gui/SelectableRowContainer.js"
import { ListModel } from "../../common/misc/ListModel.js"
import { listSelectionKeyboardShortcuts, onlySingleSelection, VirtualRow } from "../../common/gui/base/ListUtils.js"
import Stream from "mithril/stream"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../common/gui/base/List.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../common/gui/base/BaseSearchBar.js"
import { IconButton } from "../../common/gui/base/IconButton.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import ColumnEmptyMessageBox from "../../common/gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../common/gui/theme.js"
import { knowledgeBaseSearch } from "../knowledgebase/model/KnowledgeBaseSearchFilter.js"
import { showKnowledgeBaseEditor } from "./KnowledgeBaseEditor.js"
import { keyManager } from "../../common/misc/KeyManager.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { ListAutoSelectBehavior } from "../../common/misc/DeviceConfig.js"
import { UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"

assertMainOrNode()

/**
 *  List that is rendered within the knowledgeBase Settings
 */
export class KnowledgeBaseListView implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private resultItemIds: Array<IdTuple> = []

	private listModel: ListModel<KnowledgeBaseEntry>
	private listStateSubscription: Stream<unknown> | null = null
	private readonly renderConfig: RenderConfig<KnowledgeBaseEntry, KnowledgeBaseRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const knowledgebaseRow = new KnowledgeBaseRow()
			m.render(dom, knowledgebaseRow.render())
			return knowledgebaseRow
		},
	}
	private readonly shortcuts = listSelectionKeyboardShortcuts(MultiselectMode.Disabled, () => this.listModel)

	constructor(
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
		private readonly templateGroupRoot: TemplateGroupRoot,
		private readonly templateGroup: Group,
		private readonly updateDetailsViewer: (viewer: KnowledgeBaseSettingsDetailsViewer | null) => unknown,
		private readonly focusDetailsViewer: () => unknown,
	) {
		this.listModel = this.makeListModel()

		this.listModel.loadInitial()

		// hacks for old components
		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
		this.onremove = this.onremove.bind(this)
	}

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	private makeListModel() {
		const listModel = new ListModel<KnowledgeBaseEntry>({
			sortCompare: (a: KnowledgeBaseEntry, b: KnowledgeBaseEntry) => {
				const titleA = a.title.toUpperCase()
				const titleB = b.title.toUpperCase()
				return titleA < titleB ? -1 : titleA > titleB ? 1 : 0
			},
			fetch: async (_lastFetchedEntity, _count) => {
				// load all entries at once to apply custom sort order
				const allEntries = await this.entityClient.loadAll(KnowledgeBaseEntryTypeRef, this.getListId())
				return { items: allEntries, complete: true }
			},
			loadSingle: (_listId: Id, elementId: Id) => {
				return this.entityClient.load<KnowledgeBaseEntry>(KnowledgeBaseEntryTypeRef, [this.getListId(), elementId])
			},
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})

		listModel.setFilter((item: KnowledgeBaseEntry) => this.queryFilter(item))

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
						placeholder: lang.get("searchKnowledgebase_placeholder"),
					} satisfies BaseSearchBarAttrs),
					this.userCanEdit()
						? m(
								".mr-negative-s",
								m(IconButton, {
									title: "addEntry_label",
									icon: Icons.Add,
									click: () => {
										showKnowledgeBaseEditor(null, this.templateGroupRoot)
									},
								}),
						  )
						: null,
				),
			},
			this.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.list_message_bg,
						icon: Icons.Book,
						message: "noEntries_msg",
				  })
				: m(List, {
						renderConfig: this.renderConfig,
						state: this.listModel.state,
						onLoadMore: () => this.listModel.loadMore(),
						onRetryLoading: () => this.listModel.retryLoading(),
						onStopLoading: () => this.listModel.stopLoading(),
						onSingleSelection: (item: KnowledgeBaseEntry) => {
							this.listModel.onSingleSelection(item)
							this.focusDetailsViewer()
						},
						onSingleTogglingMultiselection: noOp,
						onRangeSelectionTowards: noOp,
				  } satisfies ListAttrs<KnowledgeBaseEntry, KnowledgeBaseRow>),
		)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<any> {
		for (const update of updates) {
			if (isUpdateForTypeRef(KnowledgeBaseEntryTypeRef, update) && isSameId(this.getListId(), update.instanceListId)) {
				await this.listModel.entityEventReceived(update.instanceListId, update.instanceId, update.operation)
			}
		}

		// we need to make another search in case items have changed
		this.updateQuery(this.searchQuery)
		m.redraw()
	}

	private readonly onSelectionChanged = memoized((item: KnowledgeBaseEntry | null) => {
		const detailsViewer = item == null ? null : new KnowledgeBaseSettingsDetailsViewer(item, !this.userCanEdit())
		this.updateDetailsViewer(detailsViewer)
	})

	private queryFilter(item: KnowledgeBaseEntry) {
		return this.searchQuery === "" ? true : this.resultItemIds.includes(item._id)
	}

	private updateQuery(query: string) {
		this.searchQuery = query
		this.resultItemIds = knowledgeBaseSearch(this.searchQuery, this.listModel.getUnfilteredAsArray()).map((item) => item._id)
		this.listModel.reapplyFilter()
	}

	userCanEdit(): boolean {
		return hasCapabilityOnGroup(this.logins.getUserController().user, this.templateGroup, ShareCapability.Write)
	}

	getListId(): Id {
		return this.templateGroupRoot.knowledgeBase
	}
}

export class KnowledgeBaseRow implements VirtualRow<KnowledgeBaseEntry> {
	top: number = 0
	domElement: HTMLElement | null = null
	entity: KnowledgeBaseEntry | null = null
	private entryTitleDom!: HTMLElement
	private selectionUpdater!: SelectableRowSelectedSetter

	update(entry: KnowledgeBaseEntry, selected: boolean): void {
		this.entity = entry

		this.selectionUpdater(selected, false)

		this.entryTitleDom.textContent = entry.title
	}

	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},
			m(".flex.col", [
				m(".text-ellipsis.badge-line-height", {
					oncreate: (vnode) => (this.entryTitleDom = vnode.dom as HTMLElement),
				}),
				// to create a second row
				m(".smaller.mt-xxs", NBSP),
			]),
		)
	}
}

export class KnowledgeBaseSettingsDetailsViewer implements UpdatableSettingsDetailsViewer {
	constructor(private readonly entry: KnowledgeBaseEntry, private readonly readonly: boolean) {}

	renderView(): Children {
		return m(
			".plr-l",
			m(KnowledgeBaseEntryView, {
				entry: this.entry,
				onTemplateSelected: (templateId) => m.route.set(`/settings/templates/${listIdPart(templateId)}}`),
				readonly: this.readonly,
			}),
		)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<any> {
		return Promise.resolve()
	}
}
