import m, { Children } from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import { Dialog } from "../gui/base/Dialog"
import { formatDateWithMonth, formatStorageSize } from "../misc/Formatter"
import { lang } from "../misc/LanguageViewModel"
import type { Customer, GroupInfo, GroupMembership, User } from "../api/entities/sys/TypeRefs.js"
import { CustomerTypeRef, GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../api/entities/sys/TypeRefs.js"
import { asyncFind, getFirstOrThrow, LazyLoaded, neverNull, ofClass, promiseMap, remove } from "@tutao/tutanota-utils"
import { BookingItemFeatureType, GroupType, OperationType } from "../api/common/TutanotaConstants"
import { BadRequestError, NotAuthorizedError, PreconditionFailedError } from "../api/common/error/RestError"
import type { ContactForm } from "../api/entities/tutanota/TypeRefs.js"
import { ContactFormTypeRef, CustomerContactFormGroupRootTypeRef, MailboxGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { ColumnWidth, Table, TableAttrs } from "../gui/base/Table.js"
import { getGroupTypeDisplayName } from "./groups/GroupDetailsView.js"
import { Icons } from "../gui/base/icons/Icons"
import { SecondFactorsEditForm } from "./login/secondfactor/SecondFactorsEditForm.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { EntityUpdateData } from "../api/main/EventController"
import { isUpdateForTypeRef } from "../api/main/EventController"
import { HtmlEditor as Editor, HtmlEditorMode } from "../gui/editor/HtmlEditor"
import { filterContactFormsForLocalAdmin } from "./contactform/ContactFormListView.js"
import { checkAndImportUserData, CSV_USER_FORMAT } from "./ImportUsersViewer"
import { MailAddressTable } from "./mailaddress/MailAddressTable.js"
import { compareGroupInfos, getGroupInfoDisplayName } from "../api/common/utils/GroupUtils"
import { CUSTOM_MIN_ID, isSameId } from "../api/common/utils/EntityUtils"
import { showNotAvailableForFreeDialog } from "../misc/SubscriptionDialogs"
import { showBuyDialog } from "../subscription/BuyDialog"
import { TextField } from "../gui/base/TextField.js"
import { locator } from "../api/main/MainLocator"
import { DropDownSelector, SelectorItem } from "../gui/base/DropDownSelector.js"
import { UpdatableSettingsDetailsViewer } from "./SettingsView"
import { showChangeOwnPasswordDialog, showChangeUserPasswordAsAdminDialog } from "./login/ChangePasswordDialogs.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { MailAddressTableModel } from "./mailaddress/MailAddressTableModel.js"
import { progressIcon } from "../gui/base/Icon.js"

assertMainOrNode()

export class UserViewer implements UpdatableSettingsDetailsViewer {
	private readonly user: LazyLoaded<User> = new LazyLoaded(() => this.loadUser())
	private readonly customer = new LazyLoaded(() => this.loadCustomer())
	private readonly teamGroupInfos = new LazyLoaded(() => this.loadTeamGroupInfos())
	private groupsTableAttrs: TableAttrs | null = null
	private contactFormsTableAttrs: TableAttrs | null = null
	private readonly secondFactorsForm: SecondFactorsEditForm
	private usedStorage: number | null = null
	private administratedBy: Id | null = null
	private availableTeamGroupInfos: Array<GroupInfo> = []
	private mailAddressTableModel: MailAddressTableModel | null = null

	constructor(public userGroupInfo: GroupInfo, private isAdmin: boolean) {
		this.userGroupInfo = userGroupInfo

		this.secondFactorsForm = new SecondFactorsEditForm(this.user)

		this.teamGroupInfos.getAsync().then(async (availableTeamGroupInfos) => {
			if (availableTeamGroupInfos.length > 0) {
				this.availableTeamGroupInfos = availableTeamGroupInfos.filter((info) => info.groupType === GroupType.LocalAdmin)
				this.groupsTableAttrs = {
					columnHeading: ["name_label", "groupType_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
					showActionButtonColumn: true,
					addButtonAttrs: {
						title: "addGroup_label",
						icon: Icons.Add,
						click: () => this.showAddUserToGroupDialog(),
					},
					lines: [],
				}

				await this.updateGroups()
			}
		})

		this.customer.getAsync().then(async (customer) => {
			const contactFormGroupRoot = await locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup)
			const contactForm = await locator.entityClient.loadRange(ContactFormTypeRef, contactFormGroupRoot.contactForms, CUSTOM_MIN_ID, 1, false)
			if (contactForm.length > 0) {
				this.contactFormsTableAttrs = {
					columnHeading: ["contactForms_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
					showActionButtonColumn: true,
					addButtonAttrs: {
						title: "addResponsiblePerson_label",
						icon: Icons.Add,
						click: () => this.showAddUserToContactFormDialog(),
					},
					lines: [],
				}
				await this.updateContactForms()
			}
		})

		this.user.getAsync().then(async (user) => {
			const mailMembership = await asyncFind(user.memberships, async (ship) => {
				return ship.groupType === GroupType.Mail && (await locator.entityClient.load(GroupTypeRef, ship.group)).user === user._id
			})
			if (mailMembership == null) {
				console.error("User doesn't have a mailbox?", user._id)
				return
			}
			this.mailAddressTableModel = this.isItMe()
				? await locator.mailAddressTableModelForOwnMailbox()
				: await locator.mailAddressTableModelForAdmin(mailMembership.group, user._id, this.userGroupInfo)
			m.redraw()
		})

		this.updateUsedStorageAndAdminFlag()
	}

	renderView(): Children {
		const changePasswordButtonAttrs: IconButtonAttrs = {
			title: "changePassword_label",
			click: () => this.changePassword(),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		} as const
		const passwordFieldAttrs = {
			label: "password_label",
			value: "***",
			injectionsRight: () => [m(IconButton, changePasswordButtonAttrs)],
			disabled: true,
		} as const
		return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
			m(".h4.mt-l", lang.get("userSettings_label")),
			m("", [
				m(TextField, {
					label: "mailAddress_label",
					value: this.userGroupInfo.mailAddress ?? "",
					disabled: true,
				}),
				m(TextField, {
					label: "created_label",
					value: formatDateWithMonth(this.userGroupInfo.created),
					disabled: true,
				}),
				m(TextField, {
					label: "storageCapacityUsed_label",
					value: this.usedStorage ? formatStorageSize(this.usedStorage) : lang.get("loading_msg"),
					disabled: true,
				} as const),
			]),
			m("", [
				this.renderName(),
				m(TextField, passwordFieldAttrs),
				locator.logins.getUserController().isGlobalAdmin() ? [this.renderAdminStatusSelector(), this.renderAdministratedBySelector()] : null,
				this.renderUserStatusSelector(),
			]),
			m(this.secondFactorsForm),
			this.groupsTableAttrs ? m(".h4.mt-l.mb-s", lang.get("groups_label")) : null,
			this.groupsTableAttrs ? m(Table, this.groupsTableAttrs) : null,
			this.contactFormsTableAttrs ? m(".h4.mt-l.mb-s", lang.get("contactForms_label")) : null,
			this.contactFormsTableAttrs ? m(Table, this.contactFormsTableAttrs) : null,
			this.mailAddressTableModel ? m(MailAddressTable, { model: this.mailAddressTableModel }) : progressIcon(),
		])
	}

	private renderName(): Children {
		const name = this.userGroupInfo.name
		return m(TextField, {
			label: "name_label",
			value: name,
			disabled: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "edit_action",
					click: () => this.onChangeName(name),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private onChangeName(name: string) {
		Dialog.showProcessTextInputDialog("edit_action", "name_label", null, name, (newName) => {
			this.userGroupInfo.name = newName
			return locator.entityClient.update(this.userGroupInfo)
		})
	}

	private renderAdminStatusSelector(): Children {
		return m(DropDownSelector, {
			label: "globalAdmin_label",
			items: [
				{
					name: lang.get("no_label"),
					value: false,
				},
				{
					name: lang.get("yes_label"),
					value: true,
				},
			],
			selectedValue: this.isAdmin,
			selectionChangedHandler: (value: boolean) => {
				if (this.userGroupInfo.deleted) {
					Dialog.message("userAccountDeactivated_msg")
				} else if (this.isItMe()) {
					Dialog.message("removeOwnAdminFlagInfo_msg")
				} else if (this.userGroupInfo.localAdmin != null) {
					Dialog.message("assignAdminRightsToLocallyAdministratedUserError_msg")
				} else {
					showProgressDialog(
						"pleaseWait_msg",
						this.user.getAsync().then((user) => locator.userManagementFacade.changeAdminFlag(user, value)),
					)
				}
			},
		})
	}

	private renderAdministratedBySelector(): Children {
		return m(DropDownSelector, {
			label: "administratedBy_label",
			items: [
				{
					name: lang.get("globalAdmin_label"),
					value: null,
				} as SelectorItem<Id | null>,
			].concat(
				this.availableTeamGroupInfos.map((gi) => ({
					name: getGroupInfoDisplayName(gi),
					value: gi.group,
				})),
			),
			selectedValue: this.userGroupInfo.localAdmin,
			selectionChangedHandler: async (value: Id) => {
				const user = await this.user.getAsync()
				if (this.userGroupInfo.deleted) {
					Dialog.message("userAccountDeactivated_msg")
				} else if (this.isItMe()) {
					Dialog.message("updateOwnAdminship_msg")
				} else if (this.isAdminUser(user)) {
					Dialog.message("updateAdminshipGlobalAdmin_msg")
				} else {
					showProgressDialog(
						"pleaseWait_msg",
						Promise.resolve().then(() => {
							const newAdminGroupId =
								value ?? neverNull(locator.logins.getUserController().user.memberships.find((gm) => gm.groupType === GroupType.Admin)).group
							return locator.userManagementFacade.updateAdminship(this.userGroupInfo.group, newAdminGroupId)
						}),
					)
				}
			},
		})
	}

	private renderUserStatusSelector(): Children {
		return m(DropDownSelector, {
			label: "state_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this.userGroupInfo.deleted == null,
			selectionChangedHandler: (activate: boolean) => {
				if (this.isAdmin) {
					Dialog.message("deactivateOwnAccountInfo_msg")
				} else {
					activate ? this.restoreUser() : this.deleteUser()
				}
			},
		})
	}

	private isItMe(): boolean {
		return isSameId(locator.logins.getUserController().userGroupInfo._id, this.userGroupInfo._id)
	}

	private changePassword(): void {
		if (this.isItMe()) {
			showChangeOwnPasswordDialog()
		} else if (this.isAdmin) {
			Dialog.message("changeAdminPassword_msg")
		} else {
			this.user.getAsync().then((user) => {
				showChangeUserPasswordAsAdminDialog(user)
			})
		}
	}

	private async updateGroups() {
		if (this.groupsTableAttrs) {
			const user = await this.user.getAsync()
			const customer = await this.customer.getAsync()
			this.groupsTableAttrs.lines = await promiseMap(
				this.getTeamMemberships(user, customer),
				async (m) => {
					const groupInfo = await locator.entityClient.load(GroupInfoTypeRef, m.groupInfo)
					return {
						cells: [getGroupInfoDisplayName(groupInfo), getGroupTypeDisplayName(neverNull(m.groupType))],
						actionButtonAttrs: {
							title: "remove_action",
							click: () => {
								showProgressDialog("pleaseWait_msg", locator.groupManagementFacade.removeUserFromGroup(user._id, groupInfo.group)).catch(
									ofClass(NotAuthorizedError, (e) => {
										Dialog.message("removeUserFromGroupNotAdministratedUserError_msg")
									}),
								)
							},
							icon: Icons.Cancel,
						} as const,
					}
				},
				{
					concurrency: 5,
				},
			)
		}
	}

	private async updateContactForms() {
		if (this.contactFormsTableAttrs) {
			const user = await this.user.getAsync()
			const userMailGroupMembership = neverNull(user.memberships.find((m) => m.groupType === GroupType.Mail))
			const mailboxGroupRoot = await locator.entityClient.load(MailboxGroupRootTypeRef, userMailGroupMembership.group)
			if (mailboxGroupRoot.participatingContactForms.length > 0) {
				const forms = await locator.entityClient.loadMultiple(
					ContactFormTypeRef,
					mailboxGroupRoot.participatingContactForms[0][0],
					mailboxGroupRoot.participatingContactForms.map((idTuple) => idTuple[1]),
				)
				this.contactFormsTableAttrs.lines = forms.map((cf) => ({
					cells: [cf.path],
					actionButtonAttrs: {
						title: "remove_action",
						click: () => {
							let match = cf.participantGroupInfos.find((id) => isSameId(id, user.userGroup.groupInfo))

							if (match) {
								remove(cf.participantGroupInfos, match)
							}

							showProgressDialog("pleaseWait_msg", locator.entityClient.update(cf))
						},
						icon: Icons.Cancel,
					},
				}))
			}
		}
	}

	private async showAddUserToGroupDialog(): Promise<void> {
		const user = await this.user.getAsync()
		if (this.userGroupInfo.deleted) {
			Dialog.message("userAccountDeactivated_msg")
		} else {
			const globalAdmin = locator.logins.isGlobalAdminUserLoggedIn()
			const localAdminGroupIds = locator.logins
				.getUserController()
				.getLocalAdminGroupMemberships()
				.map((gm) => gm.group)

			const availableGroupInfos = this.teamGroupInfos
				.getLoaded()
				.filter(
					(g) =>
						// global admins may add all groups, local admins may only add groups they either are the admin of or it is their own local admin group
						(globalAdmin || localAdminGroupIds.some((groupId) => groupId === g.localAdmin || groupId === g.group)) &&
						// can't add deleted groups
						!g.deleted &&
						// can't add if the user is already in the group
						!user.memberships.some((m) => isSameId(m.groupInfo, g._id)),
				)
				.sort(compareGroupInfos)

			if (availableGroupInfos.length > 0) {
				const dropdownItems = availableGroupInfos.map((g) => ({
					name: getGroupInfoDisplayName(g),
					value: g,
				}))

				let selectedGroupInfo = getFirstOrThrow(availableGroupInfos)
				Dialog.showActionDialog({
					title: lang.get("addUserToGroup_label"),
					child: {
						view: () =>
							m(DropDownSelector, {
								label: "group_label",
								items: dropdownItems,
								selectedValue: selectedGroupInfo,
								selectionChangedHandler: (selection: GroupInfo) => (selectedGroupInfo = selection),
								dropdownWidth: 250,
							}),
					},
					allowOkWithReturn: true,
					okAction: (dialog: Dialog) => {
						showProgressDialog("pleaseWait_msg", locator.groupManagementFacade.addUserToGroup(user, selectedGroupInfo.group))
						dialog.close()
					},
				})
			}
		}
	}

	private async showAddUserToContactFormDialog() {
		const user = await this.user.getAsync()
		const customer = await this.customer.getAsync()
		const contactFormGroupRoot = await locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup)
		const allContactForms = await locator.entityClient.loadAll(ContactFormTypeRef, contactFormGroupRoot.contactForms)
		const contactForms = await filterContactFormsForLocalAdmin(allContactForms)

		const dropdownItems = contactForms.map((cf) => ({ name: cf.path, value: cf }))
		let selectedContactForm = contactForms[0]

		Dialog.showActionDialog({
			title: lang.get("responsiblePersons_label"),
			child: {
				view: () =>
					m(DropDownSelector, {
						label: "contactForms_label",
						items: dropdownItems,
						selectedValue: selectedContactForm,
						selectionChangedHandler: (selection: ContactForm) => (selectedContactForm = selection),
						dropdownWidth: 250,
					}),
			},
			allowOkWithReturn: true,
			okAction: (dialog: Dialog) => {
				if (!selectedContactForm.participantGroupInfos.includes(user.userGroup.groupInfo)) {
					selectedContactForm.participantGroupInfos.push(user.userGroup.groupInfo)
				}

				showProgressDialog("pleaseWait_msg", locator.entityClient.update(selectedContactForm))
				dialog.close()
			},
		})
	}

	private async updateUsedStorageAndAdminFlag(): Promise<void> {
		const user = await this.user.getAsync()
		this.isAdmin = this.isAdminUser(user)
		try {
			this.usedStorage = await locator.userManagementFacade.readUsedUserStorage(user)
			m.redraw()
		} catch (e) {
			// may happen if the user gets the admin flag removed, so ignore it
			if (!(e instanceof BadRequestError)) {
				throw e
			}
		}
	}

	private getTeamMemberships(user: User, customer: Customer): GroupMembership[] {
		return user.memberships.filter((m) => m.groupInfo[0] === customer.teamGroups)
	}

	private isAdminUser(user: User): boolean {
		return user.memberships.find((m) => m.groupType === GroupType.Admin) != null
	}

	private async deleteUser() {
		const confirmed = await showBuyDialog({ featureType: BookingItemFeatureType.Users, count: -1, freeAmount: 0, reactivate: false })
		if (confirmed) {
			return locator.userManagementFacade
				.deleteUser(await this.user.getAsync(), false)
				.catch(ofClass(PreconditionFailedError, () => Dialog.message("stillReferencedFromContactForm_msg")))
		}
	}

	private async restoreUser() {
		const confirmed = await showBuyDialog({ featureType: BookingItemFeatureType.Users, count: 1, freeAmount: 0, reactivate: true })
		if (confirmed) {
			await locator.userManagementFacade
				.deleteUser(await this.user.getAsync(), true)
				.catch(ofClass(PreconditionFailedError, () => Dialog.message("emailAddressInUse_msg")))
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update
			if (
				isUpdateForTypeRef(GroupInfoTypeRef, update) &&
				operation === OperationType.UPDATE &&
				isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])
			) {
				this.userGroupInfo = await locator.entityClient.load(GroupInfoTypeRef, this.userGroupInfo._id)
				await this.updateUsedStorageAndAdminFlag()
				this.administratedBy = this.userGroupInfo.localAdmin
				m.redraw()
			} else if (
				isUpdateForTypeRef(UserTypeRef, update) &&
				operation === OperationType.UPDATE &&
				this.user.isLoaded() &&
				isSameId(this.user.getLoaded()._id, instanceId)
			) {
				this.user.reset()
				await this.updateUsedStorageAndAdminFlag()
				await this.updateGroups()
			} else if (isUpdateForTypeRef(MailboxGroupRootTypeRef, update)) {
				await this.updateContactForms()
			}
			await this.secondFactorsForm.entityEventReceived(update)
		}
		m.redraw()
	}

	private loadUser(): Promise<User> {
		return locator.entityClient.load(GroupTypeRef, this.userGroupInfo.group).then((userGroup) => {
			return locator.entityClient.load(UserTypeRef, neverNull(userGroup.user))
		})
	}

	private loadCustomer(): Promise<Customer> {
		return locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
	}

	private loadTeamGroupInfos(): Promise<Array<GroupInfo>> {
		return this.customer.getAsync().then((customer) => locator.entityClient.loadAll(GroupInfoTypeRef, customer.teamGroups))
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
		okAction: (csvDialog) => {
			if (locator.logins.getUserController().isFreeAccount()) {
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
