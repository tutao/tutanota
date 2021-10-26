// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import type {Group} from "../api/entities/sys/Group"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {BookingItemFeatureType, GroupType, OperationType} from "../api/common/TutanotaConstants"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {BadRequestError, NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import type {TableAttrs} from "../gui/base/TableN"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"
import {logins} from "../api/main/LoginController"
import {UserTypeRef} from "../api/entities/sys/User"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {AdministratedGroupTypeRef} from "../api/entities/sys/AdministratedGroup"
import {localAdminGroupInfoModel} from "./LocalAdminGroupInfoModel"
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {compareGroupInfos, getGroupInfoDisplayName} from "../api/common/utils/GroupUtils";
import {GENERATED_MAX_ID, GENERATED_MIN_ID, isSameId} from "../api/common/utils/EntityUtils";
import {showBuyDialog} from "../subscription/BuyDialog"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN} from "../gui/base/ButtonN"
import type {DropDownSelectorAttrs, SelectorItemList} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import type {EntityClient} from "../api/common/EntityClient"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

export class GroupViewer implements UpdatableSettingsViewer {
	view: () => Children;
	+_entityClient: EntityClient
	groupInfo: GroupInfo
	_group: LazyLoaded<Group>
	_usedStorageInBytes: number
	_name: string
	_isActive: boolean
	_members: LazyLoaded<Array<GroupInfo>>
	_administratedGroups: LazyLoaded<Array<GroupInfo>>
	_localAdminGroupInfo: LazyLoaded<Array<GroupInfo>>

	constructor(entityClient: EntityClient, groupInfo: GroupInfo) {
		this._entityClient = entityClient
		this.groupInfo = groupInfo
		this._name = groupInfo.name
		this._group = new LazyLoaded(() => {
			return this._entityClient.load(GroupTypeRef, this.groupInfo.group)
		})
		this._group.getAsync().then(() => m.redraw())

		this._members = new LazyLoaded(async () => {
			const group = await this._group.getAsync()
			// load only up to 200 members to avoid too long loading, like for account groups
			const groupMembers = await this._entityClient.loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 200, false)
			return promiseMap(groupMembers, (member) => this._entityClient.load(GroupInfoTypeRef, member.userGroupInfo))
		})
		this._updateMembers()

		if (this.groupInfo.groupType === GroupType.LocalAdmin) {
			this._administratedGroups = new LazyLoaded(() => {
				return this._group.getAsync().then(group => {
					// load only up to 200 members to avoid too long loading, like for account groups
					return this._entityClient.loadRange(AdministratedGroupTypeRef, neverNull(group.administratedGroups).items, GENERATED_MAX_ID, 200, true)
					           .then((administratedGroups) => {
						           return promiseMap(administratedGroups, (administratedGroup) => {
							           return this._entityClient.load(GroupInfoTypeRef, administratedGroup.groupInfo)
						           })
					           })
				})
			})
			this._updateAdministratedGroups()
		}

		this._isActive = this.groupInfo.deleted != null

		this._localAdminGroupInfo = new LazyLoaded(() => localAdminGroupInfoModel.init())
		this._localAdminGroupInfo.getAsync().then(() => m.redraw())

		this._updateUsedStorage()

