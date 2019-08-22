// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {Dialog} from "../gui/base/Dialog"
import type {TableAttrs, TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {lang} from "../misc/LanguageViewModel"
import {isTutanotaMailAddress} from "../api/common/RecipientInfo"
import {InvalidDataError, LimitReachedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {noOp} from "../api/common/utils/Utils"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {getAvailableDomains} from "./AddUserDialog"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonType} from "../gui/base/ButtonN"
import stream from "mithril/stream/stream.js"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {attachDropdown} from "../gui/base/DropdownN"
import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import type {MailAddressAlias} from "../api/entities/sys/MailAddressAlias"

assertMainOrNode()

export type EditAliasesFormAttrs = {|
	userGroupInfo: GroupInfo,
	aliasCount: AliasCount,
	expanded: Stream<boolean>
|}

type AliasCount = {
	availableToCreate: number,
	availableToEnable: number
}

export class EditAliasesFormN implements MComponent<EditAliasesFormAttrs> {
	view(vnode: Vnode<LifecycleAttrs<EditAliasesFormAttrs>>): Children {
		const a = vnode.attrs
		const addAliasButtonAttrs: ButtonAttrs = {
			label: "addEmailAlias_label",
			click: () => this._showAddAliasDialog(a),
			icon: () => Icons.Add
		}

		const aliasesTableAttrs: TableAttrs = {
			columnHeading: ["emailAlias_label", "state_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addAliasButtonAttrs,
			lines: getAliasLineAttrs(a),
		}

		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get('mailAddressAliases_label')),
				m(ExpanderButtonN, {label: "showEmailAliases_action", expanded: a.expanded})
			]),
			m(ExpanderPanelN, {expanded: a.expanded}, m(TableN, aliasesTableAttrs)),
			m(".small", (a.aliasCount.availableToCreate === 0) ?
				lang.get("adminMaxNbrOfAliasesReached_msg")
				: lang.get('mailAddressAliasesMaxNbr_label', {'{1}': a.aliasCount.availableToCreate}))
		]
	}

	_showAddAliasDialog(aliasFormAttrs: EditAliasesFormAttrs) {
		if (aliasFormAttrs.aliasCount.availableToEnable === 0) {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog(true)
			} else {
				Dialog.confirm(() => lang.get("adminMaxNbrOfAliasesReached_msg") + " "
					+ lang.get("orderAliasesConfirm_msg")).then(confirmed => {
					if (confirmed) {
						// TODO: Navigate to alias upgrade
						//tutao.locator.navigator.settings();
						//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
					}
				})
			}
		} else {
			getAvailableDomains().then(domains => {
				const form = new SelectMailAddressForm(domains)
				const addEmailAliasOkAction = (dialog) => {
					const alias = form.cleanMailAddress()
					addAlias(aliasFormAttrs, alias)
					// close the add alias dialog immediately
					dialog.close()
				}

				Dialog.showActionDialog({
					title: lang.get("addEmailAlias_label"),
					child: {
						view: () => [
							m(form),
							m(ExpanderPanelN,
								{expanded: form.domain.map(d => TUTANOTA_MAIL_ADDRESS_DOMAINS.includes(d))},
								m(".pt-m", lang.get("permanentAliasWarning_msg"))
							)
						]
					},
					validator: () => form.getErrorMessageId(),
					allowOkWithReturn: true,
					okAction: addEmailAliasOkAction
				})
			})
		}
	}
}

export function getAliasLineAttrs(editAliasAttrs: EditAliasesFormAttrs): Array<TableLineAttrs> {
	return editAliasAttrs.userGroupInfo.mailAddressAliases
	                     .slice()
	                     .sort((a, b) => (a.mailAddress > b.mailAddress) ? 1 : -1)
	                     .map(alias => {
		                     const actionButtonAttrs: ButtonAttrs = attachDropdown(
			                     {
				                     label: "edit_action",
				                     icon: () => Icons.Edit,
				                     click: noOp
			                     },
			                     () => [
				                     {
					                     label: "activate_action",
					                     click: () => {
						                     if (!alias.enabled) {
							                     switchAliasStatus(alias, editAliasAttrs)
						                     }
					                     },
					                     type: ButtonType.Dropdown,
					                     isSelected: () => alias.enabled
				                     },
				                     {
					                     label: isTutanotaMailAddress(alias.mailAddress) ? "deactivate_action" : "delete_action",
					                     click: () => {
						                     if (alias.enabled) {
							                     switchAliasStatus(alias, editAliasAttrs)
						                     }
					                     },
					                     type: ButtonType.Dropdown,
					                     isSelected: () => !alias.enabled
				                     }
			                     ], () => true, 250)

		                     return {
			                     cells: [
				                     alias.mailAddress,
				                     alias.enabled
					                     ? lang.get("activated_label")
					                     : lang.get("deactivated_label")
			                     ],
			                     actionButtonAttrs: actionButtonAttrs
		                     }
	                     })
}

function switchAliasStatus(alias: MailAddressAlias, editAliasAttrs: EditAliasesFormAttrs) {
	let restore = !alias.enabled
	let promise = Promise.resolve(true)
	if (!restore) {
		let message = isTutanotaMailAddress(alias.mailAddress) ? 'deactivateAlias_msg' : 'deleteAlias_msg'
		promise = Dialog.confirm(() => lang.get(message, {"{1}": alias.mailAddress}))
	}
	promise.then(confirmed => {
		if (confirmed) {
			let p = worker.setMailAliasStatus(editAliasAttrs.userGroupInfo.group, alias.mailAddress, restore)
			              .catch(LimitReachedError, e => {
				              Dialog.error("adminMaxNbrOfAliasesReached_msg")
			              })
			              .finally(() => updateNbrOfAliases(editAliasAttrs))
			showProgressDialog("pleaseWait_msg", p)
		}
	})
}


export function addAlias(aliasFormAttrs: EditAliasesFormAttrs, alias: string): Promise<void> {
	return showProgressDialog("pleaseWait_msg", worker.addMailAlias(aliasFormAttrs.userGroupInfo.group, alias))
		.catch(InvalidDataError, () => Dialog.error("mailAddressNA_msg"))
		.catch(LimitReachedError, () => Dialog.error("adminMaxNbrOfAliasesReached_msg"))
		.finally(() => updateNbrOfAliases(aliasFormAttrs))
}


export function updateNbrOfAliases(attrs: EditAliasesFormAttrs): Promise<AliasCount> {
	return worker.getAliasCounters().then(mailAddressAliasServiceReturn => {
		const newNbr = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases)
			- Number(mailAddressAliasServiceReturn.usedAliases))
		const newNbrToEnable = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases)
			- Number(mailAddressAliasServiceReturn.enabledAliases))
		attrs.aliasCount = {
			availableToCreate: newNbr,
			availableToEnable: newNbrToEnable
		}
		m.redraw()
		return attrs.aliasCount
	})
}

export function createEditAliasFormAttrs(userGroupInfo: GroupInfo): EditAliasesFormAttrs {
	return {
		userGroupInfo: userGroupInfo,
		aliasCount: {
			availableToEnable: 0,
			availableToCreate: 0
		},
		expanded: stream(false)
	}
}


