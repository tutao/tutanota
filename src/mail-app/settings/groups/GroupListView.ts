import m, { Children } from "mithril"
import type { GroupInfo } from "../../../common/api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupMemberTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import { LazyLoaded, memoized, noOp } from "@tutao/tutanota-utils"
import { GroupDetailsView } from "../../../common/settings/groups/GroupDetailsView.js"
import * as AddGroupDialog from "./AddGroupDialog.js"
import { Icon } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { ListColumnWrapper } from "../../../common/gui/ListColumnWrapper.js"
import { assertMainOrNode } from "../../../common/api/common/Env.js"
import { GroupDetailsModel } from "./GroupDetailsModel.js"
import { SelectableRowContainer, SelectableRowSelectedSetter, setVisibility } from "../../../common/gui/SelectableRowContainer.js"
import Stream from "mithril/stream"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../../common/gui/base/List.js"
import { size } from "../../../common/gui/size.js"
import { ListModel } from "../../../common/misc/ListModel.js"
import { compareGroupInfos } from "../../../common/api/common/utils/GroupUtils.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { listSelectionKeyboardShortcuts, onlySingleSelection, VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { keyManager } from "../../../common/misc/KeyManager.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../common/gui/base/BaseSearchBar.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../common/gui/theme.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { NewPaidPlans } from "../../../common/api/common/TutanotaConstants.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"

assertMainOrNode()
const className = "group-list"

export class GroupListView implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private listModel: ListModel<GroupInfo>
	private readonly renderConfig: RenderConfig<GroupInfo, GroupRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const groupRow = new GroupRow()
			m.render(dom, groupRow.render())
			return groupRow
		},
	}

	private listId: LazyLoaded<Id>
	private listStateSubscription: Stream<unknown> | null = null

	constructor(private readonly updateDetailsViewer: (viewer: GroupDetailsView | null) => unknown, private readonly focusDetailsViewer: () => unknown) {
		this.listModel = this.makeListModel()
		this.listId = new LazyLoaded(() => {
			return locator.logins
				.getUserController()
				.loadCustomer()
				.then((customer) => {
					return customer.teamGroups
				})
		})

		this.listModel.loadInitial()

		this.oncreate = this.oncreate.bind(this)
		this.onremove = this.onremove.bind(this)
		this.view = this.view.bind(this)
	}

	private readonly shortcuts = listSelectionKeyboardShortcuts(MultiselectMode.Disabled, () => this.listModel)

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
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
							this.listModel.reapplyFilter()
						},
						placeholder: lang.get("searchMailboxes_placeholder"),
					} satisfies BaseSearchBarAttrs),
					m(
						".mr-negative-s",
						m(IconButton, {
							title: "createSharedMailbox_label",
							icon: Icons.Add,
							click: () => this.addButtonClicked(),
						}),
					),
				),
			},
			this.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.list_message_bg,
						icon: Icons.People,
						message: "noEntries_msg",
				  })
				: m(List, {
						renderConfig: this.renderConfig,
						state: this.listModel.state,
						onLoadMore: () => this.listModel.loadMore(),
						onRetryLoading: () => this.listModel.retryLoading(),
						onStopLoading: () => this.listModel.stopLoading(),
						onSingleSelection: (item: GroupInfo) => {
							this.listModel.onSingleSelection(item)
							this.focusDetailsViewer()
						},
						onSingleTogglingMultiselection: noOp,
						onRangeSelectionTowards: noOp,
				  } satisfies ListAttrs<GroupInfo, GroupRow>),
		)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)

		this.listStateSubscription?.end(true)
	}

	async addButtonClicked() {
		if (await locator.logins.getUserController().isNewPaidPlan()) {
			AddGroupDialog.show()
		} else {
			const msg = lang.get("newPaidPlanRequired_msg") + " " + lang.get("sharedMailboxesMultiUser_msg")
			const wizard = await import("../../../common/subscription/UpgradeSubscriptionWizard")
			await wizard.showUpgradeWizard(locator.logins, NewPaidPlans, () => msg)
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this.listId.getSync() === instanceListId) {
				await this.listModel.entityEventReceived(instanceListId, instanceId, operation)
			} else if (isUpdateForTypeRef(GroupMemberTypeRef, update)) {
				this.listModel.reapplyFilter()
			}

			m.redraw()
		}
	}

	private makeListModel(): ListModel<GroupInfo> {
		const listModel = new ListModel<GroupInfo>({
			sortCompare: compareGroupInfos,
			fetch: async (_lastFetchedEntity, _count) => {
				// load all entries at once to apply custom sort order
				const listId = await this.listId.getAsync()
				const allGroupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, listId)

				return { items: allGroupInfos, complete: true }
			},
			loadSingle: async (_listId: Id, elementId: Id) => {
				const listId = await this.listId.getAsync()
				try {
					return await locator.entityClient.load<GroupInfo>(GroupInfoTypeRef, [listId, elementId])
				} catch (e) {
					if (e instanceof NotFoundError) {
						// we return null if the GroupInfo does not exist
						return null
					} else {
						throw e
					}
				}
			},
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})

		listModel.setFilter((item: GroupInfo) => this.groupFilter() && this.queryFilter(item))

		this.listStateSubscription?.end(true)
		this.listStateSubscription = listModel.stateStream.map((state) => {
			this.onSelectionChanged(onlySingleSelection(state))
			m.redraw()
		})

		return listModel
	}

	private readonly onSelectionChanged = memoized((item: GroupInfo | null) => {
		if (item) {
			const newSelectionModel = new GroupDetailsModel(item, locator.entityClient, m.redraw)
			const detailsViewer = item == null ? null : new GroupDetailsView(newSelectionModel)
			this.updateDetailsViewer(detailsViewer)
		}
	})

	private queryFilter(gi: GroupInfo) {
		const lowercaseSearch = this.searchQuery.toLowerCase()
		return gi.name.toLowerCase().includes(lowercaseSearch) || (!!gi.mailAddress && gi.mailAddress?.toLowerCase().includes(lowercaseSearch))
	}

	private groupFilter = () => {
		return locator.logins.getUserController().isGlobalAdmin()
	}

	private updateQuery(query: string) {
		this.searchQuery = query
		this.listModel.reapplyFilter()
	}
}

