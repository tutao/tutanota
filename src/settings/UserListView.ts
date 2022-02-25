import m, {Children} from "mithril"
import type {VirtualRow} from "../gui/base/List"
import {List} from "../gui/base/List"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {assertNotNull, contains, LazyLoaded, neverNull, noOp, promiseMap} from "@tutao/tutanota-utils"
import {UserViewer} from "./UserViewer"
import type {SettingsView, UpdatableSettingsViewer} from "./SettingsView"
import {FeatureType, GroupType, OperationType} from "../api/common/TutanotaConstants"
import {logins} from "../api/main/LoginController"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {header} from "../gui/base/Header"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"
import {UserTypeRef} from "../api/entities/sys/User"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {compareGroupInfos} from "../api/common/utils/GroupUtils"
import {GENERATED_MAX_ID} from "../api/common/utils/EntityUtils"
import {ListColumnWrapper} from "../gui/ListColumnWrapper"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import Stream from "mithril/stream";
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import * as AddUserDialog from "./AddUserDialog"

assertMainOrNode()
const className = "user-list"

export class UserListView implements UpdatableSettingsViewer {

	readonly list: List<GroupInfo, UserRow>
	readonly view: (...args: Array<any>) => any
	readonly onremove: (...args: Array<any>) => any

	private readonly listId: LazyLoaded<Id>
	private readonly searchResultStreamDependency: Stream<any>
	private adminUserGroupInfoIds: Id[] = []

	constructor(
		private readonly settingsView: SettingsView
	) {
		this.listId = new LazyLoaded(async () => {
			const customer = await locator.entityClient.load(CustomerTypeRef, logins.getUserController().user.customer!)
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

				// we have to set loadedCompletely to make sure that fetch is never called again and also that new users are inserted into the list, even at the end
				this.setLoadedCompletely()

				// we return all users because we have already loaded all users and the scroll bar shall have the complete size.
				if (logins.getUserController().isGlobalAdmin()) {
					return allUserGroupInfos
				} else {
					let localAdminGroupIds = logins
						.getUserController()
						.getLocalAdminGroupMemberships()
						.map(gm => gm.group)
					return allUserGroupInfos.filter((gi: GroupInfo) => gi.localAdmin && localAdminGroupIds.indexOf(gi.localAdmin) !== -1)
				}
			},
			loadSingle: async elementId => {
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
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: listElement => Promise.resolve(false),
				swipeRight: listElement => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		})

		this.view = (): Children => {
			return !logins.isEnabled(FeatureType.WhitelabelChild)
				? m(
					ListColumnWrapper,
					{
						headerContent: m(
							".mr-negative-s.align-self-end",
							m(ButtonN, {
								label: "addUsers_action",
								type: ButtonType.Primary,
								click: () => this.addButtonClicked(),
							}),
						),
					},
					m(this.list),
				)
				: null
		}

		this.list.loadInitial()
		const searchBar = neverNull(header.searchBar)

		this.listId.getAsync().then(listId => {
			searchBar.setGroupInfoRestrictionListId(listId)
		})

		this.searchResultStreamDependency = searchBar.lastSelectedGroupInfoResult.map(groupInfo => {
			if (this.listId.isLoaded() && this.listId.getSync() === groupInfo._id[0]) {
				this.list.scrollToIdAndSelect(groupInfo._id[1])
			}
		})

		this.onremove = () => {
			if (this.searchResultStreamDependency) {
				this.searchResultStreamDependency.end(true)
			}
		}
	}

	private async loadAdmins(): Promise<void> {
		let adminGroupMembership = logins.getUserController().user.memberships.find(gm => gm.groupType === GroupType.Admin)
		if (adminGroupMembership == null) return Promise.resolve()
		const members = await locator.entityClient.loadAll(GroupMemberTypeRef, adminGroupMembership.groupMember[0])
		this.adminUserGroupInfoIds = members.map(adminGroupMember => adminGroupMember.userGroupInfo[1])
	}

	private setLoadedCompletely() {
		this.list.setLoadedCompletely()
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
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {
			AddUserDialog.show()
		}
	}

	entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			const {instanceListId, instanceId, operation} = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && this.listId.getSync() === instanceListId) {
				if (!logins.getUserController().isGlobalAdmin()) {
					let listEntity = this.list.getEntity(instanceId)
					return locator.entityClient.load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(gi => {
						let localAdminGroupIds = logins
							.getUserController()
							.getLocalAdminGroupMemberships()
							.map(gm => gm.group)

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
					oncreate: vnode => (this._domName = vnode.dom as HTMLElement),
				}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {
					oncreate: vnode => (this._domAddress = vnode.dom as HTMLElement),
				}),
				m(".icons.flex", [
					m(Icon, {
						icon: BootIcons.Settings,
						oncreate: vnode => (this._domAdminIcon = vnode.dom as HTMLElement),
						class: "svg-list-accent-fg",
						style: {
							display: "none",
						},
					}),
					m(Icon, {
						icon: Icons.Trash,
						oncreate: vnode => (this._domDeletedIcon = vnode.dom as HTMLElement),
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