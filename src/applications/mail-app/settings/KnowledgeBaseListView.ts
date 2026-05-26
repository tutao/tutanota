import m, { Children } from "mithril"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { KnowledgeBaseEntry, KnowledgeBaseEntryTypeRef, TemplateGroupRoot } from "@tutao/entities/tutanota"
import { Group } from "@tutao/entities/sys"
import { hasCapabilityOnGroup } from "../../../entities/sys/Utils"
import { component_size } from "../../../ui/size"
import { EntityClient } from "../../../platform-kits/network/EntityClient"
import { assertMainOrNode, ShareCapability } from "../../../platform-kits/app-env"
import type { LoginController } from "../../common/api/main/LoginController"
import { ListColumnWrapper } from "../../../ui/ListColumnWrapper"
import { KnowledgeBaseEntryView } from "../knowledgebase/view/KnowledgeBaseEntryView"
import { memoized, NBSP, noOp } from "../../../platform-kits/utils"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../../../ui/SelectableRowContainer.js"
import { ListElementListModel } from "../../common/misc/ListElementListModel.js"
import { listSelectionKeyboardShortcuts, onlySingleSelection, VirtualRow } from "../../../ui/base/ListUtils.js"
import Stream from "mithril/stream"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../../ui/base/List.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../ui/base/BaseSearchBar.js"
import { IconButton } from "../../../ui/base/IconButton.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import ColumnEmptyMessageBox from "../../../ui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../ui/theme.js"
import { knowledgeBaseSearch } from "../knowledgebase/model/KnowledgeBaseSearchFilter.js"
import { showKnowledgeBaseEditor } from "./KnowledgeBaseEditor.js"
import { keyManager } from "../../../ui/utils/KeyManager.js"
import { ListAutoSelectBehavior } from "../../common/misc/DeviceConfig.js"
import { UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kits/instance-pipeline/utils/EntityUpdateUtils"
import { isSameId, listIdPart } from "../../../platform-kits/meta"

assertMainOrNode()

/**
 *  List that is rendered within the knowledgeBase Settings
 */
export class KnowledgeBaseListView implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private resultItemIds: Array<IdTuple> = []

	private listModel: ListElementListModel<KnowledgeBaseEntry>
	private listStateSubscription: Stream<unknown> | null = null
	private readonly renderConfig: RenderConfig<KnowledgeBaseEntry, KnowledgeBaseRow> = {
		itemHeight: component_size.list_row_height,
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
		const listModel = new ListElementListModel<KnowledgeBaseEntry>({
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
					".flex.flex-space-between.center-vertically.plr-24",
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
								".mr-negative-8",
								m(IconButton, {
									title: "addEntry_label",
									icon: Icons.Plus,
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
						color: theme.on_surface_variant,
						icon: Icons.BookFilled,
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
				class: "pt-12 pb-12 pl-12 pr-12",
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},
			m(".flex.col", [
				m(".text-ellipsis.badge-line-height", {
					oncreate: (vnode) => (this.entryTitleDom = vnode.dom as HTMLElement),
				}),
				// to create a second row
				m(".smaller.mt-4", NBSP),
			]),
		)
	}
}

export class KnowledgeBaseSettingsDetailsViewer implements UpdatableSettingsDetailsViewer {
	constructor(
		private readonly entry: KnowledgeBaseEntry,
		private readonly readonly: boolean,
	) {}

	renderView(): Children {
		return m(
			".plr-24",
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
