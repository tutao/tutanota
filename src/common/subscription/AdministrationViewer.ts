import m, { Children } from "mithril"
import { assertMainOrNode, ShareCapability } from "@tutao/app-env"
import { lang, TranslationKey } from "../misc/LanguageViewModel"
import { entityUpdateUtils, listIdPart, sysTypeRefs } from "@tutao/typerefs"
import { Icons } from "../gui/base/icons/Icons"
import { ColumnWidth, Table, TableLineAttrs } from "../gui/base/Table.js"
import { ExpanderPanel } from "../gui/base/Expander"
import { locator } from "../api/main/CommonLocator"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import type { UpdatableSettingsViewer } from "../settings/Interfaces.js"
import { createDropdown } from "../gui/base/Dropdown.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton"
import { assertNotNull } from "@tutao/utils"
import { Dialog } from "../gui/base/Dialog"
import { TextField, TextFieldType } from "../gui/base/TextField"
import { getCleanedMailAddress } from "../misc/parsing/MailAddressParser"
import { GroupInfo } from "../../typerefs/entities/sys/TypeRefs"

assertMainOrNode()

type Admin = {
	external: boolean
	userGroupInfo: sysTypeRefs.GroupInfo
}

/**
 * Displays administrators and allows adding new administrators.
 */
export class AdministrationViewer implements UpdatableSettingsViewer {
	private customer: sysTypeRefs.Customer | null = null
	private admins: Admin[] = []
	private adminGroupInfo: GroupInfo | null = null

	constructor() {
		this.loadData()
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m(
			"#invoicing-settings.fill-absolute.scroll.plr-24",
			{
				role: "group",
			},
			[this.renderAdmins()],
		)
	}

	private async loadData() {
		this.customer = await locator.logins.getUserController().reloadCustomer()
		const customer = this.customer

		const adminGroup = await locator.entityClient.load(sysTypeRefs.GroupTypeRef, this.customer.adminGroup)
		this.adminGroupInfo = await locator.entityClient.load(sysTypeRefs.GroupInfoTypeRef, adminGroup.groupInfo)
		const adminGroupMembers = await locator.entityClient.loadAll(sysTypeRefs.GroupMemberTypeRef, adminGroup.members)
		this.admins = await Promise.all(
			adminGroupMembers.map(async (adminGroupMember) => {
				const adminUserGroupInfo = await locator.entityClient.load(sysTypeRefs.GroupInfoTypeRef, adminGroupMember.userGroupInfo)
				const external = customer.userGroups !== listIdPart(adminGroupMember.userGroupInfo)
				return { external, userGroupInfo: adminUserGroupInfo } as Admin
			}),
		)
		m.redraw()
	}

	private renderAdmins(): Children {
		if (this.admins.length === 0) {
			return null
		} else {
			const addExternalAdminButtonAttrs: IconButtonAttrs = {
				title: "adminAddPartner_label",
				click: () => this.showAddExternalAdminDialog(),
				icon: Icons.Plus,
				size: ButtonSize.Compact,
			}
			return [
				m(".flex-space-between.items-center.mt-32.mb-8", [m(".h4", lang.get("adminAdministration_label")), m(IconButton, addExternalAdminButtonAttrs)]),
				m(
					ExpanderPanel,
					{
						expanded: true,
					},
					m(Table, {
						columnHeading: ["address_label", "adminExternal_label"],
						columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
						columnAlignments: [false, true, false],
						showActionButtonColumn: true,
						lines: this.admins.map((admin) => this.adminLineAttrs(admin)),
					}),
				),
				// m(".small", lang.get("invoiceSettingDescription_msg") + " " + lang.get("laterInvoicingInfo_msg")),
			]
		}
	}

	private adminLineAttrs(admin: Admin): TableLineAttrs {
		return {
			cells: () => [
				{
					main: admin.userGroupInfo.mailAddress ?? "",
				},
				{
					main: admin.external ? lang.getTranslationText("yes_label") : "",
				},
			],
			actionButtonAttrs: admin.external
				? {
						title: "more_label",
						icon: Icons.More,
						size: ButtonSize.Compact,
						click: (e, dom) => {
							createDropdown({
								width: 300,
								lazyButtons: () => [
									{
										label: "removed_label",
										click: () => console.log("FIXME remove", admin),
									},
								],
							})(e, dom)
						},
					}
				: null,
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			await this.processEntityUpdate(update)
		}
	}

	private async processEntityUpdate(update: entityUpdateUtils.EntityUpdateData): Promise<void> {
		if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.CustomerTypeRef, update)) {
			await this.loadData()
			m.redraw()
		}
	}

	private async showAddExternalAdminDialog() {
		let mailAddress = ""

		Dialog.showActionDialog({
			title: "notificationSettings_action",
			child: {
				view: () => [
					m(TextField, {
						label: "mailAddress_label",
						value: mailAddress,
						type: TextFieldType.Email,
						oninput: (newValue) => (mailAddress = newValue),
					}),
					m(".small.mt-8", lang.get("emailPushNotification_msg")),
				],
			},
			validator: () => this.validateExternalPartnerEmailAddressInput(mailAddress),
			allowOkWithReturn: true,
			okAction: (dialog: Dialog) => {
				this.createExternalAdmin(mailAddress)
				dialog.close()
			},
		})
	}

	private async createExternalAdmin(mailAddress: string) {
		// FIXME need to invite user as we can't access their symmetric user group key
		// GroupSharingDialog
		// GroupSharingModel
		// ShareFacade

		await locator.shareFacade.sendGroupInvitation(assertNotNull(this.adminGroupInfo), ["map-free@tutanota.de"], ShareCapability.Read)

		// showProgressDialog(
		// 	"pleaseWait_msg",
		// 	this.user
		// 		.getAsync()
		// 		.then((user) => locator.userManagementFacade.changeAdminFlag(user, value))
		// 		.catch(
		// 			ofClass(restError.PreconditionFailedError, (e) => {
		// 				if (e.data && e.data === "usergroup.pending-key-rotation") {
		// 					Dialog.message("makeAdminPendingUserGroupKeyRotationError_msg")
		// 				} else if (e.data === "multiadmingroup.pending-key-rotation") {
		// 					// when a multi admin key rotation is scheduled we do not want to introduce new members into the admin group
		// 					Dialog.message("cannotAddAdminWhenMultiAdminKeyRotationScheduled_msg")
		// 				} else {
		// 					throw e
		// 				}
		// 			}),
		// 		),
		// )
	}

	private validateExternalPartnerEmailAddressInput(emailAddress: string): TranslationKey | null {
		return getCleanedMailAddress(emailAddress) == null ? "mailAddressInvalid_msg" : null
	}
}
