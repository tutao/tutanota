import m, { Children } from "mithril"
import type { UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "./SettingsView"
import type { KnowledgeBaseEntry, TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { KnowledgeBaseEntryTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { lang } from "../misc/LanguageViewModel"
import type { EntityUpdateData } from "../api/main/EventController"
import { isUpdateForTypeRef } from "../api/main/EventController"
import { size } from "../gui/size"
import { EntityClient } from "../api/common/EntityClient"
import { GENERATED_MAX_ID, isSameId, listIdPart } from "../api/common/utils/EntityUtils"
import { hasCapabilityOnGroup } from "../sharing/GroupUtils"
import { ShareCapability } from "../api/common/TutanotaConstants"
import type { LoginController } from "../api/main/LoginController"
import type { Group } from "../api/entities/sys/TypeRefs.js"
import { ListColumnWrapper } from "../gui/ListColumnWrapper"
import { KnowledgeBaseEntryView } from "../knowledgebase/view/KnowledgeBaseEntryView"
import { memoized, NBSP, noOp } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../gui/SelectableRowContainer.js"
import { ListModel } from "../misc/ListModel.js"
import { listSelectionKeyboardShortcuts, onlySingleSelection, VirtualRow } from "../gui/base/ListUtils.js"
import Stream from "mithril/stream"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../gui/base/List.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../gui/base/BaseSearchBar.js"
import { IconButton } from "../gui/base/IconButton.js"
import { Icons } from "../gui/base/icons/Icons.js"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../gui/theme.js"
import { knowledgeBaseSearch } from "../knowledgebase/model/KnowledgeBaseSearchFilter.js"
import { showKnowledgeBaseEditor } from "./KnowledgeBaseEditor.js"
import { keyManager } from "../misc/KeyManager.js"

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
			topId: GENERATED_MAX_ID,
			sortCompare: (a: KnowledgeBaseEntry, b: KnowledgeBaseEntry) => {
				var titleA = a.title.toUpperCase()
				var titleB = b.title.toUpperCase()
				return titleA < titleB ? -1 : titleA > titleB ? 1 : 0
			},
			fetch: async (startId, count) => {
				// fetch works like in ContactListView, because we have a custom sort order there too
				if (startId === GENERATED_MAX_ID) {
					// load all entries at once to apply custom sort order
					const allEntries = await this.entityClient.loadAll(KnowledgeBaseEntryTypeRef, this.getListId())
					return { items: allEntries, complete: true }
				} else {
					throw new Error("fetch knowledgeBase entry called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this.entityClient.load<KnowledgeBaseEntry>(KnowledgeBaseEntryTypeRef, [this.getListId(), elementId])
			},
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
				await this.listModel.entityEventReceived(update.instanceId, update.operation)
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
