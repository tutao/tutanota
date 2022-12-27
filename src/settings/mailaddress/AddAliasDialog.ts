import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import stream from "mithril/stream"
import { Dialog } from "../../gui/base/Dialog.js"
import { TUTANOTA_MAIL_ADDRESS_DOMAINS } from "../../api/common/TutanotaConstants.js"
import m from "mithril"
import { SelectMailAddressForm } from "../SelectMailAddressForm.js"
import { ExpanderPanel } from "../../gui/base/Expander.js"
import { getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { InvalidDataError, LimitReachedError, PreconditionFailedError } from "../../api/common/error/RestError.js"
import { MailAddressTableModel } from "./MailAddressTableModel.js"
import { Autocomplete, TextField } from "../../gui/base/TextField.js"

const FAILURE_USER_DISABLED = "mailaddressaliasservice.group_disabled"

export function showAddAliasDialog(model: MailAddressTableModel) {
	model.getAvailableDomains().then((domains) => {
		let isVerificationBusy = false
		let mailAddress: string
		let formErrorId: TranslationKey | null = "mailAddressNeutral_msg"
		let formDomain = stream(getFirstOrThrow(domains))
		let senderName = model.defaultSenderName()

		const addEmailAliasOkAction = (dialog: Dialog) => {
			if (isVerificationBusy) return

			if (formErrorId) {
				Dialog.message(formErrorId)
				return
			}

			addAlias(model, mailAddress, senderName)
			// close the add alias dialog immediately
			dialog.close()
		}

		const isTutanotaDomain = formDomain.map((d) => TUTANOTA_MAIL_ADDRESS_DOMAINS.includes(d))

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
							onBusyStateChanged: (isBusy) => (isVerificationBusy = isBusy),
							onDomainChanged: (domain) => formDomain(domain),
						}),
						m(
							ExpanderPanel,
							{
								expanded: isTutanotaDomain(),
							},
							m(".pt-m", lang.get("permanentAliasWarning_msg")),
						),
						m(TextField, {
							label: "mailName_label",
							value: senderName,
							autocompleteAs: Autocomplete.username,
							oninput: (name) => (senderName = name),
						}),
					]
				},
			},
			allowOkWithReturn: true,
			okAction: addEmailAliasOkAction,
		})
	})
}

function addAlias(model: MailAddressTableModel, alias: string, senderName: string): Promise<void> {
	return showProgressDialog("pleaseWait_msg", model.addAlias(alias, senderName))
		.catch(ofClass(InvalidDataError, () => Dialog.message("mailAddressNA_msg")))
		.catch(ofClass(LimitReachedError, () => Dialog.message("adminMaxNbrOfAliasesReached_msg")))
		.catch(
			ofClass(PreconditionFailedError, (e) => {
				let errorMsg = e.toString()

				if (e.data === FAILURE_USER_DISABLED) {
					errorMsg = lang.get("addAliasUserDisabled_msg")
				}

				return Dialog.message(() => errorMsg)
			}),
		)
}
