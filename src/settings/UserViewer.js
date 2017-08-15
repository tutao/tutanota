// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Button} from "../gui/base/Button"
import {Dialog} from "../gui/base/Dialog"
import {update, load, loadAll} from "../api/main/Entity"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {EditAliasesForm} from "./EditAliasesForm"
import {lang} from "../misc/LanguageViewModel"
import {PasswordForm} from "./PasswordForm"
import {isSameId, isSameTypeRef} from "../api/common/EntityFunctions"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {UserTypeRef} from "../api/entities/sys/User"
import {neverNull, getGroupInfoDisplayName} from "../api/common/utils/Utils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {OperationType, BookingItemFeatureType, GroupType} from "../api/common/TutanotaConstants"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {BadRequestError, NotFoundError} from "../api/common/error/RestError"
import * as BuyDialog from "./BuyDialog"
import {logins} from "../api/main/LoginController"
import {MailboxServerPropertiesTypeRef} from "../api/entities/tutanota/MailboxServerProperties"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {Table, ColumnWidth} from "../gui/base/Table"
import TableLine from "../gui/base/TableLine"
import {getGroupTypeName} from "./GroupViewer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {Icons} from "../gui/base/icons/Icons"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"

assertMainOrNode()

export class UserViewer {
	view: Function;
	userGroupInfo: GroupInfo;
	_user: LazyLoaded<User>;
	_customer: LazyLoaded<Customer>;
	_teamGroupInfos: LazyLoaded<GroupInfo[]>;
	_senderName: TextField;
	_groupsTable: ?Table;
	_aliases: EditAliasesForm;
	_usedStorage: TextField;
	_admin: DropDownSelector<boolean>;
	_deactivated: DropDownSelector<boolean>;
	_whitelistProtection: ?DropDownSelector<boolean>;
	_secondFactorsForm: EditSecondFactorsForm;

