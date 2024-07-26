import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import type { TableLineAttrs } from "../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { LimitReachedError } from "../../api/common/error/RestError.js"
import { ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../gui/base/icons/Icons.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander.js"
import { attachDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { AddressInfo, AddressStatus, MailAddressTableModel } from "./MailAddressTableModel.js"
import { showAddAliasDialog } from "./AddAliasDialog.js"
import { locator } from "../../api/main/CommonLocator.js"
import { UpgradeRequiredError } from "../../api/main/UpgradeRequiredError.js"

assertMainOrNode()

export type MailAddressTableAttrs = {
	model: MailAddressTableModel
	expanded: boolean
	onExpanded: (expanded: boolean) => unknown
}

/** Shows a table with all aliases and ability to enable/disable them, add more and set names. */
export class MailAddressTable implements Component<MailAddressTableAttrs> {
	view({ attrs }: Vnode<MailAddressTableAttrs>): Children {
		const { model } = attrs
		// If the table is expanded we need to init the model.
		// It is no-op to init multiple times so it's safe.
		if (attrs.expanded) {
			model.init()
		}
		const addAliasButtonAttrs: IconButtonAttrs | null = model.userCanModifyAliases()
			? {
					title: "addEmailAlias_label",
					click: () => this.onAddAlias(attrs),
					icon: Icons.Add,
					size: ButtonSize.Compact,
			  }
			: null
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("mailAddresses_label")),
				m(ExpanderButton, {
					label: "show_action",
					expanded: attrs.expanded,
					onExpandedChange: (v) => {
						attrs.onExpanded(v)
					},
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: attrs.expanded,
				},
				m(Table, {
					columnHeading: ["mailAddress_label", "state_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
					showActionButtonColumn: true,
					addButtonAttrs: addAliasButtonAttrs,
					lines: getAliasLineAttrs(attrs),
				}),
			),
			model.aliasCount
				? [
						m(
							".mt-s",
							lang.get("amountUsedAndActivatedOf_label", {
								"{used}": model.aliasCount.usedAliases,
								"{active}": model.aliasCount.enabledAliases,
								"{totalAmount}": model.aliasCount.totalAliases,
							}),
						),
						m(".small.mt-s", lang.get(model.aliasLimitIncludesCustomDomains() ? "mailAddressInfoLegacy_msg" : "mailAddressInfo_msg")),
				  ]
				: null,
		]
	}

	private async onAddAlias(attrs: MailAddressTableAttrs) {
		const userController = locator.logins.getUserController()
		if (userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			const isNewPaidPlan = await userController.isNewPaidPlan()
			showAddAliasDialog(attrs.model, isNewPaidPlan)
		}
	}
}

function setNameDropdownButton(model: MailAddressTableModel, addressInfo: AddressInfo): DropdownButtonAttrs {
	return {
		label: "setSenderName_action",
		click: () => showSenderNameChangeDialog(model, addressInfo),
	}
}

function addressDropdownButtons(attrs: MailAddressTableAttrs, addressInfo: AddressInfo): DropdownButtonAttrs[] {
	switch (addressInfo.status) {
		case AddressStatus.Primary:
			return [setNameDropdownButton(attrs.model, addressInfo)]
		case AddressStatus.Alias: {
			const buttons = [setNameDropdownButton(attrs.model, addressInfo)]
			if (attrs.model.userCanModifyAliases()) {
				buttons.push({
					label: "deactivate_action",
					click: () => {
						switchAliasStatus(addressInfo, attrs)
					},
				})
			}
			return buttons
		}
		case AddressStatus.DisabledAlias: {
			return attrs.model.userCanModifyAliases()
				? [
						{
							label: "activate_action",
							click: () => {
								switchAliasStatus(addressInfo, attrs)
							},
						},
				  ]
				: []
		}
		case AddressStatus.Custom: {
			const buttons = [setNameDropdownButton(attrs.model, addressInfo)]
			if (attrs.model.userCanModifyAliases()) {
				buttons.push({
					label: "delete_action",
					click: () => {
						switchAliasStatus(addressInfo, attrs)
					},
				})
			}
			return buttons
		}
	}
}

function statusLabel(addressInfo: AddressInfo): string {
	switch (addressInfo.status) {
		case AddressStatus.Primary:
			return lang.get("primaryMailAddress_label")
		case AddressStatus.Alias:
		case AddressStatus.Custom:
			return lang.get("activated_label")
		case AddressStatus.DisabledAlias:
			return lang.get("deactivated_label")
	}
}

export function getAliasLineAttrs(attrs: MailAddressTableAttrs): Array<TableLineAttrs> {
	return attrs.model.addresses().map((addressInfo) => {
		const dropdownButtons = addressDropdownButtons(attrs, addressInfo)
		// do not display the "more" button if there are no available actions
		const actionButtonAttrs: IconButtonAttrs | null =
			dropdownButtons.length === 0
				? null
				: attachDropdown({
						mainButtonAttrs: {
							title: "edit_action",
							icon: Icons.More,
							size: ButtonSize.Compact,
						},
						showDropdown: () => true,
						width: 250,
						childAttrs: () => dropdownButtons,
				  })
		return {
			cells: () => [{ main: addressInfo.address, info: [addressInfo.name] }, { main: statusLabel(addressInfo) }],
			actionButtonAttrs: actionButtonAttrs,
		}
	})
}

async function switchAliasStatus(alias: AddressInfo, attrs: MailAddressTableAttrs) {
	const deactivateOrDeleteAlias = alias.status !== AddressStatus.DisabledAlias
	if (deactivateOrDeleteAlias) {
		// alias from custom domains will be deleted. Tutanota aliases will be deactivated
		const message: TranslationKey = alias.status === AddressStatus.Custom ? "deleteAlias_msg" : "deactivateAlias_msg"
		const confirmed = await Dialog.confirm(() =>
			lang.get(message, {
				"{1}": alias.address,
			}),
		)
		if (!confirmed) {
			return
		}
	}

	const updateModel = attrs.model
		.setAliasStatus(alias.address, !deactivateOrDeleteAlias)
		.catch(ofClass(LimitReachedError, () => attrs.model.handleTooManyAliases()))
		.catch(ofClass(UpgradeRequiredError, (e) => showPlanUpgradeRequiredDialog(e.plans, e.message)))
	await showProgressDialog("pleaseWait_msg", updateModel)
}

function showSenderNameChangeDialog(model: MailAddressTableModel, alias: { address: string; name: string }) {
	Dialog.showTextInputDialog({
		title: "edit_action",
		label: "mailName_label",
		infoMsgId: () => alias.address,
		// Use name as default value if there was nothing set before e.g. if we populated the mapping before we set the sender name for the first time
		defaultValue: alias.name || model.defaultSenderName(),
	}).then((newName) => showProgressDialog("pleaseWait_msg", model.setAliasName(alias.address, newName)))
}
