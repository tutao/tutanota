// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Button} from "../gui/base/Button"
import {Dialog} from "../gui/base/Dialog"
import {update, load, loadRange, loadAll} from "../api/main/Entity"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {isSameId, isSameTypeRef, GENERATED_MIN_ID} from "../api/common/EntityFunctions"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {neverNull, getGroupInfoDisplayName} from "../api/common/utils/Utils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {OperationType, GroupType} from "../api/common/TutanotaConstants"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {BadRequestError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {ColumnWidth, Table} from "../gui/base/Table"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"
import TableLine from "../gui/base/TableLine"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {logins} from "../api/main/LoginController"
import {UserTypeRef} from "../api/entities/sys/User"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"

assertMainOrNode()

export class GroupViewer {
	view: Function;
	groupInfo: GroupInfo;
	_group: LazyLoaded<Group>;
	_name: TextField;
	_usedStorage: TextField;
	_deactivated: DropDownSelector<boolean>;
	_members: LazyLoaded<GroupInfo[]>;
	_membersTable: Table;

	constructor(groupInfo: GroupInfo) {
		this.groupInfo = groupInfo
		this._group = new LazyLoaded(() => {
			return load(GroupTypeRef, this.groupInfo.group)
		})
		this._group.getAsync().then(() => m.redraw())

		this._members = new LazyLoaded(() => {
			return this._group.getAsync().then(group => {
				// load only up to 200 members to avoid too long loading, like for account groups
				return loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 200, false).map(member => {
					return load(GroupInfoTypeRef, member.userGroupInfo)
				})
			})
		})

		this._name = new TextField("name_label").setValue(groupInfo.name).setDisabled()
		let editNameButton = new Button("edit_action", () => {
			Dialog.showTextInputDialog("edit_action", "name_label", null, this._name.value(), newName => {
				if (this._group.isLoaded() && this._group.getLoaded().type == GroupType.Team && newName.trim() == "") {
					return "enterName_msg"
				} else {
					return null
				}
			}).then(newName => {
				groupInfo.name = newName
				update(groupInfo)
			})
		}, () => Icons.Edit)
		this._name._injectionsRight = () => [m(editNameButton)]

		let mailAddress = new TextField("mailAddress_label").setValue(groupInfo.mailAddress).setDisabled()
		let created = new TextField("created_label").setValue(formatDateWithMonth(groupInfo.created)).setDisabled()
		this._usedStorage = new TextField("storageCapacityUsed_label").setValue(lang.get("loading_msg")).setDisabled()

		this._deactivated = new DropDownSelector("state_label", null, [
			{name: lang.get("activated_label"), value: false},
			{name: lang.get("deactivated_label"), value: true}
		], this.groupInfo.deleted != null).setSelectionChangedHandler(deactivate => {
			this._members.getAsync().then(members => {
				if (deactivate && this._members.getLoaded().length > 0) {
					Dialog.error("groupNotEmpty_msg")
				} else {
					showProgressDialog("pleaseWait_msg", this._group.getAsync().then(group => worker.deactivateGroup(group, !deactivate)))
				}
			})
		})

		let addUserButton = new Button("addUserToGroup_label", () => this._showAddMember(), () => Icons.Add)
		this._membersTable = new Table(["name_label", "mailAddress_label"], [ColumnWidth.Largest, ColumnWidth.Largest], true, addUserButton)
		this._updateMembers()

		this.view = () => {
			return [
				m("#user-viewer.fill-absolute.scroll.plr-l", [
					m(".h4.mt-l", (this._group.isLoaded()) ? getGroupTypeName(this._group.getLoaded().type) : lang.get("emptyString_msg")),
					m("", [
						m(created),
						m(this._usedStorage),
					]),
					m("", [
						m(this._name),
						m(this._deactivated)
					]),
					(!this.groupInfo.deleted) ? m(".h4.mt-l.mb-s", lang.get('groupMembers_label')) : null,
					(!this.groupInfo.deleted) ? m(this._membersTable) : null,
					(this._isMailGroup()) ? m(".h4.mt-l", lang.get("mailSettings_label")) : null,
					(this._isMailGroup()) ? m(".wrapping-row", [
							m("", [
								m(mailAddress),
							])
						]) : null
				]),
			]
		}

		this._updateUsedStorage()
	}

	_showAddMember(): void {
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			return loadAll(GroupInfoTypeRef, customer.userGroups).filter(userGroupInfo => {
				// remove all users that are already member
				return !userGroupInfo.deleted && (this._members.getLoaded().find(m => isSameId(m._id, userGroupInfo._id)) == null)
			}).then(availableUserGroupInfos => {
				if (availableUserGroupInfos.length > 0) {
					let d = new DropDownSelector("userSettings_label", null, availableUserGroupInfos.map(g => {
						return {name: getGroupInfoDisplayName(g), value: g}
					}), availableUserGroupInfos[0], 250)
					return Dialog.smallDialog(lang.get("addUserToGroup_label"), {
						view: () => m(d)
					}, null).then(ok => {
						if (ok) {
							showProgressDialog("pleaseWait_msg", load(GroupTypeRef, d.selectedValue().group).then(userGroup => {
								return load(UserTypeRef, neverNull(userGroup.user)).then(user => {
									worker.addUserToGroup(user, this.groupInfo.group)
								})
							}))
						}
					})
				}
			})
		})
	}

	_updateMembers(): void {
		this._members.reset()
		this._members.getAsync().map(userGroupInfo => {
			let removeButton = new Button("remove_action", () => {
				showProgressDialog("pleaseWait_msg", load(GroupTypeRef, userGroupInfo.group).then(userGroup => worker.removeUserFromGroup(neverNull(userGroup.user), this.groupInfo.group)))
			}, () => Icons.Cancel)
			return new TableLine([userGroupInfo.name, neverNull(userGroupInfo.mailAddress)], removeButton)
		}).then(tableLines => {
			this._membersTable.updateEntries(tableLines)
		})
	}

	_isMailGroup() {
		return (this._group.isLoaded() && this._group.getLoaded().type == GroupType.Mail)
	}

	_updateUsedStorage(): void {
		worker.readUsedGroupStorage(this.groupInfo.group).then(usedStorage => {
			this._usedStorage.setValue(formatStorageSize(usedStorage))
			m.redraw()
		}).catch(BadRequestError, e => {
			// may happen if the user gets the admin flag removed
		})
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && operation == OperationType.UPDATE) {
			load(GroupInfoTypeRef, this.groupInfo._id).then(updatedUserGroupInfo => {
				if (isSameId(this.groupInfo._id, [neverNull(listId), elementId])) {
					this.groupInfo = updatedUserGroupInfo
					this._name.setValue(updatedUserGroupInfo.name)
					this._deactivated.selectedValue(updatedUserGroupInfo.deleted != null)
					this._updateUsedStorage()
					m.redraw()
				} else {
					// a member name may have changed
					this._updateMembers()
				}
			})
		} else if (isSameTypeRef(typeRef, GroupMemberTypeRef) && this._group.isLoaded() && this._group.getLoaded().members == neverNull(listId)) {
			// the members have changed
			this._updateMembers()
		}
	}
}


export function getGroupTypeName(groupType: NumberString): string {
	if (groupType == GroupType.Mail) {
		return lang.get("mailGroup_label")
	} else if (groupType == GroupType.Team) {
		return lang.get("teamGroup_label")
	} else {
		return groupType // just for testing
	}
}