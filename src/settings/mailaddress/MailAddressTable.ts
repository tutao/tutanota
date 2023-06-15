import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import type { TableAttrs, TableLineAttrs } from "../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { LimitReachedError } from "../../api/common/error/RestError.js"
import { ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../gui/base/icons/Icons.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import Stream from "mithril/stream"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander.js"
import { attachDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { AddressInfo, AddressStatus, MailAddressTableModel } from "./MailAddressTableModel.js"
import { showAddAliasDialog } from "./AddAliasDialog.js"
import { locator } from "../../api/main/MainLocator.js"
import { NewPaidPlans } from "../../api/common/TutanotaConstants.js"

assertMainOrNode()

export type MailAddressTableAttrs = {
	model: MailAddressTableModel
}

/** Shows a table with all aliases and ability to enable/disable them, add more and set names. */
export class MailAddressTable implements Component<MailAddressTableAttrs> {
	private expanded: boolean = false
	private redrawSubscription: Stream<void> | null = null

	oncreate(vnode: VnodeDOM<MailAddressTableAttrs>) {
		vnode.attrs.model.init()
		this.redrawSubscription = vnode.attrs.model.redraw.map(m.redraw)
	}

	onremove() {
		this.redrawSubscription?.end(true)
	}

	view(vnode: Vnode<MailAddressTableAttrs>): Children {
		const a = vnode.attrs
		const addAliasButtonAttrs: IconButtonAttrs | null = a.model.userCanModifyAliases()
			? {
					title: "addEmailAlias_label",
					click: () => this.onAddAlias(a),
					icon: Icons.Add,
					size: ButtonSize.Compact,
			  }
			: null
		const aliasesTableAttrs: TableAttrs = {
			columnHeading: ["mailAddress_label", "state_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addAliasButtonAttrs,
			lines: getAliasLineAttrs(a),
		}
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("mailAddresses_label")),
				m(ExpanderButton, {
					label: "show_action",
					expanded: this.expanded,
					onExpandedChange: (v) => (this.expanded = v),
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this.expanded,
				},
				m(Table, aliasesTableAttrs),
			),
		]
	}

	private onAddAlias(attrs: MailAddressTableAttrs) {
		const userController = locator.logins.getUserController()
		if (userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			showAddAliasDialog(attrs.model)
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

	const updateModel = attrs.model.setAliasStatus(alias.address, !deactivateOrDeleteAlias).catch(
		ofClass(LimitReachedError, () => {
			attrs.model.handleTooManyAliases()
		}),
	)
	await showProgressDialog("pleaseWait_msg", updateModel)
}

function showSenderNameChangeDialog(model: MailAddressTableModel, alias: { address: string; name: string }) {
	Dialog.showTextInputDialog(
		"edit_action",
		"mailName_label",
		() => alias.address,
		// Use name as default value if there was nothing set before e.g. if we populated the mapping before we set the sender name for the first time
		alias.name || model.defaultSenderName(),
	).then((newName) => showProgressDialog("pleaseWait_msg", model.setAliasName(alias.address, newName)))
}
