import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import {Dialog} from "../../gui/base/Dialog.js"
import type {TableAttrs, TableLineAttrs} from "../../gui/base/Table.js"
import {ColumnWidth, Table} from "../../gui/base/Table.js"
import {lang, TranslationKey} from "../../misc/LanguageViewModel.js"
import {InvalidDataError, LimitReachedError, PreconditionFailedError} from "../../api/common/error/RestError.js"
import {firstThrow, ofClass} from "@tutao/tutanota-utils"
import {SelectMailAddressForm} from "../SelectMailAddressForm.js"
import {Icons} from "../../gui/base/icons/Icons.js"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog.js"
import * as EmailAliasOptionsDialog from "../../subscription/EmailAliasOptionsDialog.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {ExpanderButton, ExpanderPanel} from "../../gui/base/Expander.js"
import {attachDropdown} from "../../gui/base/Dropdown.js"
import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../../api/common/TutanotaConstants.js"
import {showNotAvailableForFreeDialog} from "../../misc/SubscriptionDialogs.js"
import {assertMainOrNode} from "../../api/common/Env.js"
import {isTutanotaMailAddress} from "../../mail/model/MailUtils.js";
import {IconButtonAttrs} from "../../gui/base/IconButton.js"
import {ButtonSize} from "../../gui/base/ButtonSize.js";
import {AddressInfo, MailAddressTableModel} from "./MailAddressTableModel.js"

assertMainOrNode()

const FAILURE_USER_DISABLED = "mailaddressaliasservice.group_disabled"

export type MailAddressTableAttrs = {
	model: MailAddressTableModel
}


/** Shows a table with all aliases and ability to enable/disable them, add more and set names. */
export class MailAddressTable implements Component<MailAddressTableAttrs> {
	private expanded: boolean = false
	private redrawSubscription: Stream<void> | null = null

	oninit({attrs}: Vnode<MailAddressTableAttrs>): any {
		attrs.model.init()
	}

	oncreate(vnode: VnodeDOM<MailAddressTableAttrs>) {
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
			columnHeading: ["emailAlias_label", "state_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addAliasButtonAttrs,
			lines: getAliasLineAttrs(a),
		}
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("mailAddressAliases_label")),
				m(ExpanderButton, {
					label: "showEmailAliases_action",
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
		return m(
			".small",
			aliasCount == null
				? null
				: aliasCount.availableToCreate === 0
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
				this.showAddAliasDialog(attrs)
				break
			case "loading":
			case "notanadmin":
				break
		}
	}

	private showAddAliasDialog(attrs: MailAddressTableAttrs) {
		attrs.model.getAvailableDomains().then(domains => {
			let isVerificationBusy = false
			let mailAddress: string
			let formErrorId: TranslationKey | null = "mailAddressNeutral_msg"
			let formDomain = stream(firstThrow(domains))

			const addEmailAliasOkAction = (dialog: Dialog) => {
				if (isVerificationBusy) return

				if (formErrorId) {
					Dialog.message(formErrorId)
					return
				}

				addAlias(attrs, mailAddress)
				// close the add alias dialog immediately
				dialog.close()
			}

			const isTutanotaDomain = formDomain.map(d => TUTANOTA_MAIL_ADDRESS_DOMAINS.includes(d))
			Dialog.showActionDialog({
				title: lang.get("addEmailAlias_label"),
				child: {
					view: () => {
						return [
							m(SelectMailAddressForm, {
								availableDomains: domains,
								onValidationResult: (email, validationResult) => {
									if (validationResult.isValid) {
										mailAddress = email
										formErrorId = null
									} else {
										formErrorId = validationResult.errorId
									}
								},
								onBusyStateChanged: isBusy => (isVerificationBusy = isBusy),
								onDomainChanged: domain => formDomain(domain),
							}),
							m(ExpanderPanel, {
									expanded: isTutanotaDomain(),
								},
								m(".pt-m", lang.get("permanentAliasWarning_msg")),
							),
						]
					},
				},
				allowOkWithReturn: true,
				okAction: addEmailAliasOkAction,
			})
		})
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

export function getAliasLineAttrs(attrs: MailAddressTableAttrs): Array<TableLineAttrs> {
	return attrs.model.addresses().map(alias => {
		const actionButtonAttrs: IconButtonAttrs = attachDropdown(
			{
				mainButtonAttrs: {
					title: "edit_action",
					icon: Icons.More,
					size: ButtonSize.Compact,
				},
				showDropdown: () => true,
				width: 250,
				childAttrs: () => [
					{
						// FIXME
						label: () => "Set name",
						click: () => showSenderNameChangeDialog(attrs.model, alias)
					},
					attrs.model.userCanModifyAliases()
						? (alias.enabled)
							? {
								label: isTutanotaMailAddress(alias.address) ? "deactivate_action" : "delete_action",
								click: () => {
									if (alias.enabled) {
										switchAliasStatus(alias, attrs)
									}
								},
							}
							: {
								label: "activate_action",
								click: () => {
									if (!alias.enabled) {
										switchAliasStatus(alias, attrs)
									}
								},
							}
						: null,

				],
			},
		)
		return {
			cells: () => [
				{main: alias.address, info: [alias.name]},
				{main: alias.enabled ? lang.get("activated_label") : lang.get("deactivated_label")},
			],
			actionButtonAttrs: actionButtonAttrs,
		}
	})
}

function switchAliasStatus(alias: AddressInfo, attrs: MailAddressTableAttrs) {
	let restore = !alias.enabled
	let promise = Promise.resolve(true)

	if (!restore) {
		const message: TranslationKey = isTutanotaMailAddress(alias.address) ? "deactivateAlias_msg" : "deleteAlias_msg"
		promise = Dialog.confirm(() =>
			lang.get(message, {
				"{1}": alias.address,
			}),
		)
	}

	promise.then(confirmed => {
		if (confirmed) {
			let p = attrs.model.setAliasStatus(alias.address, restore)
						 .catch(
							 ofClass(LimitReachedError, e => {
								 Dialog.message("adminMaxNbrOfAliasesReached_msg")
							 }),
						 )
			showProgressDialog("pleaseWait_msg", p)
		}
	})
}

function showSenderNameChangeDialog(model: MailAddressTableModel, alias: {address: string, name: string}) {
	// FIXME translate
	Dialog.showTextInputDialog(
		() => "Sender name",
		// FIXME
		"name_label",
		() => alias.address,
		alias.name,
	).then((newName) => showProgressDialog("pleaseWait_msg", model.setAliasName(alias.address, newName)))
}


export function addAlias(attrs: MailAddressTableAttrs, alias: string): Promise<void> {
	return showProgressDialog("pleaseWait_msg", attrs.model.addAlias(alias))
		.catch(ofClass(InvalidDataError, () => Dialog.message("mailAddressNA_msg")))
		.catch(ofClass(LimitReachedError, () => Dialog.message("adminMaxNbrOfAliasesReached_msg")))
		.catch(
			ofClass(PreconditionFailedError, e => {
				let errorMsg = e.toString()

				if (e.data === FAILURE_USER_DISABLED) {
					errorMsg = lang.get("addAliasUserDisabled_msg")
				}

				return Dialog.message(() => errorMsg)
			}),
		)
}