		this.view = () => {
			const administratedBySelectorAttrs = this._createAdministratedBySelectorAttrs()
			return [
				m("#user-viewer.fill-absolute.scroll.plr-l", [
					m(".h4.mt-l", (this._group.isLoaded())
						? getGroupTypeName(this._group.getLoaded().type)
						: lang.get("emptyString_msg")),
					m("", [
						m(TextFieldN, {
							label: "created_label",
							value: stream(formatDateWithMonth(this.groupInfo.created)),
							disabled: true,
						}),
						(this._isMailGroup()) ? m(TextFieldN, this._createUsedStorageFieldAttrs()) : null,
					]),
					m("", [
						m(TextFieldN, this._createNameFieldAttrs()),
						(logins.getUserController().isGlobalAdmin() && administratedBySelectorAttrs)
							? m(DropDownSelectorN, administratedBySelectorAttrs)
							: null,
						m(DropDownSelectorN, this._createStatusSelectorAttrs())
					]),
					(!this.groupInfo.deleted) ? m(".h4.mt-l.mb-s", lang.get('groupMembers_label')) : null,
					(!this.groupInfo.deleted) ? m(TableN, this._createMembersTableAttrs()) : null,
					(this._isMailGroup())
						? [
							m(".h4.mt-l", lang.get("mailSettings_label")),
							m(".wrapping-row", [
								m("", [
									m(TextFieldN, {
										label: "mailAddress_label",
										value: stream(this.groupInfo.mailAddress ?? ""),
										disabled: true,
									}),
								])
							])
						]
						: null,
					this.groupInfo.groupType !== GroupType.LocalAdmin
						? null
						: [
							m(".h4.mt-l.mb-s", lang.get('administratedGroups_label')),
							m(TableN, this._createAdministratedGroupsTableAttrs())
						]
				]),
			]
		}
	}

	_createStatusSelectorAttrs(): DropDownSelectorAttrs<boolean> {
		return {
			label: "state_label",
			items: [
				{name: lang.get("activated_label"), value: false},
				{name: lang.get("deactivated_label"), value: true}
			],
			selectedValue: stream(this._isActive),
			selectionChangedHandler: (deactivate) => {
				this._onStatusSelected(deactivate)
			},
		}
	}

	_onStatusSelected(deactivate: boolean): Promise<*> {
		return this._members
		           .getAsync()
		           .then(members => {
				           if (deactivate && members.length > 0) {
					           Dialog.error("groupNotEmpty_msg")
				           } else {
					           const bookingItemType = (this.groupInfo.groupType === GroupType.LocalAdmin)
						           ? BookingItemFeatureType.LocalAdminGroup
						           : BookingItemFeatureType.SharedMailGroup
					           return showProgressDialog("pleaseWait_msg",
						           showBuyDialog(bookingItemType, (deactivate) ? -1 : 1, 0, !deactivate)
							           .then(confirmed => {
								           if (confirmed) {
									           return this._group.getAsync()
									                      .then(group =>
										                      locator.groupManagementFacade.deactivateGroup(group, !deactivate)
										                             .catch(ofClass(PreconditionFailedError, e => {
												                             if (this.groupInfo.groupType === GroupType.LocalAdmin) {
													                             Dialog.error("localAdminGroupAssignedError_msg")
												                             } else if (!deactivate) {
													                             Dialog.error("emailAddressInUse_msg")
												                             } else {
													                             Dialog.error("stillReferencedFromContactForm_msg")
												                             }
											                             }
										                             )))
								           }
							           })
					           )
				           }
			           }
		           )
	}

	_createAdministratedBySelectorAttrs(): ?DropDownSelectorAttrs<?Id> {
		if (!this._localAdminGroupInfo.isLoaded()) return null

		const filteredLocalAdminGroupInfo = this._localAdminGroupInfo.getLoaded().filter(groupInfo => !groupInfo.deleted)
		const adminGroupIdToName: SelectorItemList<?Id> = [
			{
				name: lang.get("globalAdmin_label"),
				value: null
			}
		].concat(filteredLocalAdminGroupInfo.map(gi => {
			return {
				name: getGroupInfoDisplayName(gi),
				value: gi.group
			}
		}))

		if (!adminGroupIdToName) return null

		return {
			label: "administratedBy_label",
			items: adminGroupIdToName,
			selectedValue: stream(this.groupInfo.localAdmin),
			selectionChangedHandler: (id) => {
				if (this.groupInfo.groupType === GroupType.LocalAdmin) {
					Dialog.error("updateAdminshipLocalAdminGroupError_msg")
				} else {
					showProgressDialog("pleaseWait_msg", Promise.resolve().then(() => {
						let newAdminGroupId = id
							? id
							: neverNull(logins.getUserController().user.memberships.find(gm => gm.groupType === GroupType.Admin)).group
						return locator.userManagementFacade.updateAdminship(this.groupInfo.group, newAdminGroupId)
					}))
				}
			}
		}
	}

	_createNameFieldAttrs(): TextFieldAttrs {
		const editNameButtonAttrs = {
			label: "edit_action",
			click: () => {
				Dialog.showTextInputDialog("edit_action", "name_label", null, this._name, newName => {
					if (this._group.isLoaded() && this._group.getLoaded().type === GroupType.MailingList && newName.trim()
						=== "") {
						return "enterName_msg"
					} else {
						return null
					}
				}).then(newName => {
					const newGroupInfo: GroupInfo = Object.assign({}, this.groupInfo)
					newGroupInfo.name = newName
					this._entityClient.update(newGroupInfo)
				})
			},
			icon: () => Icons.Edit
		}
		return {
			label: "name_label",
			value: stream(this._name),
			disabled: true,
			injectionsRight: () => [m(ButtonN, editNameButtonAttrs)],
		}
	}

	_createUsedStorageFieldAttrs(): TextFieldAttrs {
		return {
			label: "storageCapacityUsed_label",
			value: (this._usedStorageInBytes) ? stream(formatStorageSize(this._usedStorageInBytes)) : stream(lang.get("loading_msg")),
			disabled: true
		}
	}

	_showAddMember(): void {
		this._entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			return this._entityClient.loadAll(GroupInfoTypeRef, customer.userGroups).then(userGroupInfos => {
				// remove all users that are already member
				let globalAdmin = logins.isGlobalAdminUserLoggedIn()
				let localAdminGroupIds = logins.getUserController().getLocalAdminGroupMemberships().map(gm => gm.group)
				let availableUserGroupInfos = userGroupInfos.filter(g => {
					if (!globalAdmin && localAdminGroupIds.indexOf(g.localAdmin) === -1) {
						return false
					} else {
						return !g.deleted && (this._members.getLoaded().find(m => isSameId(m._id, g._id)) == null)
					}
				})
				if (availableUserGroupInfos.length > 0) {
					availableUserGroupInfos.sort(compareGroupInfos)
					let dropdownAttrs = {
						label: "userSettings_label",
						items: availableUserGroupInfos.map(g => {return {name: getGroupInfoDisplayName(g), value: g}}),
						selectedValue: stream(availableUserGroupInfos[0]),
						dropdownWidth: 250,
					}
					let addUserToGroupOkAction = (dialog) => {
						showProgressDialog("pleaseWait_msg", this._addUserToGroup(dropdownAttrs.selectedValue().group))
						dialog.close()
					}

					Dialog.showActionDialog({
						title: lang.get("addUserToGroup_label"),
						child: {view: () => m(DropDownSelectorN, dropdownAttrs)},
						allowOkWithReturn: true, okAction: addUserToGroupOkAction
					})
				}
			})
		})
	}

	_addUserToGroup(group: Id): Promise<*> {
		return this._entityClient.load(GroupTypeRef, group)
		           .then(userGroup => this._entityClient.load(UserTypeRef, neverNull(userGroup.user)))
		           .then(user => locator.groupManagementFacade.addUserToGroup(user, this.groupInfo.group))
	}

	_updateMembers(): void {
		if (this._members) {
			this._members.reset()
			this._members.getAsync().then(() => m.redraw())
		}
	}

	_updateAdministratedGroups(): void {
		if (this._administratedGroups) {
			this._administratedGroups.reset()
			this._administratedGroups.getAsync().then(() => m.redraw())
		}
	}

	_isMailGroup(): boolean {
		return this.groupInfo.groupType === GroupType.Mail
	}

	async _updateUsedStorage(): Promise<void> {
		if (this._isMailGroup()) {
			const usedStorage = await locator.groupManagementFacade.readUsedGroupStorage(this.groupInfo.group)
			                                 .catch(ofClass(BadRequestError, e => {
				                                 // may happen if the user gets the admin flag removed
			                                 }))
			if (usedStorage) this._usedStorageInBytes = usedStorage
		} else {
			this._usedStorageInBytes = 0
		}

		m.redraw()
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE) {
				return this._entityClient.load(GroupInfoTypeRef, this.groupInfo._id).then(updatedUserGroupInfo => {
					if (isSameId(this.groupInfo._id, [neverNull(instanceListId), instanceId])) {
						this.groupInfo = updatedUserGroupInfo
						this._name = updatedUserGroupInfo.name
						this._isActive = updatedUserGroupInfo.deleted != null
						return this._updateUsedStorage()
					} else {
						// a member name may have changed
						return this._updateMembers()
					}
				})
			} else if (isUpdateForTypeRef(GroupMemberTypeRef, update) && this._group.isLoaded()
				&& this._group.getLoaded().members === neverNull(instanceListId)) {
				// the members have changed
				return this._updateMembers()
			} else if (isUpdateForTypeRef(AdministratedGroupTypeRef, update) && this._group.isLoaded()
				&& this._group.getLoaded().administratedGroups
				&& neverNull(this._group.getLoaded().administratedGroups).items === neverNull(instanceListId)) {
				return this._updateAdministratedGroups()
			}
		}).then(noOp)
	}

	_createMembersTableAttrs(): TableAttrs {
		const addUserButtonAttrs = {
			label: "addUserToGroup_label",
			click: () => this._showAddMember(),
			icon: () => Icons.Add,
		}

		let lines = []
		if (this._members.isLoaded()) {
			lines = this._members.getLoaded().map(userGroupInfo => {
				const removeButtonAttrs = {
					label: "remove_action",
					click: () => {
						showProgressDialog("pleaseWait_msg",
							this._entityClient.load(GroupTypeRef, userGroupInfo.group)
							    .then(userGroup =>
								    locator.groupManagementFacade.removeUserFromGroup(
									    neverNull(userGroup.user),
									    this.groupInfo.group))
						)
							.catch(ofClass(NotAuthorizedError, e => {
								Dialog.error("removeUserFromGroupNotAdministratedError_msg")
							}))
					},
					icon: () => Icons.Cancel,
				}
				return {
					cells: [userGroupInfo.name, neverNull(userGroupInfo.mailAddress)],
					actionButtonAttrs: removeButtonAttrs
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

	_createAdministratedGroupsTableAttrs(): TableAttrs {
		let lines = []
		if (this._administratedGroups.isLoaded()) {
			lines = this._administratedGroups.getLoaded().map(groupInfo => {
				let removeButtonAttrs = null
				if (logins.getUserController().isGlobalAdmin()) {
					removeButtonAttrs = {
						label: "remove_action",
						click: () => {
							let adminGroupId = neverNull(logins.getUserController()
							                                   .user
							                                   .memberships
							                                   .find(m => m.groupType === GroupType.Admin)).group
							showProgressDialog("pleaseWait_msg", locator.userManagementFacade.updateAdminship(groupInfo.group, adminGroupId))
						},
						icon: () => Icons.Cancel
					}
				}

				return {
					cells: [getGroupTypeName(neverNull(groupInfo.groupType)), groupInfo.name, neverNull(groupInfo.mailAddress)],
					actionButtonAttrs: removeButtonAttrs
				}
			})
		}

		return {
			columnHeading: ["type_label", "name_label", "mailAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			showActionButtonColumn: true,
			lines
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