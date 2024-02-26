import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { NewPaidPlans, TUTANOTA_MAIL_ADDRESS_DOMAINS } from "../../api/common/TutanotaConstants.js"
import m from "mithril"
import { SelectMailAddressForm } from "../SelectMailAddressForm.js"
import { ExpanderPanel } from "../../gui/base/Expander.js"
import { getFirstOrThrow } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { InvalidDataError, PreconditionFailedError } from "../../api/common/error/RestError.js"
import { MailAddressTableModel } from "./MailAddressTableModel.js"
import { Autocomplete, TextField } from "../../gui/base/TextField.js"
import { UpgradeRequiredError } from "../../api/main/UpgradeRequiredError.js"
import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"

const FAILURE_USER_DISABLED = "mailaddressaliasservice.group_disabled"

export function showAddAliasDialog(model: MailAddressTableModel, isNewPaidPlan: boolean) {
	model.getAvailableDomains().then((domains) => {
		let isVerificationBusy = false
		let mailAddress: string
		let formErrorId: TranslationKey | null = "mailAddressNeutral_msg"
		let formDomain = getFirstOrThrow(domains)
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

		Dialog.showActionDialog({
			title: lang.get("addEmailAlias_label"),
			child: {
				view: () => {
					return [
						m(SelectMailAddressForm, {
							selectedDomain: formDomain,
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
							onDomainChanged: (domain) => {
								if (!domain.isPaid || isNewPaidPlan) {
									formDomain = domain
								} else {
									Dialog.confirm(() => `${lang.get("paidEmailDomainLegacy_msg")}\n${lang.get("changePaidPlan_msg")}`).then(
										async (confirmed) => {
											if (confirmed) {
												isNewPaidPlan = await showPlanUpgradeRequiredDialog(NewPaidPlans)
											}
										},
									)
								}
							},
						}),
						m(
							ExpanderPanel,
							{
								expanded: TUTANOTA_MAIL_ADDRESS_DOMAINS.includes(formDomain.domain),
							},
							m(".pt", lang.get("permanentAliasWarning_msg")),
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

async function addAlias(model: MailAddressTableModel, alias: string, senderName: string): Promise<void> {
	try {
		await showProgressDialog("pleaseWait_msg", model.addAlias(alias, senderName))
	} catch (error) {
		if (error instanceof InvalidDataError) {
			Dialog.message("mailAddressNA_msg")
		} else if (error instanceof PreconditionFailedError) {
			let errorMsg = error.toString()

			if (error.data === FAILURE_USER_DISABLED) {
				errorMsg = lang.get("addAliasUserDisabled_msg")
			}

			return Dialog.message(() => errorMsg)
		} else if (error instanceof UpgradeRequiredError) {
			showPlanUpgradeRequiredDialog(error.plans, error.message)
		} else {
			throw error
		}
	}
}
