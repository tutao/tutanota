import m, {Children, Component, Vnode} from "mithril"
import {Dialog} from "../gui/base/Dialog"
import type {TableAttrs, TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {lang, TranslationKey} from "../misc/LanguageViewModel"
import {InvalidDataError, LimitReachedError, PreconditionFailedError} from "../api/common/error/RestError"
import {firstThrow, noOp, ofClass} from "@tutao/tutanota-utils"
import {SelectMailAddressForm, SelectMailAddressFormAttrs} from "./SelectMailAddressForm"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import * as EmailAliasOptionsDialog from "../subscription/EmailAliasOptionsDialog"
import {getAvailableDomains} from "./AddUserDialog"
import type {ButtonAttrs} from "../gui/base/Button.js"
import {ButtonType} from "../gui/base/Button.js"
import stream from "mithril/stream"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {attachDropdown} from "../gui/base/Dropdown.js"
import {TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import type {GroupInfo, MailAddressAlias} from "../api/entities/sys/TypeRefs.js"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import {isTutanotaMailAddress} from "../mail/model/MailUtils.js";

assertMainOrNode()
const FAILURE_USER_DISABLED = "mailaddressaliasservice.group_disabled"
export type EditAliasesFormAttrs = {
	userGroupInfo: GroupInfo
	aliasCount: AliasCount
}
type AliasCount = {
	availableToCreate: number
	availableToEnable: number
}

export class EditAliasesFormN implements Component<EditAliasesFormAttrs> {
	private expanded: boolean = false

	view(vnode: Vnode<EditAliasesFormAttrs>): Children {
		const a = vnode.attrs
		const addAliasButtonAttrs: ButtonAttrs = {
			label: "addEmailAlias_label",
			click: () => this._showAddAliasDialog(a),
			icon: () => Icons.Add,
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
				m(".h4", lang.get("mailAddressAliases_label")),
				m(ExpanderButtonN, {
					label: "showEmailAliases_action",
					expanded: this.expanded,
					onExpandedChange: (v) => this.expanded = v
				}),
			]),
			m(ExpanderPanelN, {
					expanded: this.expanded,
				},
				m(TableN, aliasesTableAttrs),
			),
			m(
				".small",
				a.aliasCount.availableToCreate === 0
					? lang.get("adminMaxNbrOfAliasesReached_msg")
					: lang.get("mailAddressAliasesMaxNbr_label", {
						"{1}": a.aliasCount.availableToCreate,
					}),
			),
		]
	}

	_showAddAliasDialog(aliasFormAttrs: EditAliasesFormAttrs) {
		if (aliasFormAttrs.aliasCount.availableToCreate === 0) {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog(true)
			} else {
				Dialog.confirm(() => lang.get("adminMaxNbrOfAliasesReached_msg") + " " + lang.get("orderAliasesConfirm_msg")).then(confirmed => {
					if (confirmed) {
						// Navigate to subscriptions folder and show alias options
						m.route.set("/settings/subscription")
						EmailAliasOptionsDialog.show()
					}
				})
			}
		} else {
			getAvailableDomains().then(domains => {
				let isVerificationBusy = false
				let mailAddress: string
				let formErrorId: TranslationKey | null = null
				let formDomain = stream(firstThrow(domains))

				const addEmailAliasOkAction = (dialog: Dialog) => {
					if (isVerificationBusy) return

					if (formErrorId) {
						Dialog.message(formErrorId)
						return
					}

					addAlias(aliasFormAttrs, mailAddress)
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
									onEmailChanged: (email, validationResult) => {
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
								m(ExpanderPanelN, {
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
	}
}

export function getAliasLineAttrs(editAliasAttrs: EditAliasesFormAttrs): Array<TableLineAttrs> {
	return editAliasAttrs.userGroupInfo.mailAddressAliases
						 .slice()
						 .sort((a, b) => (a.mailAddress > b.mailAddress ? 1 : -1))
						 .map(alias => {
							 const actionButtonAttrs: ButtonAttrs = attachDropdown(
								 {
                                     mainButtonAttrs: {
                                         label: "edit_action",
                                         icon: () => Icons.Edit,
                                         click: noOp,
                                     }, childAttrs: () => [
                                         {
                                             label: "activate_action",
                                             click: () => {
                                                 if (!alias.enabled) {
                                                     switchAliasStatus(alias, editAliasAttrs)
                                                 }
                                             },
                                             type: ButtonType.Dropdown,
                                             isSelected: () => alias.enabled,
                                         },
                                         {
                                             label: isTutanotaMailAddress(alias.mailAddress) ? "deactivate_action" : "delete_action",
                                             click: () => {
                                                 if (alias.enabled) {
                                                     switchAliasStatus(alias, editAliasAttrs)
                                                 }
                                             },
                                             type: ButtonType.Dropdown,
                                             isSelected: () => !alias.enabled,
                                         },
                                     ], showDropdown: () => true, width: 250
                                 },
							 )
							 return {
								 cells: [alias.mailAddress, alias.enabled ? lang.get("activated_label") : lang.get("deactivated_label")],
								 actionButtonAttrs: actionButtonAttrs,
							 }
						 })
}

function switchAliasStatus(alias: MailAddressAlias, editAliasAttrs: EditAliasesFormAttrs) {
	let restore = !alias.enabled
	let promise = Promise.resolve(true)

	if (!restore) {
		const message: TranslationKey = isTutanotaMailAddress(alias.mailAddress) ? "deactivateAlias_msg" : "deleteAlias_msg"
		promise = Dialog.confirm(() =>
			lang.get(message, {
				"{1}": alias.mailAddress,
			}),
		)
	}

	promise.then(confirmed => {
		if (confirmed) {
			let p = locator.mailAddressFacade
						   .setMailAliasStatus(editAliasAttrs.userGroupInfo.group, alias.mailAddress, restore)
						   .catch(
							   ofClass(LimitReachedError, e => {
								   Dialog.message("adminMaxNbrOfAliasesReached_msg")
							   }),
						   )
						   .finally(() => updateNbrOfAliases(editAliasAttrs))
			showProgressDialog("pleaseWait_msg", p)
		}
	})
}

export function addAlias(aliasFormAttrs: EditAliasesFormAttrs, alias: string): Promise<void> {
	return showProgressDialog("pleaseWait_msg", locator.mailAddressFacade.addMailAlias(aliasFormAttrs.userGroupInfo.group, alias))
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
		.finally(() => updateNbrOfAliases(aliasFormAttrs))
}

export function updateNbrOfAliases(attrs: EditAliasesFormAttrs): Promise<AliasCount> {
	return locator.mailAddressFacade.getAliasCounters().then(mailAddressAliasServiceReturn => {
		const newNbr = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases) - Number(mailAddressAliasServiceReturn.usedAliases))
		const newNbrToEnable = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases) - Number(mailAddressAliasServiceReturn.enabledAliases))
		attrs.aliasCount = {
			availableToCreate: newNbr,
			availableToEnable: newNbrToEnable,
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
			availableToCreate: 0,
		},
	}
}