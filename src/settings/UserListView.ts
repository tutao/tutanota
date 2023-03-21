import m, { Children } from "mithril"
import type { VirtualRow } from "../gui/base/List.js"
import { List } from "../gui/base/List.js"
import { lang } from "../misc/LanguageViewModel.js"
import { NotFoundError } from "../api/common/error/RestError.js"
import { size } from "../gui/size.js"
import type { GroupInfo } from "../api/entities/sys/TypeRefs.js"
import { CustomerTypeRef, GroupInfoTypeRef, GroupMemberTypeRef, UserTypeRef } from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, contains, LazyLoaded, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils"
import { UserViewer } from "./UserViewer.js"
import type { SettingsView, UpdatableSettingsViewer } from "./SettingsView.js"
import { FeatureType, GroupType, OperationType } from "../api/common/TutanotaConstants.js"
import { Icon } from "../gui/base/Icon.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { BootIcons } from "../gui/base/icons/BootIcons.js"
import type { EntityUpdateData } from "../api/main/EventController.js"
import { isUpdateForTypeRef } from "../api/main/EventController.js"
import { Button, ButtonType } from "../gui/base/Button.js"
import { compareGroupInfos } from "../api/common/utils/GroupUtils.js"
import { elementIdPart, GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"
import { ListColumnWrapper } from "../gui/ListColumnWrapper.js"
import { assertMainOrNode } from "../api/common/Env.js"
import { locator } from "../api/main/MainLocator.js"
import Stream from "mithril/stream"
import { showNotAvailableForFreeDialog } from "../misc/SubscriptionDialogs.js"
import * as AddUserDialog from "./AddUserDialog.js"

assertMainOrNode()
const className = "user-list"

export class UserListView implements UpdatableSettingsViewer {
	readonly list: List<GroupInfo, UserRow>

	private readonly listId: LazyLoaded<Id>
	private readonly searchResultStreamDependency: Stream<any>
	private adminUserGroupInfoIds: Id[] = []

	constructor(private readonly settingsView: SettingsView) {
		this.listId = new LazyLoaded(async () => {
			const customer = await locator.entityClient.load(CustomerTypeRef, locator.logins.getUserController().user.customer!)
			return customer.userGroups
		})
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: async (startId, count) => {
				if (startId !== GENERATED_MAX_ID) {
					throw new Error("fetch user group infos called for specific start id")
				}
				await this.loadAdmins()
				const listId = await this.listId.getAsync()
				const allUserGroupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, listId)

				// we return all users because we have already loaded all users and the scroll bar shall have the complete size.
				let items: GroupInfo[]
				if (locator.logins.getUserController().isGlobalAdmin()) {
					items = allUserGroupInfos
				} else {
					let localAdminGroupIds = locator.logins
						.getUserController()
						.getLocalAdminGroupMemberships()
						.map((gm) => gm.group)
					items = allUserGroupInfos.filter((gi: GroupInfo) => gi.localAdmin && localAdminGroupIds.includes(gi.localAdmin))
				}
				return { items, complete: true }
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
			sortCompare: compareGroupInfos,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new UserRow(this),
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		})

		this.list.loadInitial()
		const searchBar = neverNull(locator.header.searchBar)

		this.listId.getAsync().then((listId) => {
			searchBar.setGroupInfoRestrictionListId(listId)
		})

		this.searchResultStreamDependency = searchBar.lastSelectedGroupInfoResult.map((groupInfo) => {
			if (this.listId.isLoaded() && this.listId.getSync() === groupInfo._id[0]) {
				this.list.scrollToIdAndSelect(groupInfo._id[1])
			}
		})

		this.onremove = this.onremove.bind(this)
		this.view = this.view.bind(this)
	}

	view(): Children {
		if (locator.logins.isEnabled(FeatureType.WhitelabelChild)) {
			return null
		}

		return m(
			ListColumnWrapper,
			{
				headerContent: m(
					".mr-negative-s.align-self-end.plr-l",
					m(Button, {
						label: "addUsers_action",
						type: ButtonType.Primary,
						click: () => this.addButtonClicked(),
					}),
				),
			},
			m(this.list),
		)
	}

	onremove() {
		if (this.searchResultStreamDependency) {
			this.searchResultStreamDependency.end(true)
		}
	}

	private async loadAdmins(): Promise<void> {
		const adminGroupMembership = locator.logins.getUserController().user.memberships.find((gm) => gm.groupType === GroupType.Admin)
		if (adminGroupMembership == null) {
			return
		}
		const members = await locator.entityClient.loadAll(GroupMemberTypeRef, adminGroupMembership.groupMember[0])
		this.adminUserGroupInfoIds = members.map((adminGroupMember) => elementIdPart(adminGroupMember.userGroupInfo))
	}

	private elementSelected(groupInfos: GroupInfo[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (groupInfos.length === 0 && this.settingsView.detailsViewer) {
			this.settingsView.detailsViewer = null
			m.redraw()
		} else if (groupInfos.length === 1 && selectionChanged) {
			this.settingsView.detailsViewer = new UserViewer(groupInfos[0], this.isAdmin(groupInfos[0]))

			if (elementClicked) {
				this.settingsView.focusSettingsDetailsColumn()
			}

			m.redraw()
		} else {
			this.settingsView.focusSettingsDetailsColumn()
		}
	}

	isAdmin(userGroupInfo: GroupInfo): boolean {
		return contains(this.adminUserGroupInfoIds, userGroupInfo._id[1])
	}

	private addButtonClicked() {
		if (locator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {
			AddUserDialog.show()
		}
	}

	entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			const { instanceListId, instanceId, operation } = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this.listId.getSync() === instanceListId) {
				if (!locator.logins.getUserController().isGlobalAdmin()) {
					let listEntity = this.list.getEntity(instanceId)
					return locator.entityClient.load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then((gi) => {
						let localAdminGroupIds = locator.logins
							.getUserController()
							.getLocalAdminGroupMemberships()
							.map((gm) => gm.group)

						if (listEntity) {
							if (localAdminGroupIds.indexOf(assertNotNull(gi.localAdmin)) === -1) {
								return this.list.entityEventReceived(instanceId, OperationType.DELETE)
							} else {
								return this.list.entityEventReceived(instanceId, operation)
							}
						} else {
							if (localAdminGroupIds.indexOf(assertNotNull(gi.localAdmin)) !== -1) {
								return this.list.entityEventReceived(instanceId, OperationType.CREATE)
							}
						}
					})
				} else {
					return this.list.entityEventReceived(instanceId, operation)
				}
			} else if (isUpdateForTypeRef(UserTypeRef, update) && operation === OperationType.UPDATE) {
				return this.loadAdmins().then(() => {
					this.list.redraw()
				})
			}
		}).then(noOp)
	}
}

