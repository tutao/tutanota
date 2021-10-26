// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {Button} from "../gui/base/Button"
import {Dialog} from "../gui/base/Dialog"
import {load, loadAll, loadMultiple, loadRange, update} from "../api/main/Entity"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {PasswordForm} from "./PasswordForm"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import type {User} from "../api/entities/sys/User"
import {UserTypeRef} from "../api/entities/sys/User"
import {neverNull} from "@tutao/tutanota-utils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {BookingItemFeatureType, GroupType, OperationType} from "../api/common/TutanotaConstants"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {BadRequestError, NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import {logins} from "../api/main/LoginController"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {Table} from "../gui/base/Table"
import {ColumnWidth} from "../gui/base/TableN"
import TableLine from "../gui/base/TableLine"
import {getGroupTypeName} from "./GroupViewer"
import type {Customer} from "../api/entities/sys/Customer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {Icons} from "../gui/base/icons/Icons"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"
import type {ContactForm} from "../api/entities/tutanota/ContactForm"
import {ContactFormTypeRef} from "../api/entities/tutanota/ContactForm"
import {remove} from "@tutao/tutanota-utils"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {HtmlEditor as Editor, Mode} from "../gui/editor/HtmlEditor"
import {filterContactFormsForLocalAdmin} from "./ContactFormListView"
import {checkAndImportUserData, CSV_USER_FORMAT} from "./ImportUsersViewer"
import type {EditAliasesFormAttrs} from "./EditAliasesFormN"
import {createEditAliasFormAttrs, EditAliasesFormN, updateNbrOfAliases} from "./EditAliasesFormN"
import type {GroupMembership} from "../api/entities/sys/GroupMembership"
import {compareGroupInfos, getGroupInfoDisplayName} from "../api/common/utils/GroupUtils";
import {CUSTOM_MIN_ID, isSameId} from "../api/common/utils/EntityUtils";
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {showBuyDialog} from "../subscription/BuyDialog"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN} from "../gui/base/ButtonN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"

assertMainOrNode()

export class UserViewer {
	view: Function;
	userGroupInfo: GroupInfo;
	_user: LazyLoaded<User>;
	_customer: LazyLoaded<Customer>;
	_teamGroupInfos: LazyLoaded<GroupInfo[]>;
	_senderName: string
	_groupsTable: ?Table;
	_contactFormsTable: ?Table;
	_adminStatusSelector: DropDownSelector<boolean>;
	_administratedBy: DropDownSelector<?Id>;
	_userStatusSelector: DropDownSelector<boolean>;
	_whitelistProtection: ?DropDownSelector<boolean>;
	_secondFactorsForm: EditSecondFactorsForm;
	_editAliasFormAttrs: EditAliasesFormAttrs;
	_usedStorage: number | null


