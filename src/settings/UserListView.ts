import m, { Children } from "mithril"
import type { VirtualRow } from "../gui/base/List.js"
import { NotFoundError } from "../api/common/error/RestError.js"
import { size } from "../gui/size.js"
import type { GroupInfo, User } from "../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupMemberTypeRef } from "../api/entities/sys/TypeRefs.js"
import { contains, LazyLoaded, memoized, noOp } from "@tutao/tutanota-utils"
import { UserViewer } from "./UserViewer.js"
import type { UpdatableSettingsViewer } from "./SettingsView.js"
import { FeatureType, GroupType } from "../api/common/TutanotaConstants.js"
import { Icon } from "../gui/base/Icon.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { BootIcons } from "../gui/base/icons/BootIcons.js"
import type { EntityUpdateData } from "../api/main/EventController.js"
import { isUpdateFor, isUpdateForTypeRef } from "../api/main/EventController.js"
import { compareGroupInfos } from "../api/common/utils/GroupUtils.js"
import { elementIdPart, GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"
import { ListColumnWrapper } from "../gui/ListColumnWrapper.js"
import { assertMainOrNode } from "../api/common/Env.js"
import { locator } from "../api/main/MainLocator.js"
import Stream from "mithril/stream"
import * as AddUserDialog from "./AddUserDialog.js"
import { SelectableRowContainer, SelectableRowSelectedSetter, setVisibility } from "../gui/SelectableRowContainer.js"
import { ListModel } from "../misc/ListModel.js"
import { MultiselectMode, NewList, NewListAttrs, RenderConfig } from "../gui/base/NewList.js"
import { listSelectionKeyboardShortcuts, onlySingleSelection } from "../gui/base/ListUtils.js"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../gui/theme.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../gui/base/BaseSearchBar.js"
import { IconButton } from "../gui/base/IconButton.js"
import { attachDropdown } from "../gui/base/Dropdown.js"
import { lang } from "../misc/LanguageViewModel.js"
import { keyManager } from "../misc/KeyManager.js"

assertMainOrNode()

/**
 * Displays a list with users that are available to manage by the current user.
 * Global admins see all users.
 * Local admins see only their assigned users.
 */
export class UserListView implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private listModel: ListModel<GroupInfo>
	private readonly renderConfig: RenderConfig<GroupInfo, UserRow> = {
		createElement: (dom) => {
			const row = new UserRow((groupInfo) => this.isAdmin(groupInfo))
			m.render(dom, row.render())
			return row
		},
		itemHeight: size.list_row_height,
		swipe: null,
		multiselectionAllowed: MultiselectMode.Disabled,
	}

	private readonly listId: LazyLoaded<Id>
	private readonly searchResultSubscription: Stream<unknown>
	private adminUserGroupInfoIds: Id[] = []
	private listStateSubscription: Stream<unknown> | null = null

	constructor(
		private readonly updateDetailsViewer: (viewer: UserViewer | null) => unknown,
		private readonly focusDetailsViewer: () => unknown,
		private readonly canImportUsers: () => boolean,
		private readonly onImportUsers: () => unknown,
		private readonly onExportUsers: () => unknown,
	) {
		// doing it after "onSelectionChanged" is initialized
		this.listModel = this.makeListModel()
		this.listId = new LazyLoaded(async () => {
			const customer = await locator.logins.getUserController().loadCustomer()
			return customer.userGroups
		})

		this.listModel.loadInitial()

		this.listId.getAsync().then((listId) => {
			locator.search.setGroupInfoRestrictionListId(listId)
		})

		this.searchResultSubscription = locator.search.lastSelectedGroupInfoResult.map((groupInfo) => {
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
		if (locator.logins.isEnabled(FeatureType.WhitelabelChild)) {
			return null
		}

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
						placeholder: lang.get("searchUsers_placeholder"),
					} satisfies BaseSearchBarAttrs),
					m(
						".mr-negative-s",
						m(IconButton, {
							title: "addUsers_action",
							icon: Icons.Add,
							click: () => this.addButtonClicked(),
						}),
						this.renderImportButton(),
					),
				),
			},
			this.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.list_message_bg,
						icon: BootIcons.Contacts,
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
				  } satisfies NewListAttrs<GroupInfo, UserRow>),
		)
	}

	private renderImportButton() {
		if (this.canImportUsers()) {
			return m(
				IconButton,
				attachDropdown({
					mainButtonAttrs: {
						title: "more_label",
						icon: Icons.More,
					},
					childAttrs: () => [
						{
							label: "importUsers_action",
							click: () => {
								this.onImportUsers()
							},
						},
						{
							label: "exportUsers_action",
							click: () => {
								this.onExportUsers()
							},
						},
					],
				}),
			)
		} else {
			return null
		}
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)

		if (this.searchResultSubscription) {
			this.searchResultSubscription.end(true)
		}
		this.listStateSubscription?.end(true)
	}

	private async loadAdmins(): Promise<void> {
		const adminGroupMembership = locator.logins.getUserController().user.memberships.find((gm) => gm.groupType === GroupType.Admin)
		if (adminGroupMembership == null) {
			return
		}
		const members = await locator.entityClient.loadAll(GroupMemberTypeRef, adminGroupMembership.groupMember[0])
		this.adminUserGroupInfoIds = members.map((adminGroupMember) => elementIdPart(adminGroupMember.userGroupInfo))
	}

	private isAdmin(userGroupInfo: GroupInfo): boolean {
		return contains(this.adminUserGroupInfoIds, userGroupInfo._id[1])
	}

	private addButtonClicked() {
		AddUserDialog.show()
	}

	async entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this.listId.getSync() === instanceListId) {
				await this.listModel.entityEventReceived(instanceId, operation)
			} else if (isUpdateFor(locator.logins.getUserController().user, update)) {
				await this.loadAdmins()
				this.listModel.reapplyFilter()
			}
			m.redraw()
		}
	}

	private readonly localAdminGroups = memoized((user: User) => {
		return locator.logins
			.getUserController()
			.getLocalAdminGroupMemberships()
			.map((gm) => gm.group)
	})

	private makeListModel(): ListModel<GroupInfo> {
		const listModel = new ListModel<GroupInfo>({
			topId: GENERATED_MAX_ID,
			sortCompare: compareGroupInfos,
			fetch: async (startId) => {
				if (startId !== GENERATED_MAX_ID) {
					throw new Error("fetch user group infos called for specific start id")
				}
				await this.loadAdmins()
				const listId = await this.listId.getAsync()
				const allUserGroupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, listId)

				return { items: allUserGroupInfos, complete: true }
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

		listModel.setFilter((gi) => this.groupFilter(gi) && this.queryFilter(gi))

		this.listStateSubscription?.end(true)
		this.listStateSubscription = listModel.stateStream.map((state) => {
			this.onSelectionChanged(onlySingleSelection(state))
			m.redraw()
		})
		return listModel
	}

	private readonly onSelectionChanged = memoized((item: GroupInfo | null) => {
		const detailsViewer = item == null ? null : new UserViewer(item, this.isAdmin(item))
		this.updateDetailsViewer(detailsViewer)
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
			return !!gi.localAdmin && this.localAdminGroups(locator.logins.getUserController().user).includes(gi.localAdmin)
		}
	}

	private updateQuery(query: string) {
		this.searchQuery = query
		this.listModel.reapplyFilter()
	}
}

export class UserRow implements VirtualRow<GroupInfo> {
	top: number = 0
	domElement: HTMLElement | null = null // set from List
	entity: GroupInfo | null = null
	private nameDom!: HTMLElement
	private addressDom!: HTMLElement
	private adminIconDom!: HTMLElement
	private deletedIconDom!: HTMLElement
	private selectionUpdater!: SelectableRowSelectedSetter

	constructor(private readonly isAdmin: (groupInfo: GroupInfo) => boolean) {}

	update(groupInfo: GroupInfo, selected: boolean): void {
		this.entity = groupInfo

		this.selectionUpdater(selected, false)

		this.nameDom.textContent = groupInfo.name
		this.addressDom.textContent = groupInfo.mailAddress ? groupInfo.mailAddress : ""

		setVisibility(this.adminIconDom, this.isAdmin(groupInfo))
		setVisibility(this.deletedIconDom, groupInfo.deleted != null)
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
							icon: BootIcons.Settings,
							oncreate: (vnode) => (this.adminIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
						m(Icon, {
							icon: Icons.Trash,
							oncreate: (vnode) => (this.deletedIconDom = vnode.dom as HTMLElement),
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
