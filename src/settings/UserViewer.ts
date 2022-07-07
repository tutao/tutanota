import m, {Children} from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {Dialog} from "../gui/base/Dialog"
import {formatDateWithMonth, formatStorageSize} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import type {Customer, GroupInfo, GroupMembership, User} from "../api/entities/sys/TypeRefs.js"
import {CustomerTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef} from "../api/entities/sys/TypeRefs.js"
import {assertNotNull, LazyLoaded, neverNull, ofClass, promiseMap, remove} from "@tutao/tutanota-utils"
import {BookingItemFeatureType, GroupType, OperationType} from "../api/common/TutanotaConstants"
import {BadRequestError, NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import {logins} from "../api/main/LoginController"
import type {ContactForm} from "../api/entities/tutanota/TypeRefs.js"
import {ContactFormTypeRef, CustomerContactFormGroupRootTypeRef, MailboxGroupRootTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {ColumnWidth, TableAttrs, Table} from "../gui/base/Table.js"
import {getGroupTypeName} from "./GroupViewer"
import {Icons} from "../gui/base/icons/Icons"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import stream from "mithril/stream"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {HtmlEditor as Editor, HtmlEditorMode} from "../gui/editor/HtmlEditor"
import {filterContactFormsForLocalAdmin} from "./contactform/ContactFormListView.js"
import {checkAndImportUserData, CSV_USER_FORMAT} from "./ImportUsersViewer"
import type {EditAliasesFormAttrs} from "./EditAliasesFormN"
import {createEditAliasFormAttrs, EditAliasesFormN, updateNbrOfAliases} from "./EditAliasesFormN"
import {compareGroupInfos, getGroupInfoDisplayName} from "../api/common/utils/GroupUtils"
import {CUSTOM_MIN_ID, isSameId} from "../api/common/utils/EntityUtils"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {showBuyDialog} from "../subscription/BuyDialog"
import type {ButtonAttrs} from "../gui/base/Button.js"
import {Button} from "../gui/base/Button.js"
import {TextFieldN} from "../gui/base/TextFieldN"
import {locator} from "../api/main/MainLocator"
import {SelectorItem} from "../gui/base/DropDownSelectorN";
import {UpdatableSettingsDetailsViewer} from "./SettingsView"
import {showChangeOwnPasswordDialog, showChangeUserPasswordAsAdminDialog} from "./ChangePasswordDialogs.js";

assertMainOrNode()

export class UserViewer implements UpdatableSettingsDetailsViewer {
	userGroupInfo: GroupInfo
	private readonly _user: LazyLoaded<User>
	private readonly _customer: LazyLoaded<Customer>
	private readonly _teamGroupInfos: LazyLoaded<GroupInfo[]>
	private _senderName: string
	private _groupsTableAttrs: TableAttrs | null = null
	private _contactFormsTableAttrs: TableAttrs | null = null
	private readonly _adminStatusSelector: DropDownSelector<boolean>
	private _administratedBy!: DropDownSelector<Id | null>
	private readonly _userStatusSelector: DropDownSelector<boolean>
	private _whitelistProtection: DropDownSelector<boolean> | null = null
	private readonly _secondFactorsForm: EditSecondFactorsForm
	private readonly _editAliasFormAttrs: EditAliasesFormAttrs
	private _usedStorage: number | null

	constructor(userGroupInfo: GroupInfo, isAdmin: boolean) {
		// used storage is unknown initially
		this._usedStorage = null
		this.userGroupInfo = userGroupInfo
		this._senderName = this.userGroupInfo.name || ""
		this._user = new LazyLoaded(() => {
			return locator.entityClient.load(GroupTypeRef, this.userGroupInfo.group).then(userGroup => {
				return locator.entityClient.load(UserTypeRef, neverNull(userGroup.user))
			})
		})
		this._customer = new LazyLoaded(() => locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)))
		this._teamGroupInfos = new LazyLoaded(() =>
			this._customer.getAsync().then(customer => locator.entityClient.loadAll(GroupInfoTypeRef, customer.teamGroups)),
		)
		this._adminStatusSelector = new DropDownSelector(
			"globalAdmin_label",
			null,
			[
				{
					name: lang.get("no_label"),
					value: false,
				},
				{
					name: lang.get("yes_label"),
					value: true,
				},
			],
			stream(isAdmin),
		).setSelectionChangedHandler(makeAdmin => {
			if (this.userGroupInfo.deleted) {
				Dialog.message("userAccountDeactivated_msg")
			} else if (this.isItMe()) {
				Dialog.message("removeOwnAdminFlagInfo_msg")
			} else if (this.userGroupInfo.localAdmin != null) {
				Dialog.message("assignAdminRightsToLocallyAdministratedUserError_msg")
			} else {
				showProgressDialog(
					"pleaseWait_msg",
					this._user.getAsync().then(user => locator.userManagementFacade.changeAdminFlag(user, makeAdmin)),
				)
			}
		})
		this._userStatusSelector = new DropDownSelector(
			"state_label",
			null,
			[
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			stream(this.userGroupInfo.deleted != null),
		).setSelectionChangedHandler(deactivate => {
			if (this._adminStatusSelector.selectedValue()) {
				Dialog.message("deactivateOwnAccountInfo_msg")
			} else {
				this.deleteUser(!deactivate)
			}
		})
		this._secondFactorsForm = new EditSecondFactorsForm(this._user)

		this._teamGroupInfos.getAsync().then(availableTeamGroupInfos => {
			if (availableTeamGroupInfos.length > 0) {
				this._groupsTableAttrs = {
					columnHeading: ["name_label", "groupType_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
					showActionButtonColumn: true,
					addButtonAttrs: {
						label: "addGroup_label",
						icon: () => Icons.Add,
						click: () => this.showAddUserToGroupDialog()
					},
					lines: []
				}
				this.updateGroups()

				let adminGroupIdToName: {name: string, value: Id | null}[] = [
					{
						name: lang.get("globalAdmin_label"),
						value: null,
					} as SelectorItem<Id | null>,
				].concat(
					availableTeamGroupInfos
						.filter(gi => gi.groupType === GroupType.LocalAdmin)
						.map(gi => {
							return {
								name: getGroupInfoDisplayName(gi),
								value: gi.group,
							}
						}),
				)
				this._administratedBy = new DropDownSelector(
					"administratedBy_label",
					null,
					adminGroupIdToName,
					stream(this.userGroupInfo.localAdmin),
				).setSelectionChangedHandler(localAdminId => {
					return this._user.getAsync().then(user => {
						if (this.userGroupInfo.deleted) {
							Dialog.message("userAccountDeactivated_msg")
						} else if (this.isItMe()) {
							Dialog.message("updateOwnAdminship_msg")
						} else if (this.isAdmin(user)) {
							Dialog.message("updateAdminshipGlobalAdmin_msg")
						} else {
							showProgressDialog(
								"pleaseWait_msg",
								Promise.resolve().then(() => {
									let newAdminGroupId = localAdminId
										? localAdminId
										: neverNull(logins.getUserController().user.memberships.find(gm => gm.groupType === GroupType.Admin)).group
									return locator.userManagementFacade.updateAdminship(this.userGroupInfo.group, newAdminGroupId)
								}),
							)
						}
					})
				})
			}
		})

		this._customer.getAsync().then(customer => {
			return locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(contactFormGroupRoot => {
				return locator.entityClient.loadRange(ContactFormTypeRef, contactFormGroupRoot.contactForms, CUSTOM_MIN_ID, 1, false).then(cf => {
					if (cf.length > 0) {
						this._contactFormsTableAttrs = {
							columnHeading: ["contactForms_label"],
							columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
							showActionButtonColumn: true,
							addButtonAttrs: {
								label: "addResponsiblePerson_label",
								icon: () => Icons.Add,
								click: () => this.showAddUserToContactFormDialog()
							},
							lines: []
						}
						return this.updateContactForms()
					}
				})
			})
		})

		this._editAliasFormAttrs = createEditAliasFormAttrs(this.userGroupInfo)

		if (logins.getUserController().isGlobalAdmin()) {
			updateNbrOfAliases(this._editAliasFormAttrs)
		}

		this.updateUsedStorageAndAdminFlag()
	}

	view(): Children {
		const editSenderNameButtonAttrs: ButtonAttrs = {
			label: "edit_action",
			click: () => {
				Dialog.showProcessTextInputDialog("edit_action", "mailName_label", null, this._senderName,
					(newName) => {
						this.userGroupInfo.name = newName
						return locator.entityClient.update(this.userGroupInfo)
					}
				)
			},
			icon: () => Icons.Edit,
		} as const
		const senderNameFieldAttrs = {
			label: "mailName_label",
			value: this._senderName,
			disabled: true,
			injectionsRight: () => [m(Button, editSenderNameButtonAttrs)],
		} as const
		const changePasswordButtonAttrs: ButtonAttrs = {
			label: "changePassword_label",
			click: () => this.changePassword(),
			icon: () => Icons.Edit,
		} as const
		const passwordFieldAttrs = {
			label: "password_label",
			value: "***",
			injectionsRight: () => [m(Button, changePasswordButtonAttrs)],
			disabled: true,
		} as const
		const whitelistProtection = this._whitelistProtection
		return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
			m(".h4.mt-l", lang.get("userSettings_label")),
			m("", [
				m(TextFieldN, {
					label: "mailAddress_label",
					value: this.userGroupInfo.mailAddress ?? "",
					disabled: true,
				}),
				m(TextFieldN, {
					label: "created_label",
					value: formatDateWithMonth(this.userGroupInfo.created),
					disabled: true,
				}),
				m(TextFieldN, {
					label: "storageCapacityUsed_label",
					value: this._usedStorage ? formatStorageSize(this._usedStorage) : lang.get("loading_msg"),
					disabled: true,
				} as const)
			]),
			m("", [
				m(TextFieldN, senderNameFieldAttrs),
				m(TextFieldN, passwordFieldAttrs),
				!logins.getUserController().isGlobalAdmin() ? null : [m(this._adminStatusSelector), this._administratedBy ? m(this._administratedBy) : null],
				m(this._userStatusSelector),
			]),
			m(this._secondFactorsForm),
			this._groupsTableAttrs ? m(".h4.mt-l.mb-s", lang.get("groups_label")) : null,
			this._groupsTableAttrs ? m(Table, this._groupsTableAttrs) : null,
			this._contactFormsTableAttrs ? m(".h4.mt-l.mb-s", lang.get("contactForms_label")) : null,
			this._contactFormsTableAttrs ? m(Table, this._contactFormsTableAttrs) : null,
			m(EditAliasesFormN, this._editAliasFormAttrs),
			logins.getUserController().isPremiumAccount() && whitelistProtection
				? [m(".h4.mt-l", lang.get("mailSettings_label")), m(whitelistProtection)]
				: null,
		])
	}

	private isItMe(): boolean {
		return isSameId(logins.getUserController().userGroupInfo._id, this.userGroupInfo._id)
	}

	private changePassword(): void {
		if (this.isItMe()) {
			showChangeOwnPasswordDialog()
		} else if (this._adminStatusSelector.selectedValue()) {
			Dialog.message("changeAdminPassword_msg")
		} else {
			this._user.getAsync().then(user => {
				showChangeUserPasswordAsAdminDialog(user)
			})
		}
	}

	private async updateGroups() {
		if (this._groupsTableAttrs) {
			const user = await this._user.getAsync()
			const customer = await this._customer.getAsync()
			this._groupsTableAttrs.lines = await promiseMap(
				this.getTeamMemberships(user, customer),
				async m => {
					const groupInfo = await locator.entityClient.load(GroupInfoTypeRef, m.groupInfo)
					return {
						cells: [getGroupInfoDisplayName(groupInfo), getGroupTypeName(neverNull(m.groupType))],
						actionButtonAttrs: {
							label: "remove_action",
							click: () => {
								showProgressDialog(
									"pleaseWait_msg",
									locator.groupManagementFacade.removeUserFromGroup(user._id, groupInfo.group),
								).catch(
									ofClass(NotAuthorizedError, e => {
										Dialog.message("removeUserFromGroupNotAdministratedUserError_msg")
									}),
								)
							},
							icon: () => Icons.Cancel
						} as const
					}
				},
				{
					concurrency: 5,
				},
			)
		}
	}

	private async updateContactForms() {
		if (this._contactFormsTableAttrs) {
			const user = await this._user.getAsync()
			const userMailGroupMembership = neverNull(user.memberships.find(m => m.groupType === GroupType.Mail))
			const mailboxGroupRoot = await locator.entityClient.load(MailboxGroupRootTypeRef, userMailGroupMembership.group)
			if (mailboxGroupRoot.participatingContactForms.length > 0) {
				const forms = await locator.entityClient.loadMultiple(
					ContactFormTypeRef,
					mailboxGroupRoot.participatingContactForms[0][0],
					mailboxGroupRoot.participatingContactForms.map(idTuple => idTuple[1]),
				)
				this._contactFormsTableAttrs.lines = forms.map(cf => ({
					cells: [cf.path],
					actionButtonAttrs: {
						label: "remove_action",
						click: () => {
							let match = cf.participantGroupInfos.find(id => isSameId(id, user.userGroup.groupInfo))

							if (match) {
								remove(cf.participantGroupInfos, match)
							}

							showProgressDialog("pleaseWait_msg", locator.entityClient.update(cf))
						},
						icons: Icons.Cancel
					}
				}))
			}
		}
	}

	private showAddUserToGroupDialog() {
		this._user.getAsync().then(user => {
			if (this.userGroupInfo.deleted) {
				Dialog.message("userAccountDeactivated_msg")
			} else {
				// remove all groups the user is already member of
				let globalAdmin = logins.isGlobalAdminUserLoggedIn()
				let localAdminGroupIds = logins
					.getUserController()
					.getLocalAdminGroupMemberships()
					.map(gm => gm.group)

				let availableGroupInfos = this._teamGroupInfos.getLoaded().filter(g => {
					if (
						!globalAdmin && // global admins may add all groups
						localAdminGroupIds.indexOf(assertNotNull(g.localAdmin)) === -1 && // local admins may only add groups they either are the admin of
						localAdminGroupIds.indexOf(g.group) === -1
					) {
						// or it is their own local admin group
						return false
					} else {
						return !g.deleted && user.memberships.find(m => isSameId(m.groupInfo, g._id)) == null
					}
				})

				if (availableGroupInfos.length > 0) {
					availableGroupInfos.sort(compareGroupInfos)
					let dropdown = new DropDownSelector(
						"group_label",
						null,
						availableGroupInfos.map(g => {
							return {
								name: getGroupInfoDisplayName(g),
								value: g,
							}
						}),
						stream(availableGroupInfos[0]),
						250,
					)

					let addUserToGroupOkAction = (dialog: Dialog) => {
						showProgressDialog("pleaseWait_msg", locator.groupManagementFacade.addUserToGroup(user, dropdown.selectedValue().group))
						dialog.close()
					}

					Dialog.showActionDialog({
						title: lang.get("addUserToGroup_label"),
						child: {
							view: () => m(dropdown),
						},
						allowOkWithReturn: true,
						okAction: addUserToGroupOkAction,
					})
				}
			}
		})
	}

	private showAddUserToContactFormDialog() {
		this._user.getAsync().then(user => {
			this._customer.getAsync().then(customer => {
				return locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(contactFormGroupRoot => {
					locator.entityClient.loadAll(ContactFormTypeRef, contactFormGroupRoot.contactForms).then(allContactForms => {
						filterContactFormsForLocalAdmin(allContactForms).then(contactForms => {
							let dropdown = new DropDownSelector(
								"contactForms_label",
								null,
								contactForms.map(cf => {
									return {
										name: cf.path,
										value: cf,
									}
								}),
								stream(contactForms[0]),
								250,
							)

							let addUserToContactFormOkAction = (dialog: Dialog) => {
								let cf = dropdown.selectedValue() as ContactForm

								if (cf.participantGroupInfos.indexOf(user.userGroup.groupInfo)) {
									cf.participantGroupInfos.push(user.userGroup.groupInfo)
								}

								showProgressDialog("pleaseWait_msg", locator.entityClient.update(cf))
								dialog.close()
							}

							Dialog.showActionDialog({
								title: lang.get("responsiblePersons_label"),
								child: {
									view: () => m(dropdown),
								},
								allowOkWithReturn: true,
								okAction: addUserToContactFormOkAction,
							})
						})
					})
				})
			})
		})
	}

	private updateUsedStorageAndAdminFlag(): Promise<void> {
		return this._user.getAsync().then(user => {
			let isAdmin = this.isAdmin(user)

			this._adminStatusSelector.selectedValue(isAdmin)

			return locator.userManagementFacade
						  .readUsedUserStorage(user)
						  .then(usedStorage => {
							  this._usedStorage = usedStorage
							  m.redraw()
						  })
						  .catch(
							  ofClass(BadRequestError, e => {
								  // may happen if the user gets the admin flag removed
							  }),
						  )
		})
	}

	private getTeamMemberships(user: User, customer: Customer): GroupMembership[] {
		return user.memberships.filter(m => m.groupInfo[0] === customer.teamGroups)
	}

	private isAdmin(user: User): boolean {
		return user.memberships.find(m => m.groupType === GroupType.Admin) != null
	}

	private deleteUser(restore: boolean): Promise<void> {
		return showProgressDialog(
			"pleaseWait_msg",
			showBuyDialog({featureType: BookingItemFeatureType.Users, count: restore ? 1 : -1, freeAmount: 0, reactivate: restore}).then(confirmed => {
				if (confirmed) {
					return this._user.getAsync().then(user => {
						return locator.userManagementFacade.deleteUser(user, restore)
					})
				}
			}),
		).catch(
			ofClass(PreconditionFailedError, e => {
				if (restore) {
					Dialog.message("emailAddressInUse_msg")
				} else {
					Dialog.message("stillReferencedFromContactForm_msg")
				}
			}),
		)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			let promise = Promise.resolve()
			const {instanceListId, instanceId, operation} = update

			if (
				isUpdateForTypeRef(GroupInfoTypeRef, update) &&
				operation === OperationType.UPDATE &&
				isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])
			) {
				promise = locator.entityClient.load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
					this.userGroupInfo = updatedUserGroupInfo
					this._senderName = updatedUserGroupInfo.name

					this._userStatusSelector.selectedValue(updatedUserGroupInfo.deleted != null)

					return this.updateUsedStorageAndAdminFlag().then(() => {
						if (this._administratedBy) {
							this._administratedBy.selectedValue(this.userGroupInfo.localAdmin)
						}

						this._editAliasFormAttrs.userGroupInfo = this.userGroupInfo
						m.redraw()
					})
				})
			} else if (
				isUpdateForTypeRef(UserTypeRef, update) &&
				operation === OperationType.UPDATE &&
				this._user.isLoaded() &&
				isSameId(this._user.getLoaded()._id, instanceId)
			) {
				this._user.reset()

				promise = this.updateUsedStorageAndAdminFlag().then(() => {
					return this.updateGroups()
				})
			} else if (isUpdateForTypeRef(MailboxGroupRootTypeRef, update)) {
				promise = this.updateContactForms()
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
	let editor = new Editor("enterAsCSV_msg").showBorders().setMode(HtmlEditorMode.HTML).setValue(CSV_USER_FORMAT).setMinHeight(200)
	let form = {
		view: () => {
			return [m(editor)]
		},
	}
	Dialog.showActionDialog({
		title: lang.get("importUsers_action"),
		child: form,
		okAction: csvDialog => {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog(false)
			} else {
				let closeCsvDialog = checkAndImportUserData(editor.getValue(), customDomains)

				if (closeCsvDialog) {
					csvDialog.close()
				}
			}
		},
	})
}