	constructor(userGroupInfo: GroupInfo, isAdmin: boolean) {
		// used storage is unknown initially
		this._usedStorage = null
		this.userGroupInfo = userGroupInfo
		this._senderName = this.userGroupInfo.name || ""
		this._user = new LazyLoaded(() => {
			return load(GroupTypeRef, this.userGroupInfo.group).then(userGroup => {
				return load(UserTypeRef, neverNull(userGroup.user))
			})
		})
		this._customer = new LazyLoaded(() => load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)))
		this._teamGroupInfos = new LazyLoaded(() => this._customer.getAsync()
		                                                .then(customer => loadAll(GroupInfoTypeRef, customer.teamGroups)))

		this._adminStatusSelector = new DropDownSelector("globalAdmin_label", null, [
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
				                                         .then(user => locator.userManagementFacade.changeAdminFlag(user, makeAdmin)))
			}
		})

		this._userStatusSelector = new DropDownSelector("state_label", null, [
			{name: lang.get("activated_label"), value: false},
			{name: lang.get("deactivated_label"), value: true}
		], stream(this.userGroupInfo.deleted != null)).setSelectionChangedHandler(deactivate => {
			if (this._adminStatusSelector.selectedValue()) {
				Dialog.error("deactivateOwnAccountInfo_msg")
			} else {
				this._deleteUser(!deactivate)
			}
		})

		this._secondFactorsForm = new EditSecondFactorsForm(this._user);

		this._teamGroupInfos.getAsync().then(availableTeamGroupInfos => {
			if (availableTeamGroupInfos.length > 0) {
				let addGroupButton = new Button("addGroup_label", () => this._showAddUserToGroupDialog(), () => Icons.Add)
				this._groupsTable = new Table(["name_label", "groupType_label"], [
					ColumnWidth.Largest, ColumnWidth.Small
				], true, addGroupButton)
				this._updateGroups()

				let adminGroupIdToName: {name: string, value: ?Id}[] = [
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
								return locator.userManagementFacade.updateAdminship(this.userGroupInfo.group, newAdminGroupId)
							}))
						}
					})
				})
			}
		})


		this._customer.getAsync().then(customer => {
			return load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(contactFormGroupRoot => {
				return loadRange(ContactFormTypeRef, contactFormGroupRoot.contactForms, CUSTOM_MIN_ID, 1, false).then(cf => {
					if (cf.length > 0) {
						let contactFormsAddButton = new Button("addResponsiblePerson_label", () => this._showAddUserToContactFormDialog(), () => Icons.Add)
						this._contactFormsTable = new Table(["contactForms_label"], [
							ColumnWidth.Largest, ColumnWidth.Small
						], true, contactFormsAddButton)
						return this._updateContactForms()
					}
				})
			})
		})

		this._editAliasFormAttrs = createEditAliasFormAttrs(this.userGroupInfo)

		if (logins.getUserController().isGlobalAdmin()) {
			updateNbrOfAliases(this._editAliasFormAttrs)
		}

		this._updateUsedStorageAndAdminFlag()
	}

	view(vnode: Vnode<any>): Children {
		const editSenderNameButtonAttrs: ButtonAttrs = {
			label: "edit_action",
			click: () => {
				Dialog.showTextInputDialog("edit_action", "mailName_label", null, this._senderName)
				      .then(newName => {
					      this.userGroupInfo.name = newName
					      update(this.userGroupInfo)
				      })
			},
			icon: () => Icons.Edit,
		}
		const senderNameFieldAttrs = {
			label: "mailName_label",
			value: stream(this._senderName),
			disabled: true,
			injectionsRight: () => [m(ButtonN, editSenderNameButtonAttrs)]
		}

		const mailAddressFieldAttrs = {
			label: "mailAddress_label",
			value: stream(this.userGroupInfo.mailAddress ?? ""),
			disabled: true,
		}

		const createdFieldAttrs = {
			label: "created_label",
			value: stream(formatDateWithMonth(this.userGroupInfo.created)),
			disabled: true
		}

		const usedStorageFieldAttrs = {
			label: "storageCapacityUsed_label",
			value: this._usedStorage ? stream(formatStorageSize(this._usedStorage)) : stream(lang.get("loading_msg")),
			disabled: true,
		}

		const changePasswordButtonAttrs: ButtonAttrs = {
			label: "changePassword_label",
			click: () => this._changePassword(),
			icon: () => Icons.Edit,

		}
		const passwordFieldAttrs = {
			label: "password_label",
			value: stream("***"),
			injectionsRight: () => [m(ButtonN, changePasswordButtonAttrs)],
			disabled: true
		}

		const whitelistProtection = this._whitelistProtection
		return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
			m(".h4.mt-l", lang.get('userSettings_label')),
			m("", [
				m(TextFieldN, mailAddressFieldAttrs),
				m(TextFieldN, createdFieldAttrs),
				m(TextFieldN, usedStorageFieldAttrs),
			]),
			m("", [
				m(TextFieldN, senderNameFieldAttrs),
				m(TextFieldN, passwordFieldAttrs),
				!logins.getUserController().isGlobalAdmin() ? null : [
					m(this._adminStatusSelector),
					this._administratedBy ? m(this._administratedBy) : null,
				],
				m(this._userStatusSelector)
			]),
			m(this._secondFactorsForm),
			(this._groupsTable) ? m(".h4.mt-l.mb-s", lang.get('groups_label')) : null,
			(this._groupsTable) ? m(this._groupsTable) : null,
			(this._contactFormsTable) ? m(".h4.mt-l.mb-s", lang.get('contactForms_label')) : null,
			(this._contactFormsTable) ? m(this._contactFormsTable) : null,
			m(EditAliasesFormN, this._editAliasFormAttrs),
			logins.getUserController().isPremiumAccount() && whitelistProtection
				? [
					m(".h4.mt-l", lang.get('mailSettings_label')),
					m(whitelistProtection)
				]
				: null
		])
	}

	_isItMe(): boolean {
		return isSameId(logins.getUserController().userGroupInfo._id, this.userGroupInfo._id)
	}

	_changePassword(): void {
		if (this._isItMe()) {
			PasswordForm.showChangeOwnPasswordDialog()
		} else if (this._adminStatusSelector.selectedValue()) {
			Dialog.error("changeAdminPassword_msg")
		} else {
			this._user.getAsync().then(user => {
				PasswordForm.showChangeUserPasswordAsAdminDialog(user)
			})
		}
	}

	_updateGroups(): Promise<void> {
		if (this._groupsTable) {
			return this._user.getAsync().then(user => {
				return this._customer.getAsync().then(customer => {
					return promiseMap(this._getTeamMemberships(user, customer), m => {
						return load(GroupInfoTypeRef, m.groupInfo).then(groupInfo => {
							let removeButton
							removeButton = new Button("remove_action", () => {
								showProgressDialog("pleaseWait_msg", locator.groupManagementFacade.removeUserFromGroup(user._id, groupInfo.group))
									.catch(ofClass(NotAuthorizedError, e => {
										Dialog.error("removeUserFromGroupNotAdministratedUserError_msg")
									}))
							}, () => Icons.Cancel)
							return new TableLine([
								getGroupInfoDisplayName(groupInfo), getGroupTypeName(neverNull(m.groupType))
							], removeButton)
						})
					}, {concurrency: 5}).then(tableLines => {
						if (this._groupsTable) {
							this._groupsTable.updateEntries(tableLines)
						}
					})
				})
			})
		} else {
			return Promise.resolve()
		}
	}

	_updateContactForms(): Promise<void> {
		if (this._contactFormsTable) {
			return this._user.getAsync().then(user => {
				let userMailGroupMembership = neverNull(user.memberships.find(m => m.groupType === GroupType.Mail))
				return load(MailboxGroupRootTypeRef, userMailGroupMembership.group).then(mailboxGroupRoot => {
					if (mailboxGroupRoot.participatingContactForms.length > 0) {
						return loadMultiple(ContactFormTypeRef, mailboxGroupRoot.participatingContactForms[0][0], mailboxGroupRoot.participatingContactForms.map(idTuple => idTuple[1]))
					}
					return []
				}).then((forms) => {
					const tableLines = forms.map((cf) => {
						let removeButton = new Button("remove_action", () => {
							let match = cf.participantGroupInfos.find(id => isSameId(id, user.userGroup.groupInfo))
							if (match) {
								remove(cf.participantGroupInfos, match)
							}
							showProgressDialog("pleaseWait_msg", update(cf))
						}, () => Icons.Cancel)
						return new TableLine([cf.path], removeButton)
					})

					if (this._contactFormsTable) {
						this._contactFormsTable.updateEntries(tableLines)
					}
				})
			})
		} else {
			return Promise.resolve()
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
					if (!globalAdmin // global admins may add all groups
						&& localAdminGroupIds.indexOf(g.localAdmin) === -1 // local admins may only add groups they either are the admin of
						&& localAdminGroupIds.indexOf(g.group) === -1) {  // or it is their own local admin group
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
						showProgressDialog("pleaseWait_msg", locator.groupManagementFacade.addUserToGroup(user, dropdown.selectedValue().group))
						dialog.close()
					}

					Dialog.showActionDialog({
						title: lang.get("addUserToGroup_label"),
						child: {view: () => m(dropdown)},
						allowOkWithReturn: true,
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
					loadAll(ContactFormTypeRef, contactFormGroupRoot.contactForms).then(allContactForms => {
						filterContactFormsForLocalAdmin(allContactForms).then(contactForms => {
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
								allowOkWithReturn: true,
								okAction: addUserToContactFormOkAction
							})
						})
					})
				})
			})
		})
	}

	_updateUsedStorageAndAdminFlag(): Promise<void> {
		return this._user.getAsync().then(user => {
			let isAdmin = this._isAdmin(user)
			this._adminStatusSelector.selectedValue(isAdmin)

			return locator.userManagementFacade.readUsedUserStorage(user).then(usedStorage => {
				this._usedStorage = usedStorage
				m.redraw()
			}).catch(ofClass(BadRequestError, e => {
				// may happen if the user gets the admin flag removed
			}))
		})
	}

	_getTeamMemberships(user: User, customer: Customer): GroupMembership[] {
		return user.memberships.filter(m => m.groupInfo[0] === customer.teamGroups)
	}

	_isAdmin(user: User): boolean {
		return user.memberships.find(m => m.groupType === GroupType.Admin) != null
	}

	_deleteUser(restore: boolean): Promise<void> {
		return showProgressDialog("pleaseWait_msg",
			showBuyDialog(BookingItemFeatureType.Users, (restore) ? 1 : -1, 0, restore).then(confirmed => {
				if (confirmed) {
					return this._user.getAsync().then(user => {
						return locator.userManagementFacade.deleteUser(user, restore)
					})
				}
			})
		).catch(ofClass(PreconditionFailedError, e => {
			if (restore) {
				Dialog.error("emailAddressInUse_msg")
			} else {
				Dialog.error("stillReferencedFromContactForm_msg")
			}
		}))
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			let promise = Promise.resolve()
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE
				&& isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
				promise = load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
					this.userGroupInfo = updatedUserGroupInfo
					this._senderName = updatedUserGroupInfo.name
					this._userStatusSelector.selectedValue(updatedUserGroupInfo.deleted != null)
					return this._updateUsedStorageAndAdminFlag().then(() => {
						if (this._administratedBy) {
							this._administratedBy.selectedValue(this.userGroupInfo.localAdmin)
						}
						this._editAliasFormAttrs.userGroupInfo = this.userGroupInfo
						m.redraw()
					})
				})
			} else if (isUpdateForTypeRef(UserTypeRef, update) && operation === OperationType.UPDATE && this._user.isLoaded()
				&& isSameId(this._user.getLoaded()._id, instanceId)) {
				this._user.reset()
				promise = this._updateUsedStorageAndAdminFlag().then(() => {
					return this._updateGroups()
				})
			} else if (isUpdateForTypeRef(MailboxGroupRootTypeRef, update)) {
				promise = this._updateContactForms()
			}
			return promise.then(() => {
				return this._secondFactorsForm.entityEventReceived(update)
			})
		}).then(() => m.redraw())
	}
}

/**
 * Show editor for adding the csv values of the users.
 */
export function showUserImportDialog(customDomains: string[]) {
	let editor = new Editor("enterAsCSV_msg")
		.showBorders()
		.setMode(Mode.HTML)
		.setValue(CSV_USER_FORMAT)
		.setMinHeight(200)

	let form = {
		view: () => {
			return [
				m(editor)
			]
		}
	}

	Dialog.showActionDialog({
		title: lang.get("importUsers_action"),
		child: form,
		okAction: (csvDialog) => {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog(false)
			} else {
				let closeCsvDialog = checkAndImportUserData(editor.getValue(), customDomains)
				if (closeCsvDialog) {
					csvDialog.close()
				}
			}
		}
	})
}
