import m, { Children } from "mithril"
import { assertMainOrNode, UnsubscribeFailureReason } from "../../../platform-kit/app-env"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { formatDateWithMonth, formatStorageSize } from "../../../ui/utils/Formatter.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { assertNotNull, asyncFind, getFirstOrThrow, LazyLoaded, neverNull, ofClass, promiseMap } from "../../../platform-kit/utils"
import { BadRequestError, NotAuthorizedError, PreconditionFailedError } from "../../../platform-kit/rest-client/error"
import { ColumnWidth, Table, TableAttrs } from "../../../ui/base/Table.js"
import { getGroupTypeDisplayName } from "./groups/GroupDetailsView.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { SecondFactorsEditForm } from "./login/secondfactor/SecondFactorsEditForm.js"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { elementIdToId, idToElementId, isSameId, isSameSingleId, OperationType } from "../../../platform-kit/meta"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { Customer, GroupInfo, GroupInfoTypeRef, GroupMembership, GroupTypeRef, User, UserTypeRef } from "@tutao/entities/sys"
import { BookingItemFeatureType, GroupType } from "../../../entities/sys/Utils"
import { HtmlEditor, HtmlEditorMode } from "../../../ui/editor/HtmlEditor.js"
import { checkAndImportUserData, CSV_USER_FORMAT } from "./ImportUsersViewer.js"
import { MailAddressTable } from "./mailaddress/MailAddressTable.js"
import { compareGroupInfos, getGroupInfoDisplayName } from "../../../platform-kit/network/GroupUtils.js"
import { showBuyDialog } from "../subscription/BuyDialog.js"
import { LegacyTextField, LegacyTextFieldType } from "../../../ui/base/LegacyTextField.js"
import { locator } from "../api/main/CommonLocator.js"
import { DropDownSelector } from "../../../ui/base/DropDownSelector.js"
import { showChangeOwnPasswordDialog, showChangeUserPasswordAsAdminDialog } from "./login/ChangePasswordDialogs.js"
import { IconButton, IconButtonAttrs } from "../../../ui/base/IconButton.js"
import { ButtonSize } from "../../../ui/base/ButtonSize.js"
import { MailAddressTableModel } from "./mailaddress/MailAddressTableModel.js"
import { progressIcon } from "../../../ui/base/Icon.js"
import { toFeatureType } from "../subscription/utils/SubscriptionUtils.js"
import { UpdatableSettingsDetailsViewer } from "./Interfaces.js"
import { getHtmlSanitizer } from "../misc/HtmlSanitizer"
import { CustomerMigrationController } from "../../mail-app/settings/migration/CustomerMigrationController"
import { mailLocator } from "../../mail-app/mailLocator"
import { TextField } from "../../../ui/base/TextField"
import { createImapAccount } from "@tutao/entities/tutanota"
import { InitializeImapImportParams } from "../../mail-app/workerUtils/imapimport/ImapImporter"
import { DEFAULT_IMAP_IMPORT_MAX_QUOTA } from "../api/common/utils/imapImportUtils/ImapImportUtils"
import { IMAP_SSL_PORT, ImapProvider } from "../api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapAccountSyncStatus } from "../../../entities/tutanota/Utils"
import { ImapErrorCause } from "../api/common/error/ImapError"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../ui/base/DialogHeaderBar"
import { ButtonType } from "../../../ui/base/Button"
import { theme } from "../../../ui/theme"
import { ContentWithOptionsDialog } from "../../../ui/dialogs/ContentWithOptionsDialog"

assertMainOrNode()

export class UserViewer implements UpdatableSettingsDetailsViewer {
	private readonly user: LazyLoaded<User> = new LazyLoaded(() => this.loadUser())
	private readonly customer = new LazyLoaded(() => this.loadCustomer())
	private readonly teamGroupInfos = new LazyLoaded(() => this.loadTeamGroupInfos())
	private groupsTableAttrs: TableAttrs | null = null
	private readonly secondFactorsForm: SecondFactorsEditForm
	private usedStorage: number | null = null
	private mailAddressTableModel: MailAddressTableModel | null = null
	private mailAddressTableExpanded: boolean
	private isPurchasingNewSharedMailboxGroup: boolean

