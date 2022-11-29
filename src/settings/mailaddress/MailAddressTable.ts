import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import {Dialog} from "../../gui/base/Dialog.js"
import type {TableAttrs, TableLineAttrs} from "../../gui/base/Table.js"
import {ColumnWidth, Table} from "../../gui/base/Table.js"
import {lang, TranslationKey} from "../../misc/LanguageViewModel.js"
import {LimitReachedError} from "../../api/common/error/RestError.js"
import {ofClass} from "@tutao/tutanota-utils"
import {Icons} from "../../gui/base/icons/Icons.js"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog.js"
import * as EmailAliasOptionsDialog from "../../subscription/EmailAliasOptionsDialog.js"
import Stream from "mithril/stream"
import {ExpanderButton, ExpanderPanel} from "../../gui/base/Expander.js"
import {attachDropdown, DropdownButtonAttrs} from "../../gui/base/Dropdown.js"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs.js"
import {assertMainOrNode} from "../../api/common/Env.js"
import {IconButtonAttrs} from "../../gui/base/IconButton.js"
import {ButtonSize} from "../../gui/base/ButtonSize.js";
import {AddressInfo, AddressStatus, MailAddressTableModel} from "./MailAddressTableModel.js"
import {showAddAliasDialog} from "./AddAliasDialog.js"

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
				size: ButtonSize.Compact
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
					onExpandedChange: (v) => this.expanded = v
				}),
			]),
			m(ExpanderPanel, {
					expanded: this.expanded,
				},
				m(Table, aliasesTableAttrs),
			),
			this.renderAliasCount(a),
		]
	}

	private renderAliasCount({model}: MailAddressTableAttrs) {
		if (!model.userCanModifyAliases()) {
			return null
		}
		const aliasCount = model.aliasCount()
		if (aliasCount == null) {
			return null
		}
		return m(
			".small",
			aliasCount.availableToCreate === 0
				? lang.get("adminMaxNbrOfAliasesReached_msg")
				: lang.get("mailAddressAliasesMaxNbr_label", {"{1}": aliasCount.availableToCreate,}),
		)
	}

	private onAddAlias(attrs: MailAddressTableAttrs) {
		const {model} = attrs
		switch (model.checkTryingToAddAlias()) {
			case "freeaccount":
				showNotAvailableForFreeDialog(true)
				break
			case "limitreached":
				this.onAliasLimitReached()
				break
			case "ok":
				showAddAliasDialog(attrs.model)
				break
			case "loading":
			case "notanadmin":
				break
		}
	}


	private onAliasLimitReached() {
		Dialog.confirm(() => lang.get("adminMaxNbrOfAliasesReached_msg") + " " + lang.get("orderAliasesConfirm_msg")).then(confirmed => {
			if (confirmed) {
				// Navigate to subscriptions folder and show alias options
				m.route.set("/settings/subscription")
				EmailAliasOptionsDialog.show()
			}
		})
	}
}

function setNameDropdownButton(model: MailAddressTableModel, addressInfo: AddressInfo): DropdownButtonAttrs {
	return {
		label: "setSenderName_action",
		click: () => showSenderNameChangeDialog(model, addressInfo)
	}
}

function addressDropdownButtons(attrs: MailAddressTableAttrs, addressInfo: AddressInfo): DropdownButtonAttrs[] {
	switch (addressInfo.status) {
		case AddressStatus.Primary:
			return [
				setNameDropdownButton(attrs.model, addressInfo)
			]
		case AddressStatus.Alias: {
			const buttons = [setNameDropdownButton(attrs.model, addressInfo)]
			if (attrs.model.userCanModifyAliases()) {
				buttons.push({
						label: "deactivate_action",
						click: () => {
							switchAliasStatus(addressInfo, attrs)
						},
					}
				)
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
					}
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
					}
				)
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
	return attrs.model.addresses().map(addressInfo => {
		const dropdownButtons = addressDropdownButtons(attrs, addressInfo)
		// do not display the "more" button if there are no available actions
		const actionButtonAttrs: IconButtonAttrs | null =
			dropdownButtons.length === 0
				? null
				: attachDropdown(
					{
						mainButtonAttrs: {
							title: "edit_action",
							icon: Icons.More,
							size: ButtonSize.Compact,
						},
						showDropdown: () => true,
						width: 250,
						childAttrs: () => dropdownButtons,
					},
				)
		return {
			cells: () => [
				{main: addressInfo.address, info: [addressInfo.name]},
				{main: statusLabel(addressInfo)},
			],
			actionButtonAttrs: actionButtonAttrs,
		}
	})
}

async function switchAliasStatus(alias: AddressInfo, attrs: MailAddressTableAttrs) {
	const message: TranslationKey = (alias.status === AddressStatus.Alias) ? "deactivateAlias_msg" : "deleteAlias_msg"
	const confirmed = await Dialog.confirm(() =>
		lang.get(message, {
			"{1}": alias.address,
		}),
	)

	if (!confirmed) {
		return
	}

	const restore = alias.status === AddressStatus.DisabledAlias
	const p = attrs.model.setAliasStatus(alias.address, restore)
				   .catch(ofClass(LimitReachedError, () => {
						   Dialog.message("adminMaxNbrOfAliasesReached_msg")
					   }),
				   )
	await showProgressDialog("pleaseWait_msg", p)
}

function showSenderNameChangeDialog(model: MailAddressTableModel, alias: {address: string, name: string}) {
	Dialog.showTextInputDialog(
		"edit_action",
		"mailName_label",
		() => alias.address,
		alias.name,
	).then((newName) => showProgressDialog("pleaseWait_msg", model.setAliasName(alias.address, newName)))
}


