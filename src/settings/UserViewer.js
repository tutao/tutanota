// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Button} from "../gui/base/Button"
import {Dialog} from "../gui/base/Dialog"
import {load, loadAll, loadMultiple, loadRange, update} from "../api/main/Entity"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {EditAliasesForm} from "./EditAliasesForm"
import {lang} from "../misc/LanguageViewModel"
import {PasswordForm} from "./PasswordForm"
import {CUSTOM_MIN_ID, isSameId} from "../api/common/EntityFunctions"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {UserTypeRef} from "../api/entities/sys/User"
import {compareGroupInfos, getGroupInfoDisplayName, neverNull} from "../api/common/utils/Utils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {BookingItemFeatureType, GroupType, OperationType} from "../api/common/TutanotaConstants"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {BadRequestError, NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import * as BuyDialog from "../subscription/BuyDialog"
import {logins} from "../api/main/LoginController"
import {MailboxServerPropertiesTypeRef} from "../api/entities/tutanota/MailboxServerProperties"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {ColumnWidth, Table} from "../gui/base/Table"
import TableLine from "../gui/base/TableLine"
import {getGroupTypeName} from "./GroupViewer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {Icons} from "../gui/base/icons/Icons"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"
import {ContactFormTypeRef} from "../api/entities/tutanota/ContactForm"
import {remove} from "../api/common/utils/ArrayUtils"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {MailSettingNotificationViewer} from "./MailSettingNotificationViewer"
import {PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../api/main/EntityEventController"
import {isUpdateForTypeRef} from "../api/main/EntityEventController"

assertMainOrNode()

export class UserViewer {
	view: Function;
	userGroupInfo: GroupInfo;
	_user: LazyLoaded<User>;
	_customer: LazyLoaded<Customer>;
	_teamGroupInfos: LazyLoaded<GroupInfo[]>;
	_senderName: TextField;
	_groupsTable: ?Table;
	_contactFormsTable: ?Table;
	_aliases: EditAliasesForm;
	_usedStorage: TextField;
	_admin: DropDownSelector<boolean>;
	_administratedBy: DropDownSelector<?Id>;
	_deactivated: DropDownSelector<boolean>;
	_whitelistProtection: ?DropDownSelector<boolean>;
	_secondFactorsForm: EditSecondFactorsForm;
	_notificationViewer: MailSettingNotificationViewer;

	constructor(userGroupInfo: GroupInfo, isAdmin: boolean) {
		this.userGroupInfo = userGroupInfo
		this._user = new LazyLoaded(() => {
			return load(GroupTypeRef, this.userGroupInfo.group).then(userGroup => {
				return load(UserTypeRef, neverNull(userGroup.user))
			})
		})
		this._customer = new LazyLoaded(() => load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)))
		this._teamGroupInfos = new LazyLoaded(() => this._customer.getAsync()
			.then(customer => loadAll(GroupInfoTypeRef, customer.teamGroups)))
		this._senderName = new TextField("mailName_label").setValue(this.userGroupInfo.name).setDisabled()
		let editSenderNameButton = new Button("edit_action", () => {
			Dialog.showTextInputDialog("edit_action", "mailName_label", null, this._senderName.value())
				.then(newName => {
					this.userGroupInfo.name = newName
					update(this.userGroupInfo)
				})
		}, () => Icons.Edit)
		this._senderName._injectionsRight = () => [m(editSenderNameButton)]

		let mailAddress = new TextField("mailAddress_label").setValue(this.userGroupInfo.mailAddress).setDisabled()
		let created = new TextField("created_label").setValue(formatDateWithMonth(this.userGroupInfo.created))
			.setDisabled()
		this._usedStorage = new TextField("storageCapacityUsed_label").setValue(lang.get("loading_msg")).setDisabled()

		this._admin = new DropDownSelector("globalAdmin_label", null, [
			{name: lang.get("no_label"), value: false},
			{name: lang.get("yes_label"), value: true}
		], stream(isAdmin)).setSelectionChangedHandler(makeAdmin => {
			if (this.userGroupInfo.deleted) {
				Dialog.error("userAccountDeactivated_msg")
			} else if (this._isItMe()) {
				Dialog.error("removeOwnAdminFlagInfo_msg")
			} else if (this.userGroupInfo.localAdmin != null) {
				Dialog.error("assignAdminRightsToLocallyAdministratedUserError_msg")
			} else {
				showProgressDialog("pleaseWait_msg", this._user.getAsync()
					.then(user => worker.changeAdminFlag(user, makeAdmin)))
			}
		})


		this._deactivated = new DropDownSelector("state_label", null, [
			{name: lang.get("activated_label"), value: false},
			{name: lang.get("deactivated_label"), value: true}
		], stream(this.userGroupInfo.deleted != null)).setSelectionChangedHandler(deactivate => {
			if (this._admin.selectedValue()) {
				Dialog.error("deactivateOwnAccountInfo_msg")
			} else {
				this._deleteUser(!deactivate)
			}
		})

		let password = new TextField("password_label").setValue("***").setDisabled()
		let changePasswordButton = new Button("changePassword_label", () => this._changePassword(), () => Icons.Edit)
		password._injectionsRight = () => [m(changePasswordButton)]

		this._secondFactorsForm = new EditSecondFactorsForm(this._user);
		this._aliases = new EditAliasesForm(this.userGroupInfo)

		this._teamGroupInfos.getAsync().then(availableTeamGroupInfos => {
			if (availableTeamGroupInfos.length > 0) {
				let addGroupButton = new Button("addGroup_label", () => this._showAddUserToGroupDialog(), () => Icons.Add)
				this._groupsTable = new Table(["name_label", "groupType_label"], [
					ColumnWidth.Largest, ColumnWidth.Small
				], true, addGroupButton)
				this._updateGroups()

				let adminGroupIdToName: { name: string, value: ?Id }[] = [
					{
						name: lang.get("globalAdmin_label"),
						value: null
					}
				].concat(availableTeamGroupInfos.filter(gi => gi.groupType === GroupType.LocalAdmin).map(gi => {
					return {
						name: getGroupInfoDisplayName(gi),
						value: gi.group
					}
				}))
				this._administratedBy = new DropDownSelector("administratedBy_label", null, adminGroupIdToName, stream(this.userGroupInfo.localAdmin)).setSelectionChangedHandler(localAdminId => {
					return this._user.getAsync().then(user => {
						if (this.userGroupInfo.deleted) {
							Dialog.error("userAccountDeactivated_msg")
						} else if (this._isItMe()) {
							Dialog.error("updateOwnAdminship_msg")
						} else if (this._isAdmin(user)) {
							Dialog.error("updateAdminshipGlobalAdmin_msg")
						} else {
							showProgressDialog("pleaseWait_msg", Promise.resolve().then(() => {
								let newAdminGroupId = localAdminId ? localAdminId : neverNull(logins.getUserController()
									.user
									.memberships
									.find(gm => gm.groupType
										=== GroupType.Admin)).group
								return worker.updateAdminship(this.userGroupInfo.group, newAdminGroupId)
							}))
						}
					})
				})
			}
		})


		this._customer.getAsync().then(customer => {
			return load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(contactFormGroupRoot => {
				loadRange(ContactFormTypeRef, contactFormGroupRoot.contactForms, CUSTOM_MIN_ID, 1, false).then(cf => {
					if (cf.length > 0) {
						let contactFormsAddButton = new Button("addResponsiblePerson_label", () => this._showAddUserToContactFormDialog(), () => Icons.Add)
						this._contactFormsTable = new Table(["contactForms_label"], [
							ColumnWidth.Largest, ColumnWidth.Small
						], true, contactFormsAddButton)
						this._updateContactForms()
					}
				})
			})
		})

		this._notificationViewer = new MailSettingNotificationViewer()
		this._user.getAsync().then(user => this._notificationViewer.loadPushIdentifiers(user))


		this.view = () => {
			return [
				m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
					m(".h4.mt-l", lang.get('userSettings_label')),
					m("", [
						m(mailAddress),
						m(created),
						m(this._usedStorage),
					]),
					m("", [
						m(this._senderName),
						m(password),
						!logins.getUserController().isGlobalAdmin() ? null : [
							m(this._admin),
							this._administratedBy ? m(this._administratedBy) : null,
						],
						m(this._deactivated)
					]),
					(logins.getUserController().isPremiumAccount() || logins.getUserController()
						.isFreeAccount()) ? m(this._secondFactorsForm) : null,
					(this._groupsTable) ? m(".h4.mt-l.mb-s", lang.get('groups_label')) : null,
					(this._groupsTable) ? m(this._groupsTable) : null,
					(this._contactFormsTable) ? m(".h4.mt-l.mb-s", lang.get('contactForms_label')) : null,
					(this._contactFormsTable) ? m(this._contactFormsTable) : null,
					m(this._aliases),
					!logins.getUserController().isPremiumAccount() ? null : [
						m(".h4.mt-l", lang.get('mailSettings_label')),
						(this._whitelistProtection) ? m(this._whitelistProtection) : null,
						m(this._notificationViewer),
					]
				]),
			]
		}

		this._createOrUpdateWhitelistProtectionField()
		this._updateUsedStorageAndAdminFlag()
	}

	_createOrUpdateWhitelistProtectionField() {
		// currently not available
		// if (!logins.getUserController().isGlobalAdmin()) {
		// 	return
		// }
		// this._user.getAsync().then(user => {
		// 	let userMailGroupId = neverNull(user.memberships.find(m => m.groupType === GroupType.Mail)).group
		// 	return load(MailboxGroupRootTypeRef, userMailGroupId).then(mailboxGroupRoot => {
		// 		return load(MailboxServerPropertiesTypeRef, mailboxGroupRoot.serverProperties).then(props => {
		// 			if (!this._whitelistProtection) {
		// 				this._whitelistProtection = new DropDownSelector("whitelistProtection_label", () => lang.get("whitelistProtectionInfo_label"), [
		// 					{name: lang.get("activated_label"), value: true},
		// 					{name: lang.get("deactivated_label"), value: false}
		// 				], props.whitelistProtectionEnabled).setSelectionChangedHandler(v => {
		// 					props.whitelistProtectionEnabled = v
		// 					update(props)
		// 				})
		// 				m.redraw()
		// 			} else {
		// 				this._whitelistProtection.selectedValue(props.whitelistProtectionEnabled)
		// 			}
		// 		})
		// 	}).catch(NotFoundError, e => {
		// 		// not migrated yet
		// 	})
		// })
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
							let removeButton
							removeButton = new Button("remove_action", () => {
								showProgressDialog("pleaseWait_msg", worker.removeUserFromGroup(user._id, groupInfo.group))
									.catch(NotAuthorizedError, e => {
										Dialog.error("removeUserFromGroupNotAdministratedUserError_msg")
									})
							}, () => Icons.Cancel)
							return new TableLine([
								getGroupInfoDisplayName(groupInfo), getGroupTypeName(neverNull(m.groupType))
							], removeButton)
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

	_updateContactForms(): void {
		if (this._contactFormsTable) {
			this._user.getAsync().then(user => {
				let userMailGroupMembership = neverNull(user.memberships.find(m => m.groupType === GroupType.Mail))
				return load(MailboxGroupRootTypeRef, userMailGroupMembership.group).then(mailboxGroupRoot => {
					if (mailboxGroupRoot.participatingContactForms.length > 0) {
						return loadMultiple(ContactFormTypeRef, mailboxGroupRoot.participatingContactForms[0][0], mailboxGroupRoot.participatingContactForms.map(idTuple => idTuple[1]))
					}
					return []
				}).map((cf: ContactForm) => {
					let removeButton = new Button("remove_action", () => {
						let match = cf.participantGroupInfos.find(id => isSameId(id, user.userGroup.groupInfo))
						if (match) {
							remove(cf.participantGroupInfos, match)
						}
						showProgressDialog("pleaseWait_msg", update(cf))
					}, () => Icons.Cancel)
					return new TableLine([cf.path], removeButton)
				}).then(tableLines => {
					if (this._contactFormsTable) {
						this._contactFormsTable.updateEntries(tableLines)
					}
				})
			})
		}
	}


	_showAddUserToGroupDialog() {
		this._user.getAsync().then(user => {
			if (this.userGroupInfo.deleted) {
				Dialog.error("userAccountDeactivated_msg")
			} else {
				// remove all groups the user is already member of
				let globalAdmin = logins.isGlobalAdminUserLoggedIn()
				let localAdminGroupIds = logins.getUserController().getLocalAdminGroupMemberships().map(gm => gm.group)
				let availableGroupInfos = this._teamGroupInfos.getLoaded().filter(g => {
					if (!globalAdmin && localAdminGroupIds.indexOf(g.localAdmin) === -1) {
						return false
					} else {
						return !g.deleted && user.memberships.find(m => isSameId(m.groupInfo, g._id)) == null
					}
				})
				if (availableGroupInfos.length > 0) {
					availableGroupInfos.sort(compareGroupInfos)
					let dropdown = new DropDownSelector("group_label", null, availableGroupInfos.map(g => {
						return {name: getGroupInfoDisplayName(g), value: g}
					}), stream(availableGroupInfos[0]), 250)

					let addUserToGroupOkAction = (dialog) => {
						showProgressDialog("pleaseWait_msg", worker.addUserToGroup(user, dropdown.selectedValue().group))
						dialog.close()
					}

					Dialog.showActionDialog({
						title: lang.get("addUserToGroup_label"),
						child: {view: () => m(dropdown)},
						okAction: addUserToGroupOkAction
					})
				}
			}
		})
	}


	_showAddUserToContactFormDialog() {
		this._user.getAsync().then(user => {
			this._customer.getAsync().then(customer => {
				return load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(contactFormGroupRoot => {
					loadAll(ContactFormTypeRef, contactFormGroupRoot.contactForms).then(contactForms => {
						let dropdown = new DropDownSelector("contactForms_label", null, contactForms.map(cf => {
							return {name: cf.path, value: cf}
						}), stream(contactForms[0]), 250)

						let addUserToContactFormOkAction = (dialog) => {
							let cf = (dropdown.selectedValue(): ContactForm)
							if (cf.participantGroupInfos.indexOf(user.userGroup.groupInfo)) {
								cf.participantGroupInfos.push(user.userGroup.groupInfo)
							}
							showProgressDialog("pleaseWait_msg", update(cf))
							dialog.close()
						}

						Dialog.showActionDialog({
							title: lang.get("responsiblePersons_label"),
							child: {view: () => m(dropdown)},
							okAction: addUserToContactFormOkAction
						})
					})
				})
			})
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
		return user.memberships.filter(m => m.groupInfo[0] === customer.teamGroups)
	}

	_isAdmin(user: User): boolean {
		return user.memberships.find(m => m.groupType === GroupType.Admin) != null
	}

	_deleteUser(restore: boolean): Promise<void> {
		return showProgressDialog("pleaseWait_msg", load(GroupTypeRef, this.userGroupInfo.group).then(group => {
			return showProgressDialog("pleaseWait_msg",
				BuyDialog.show(BookingItemFeatureType.Users, (restore) ? 1 : -1, 0, restore)
					.then(confirmed => {
						if (confirmed) {
							return this._user.getAsync().then(user => {
								return worker.deleteUser(user, restore)
							})
						}
					})).catch(PreconditionFailedError, e => {
				Dialog.error("emailAddressInUse_msg")
			})
		}))
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): void {
		for (let update of updates) {
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE
				&& isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
				load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
					this.userGroupInfo = updatedUserGroupInfo
					this._senderName.setValue(updatedUserGroupInfo.name)
					this._deactivated.selectedValue(updatedUserGroupInfo.deleted != null)
					this._updateUsedStorageAndAdminFlag()
					if (this._administratedBy) {
						this._administratedBy.selectedValue(this.userGroupInfo.localAdmin)
					}
					m.redraw()
				})
			} else if (isUpdateForTypeRef(UserTypeRef, update) && operation === OperationType.UPDATE && this._user.isLoaded()
				&& isSameId(this._user.getLoaded()._id, instanceId)) {
				this._user.reset()
				this._updateUsedStorageAndAdminFlag()
				this._updateGroups()
			} else if (isUpdateForTypeRef(MailboxServerPropertiesTypeRef, update)) {
				this._createOrUpdateWhitelistProtectionField()
			} else if (isUpdateForTypeRef(MailboxGroupRootTypeRef, update)) {
				this._updateContactForms()
			} else if (isUpdateForTypeRef(PushIdentifierTypeRef, update) && this._user.isLoaded()) {
				this._notificationViewer.loadPushIdentifiers(this._user.getLoaded())
			}
			this._secondFactorsForm.entityEventReceived(update)
			this._aliases.entityEventReceived(update)
		}
	}
}