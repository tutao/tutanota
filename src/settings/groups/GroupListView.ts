import m, { Children } from "mithril"
import type { VirtualRow } from "../../gui/base/List.js"
import type { GroupInfo, GroupMembership } from "../../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupMemberTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { LazyLoaded, memoized, noOp } from "@tutao/tutanota-utils"
import type { UpdatableSettingsViewer } from "../SettingsView.js"
import { GroupDetailsView } from "./GroupDetailsView.js"
import * as AddGroupDialog from "./AddGroupDialog.js"
import { Icon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { OperationType } from "../../api/common/TutanotaConstants.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import type { EntityUpdateData } from "../../api/main/EventController.js"
import { isUpdateForTypeRef } from "../../api/main/EventController.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { locator } from "../../api/main/MainLocator.js"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { GroupDetailsModel } from "./GroupDetailsModel.js"
import { SelectableRowContainer, SelectableRowSelectedSetter, setVisibility } from "../../gui/SelectableRowContainer.js"
import Stream from "mithril/stream"
import { MultiselectMode, NewList, NewListAttrs, RenderConfig } from "../../gui/base/NewList.js"
import { size } from "../../gui/size.js"
import { GENERATED_MAX_ID } from "../../api/common/utils/EntityUtils.js"
import { ListModel } from "../../misc/ListModel.js"
import { compareGroupInfos } from "../../api/common/utils/GroupUtils.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import { listSelectionKeyboardShortcuts, onlySingleSelection } from "../../gui/base/ListUtils.js"
import { keyManager } from "../../misc/KeyManager.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../gui/base/BaseSearchBar.js"
import { lang } from "../../misc/LanguageViewModel.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"

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
	private searchResultStreamDependency: Stream<any>
	private localAdminGroupMemberships: GroupMembership[]
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
		this.localAdminGroupMemberships = locator.logins.getUserController().getLocalAdminGroupMemberships()

		this.listModel.loadInitial()

		this.listId.getAsync().then((listId) => {
			locator.search.setGroupInfoRestrictionListId(listId)
		})

		this.searchResultStreamDependency = locator.search.lastSelectedGroupInfoResult.map((groupInfo) => {
			if (this.listId.isLoaded() && this.listId.getSync() === groupInfo._id[0]) {
				this.listModel.loadAndSelect(groupInfo._id[1], () => false)
			}
		})

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
						placeholder: lang.get("searchGroups_placeholder"),
					} satisfies BaseSearchBarAttrs),
					m(
						".mr-negative-s",
						m(Button, {
							label: "addGroup_label",
							type: ButtonType.Primary,
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
				: m(NewList, {
						renderConfig: this.renderConfig,
						state: this.listModel.state,
						onLoadMore: () => this.listModel.loadMore(),
						onRetryLoading: () => this.listModel.retryLoading(),
						onStopLoading: () => this.listModel.stopLoading(),
						onSingleSelection: (item: GroupInfo) => {
							this.listModel.onSingleSelection(item)
							this.focusDetailsViewer()
						},
						onSingleExclusiveSelection: noOp,
						selectRangeTowards: noOp,
				  } satisfies NewListAttrs<GroupInfo, GroupRow>),
		)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)

		if (this.searchResultStreamDependency) {
			this.searchResultStreamDependency.end(true)
		}
		this.listStateSubscription?.end(true)
	}

	addButtonClicked() {
		AddGroupDialog.show()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this.listId.getSync() === instanceListId) {
				await this.listModel.entityEventReceived(instanceId, operation)
			} else if (isUpdateForTypeRef(GroupMemberTypeRef, update)) {
				let oldLocalAdminGroupMembership = this.localAdminGroupMemberships.find((gm) => gm.groupMember[1] === instanceId)

				let newLocalAdminGroupMembership = locator.logins
					.getUserController()
					.getLocalAdminGroupMemberships()
					.find((gm) => gm.groupMember[1] === instanceId)
				let promise = Promise.resolve()

				if (operation === OperationType.CREATE && !oldLocalAdminGroupMembership && newLocalAdminGroupMembership) {
					promise = this.listModel.entityEventReceived(newLocalAdminGroupMembership.groupInfo[1], operation)
				} else if (operation === OperationType.DELETE && oldLocalAdminGroupMembership && !newLocalAdminGroupMembership) {
					promise = this.listModel.entityEventReceived(oldLocalAdminGroupMembership.groupInfo[1], operation)
				}

				this.localAdminGroupMemberships = locator.logins.getUserController().getLocalAdminGroupMemberships()
				this.listModel.reapplyFilter()
			}

			m.redraw()
		}
	}

	private makeListModel(): ListModel<GroupInfo> {
		const listModel = new ListModel<GroupInfo>({
			topId: GENERATED_MAX_ID,
			sortCompare: compareGroupInfos,
			fetch: async (startId) => {
				if (startId === GENERATED_MAX_ID) {
					const listId = await this.listId.getAsync()
					const allGroupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, listId)

					return { items: allGroupInfos, complete: true }
				} else {
					throw new Error("fetch user group infos called for specific start id")
				}
			},
			loadSingle: async (elementId) => {
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
		})

		listModel.setFilter((item: GroupInfo) => this.groupFilter(item) && this.queryFilter(item))

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
		return (
			gi.name.includes(this.searchQuery) ||
			(!!gi.mailAddress && gi.mailAddress?.includes(this.searchQuery)) ||
			gi.mailAddressAliases.some((mai) => mai.mailAddress.includes(this.searchQuery))
		)
	}

	private groupFilter = (gi: GroupInfo) => {
		if (locator.logins.getUserController().isGlobalAdmin()) {
			return true
		} else {
			return !!gi.localAdmin && this.localAdminGroupMemberships.map((gm) => gm.group).includes(gi.localAdmin)
		}
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