	constructor(
		public userGroupInfo: GroupInfo,
		private isAdmin: boolean,
	) {
		this.userGroupInfo = userGroupInfo
		this.isPurchasingNewSharedMailboxGroup = false

		this.mailAddressTableExpanded = false

		this.secondFactorsForm = new SecondFactorsEditForm(
			this.user,
			locator.domainConfigProvider(),
			locator.loginFacade,
			this.isAdmin,
			!!this.userGroupInfo.deleted,
		)

		this.teamGroupInfos.getAsync().then(async (availableTeamGroupInfos) => {
			if (availableTeamGroupInfos.length > 0) {
				this.groupsTableAttrs = {
					columnHeading: ["name_label", "groupType_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
					showActionButtonColumn: true,
					addButtonAttrs: {
						title: "addGroup_label",
						icon: Icons.Plus,
						click: () => this.showAddUserToGroupDialog(),
					},
					lines: [],
				}

				await this.updateGroups()
			}
		})

		this.user.getAsync().then(async (user) => {
			const mailMembership = await asyncFind(user.memberships, async (ship) => {
				if (ship.groupType === GroupType.Mail) {
					const membershipGroup = await locator.entityClient.load(GroupTypeRef, idToElementId(ship.group))
					return isSameSingleId(membershipGroup.user, elementIdToId(user._id))
				}
				return false
			})
			if (mailMembership == null) {
				console.error("User doesn't have a mailbox?", user._id)
				return
			}
			this.mailAddressTableModel = this.isItMe()
				? await locator.mailAddressTableModelForOwnMailbox()
				: await locator.mailAddressTableModelForAdmin(mailMembership.group, elementIdToId(user._id), {
						user,
						userGroupInfo: this.userGroupInfo,
					})
			m.redraw()
		})

		this.updateUsedStorageAndAdminFlag()
	}

	renderView(): Children {
		const changePasswordButtonAttrs: IconButtonAttrs = {
			title: "changePassword_label",
			click: () => this.changePassword(),
			icon: Icons.PenFilled,
			size: ButtonSize.Compact,
		} as const
		const hasMigrationController = (() => {
			try {
				mailLocator.getCustomerMigrationController()
				return true
			} catch {
				return false
			}
		})()
		const passwordFieldAttrs = {
			label: "password_label",
			value: "***",
			injectionsRight: () => [m(IconButton, changePasswordButtonAttrs)],
			isReadOnly: true,
		} as const
		return m("#user-viewer.fill-absolute.scroll.plr-24.pb-floating", [
			m(".h4.mt-32", lang.get("userSettings_label")),
			m(".flex.justify-between.items-center.mt-32", [
				m(".h4", lang.get("userSettings_label")),
				hasMigrationController
					? m(IconButton, {
							title: "migrationStart_action",
							icon: Icons.Sync,
							click: () => this.showImapImportDialog(),
							size: ButtonSize.Compact,
						})
					: null,
			]),
			m("", [
				m(LegacyTextField, {
					label: "mailAddress_label",
					value: this.userGroupInfo.mailAddress ?? "",
					isReadOnly: true,
				}),
				m(LegacyTextField, {
					label: "created_label",
					value: formatDateWithMonth(this.userGroupInfo.created),
					isReadOnly: true,
				}),
				m(LegacyTextField, {
					label: "storageCapacityUsed_label",
					value: this.usedStorage ? formatStorageSize(this.usedStorage) : lang.get("loading_msg"),
					isReadOnly: true,
				} as const),
			]),
			m("", [
				this.renderName(),
				m(LegacyTextField, passwordFieldAttrs),
				locator.logins.getUserController().isGlobalAdmin() ? this.renderAdminStatusSelector() : null,
				this.renderUserStatusSelector(),
			]),
			m(this.secondFactorsForm),
			this.groupsTableAttrs ? m(".h4.mt-32.mb-8", lang.get("groups_label")) : null,
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
		return m(LegacyTextField, {
			label: "name_label",
			value: name,
			isReadOnly: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "edit_action",
					click: () => this.onChangeName(name),
					icon: Icons.PenFilled,
					size: ButtonSize.Compact,
				}),
		})
	}

	private onChangeName(name: string) {
		Dialog.showProcessTextInputDialog(
			{
				title: "edit_action",
				label: "name_label",
				defaultValue: name,
			},
			(newName) => {
				this.userGroupInfo.name = newName
				return locator.entityClient.update(this.userGroupInfo)
			},
		)
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
									} else if (e.data === "multiadmingroup.pending-key-rotation") {
										// when a multi admin key rotation is scheduled we do not want to introduce new members into the admin group
										Dialog.message("cannotAddAdminWhenMultiAdminKeyRotationScheduled_msg")
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
			selectionChangedHandler: async (activate: boolean) => {
				const user = await this.user.getAsync()
				if (user.enabled === activate) {
					return
				}
				if (this.isAdmin) {
					Dialog.message("deactivateOwnAccountInfo_msg")
				} else if (activate) {
					this.restoreUser()
				} else {
					this.deleteUser()
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
								showProgressDialog(
									"pleaseWait_msg",
									locator.groupManagementFacade.removeUserFromGroup(elementIdToId(user._id), groupInfo.group),
								).catch(
									ofClass(NotAuthorizedError, (e) => {
										Dialog.message("removeUserFromGroupNotAdministratedUserError_msg")
									}),
								)
							},
							icon: Icons.X,
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
					title: "addUserToGroup_label",
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
			} else {
				showAddGroupDialog(() => {
					this.isPurchasingNewSharedMailboxGroup = true
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

	private async getUserMainMailGroupId(): Promise<Id> {
		const user = await this.user.getAsync()
		const mailMembership = getFirstOrThrow(user.memberships.filter((m) => m.groupType === GroupType.Mail))
		return mailMembership.group
	}

	private showImapImportDialog(): void {
		if (this.userGroupInfo.deleted) {
			Dialog.message("userAccountDeactivated_msg")
			return
		}

		// Check if the controller is available (only on desktop/admin client)
		let customerMigrationController: CustomerMigrationController
		try {
			customerMigrationController = mailLocator.getCustomerMigrationController()
		} catch {
			Dialog.message("migrationNoMigrationOnWeb_label")
			return
		}

		// View model for form state
		const viewModel = {
			host: "localhost",
			port: 143,
			username: "user@test.com",
			password: "password",
			rootFolder: "root",
			disableStartButton: false,
		}

		// Build the dialog with header and content
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					type: ButtonType.Secondary,
					label: "close_alt",
					click: () => {
						dialog.close()
					},
				},
			],
			middle: "migration_title",
		}

		const dialog = new Dialog(DialogType.EditMedium, {
			view: () => {
				return m(
					".flex.col.border-radius",
					{
						style: {
							height: "100%",
							"background-color": theme.surface_container,
						},
					},
					[
						m(DialogHeaderBar, headerBarAttrs),
						m(
							".plr-24.flex-grow",
							m(
								ContentWithOptionsDialog,
								{
									mainActionText: "migrationStart_action",
									mainActionClick: async () => {
										// Validate required fields
										if (!viewModel.host || !viewModel.username || !viewModel.password || !viewModel.rootFolder) {
											Dialog.message("migrationGenericError_msg")
											return
										}
										viewModel.disableStartButton = true
										try {
											const user = await this.user.getAsync()
											const userId = elementIdToId(user._id)
											const mailGroupId = await this.getUserMainMailGroupId()

											const imapAccount = createImapAccount({
												host: viewModel.host,
												port: viewModel.port.toString(),
												username: viewModel.username,
												password: viewModel.password,
												oAuthTokenEndpointResponse: null,
												customCertificateData: null,
												ignoreCertificateErrors: false,
												useSSL: viewModel.port.toString() === IMAP_SSL_PORT,
											})

											const params: InitializeImapImportParams = {
												imapAccount,
												maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
												mailGroupId,
												imapSyncLabelData: null,
												provider: ImapProvider.Other,
												matchImapMailboxesToTutaMailSets: false,
												rootImportMailSetName: viewModel.rootFolder,
												spamFolderMigrationInformation: {
													shouldMigrateSpamFolder: false,
													spamMailbox: null,
												},
											}

											const result = await showProgressDialog(
												"startingMigration_msg",
												customerMigrationController.startImapImport(params, userId),
											)

											if (result.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED) {
												Dialog.message("migrationStartedPostponed_msg")
											} else {
												Dialog.message("migrationSetupFinished_msg")
											}
											dialog.close()
										} catch (e) {
											if (e.data === ImapErrorCause.AUTH_FAILED) {
												Dialog.message("migrationAuthFailed_msg")
											} else {
												console.error("IMAP import failed", e)
												Dialog.message("migrationGenericError_msg")
											}
										} finally {
											viewModel.disableStartButton = false
										}
									},
									disableMainActionButton: viewModel.disableStartButton,
									subActionText: null,
									subActionClick: () => {},
								},
								// Content
								m(".mt-24", [
									m(TextField, {
										label: "migrationImapAccountHost_label",
										value: viewModel.host,
										oninput: (v) => (viewModel.host = v),
										leadingIcon: { icon: Icons.ServerFilled, color: theme.on_surface_variant },
									}),
									m(TextField, {
										label: "migrationImapAccountPort_label",
										value: viewModel.port.toString(),
										oninput: (v) => (viewModel.port = parseInt(v, 10) || 993),
										leadingIcon: { icon: Icons.KeyFilled, color: theme.on_surface_variant },
									}),
									m(TextField, {
										label: "migrationAccountUsername_label",
										value: viewModel.username,
										oninput: (v) => (viewModel.username = v),
										leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
									}),
									m(TextField, {
										label: "migrationImapAccountPassword_label",
										value: viewModel.password,
										type: LegacyTextFieldType.Password,
										oninput: (v) => (viewModel.password = v),
										leadingIcon: { icon: Icons.GenericLockFilled, color: theme.on_surface_variant },
									}),
									m(TextField, {
										label: "migrationRootMailFolderName_label",
										value: viewModel.rootFolder,
										oninput: (v) => (viewModel.rootFolder = v),
										leadingIcon: { icon: Icons.FolderFilled, color: theme.on_surface_variant },
									}),
								]),
							),
						),
					],
				)
			},
		})

		dialog.show()
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
			await locator.userManagementFacade.deleteUser(await this.user.getAsync(), true).catch(
				ofClass(PreconditionFailedError, (e) => {
					if (e.data === UnsubscribeFailureReason.NOT_ENOUGH_CREDIT) {
						Dialog.message("insufficientBalanceError_msg")
					} else {
						Dialog.message("emailAddressInUse_msg")
					}
				}),
			)
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
				m.redraw()
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.CREATE) {
				await this.teamGroupInfos.reload()
				// When getting a create event, if user has just bought a new shared mailbox, add it to the selected user
				if (this.isPurchasingNewSharedMailboxGroup) {
					this.isPurchasingNewSharedMailboxGroup = false
					await this.showAddUserToGroupDialog()
				}
				m.redraw()
			} else if (
				isUpdateForTypeRef(UserTypeRef, update) &&
				operation === OperationType.UPDATE &&
				this.user.isLoaded() &&
				isSameId(this.user.getLoaded()._id, idToElementId(instanceId))
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
		return locator.entityClient.load(GroupTypeRef, idToElementId(this.userGroupInfo.group)).then((userGroup) => {
			return locator.entityClient.load(UserTypeRef, idToElementId(neverNull(userGroup.user)))
		})
	}

	private loadCustomer(): Promise<Customer> {
		return locator.logins.getUserController().reloadCustomer()
	}

	private loadTeamGroupInfos(): Promise<Array<GroupInfo>> {
		return this.customer.getAsync().then((customer) => locator.entityClient.loadAll(GroupInfoTypeRef, customer.teamGroups))
	}
}

/**
 * Show editor for adding the csv values of the users.
 */
export function showUserImportDialog(customDomains: string[]) {
	let editor = new HtmlEditor(getHtmlSanitizer(), "enterAsCSV_msg").showBorders().setMode(HtmlEditorMode.HTML).setValue(CSV_USER_FORMAT).setMinHeight(200)
	let form = {
		view: () => {
			return [m(editor)]
		},
	}
	Dialog.showActionDialog({
		title: "importUsers_action",
		child: form,
		okAction: (csvDialog) => {
			let closeCsvDialog = checkAndImportUserData(editor.getValue(), customDomains)
			if (closeCsvDialog) {
				csvDialog.close()
			}
		},
	})
}

export async function showAddGroupDialog(userConfirmedAddingGroup: () => void) {
	const isCreateNewGroupSelected = await Dialog.choice("userAlreadyAssignedToAllAvailableGroups_msg", [
		{ text: "close_alt", value: false },
		{
			text: "addGroup_label",
			value: true,
		},
	])
	if (isCreateNewGroupSelected) {
		const { show } = await import("./../../mail-app/settings/groups/AddGroupDialog.js")
		show()
		userConfirmedAddingGroup()
	}
}