export class UserRow implements VirtualRow<GroupInfo> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: GroupInfo | null
	private _domName!: HTMLElement
	private _domAddress!: HTMLElement
	private _domAdminIcon!: HTMLElement
	private _domDeletedIcon!: HTMLElement
	private readonly _userListView: UserListView

	constructor(userListView: UserListView) {
		this._userListView = userListView
		this.top = 0
		this.entity = null
	}

	update(groupInfo: GroupInfo, selected: boolean): void {
		if (!this.domElement) {
			return
		}

		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domName.textContent = groupInfo.name
		this._domAddress.textContent = groupInfo.mailAddress ? groupInfo.mailAddress : ""

		if (this._userListView.isAdmin(groupInfo)) {
			this._domAdminIcon.style.display = ""
		} else {
			this._domAdminIcon.style.display = "none"
		}

		if (groupInfo.deleted) {
			this._domDeletedIcon.style.display = ""
		} else {
			this._domDeletedIcon.style.display = "none"
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): any {
		let elements = [
			m(".top", [
				m(".name", {
					oncreate: (vnode) => (this._domName = vnode.dom as HTMLElement),
				}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {
					oncreate: (vnode) => (this._domAddress = vnode.dom as HTMLElement),
				}),
				m(".icons.flex", [
					m(Icon, {
						icon: BootIcons.Settings,
						oncreate: (vnode) => (this._domAdminIcon = vnode.dom as HTMLElement),
						class: "svg-list-accent-fg",
						style: {
							display: "none",
						},
					}),
					m(Icon, {
						icon: Icons.Trash,
						oncreate: (vnode) => (this._domDeletedIcon = vnode.dom as HTMLElement),
						class: "svg-list-accent-fg",
						style: {
							display: "none",
						},
					}),
				]),
			]),
		]
		return elements
	}
}
