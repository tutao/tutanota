// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {Dialog} from "../gui/base/Dialog"
import {ColumnWidth} from "../gui/base/Table"
import {lang} from "../misc/LanguageViewModel"
import {isTutanotaMailAddress} from "../api/common/RecipientInfo"
import {InvalidDataError, LimitReachedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {noOp} from "../api/common/utils/Utils"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {ButtonType} from "../gui/base/Button"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {getAvailableDomains} from "./AddUserDialog"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import type {TableAttrs, TableLineAttrs} from "../gui/base/TableN"
import {TableN} from "../gui/base/TableN"
import stream from "mithril/stream/stream.js"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {attachDropdown} from "../gui/base/DropdownN"
import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"

assertMainOrNode()

export type EditAliasesFormAttrs = {
	userGroupInfo: GroupInfo
}

class _EditAliasesForm {
	_nbrOfAliases: number;
	_expanded: stream<boolean>;

	constructor() {
		this._nbrOfAliases = 0
		this._expanded = stream(false)
	}

	view(vnode: Vnode<LifecycleAttrs<EditAliasesFormAttrs>>) {
		const a = vnode.attrs
		this._getNbrOfAliases()

		const addAliasButtonAttrs: ButtonAttrs = {
			label: "addEmailAlias_label",
			click: () => this._showAddAliasDialog(a.userGroupInfo),
			icon: () => Icons.Add
		}

		const aliasesTableAttrs: TableAttrs = {
			columnHeadingTextIds: ["emailAlias_label", "state_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addAliasButtonAttrs,
			lines: this._getAliasLineAttrs(a.userGroupInfo),
		}

		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get('mailAddressAliases_label')),
				m(ExpanderButtonN, {label: "showEmailAliases_action", expanded: this._expanded})
			]),
			m(ExpanderPanelN, {expanded: this._expanded}, m(TableN, aliasesTableAttrs)),
			m(".small", (this._nbrOfAliases === 0) ?
				lang.get("adminMaxNbrOfAliasesReached_msg")
				: lang.get('mailAddressAliasesMaxNbr_label', {'{1}': this._nbrOfAliases}))
		]
	}

	_getAliasLineAttrs(groupInfo: GroupInfo): Array<TableLineAttrs> {
		return groupInfo.mailAddressAliases.map(alias => {
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
								this._switchStatus(alias, groupInfo)
							}
						},
						type: ButtonType.Dropdown,
						isSelected: () => alias.enabled
					},
					{
						label: isTutanotaMailAddress(alias.mailAddress) ? "deactivate_action" : "delete_action",
						click: () => {
							if (alias.enabled) {
								this._switchStatus(alias, groupInfo)
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

	_showAddAliasDialog(groupInfo: GroupInfo) {
		if (this._nbrOfAliases === 0) {
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
					showProgressDialog("pleaseWait_msg", worker.addMailAlias(groupInfo.group, alias))
						.catch(InvalidDataError, () => Dialog.error("mailAddressNA_msg"))
						.catch(LimitReachedError, () => Dialog.error("adminMaxNbrOfAliasesReached_msg"))
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
					okAction: addEmailAliasOkAction
				})
			})
		}
	}

	_getNbrOfAliases() {
		worker.getAliasCounters().then(mailAddressAliasServiceReturn => {
			const newNbr = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases) - Number(mailAddressAliasServiceReturn.usedAliases))
			if (this._nbrOfAliases !== newNbr) {
				this._nbrOfAliases = newNbr
				m.redraw()
			}
		})
	}

	_switchStatus(alias: MailAddressAlias, groupInfo: GroupInfo) {
		let restore = !alias.enabled
		let promise = Promise.resolve(true)
		if (!restore) {
			let message = isTutanotaMailAddress(alias.mailAddress) ? 'deactivateAlias_msg' : 'deleteAlias_msg'
			promise = Dialog.confirm(() => lang.get(message, {"{1}": alias.mailAddress}))
		}
		promise.then(confirmed => {
			if (confirmed) {
				let p = worker.setMailAliasStatus(groupInfo.group, alias.mailAddress, restore)
				              .catch(LimitReachedError, e => {
					              Dialog.error("adminMaxNbrOfAliasesReached_msg")
				              })
				showProgressDialog("pleaseWait_msg", p)
			}
		})
	}
}

export const EditAliasesFormN: Class<MComponent<EditAliasesFormAttrs>> = _EditAliasesForm

