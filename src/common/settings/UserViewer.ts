import m, { Children } from "mithril"
import { assertMainOrNode } from "../api/common/Env.js"
import { Dialog } from "../gui/base/Dialog.js"
import { formatDateWithMonth, formatStorageSize } from "../misc/Formatter.js"
import { lang } from "../misc/LanguageViewModel.js"
import type { Customer, GroupInfo, GroupMembership, User } from "../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../api/entities/sys/TypeRefs.js"
import { asyncFind, getFirstOrThrow, LazyLoaded, neverNull, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { BookingItemFeatureType, GroupType, OperationType } from "../api/common/TutanotaConstants.js"
import { BadRequestError, NotAuthorizedError, PreconditionFailedError } from "../api/common/error/RestError.js"
import { ColumnWidth, Table, TableAttrs } from "../gui/base/Table.js"
import { getGroupTypeDisplayName } from "./groups/GroupDetailsView.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { SecondFactorsEditForm } from "./login/secondfactor/SecondFactorsEditForm.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"

import { HtmlEditor as Editor, HtmlEditorMode } from "../gui/editor/HtmlEditor.js"
import { checkAndImportUserData, CSV_USER_FORMAT } from "./ImportUsersViewer.js"
import { MailAddressTable } from "./mailaddress/MailAddressTable.js"
import { compareGroupInfos, getGroupInfoDisplayName } from "../api/common/utils/GroupUtils.js"
import { isSameId } from "../api/common/utils/EntityUtils.js"
import { showBuyDialog } from "../subscription/BuyDialog.js"
import { TextField } from "../gui/base/TextField.js"
import { locator } from "../api/main/CommonLocator.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import { showChangeOwnPasswordDialog, showChangeUserPasswordAsAdminDialog } from "./login/ChangePasswordDialogs.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { MailAddressTableModel } from "./mailaddress/MailAddressTableModel.js"
import { progressIcon } from "../gui/base/Icon.js"
import { toFeatureType } from "../subscription/SubscriptionUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { UpdatableSettingsDetailsViewer } from "./Interfaces.js"

assertMainOrNode()

export class UserViewer implements UpdatableSettingsDetailsViewer {
	private readonly user: LazyLoaded<User> = new LazyLoaded(() => this.loadUser())
	private readonly customer = new LazyLoaded(() => this.loadCustomer())
	private readonly teamGroupInfos = new LazyLoaded(() => this.loadTeamGroupInfos())
	private groupsTableAttrs: TableAttrs | null = null
	private readonly secondFactorsForm: SecondFactorsEditForm
	private usedStorage: number | null = null
	private administratedBy: Id | null = null
	private availableTeamGroupInfos: Array<GroupInfo> = []
	private mailAddressTableModel: MailAddressTableModel | null = null
	private mailAddressTableExpanded: boolean

	constructor(public userGroupInfo: GroupInfo, private isAdmin: boolean) {
		this.userGroupInfo = userGroupInfo

		this.mailAddressTableExpanded = false

		this.secondFactorsForm = new SecondFactorsEditForm(this.user, locator.domainConfigProvider())

		this.teamGroupInfos.getAsync().then(async (availableTeamGroupInfos) => {
			if (availableTeamGroupInfos.length > 0) {
				this.availableTeamGroupInfos = availableTeamGroupInfos
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
			isReadOnly: true,
		} as const
		return m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
			m(".h4.mt-l", lang.get("userSettings_label")),
			m("", [
				m(TextField, {
					label: "mailAddress_label",
					value: this.userGroupInfo.mailAddress ?? "",
					isReadOnly: true,
				}),
				m(TextField, {
					label: "created_label",
					value: formatDateWithMonth(this.userGroupInfo.created),
					isReadOnly: true,
				}),
				m(TextField, {
					label: "storageCapacityUsed_label",
					value: this.usedStorage ? formatStorageSize(this.usedStorage) : lang.get("loading_msg"),
					isReadOnly: true,
				} as const),
			]),
			m("", [
				this.renderName(),
				m(TextField, passwordFieldAttrs),
				locator.logins.getUserController().isGlobalAdmin() ? this.renderAdminStatusSelector() : null,
				this.renderUserStatusSelector(),
			]),
			m(this.secondFactorsForm),
			this.groupsTableAttrs ? m(".h4.mt-l.mb-s", lang.get("groups_label")) : null,
			this.groupsTableAttrs ? m(Table, this.groupsTableAttrs) : null,
			this.mailAddressTableModel
				? m(MailAddressTable, {
						model: this.mailAddressTableModel,
						expanded: this.mailAddressTableExpanded,
						onExpanded: (newExpanded) => (this.mailAddressTableExpanded = newExpanded),
				  })
				: progressIcon(),
		])
	}

	private renderName(): Children {
		const name = this.userGroupInfo.name
		return m(TextField, {
			label: "name_label",
			value: name,
			isReadOnly: true,
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
		Dialog.showProcessTextInputDialog({ title: "edit_action", label: "name_label", defaultValue: name }, (newName) => {
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
						this.user
							.getAsync()
							.then((user) => locator.userManagementFacade.changeAdminFlag(user, value))
							.catch(
								ofClass(PreconditionFailedError, (e) => {
									if (e.data && e.data === "usergroup.pending-key-rotation") {
										Dialog.message("makeAdminPendingUserGroupKeyRotationError_msg")
									} else {
										throw e
									}
								}),
							),
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

	private async showAddUserToGroupDialog(): Promise<void> {
		const user = await this.user.getAsync()
		if (this.userGroupInfo.deleted) {
			Dialog.message("userAccountDeactivated_msg")
		} else {
			const globalAdmin = locator.logins.isGlobalAdminUserLoggedIn()

			const availableGroupInfos = this.teamGroupInfos
				.getLoaded()
				.filter(
					(g) =>
						// global admins may add all groups
						globalAdmin &&
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
		return user.memberships.some((m) => m.groupType === GroupType.Admin)
	}

	private async deleteUser() {
		const planType = await locator.logins.getUserController().getPlanType()
		const newPlan = await locator.logins.getUserController().isNewPaidPlan()

		const confirmed = await showBuyDialog({
			featureType: newPlan ? toFeatureType(planType) : BookingItemFeatureType.LegacyUsers,
			bookingText: "cancelUserAccounts_label",
			count: -1,
			freeAmount: 0,
			reactivate: false,
		})
		if (confirmed) {
			return locator.userManagementFacade
				.deleteUser(await this.user.getAsync(), false)
				.catch(ofClass(PreconditionFailedError, () => Dialog.message("stillReferencedFromContactForm_msg")))
		}
	}

	private async restoreUser() {
		const planType = await locator.logins.getUserController().getPlanType()
		const newPlan = await locator.logins.getUserController().isNewPaidPlan()
		const confirmed = await showBuyDialog({
			featureType: newPlan ? toFeatureType(planType) : BookingItemFeatureType.LegacyUsers,
			bookingText: "bookingItemUsersIncluding_label",
			count: 1,
			freeAmount: 0,
			reactivate: true,
		})
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
		return locator.logins.getUserController().loadCustomer()
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
			let closeCsvDialog = checkAndImportUserData(editor.getValue(), customDomains)
			if (closeCsvDialog) {
				csvDialog.close()
			}
		},
	})
}