export class GroupRow implements VirtualRow<GroupInfo> {
	top: number = 0
	domElement: HTMLElement | null = null // set from List
	entity: GroupInfo | null = null
	private nameDom!: HTMLElement
	private addressDom!: HTMLElement
	private deletedIconDom!: HTMLElement
	private localAdminIconDom!: HTMLElement
	private mailIconDom!: HTMLElement
	private selectionUpdater!: SelectableRowSelectedSetter

	constructor() {}

	update(groupInfo: GroupInfo, selected: boolean): void {
		this.entity = groupInfo

		this.selectionUpdater(selected, false)

		this.nameDom.textContent = groupInfo.name
		this.addressDom.textContent = groupInfo.mailAddress ?? ""
		setVisibility(this.deletedIconDom, groupInfo.deleted != null)

		// mail group or local admin group
		if (groupInfo.mailAddress) {
			this.localAdminIconDom.style.display = "none"
			this.mailIconDom.style.display = ""
		} else {
			this.localAdminIconDom.style.display = ""
			this.mailIconDom.style.display = "none"
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},
			m(".flex.col.flex-grow", [
				m(".badge-line-height", [
					m("", {
						oncreate: (vnode) => (this.nameDom = vnode.dom as HTMLElement),
					}),
				]),
				m(".flex-space-between.mt-xxs", [
					m(".smaller", {
						oncreate: (vnode) => (this.addressDom = vnode.dom as HTMLElement),
					}),
					m(".icons.flex", [
						m(Icon, {
							icon: Icons.Trash,
							oncreate: (vnode) => (this.deletedIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
						m(Icon, {
							icon: BootIcons.Settings,
							oncreate: (vnode) => (this.localAdminIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
						m(Icon, {
							icon: BootIcons.Mail,
							oncreate: (vnode) => (this.mailIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
					]),
				]),
			]),
		)
	}
}
