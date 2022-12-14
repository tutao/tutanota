import m, {Children} from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {assertNotNull, firstThrow, LazyLoaded, neverNull, ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {Group, GroupInfo} from "../api/entities/sys/TypeRefs.js"
import {AdministratedGroupTypeRef, CustomerTypeRef, GroupInfoTypeRef, GroupMemberTypeRef, GroupTypeRef, UserTypeRef} from "../api/entities/sys/TypeRefs.js"
import {BookingItemFeatureType, GroupType, OperationType} from "../api/common/TutanotaConstants"
import {BadRequestError, NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import type {TableAttrs} from "../gui/base/Table.js"
import {ColumnWidth, Table, TableLineAttrs} from "../gui/base/Table.js"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {localAdminGroupInfoModel} from "./LocalAdminGroupInfoModel"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {compareGroupInfos, getGroupInfoDisplayName} from "../api/common/utils/GroupUtils"
import {GENERATED_MAX_ID, GENERATED_MIN_ID, isSameId} from "../api/common/utils/EntityUtils"
import {showBuyDialog} from "../subscription/BuyDialog"
import type {TextFieldAttrs} from "../gui/base/TextField.js"
import {TextField} from "../gui/base/TextField.js"
import type {DropDownSelectorAttrs, SelectorItemList} from "../gui/base/DropDownSelector.js"
import {DropDownSelector} from "../gui/base/DropDownSelector.js"
import type {EntityClient} from "../api/common/EntityClient"
import type {UpdatableSettingsDetailsViewer} from "./SettingsView"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import {IconButton, IconButtonAttrs} from "../gui/base/IconButton.js"
import {ButtonSize} from "../gui/base/ButtonSize.js"

assertMainOrNode()

export class GroupViewer implements UpdatableSettingsDetailsViewer {
	groupInfo: GroupInfo
	private readonly group: LazyLoaded<Group>
	private usedStorageInBytes!: number
	private name: string
	private isActive: boolean
	private readonly members: LazyLoaded<Array<GroupInfo>>
	private administratedGroups!: LazyLoaded<Array<GroupInfo>>
	private localAdminGroupInfo: LazyLoaded<Array<GroupInfo>>

	constructor(
		private readonly entityClient: EntityClient,
		groupInfo: GroupInfo
	) {
		this.entityClient = entityClient
		this.groupInfo = groupInfo
		this.name = groupInfo.name
		this.group = new LazyLoaded(() => this.entityClient.load(GroupTypeRef, this.groupInfo.group))

		this.group.getAsync().then(() => m.redraw())

		this.members = new LazyLoaded(async () => {
			const group = await this.group.getAsync()
			// load only up to 200 members to avoid too long loading, like for account groups
			const groupMembers = await this.entityClient.loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 200, false)
			return promiseMap(groupMembers, member => this.entityClient.load(GroupInfoTypeRef, member.userGroupInfo))
		})

		// noinspection JSIgnoredPromiseFromCall
		this.updateMembers()

		if (this.groupInfo.groupType === GroupType.LocalAdmin) {
			this.administratedGroups = new LazyLoaded(async () => {
				const group = await this.group.getAsync()
				// load only up to 200 members to avoid too long loading, like for account groups
				const administratedGroups = await this.entityClient.loadRange(
					AdministratedGroupTypeRef,
					assertNotNull(group.administratedGroups).items,
					GENERATED_MAX_ID,
					200,
					true
				)
				return promiseMap(administratedGroups, administratedGroup => this.entityClient.load(GroupInfoTypeRef, administratedGroup.groupInfo))
			})

			// noinspection JSIgnoredPromiseFromCall
			this.updateAdministratedGroups()
		}

		this.isActive = this.groupInfo.deleted != null
		this.localAdminGroupInfo = new LazyLoaded(() => localAdminGroupInfoModel.init())

		this.localAdminGroupInfo.getAsync().then(() => m.redraw())

		// noinspection JSIgnoredPromiseFromCall
		this.updateUsedStorage()
	}

	renderView(): Children {
		const administratedBySelectorAttrs = this.createAdministratedBySelectorAttrs()

		return [
			m("#user-viewer.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", this.group.isLoaded() ? getGroupTypeName(this.group.getLoaded().type) : lang.get("emptyString_msg")),
				m("", [
					m(TextField, {
						label: "created_label",
						value: formatDateWithMonth(this.groupInfo.created),
						disabled: true,
					}),
					this.isMailGroup() ? m(TextField, this.createUsedStorageFieldAttrs()) : null,
				]),
				m("", [
					m(TextField, this.createNameFieldAttrs()),
					logins.getUserController().isGlobalAdmin() && administratedBySelectorAttrs ? m(DropDownSelector, administratedBySelectorAttrs) : null,
					m(DropDownSelector, this.createStatusSelectorAttrs()),
				]),
				!this.groupInfo.deleted ? m(".h4.mt-l.mb-s", lang.get("groupMembers_label")) : null,
				!this.groupInfo.deleted ? m(Table, this.createMembersTableAttrs()) : null,
				this.isMailGroup()
					? [
						m(".h4.mt-l", lang.get("mailSettings_label")),
						m(".wrapping-row", [
							m("", [
								m(TextField, {
									label: "mailAddress_label",
									value: this.groupInfo.mailAddress ?? "",
									disabled: true,
								}),
							]),
						]),
					]
					: null,
				this.groupInfo.groupType !== GroupType.LocalAdmin
					? null
					: [m(".h4.mt-l.mb-s", lang.get("administratedGroups_label")), m(Table, this.createAdministratedGroupsTableAttrs())],
			]),
		]
	}

	private createStatusSelectorAttrs(): DropDownSelectorAttrs<boolean> {
		return {
			label: "state_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			selectedValue: this.isActive,
			selectionChangedHandler: deactivate => this.onStatusSelected(deactivate),
		}
	}

	private async onStatusSelected(deactivate: boolean): Promise<void> {
		const members = await this.members.getAsync()
		if (deactivate && members.length > 0) {
			return Dialog.message("groupNotEmpty_msg")
		} else {
			return showProgressDialog("pleaseWait_msg", this.showGroupBuyDialog(deactivate))
		}
	}

	private async showGroupBuyDialog(deactivate: boolean): Promise<void> {
		const bookingItemType = this.groupInfo.groupType === GroupType.LocalAdmin
			? BookingItemFeatureType.LocalAdminGroup
			: BookingItemFeatureType.SharedMailGroup

		const confirmed = await showBuyDialog({featureType: bookingItemType, count: deactivate ? -1 : 1, freeAmount: 0, reactivate: !deactivate})
		if (confirmed) {
			const group = await this.group.getAsync()
			try {
				return await locator.groupManagementFacade.deactivateGroup(group, !deactivate)
			} catch (e) {
				if (!(e instanceof PreconditionFailedError)) throw e
				if (this.groupInfo.groupType === GroupType.LocalAdmin) {
					return Dialog.message("localAdminGroupAssignedError_msg")
				} else if (!deactivate) {
					return Dialog.message("emailAddressInUse_msg")
				} else {
					return Dialog.message("stillReferencedFromContactForm_msg")
				}
			}
		}
	}

	private createAdministratedBySelectorAttrs(): DropDownSelectorAttrs<Id | null> | null {
		if (!this.localAdminGroupInfo.isLoaded()) return null

		const filteredLocalAdminGroupInfo = this.localAdminGroupInfo.getLoaded().filter(groupInfo => !groupInfo.deleted)

		const adminGroupIdToName: SelectorItemList<Id | null> = [
			{
				name: lang.get("globalAdmin_label"),
				value: null,
			},
			...filteredLocalAdminGroupInfo.map(gi => {
				return {
					name: getGroupInfoDisplayName(gi),
					value: gi.group,
				}
			})
		]
		if (!adminGroupIdToName) return null
		return {
			label: "administratedBy_label",
			items: adminGroupIdToName,
			selectedValue: this.groupInfo.localAdmin,
			selectionChangedHandler: id => {
				if (this.groupInfo.groupType === GroupType.LocalAdmin) {
					// noinspection JSIgnoredPromiseFromCall
					Dialog.message("updateAdminshipLocalAdminGroupError_msg")
				} else {
					// noinspection JSIgnoredPromiseFromCall
					showProgressDialog(
						"pleaseWait_msg",
						Promise.resolve().then(() => {
							let newAdminGroupId = id
								? id
								: neverNull(logins.getUserController().user.memberships.find(gm => gm.groupType === GroupType.Admin)).group
							return locator.userManagementFacade.updateAdminship(this.groupInfo.group, newAdminGroupId)
						}),
					)
				}
			},
		}
	}

	private createNameFieldAttrs(): TextFieldAttrs {
		return {
			label: "name_label",
			value: this.name,
			disabled: true,
			injectionsRight: () => m(IconButton, {
				title: "edit_action",
				click: () => {
					this.showChangeNameDialog()
				},
				icon: Icons.Edit,
				size: ButtonSize.Compact,
			}),
		}
	}

	private showChangeNameDialog(): void {
		Dialog.showProcessTextInputDialog("edit_action", "name_label", null, this.name,
			(newName) => {
				const newGroupInfo: GroupInfo = Object.assign({}, this.groupInfo)
				newGroupInfo.name = newName

				return this.entityClient.update(newGroupInfo)
			},
			newName => {
				if (this.group.isLoaded() && this.group.getLoaded().type === GroupType.MailingList && newName.trim() === "") {
					return "enterName_msg"
				} else {
					return null
				}
			})
	}

	private createUsedStorageFieldAttrs(): TextFieldAttrs {
		return {
			label: "storageCapacityUsed_label",
			value: this.usedStorageInBytes ? formatStorageSize(this.usedStorageInBytes) : lang.get("loading_msg"),
			disabled: true,
		}
	}

	private async showAddMember(): Promise<void> {
		const customer = await this.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
		// remove all users that are already member
		let globalAdmin = logins.isGlobalAdminUserLoggedIn()
		let localAdminGroupIds = logins
			.getUserController()
			.getLocalAdminGroupMemberships()
			.map(gm => gm.group)
		let availableUserGroupInfos = userGroupInfos.filter(g => {
			if (!globalAdmin && localAdminGroupIds.indexOf(assertNotNull(g.localAdmin)) === -1) {
				return false
			} else {
				return !g.deleted && this.members.getLoaded().find(m => isSameId(m._id, g._id)) == null
			}
		})

		if (availableUserGroupInfos.length > 0) {
			availableUserGroupInfos.sort(compareGroupInfos)
			let selectedGroupInfo = firstThrow(availableUserGroupInfos)
			let addUserToGroupOkAction = (dialog: Dialog) => {
				// noinspection JSIgnoredPromiseFromCall
				showProgressDialog("pleaseWait_msg", this.addUserToGroup(selectedGroupInfo.group))
				dialog.close()
			}

			Dialog.showActionDialog({
				title: lang.get("addUserToGroup_label"),
				child: {
					view: () => m(DropDownSelector, {
							label: "userSettings_label",
							items: availableUserGroupInfos.map(g => ({name: getGroupInfoDisplayName(g), value: g})),
							selectedValue: selectedGroupInfo,
							selectionChangedHandler: (newSelected: GroupInfo) => selectedGroupInfo = newSelected,
							dropdownWidth: 250,
						}
					),
				},
				allowOkWithReturn: true,
				okAction: addUserToGroupOkAction,
			})
		}
	}

	private async addUserToGroup(group: Id): Promise<any> {
		const userGroup = await this.entityClient.load(GroupTypeRef, group)
		const user = await this.entityClient.load(UserTypeRef, neverNull(userGroup.user))
		return locator.groupManagementFacade.addUserToGroup(user, this.groupInfo.group)
	}

	private async updateMembers(): Promise<void> {
		if (this.members) {
			this.members.reset()
			await this.members.getAsync()
			m.redraw()
		}
	}

	private async updateAdministratedGroups(): Promise<void> {
		if (this.administratedGroups) {
			this.administratedGroups.reset()
			await this.administratedGroups.getAsync()
			m.redraw()
		}
	}

	private isMailGroup(): boolean {
		return this.groupInfo.groupType === GroupType.Mail
	}

	private async updateUsedStorage(): Promise<void> {
		if (this.isMailGroup()) {
			try {
				this.usedStorageInBytes = await locator.groupManagementFacade.readUsedGroupStorage(this.groupInfo.group)
			} catch (e) {
				if (!(e instanceof BadRequestError)) throw e
				// may happen if the user gets the admin flag removed
			}
		} else {
			this.usedStorageInBytes = 0
		}

		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await promiseMap(updates, async update => {
			const {instanceListId, instanceId, operation} = update

			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE) {
				const updatedUserGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.groupInfo._id)
				if (isSameId(this.groupInfo._id, [neverNull(instanceListId), instanceId])) {
					this.groupInfo = updatedUserGroupInfo
					this.name = updatedUserGroupInfo.name
					this.isActive = updatedUserGroupInfo.deleted != null
					return this.updateUsedStorage()
				} else {
					// a member name may have changed
					return this.updateMembers()
				}
			} else if (
				isUpdateForTypeRef(GroupMemberTypeRef, update) &&
				this.group.isLoaded() &&
				this.group.getLoaded().members === neverNull(instanceListId)
			) {
				// the members have changed
				return this.updateMembers()
			} else if (
				isUpdateForTypeRef(AdministratedGroupTypeRef, update) &&
				this.group.isLoaded() &&
				this.group.getLoaded().administratedGroups &&
				neverNull(this.group.getLoaded().administratedGroups).items === neverNull(instanceListId)
			) {
				return this.updateAdministratedGroups()
			}
		})
	}

	private createMembersTableAttrs(): TableAttrs {
		const addUserButtonAttrs: IconButtonAttrs = {
			title: "addUserToGroup_label",
			click: () => this.showAddMember(),
			icon: Icons.Add,
			size: ButtonSize.Compact,
		} as const
		let lines: TableLineAttrs[] = []

		if (this.members.isLoaded()) {
			lines = this.members.getLoaded().map(userGroupInfo => {
				const removeButtonAttrs: IconButtonAttrs = {
					title: "remove_action",
					click: () => {
						showProgressDialog(
							"pleaseWait_msg",
							this.entityClient
								.load(GroupTypeRef, userGroupInfo.group)
								.then(userGroup => locator.groupManagementFacade.removeUserFromGroup(assertNotNull(userGroup.user), this.groupInfo.group)),
						).catch(
							ofClass(NotAuthorizedError, () => {
								Dialog.message("removeUserFromGroupNotAdministratedError_msg")
							}),
						)
					},
					icon: Icons.Cancel,
					size: ButtonSize.Compact,
				}
				return {
					cells: [userGroupInfo.name, neverNull(userGroupInfo.mailAddress)],
					actionButtonAttrs: removeButtonAttrs,
				}
			})
		}

		return {
			columnHeading: ["name_label", "mailAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: addUserButtonAttrs,
			lines,
		}
	}

	private createAdministratedGroupsTableAttrs(): TableAttrs {
		let lines: TableLineAttrs[] = []

		if (this.administratedGroups.isLoaded()) {
			lines = this.administratedGroups.getLoaded().map(groupInfo => {
				let removeButtonAttrs: IconButtonAttrs | null = null

				if (logins.getUserController().isGlobalAdmin()) {
					removeButtonAttrs = {
						title: "remove_action",
						click: () => {
							let adminGroupId = neverNull(logins.getUserController().user.memberships.find(m => m.groupType === GroupType.Admin)).group
							// noinspection JSIgnoredPromiseFromCall
							showProgressDialog("pleaseWait_msg", locator.userManagementFacade.updateAdminship(groupInfo.group, adminGroupId))
						},
						icon: Icons.Cancel,
						size: ButtonSize.Compact,
					}
				}

				return {
					cells: [getGroupTypeName(neverNull(groupInfo.groupType)), groupInfo.name, neverNull(groupInfo.mailAddress)],
					actionButtonAttrs: removeButtonAttrs,
				}
			})
		}

		return {
			columnHeading: ["type_label", "name_label", "mailAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			showActionButtonColumn: true,
			lines,
		}
	}
}

export function getGroupTypeName(groupType: NumberString): string {
	if (groupType === GroupType.Mail) {
		return lang.get("sharedMailbox_label")
	} else if (groupType === GroupType.LocalAdmin) {
		return lang.get("localAdmin_label")
	} else if (groupType === GroupType.User) {
		return lang.get("userColumn_label")
	} else if (groupType === GroupType.Template) {
		return lang.get("templateGroup_label")
	} else {
		return groupType // just for testing
	}
}