	constructor(userGroupInfo: GroupInfo, isAdmin: boolean) {
		this.userGroupInfo = userGroupInfo
		this._user = new LazyLoaded(() => {
			return load(GroupTypeRef, this.userGroupInfo.group).then(userGroup => {
				return load(UserTypeRef, neverNull(userGroup.user))
			})
		})
		this._customer = new LazyLoaded(() => load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)))
		this._teamGroupInfos = new LazyLoaded(() => this._customer.getAsync().then(customer => loadAll(GroupInfoTypeRef, customer.teamGroups)))

		this._senderName = new TextField("mailName_label").setValue(userGroupInfo.name).setDisabled()
		let editSenderNameButton = new Button("edit_action", () => {
			Dialog.showTextInputDialog("edit_action", "mailName_label", null, this._senderName.value()).then(newName => {
				userGroupInfo.name = newName
				update(userGroupInfo)
			})
		}, () => BootIcons.Edit)
		this._senderName._injectionsRight = () => [m(editSenderNameButton)]

		let mailAddress = new TextField("mailAddress_label").setValue(userGroupInfo.mailAddress).setDisabled()
		let created = new TextField("created_label").setValue(formatDateWithMonth(userGroupInfo.created)).setDisabled()
		this._usedStorage = new TextField("storageCapacityUsed_label").setValue(lang.get("loading_msg")).setDisabled()

		this._admin = new DropDownSelector("administrator_label", null, [{
			name: lang.get("no_label"),
			value: false
		}, {name: lang.get("yes_label"), value: true}], isAdmin).setSelectionChangedHandler(makeAdmin => {
			if (this.userGroupInfo.deleted) {
				Dialog.error("userAccountDeactivated_msg")
			} else if (this._isItMe()) {
				Dialog.error("removeOwnAdminFlagInfo_msg")
			} else {
				Dialog.progress("pleaseWait_msg", this._user.getAsync().then(user => worker.changeAdminFlag(user, makeAdmin)))
			}
		})

		this._deactivated = new DropDownSelector("state_label", null, [
			{name: lang.get("activated_label"), value: false},
			{name: lang.get("deactivated_label"), value: true}
		], this.userGroupInfo.deleted != null).setSelectionChangedHandler(deactivate => {
			if (this._admin.selectedValue()) {
				Dialog.error("deactivateOwnAccountInfo_msg")
			} else {
				this._deleteUser(!deactivate)
			}
		})

		let password = new TextField("password_label").setValue("***").setDisabled()
		let changePasswordButton = new Button("changePassword_label", () => this._changePassword(), () => BootIcons.Edit)
		password._injectionsRight = () => [m(changePasswordButton)]

		this._secondFactorsForm = new EditSecondFactorsForm(this._user);
		this._aliases = new EditAliasesForm(userGroupInfo)

		this._teamGroupInfos.getAsync().then(availableTeamGroupInfos => {
			if (availableTeamGroupInfos.length > 0) {
				let addGroupButton = new Button("addGroup_label", () => this._showAddUserToGroupDialog(), () => Icons.Add)
				this._groupsTable = new Table(["name_label", "groupType_label"], [ColumnWidth.Largest, ColumnWidth.Small], true, addGroupButton)
				this._updateGroups()
			}
		})

		this.view = () => {
			return [
				m("#user-viewer.fill-absolute.scroll.plr-l", [
					m(".h4.mt-l", lang.get('userSettings_label')),
					m(".wrapping-row", [
						m("", [
							m(mailAddress),
							m(created),
							m(this._usedStorage),
						]),
						m("", [
							m(this._senderName),
							m(password),
							m(this._admin),
							m(this._deactivated)
						]),
					]),
					(logins.getUserController().isPremiumAccount() || logins.getUserController().isFreeAccount()) ? m(this._secondFactorsForm) : null,
					(this._groupsTable) ? m(".h4.mt-l.mb-s", lang.get('groups_label')) : null,
					(this._groupsTable) ? m(this._groupsTable) : null,
					m(this._aliases),
					logins.getUserController().isPremiumAccount() ? m(".h4.mt-l", lang.get('mailSettings_label')) : null,
					logins.getUserController().isPremiumAccount() && !logins.isProdDisabled() ? m(".wrapping-row", [
							m("", [
								(this._whitelistProtection) ? m(this._whitelistProtection) : null,
							]),
							m("", [])
						]) : null
				]),
			]
		}

		this._createOrUpdateWhitelistProtectionField()
		this._updateUsedStorageAndAdminFlag()
	}

	_createOrUpdateWhitelistProtectionField() {
		this._user.getAsync().then(user => {
			let userMailGroupId = neverNull(user.memberships.find(m => m.groupType === GroupType.Mail)).group
			return load(MailboxGroupRootTypeRef, userMailGroupId).then(mailboxGroupRoot => {
				return load(MailboxServerPropertiesTypeRef, mailboxGroupRoot.serverProperties).then(props => {
					if (!this._whitelistProtection) {
						this._whitelistProtection = new DropDownSelector("whitelistProtection_label", () => lang.get("whitelistProtectionInfo_label"), [
							{name: lang.get("activated_label"), value: true},
							{name: lang.get("deactivated_label"), value: false}
						], props.whitelistProtectionEnabled).setSelectionChangedHandler(v => {
							props.whitelistProtectionEnabled = v
							update(props)
						})
						m.redraw()
					} else {
						this._whitelistProtection.selectedValue(props.whitelistProtectionEnabled)
					}
				})
			}).catch(NotFoundError, e => {
				// not migrated yet
			})
		})
	}

	_isItMe(): boolean {
		return isSameId(logins.getUserController().userGroupInfo._id, this.userGroupInfo._id)
	}

	_changePassword(): void {
		if (this._isItMe()) {
			PasswordForm.showChangeOwnPasswordDialog()
		} else if (this._admin.selectedValue()) {
			Dialog.error("changeAdminPassword_msg")
		} else {
			this._user.getAsync().then(user => {
				PasswordForm.showChangeUserPasswordAsAdminDialog(user)
			})
		}
	}

	_updateGroups(): void {
		if (this._groupsTable) {
			this._user.getAsync().then(user => {
				this._customer.getAsync().then(customer => {
					Promise.map(this._getTeamMemberships(user, customer), m => {
						return load(GroupInfoTypeRef, m.groupInfo).then(groupInfo => {
							let removeButton = new Button("remove_action", () => {
								Dialog.progress("pleaseWait_msg", worker.removeUserFromGroup(user._id, groupInfo.group))
							}, () => Icons.Cancel)
							return new TableLine([getGroupInfoDisplayName(groupInfo), getGroupTypeName(neverNull(m.groupType))], removeButton)
						})
					}).then(tableLines => {
						if (this._groupsTable) {
							this._groupsTable.updateEntries(tableLines)
						}
					})
				})
			})
		}
	}

	_showAddUserToGroupDialog() {
		this._user.getAsync().then(user => {
			// remove all groups the user is already member of
			let availableGroupInfos = this._teamGroupInfos.getLoaded().filter(g => !g.deleted && user.memberships.find(m => isSameId(m.groupInfo, g._id)) == null)
			if (availableGroupInfos.length > 0) {
				let d = new DropDownSelector("group_label", null, availableGroupInfos.map(g => {
					return {name: getGroupInfoDisplayName(g), value: g}
				}), availableGroupInfos[0], 250)
				return Dialog.smallDialog(lang.get("addUserToGroup_label"), {
					view: () => m(d)
				}, null).then(ok => {
					if (ok) {
						Dialog.progress("pleaseWait_msg", worker.addUserToGroup(user, d.selectedValue().group))
					}
				})
			}
		})
	}

	_updateUsedStorageAndAdminFlag(): void {
		this._user.getAsync().then(user => {
			let isAdmin = this._isAdmin(user)
			this._admin.selectedValue(isAdmin)

			worker.readUsedUserStorage(user).then(usedStorage => {
				this._usedStorage.setValue(formatStorageSize(usedStorage))
				m.redraw()
			}).catch(BadRequestError, e => {
				// may happen if the user gets the admin flag removed
			})
		})
	}

	_getTeamMemberships(user: User, customer: Customer): GroupMembership[] {
		return user.memberships.filter(m => m.groupInfo[0] == customer.teamGroups)
	}

	_isAdmin(user: User): boolean {
		return user.memberships.find(m => m.admin) != null
	}

	_deleteUser(restore: boolean): Promise<void> {
		return Dialog.progress("pleaseWait_msg", load(GroupTypeRef, this.userGroupInfo.group).then(group => {
			let availablePromise = (restore) ? worker.isMailAddressAvailable(neverNull(this.userGroupInfo.mailAddress)) : Promise.resolve(true)
			return availablePromise.then(available => {
				if (available) {
					return BuyDialog.show(BookingItemFeatureType.Users, (restore) ? 1 : -1, 0).then(confirmed => {
						if (confirmed) {
							return this._user.getAsync().then(user => {
								return worker.deleteUser(user, restore)
							})
						}
					})
				} else {
					Dialog.error("emailAddressInUse_msg")
				}
			})
		}))
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && operation == OperationType.UPDATE && isSameId(this.userGroupInfo._id, [neverNull(listId), elementId])) {
			load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
				this.userGroupInfo = updatedUserGroupInfo
				this._senderName.setValue(updatedUserGroupInfo.name)
				this._deactivated.selectedValue(updatedUserGroupInfo.deleted != null)
				this._updateUsedStorageAndAdminFlag()
				m.redraw()
			})
		} else if (isSameTypeRef(typeRef, UserTypeRef) && operation == OperationType.UPDATE && this._user.isLoaded() && isSameId(this._user.getLoaded()._id, elementId)) {
			this._user.reset()
			this._updateUsedStorageAndAdminFlag()
			this._updateGroups()
		} else if (isSameTypeRef(typeRef, MailboxServerPropertiesTypeRef)) {
			this._createOrUpdateWhitelistProtectionField()
		}
		this._secondFactorsForm.entityEventReceived(typeRef, listId, elementId, operation)
		this._aliases.entityEventReceived(typeRef, listId, elementId, operation)
	}
}