import m from "mithril"
import { lang, TranslationText } from "../misc/LanguageViewModel"
import { BookingItemFeatureType } from "../api/common/TutanotaConstants"
import { Dialog } from "../gui/base/Dialog"
import { PasswordForm, PasswordModel } from "./PasswordForm"
import { SelectMailAddressForm } from "./SelectMailAddressForm"
import { assertNotNull, ofClass } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { PreconditionFailedError } from "../api/common/error/RestError"
import { showBuyDialog } from "../subscription/BuyDialog"
import { TextField } from "../gui/base/TextField.js"
import { locator } from "../api/main/MainLocator"
import { assertMainOrNode } from "../api/common/Env"
import { getAvailableDomains } from "./mailaddress/MailAddressesUtils.js"

assertMainOrNode()

export function show(): Promise<void> {
	return getAvailableDomains(locator.entityClient, locator.logins).then((availableDomains) => {
		let emailAddress: string | null = null
		let errorMsg: TranslationText | null = "mailAddressNeutral_msg"
		let isVerificationBusy = false
		let userName = ""
		const passwordModel = new PasswordModel(locator.logins, { checkOldPassword: false, enforceStrength: false, hideConfirmation: true })
		let form = {
			view: () => {
				return [
					m(TextField, {
						label: "name_label",
						helpLabel: () => lang.get("loginNameInfoAdmin_msg"),
						value: userName,
						oninput: (value) => (userName = value),
					}),
					m(SelectMailAddressForm, {
						availableDomains,
						onValidationResult: (email, verificationResult) => {
							if (verificationResult.isValid) {
								emailAddress = email
								errorMsg = null
							} else {
								errorMsg = verificationResult.errorId
							}
						},
						onBusyStateChanged: (isBusy) => {
							isVerificationBusy = isBusy
						},
					}),
					m(PasswordForm, { model: passwordModel }),
				]
			},
		}

		let addUserOkAction = (dialog: Dialog) => {
			if (isVerificationBusy) return
			const passwordFormError = passwordModel.getErrorMessageId()

			if (errorMsg) {
				Dialog.message(errorMsg)
				return
			} else if (passwordFormError) {
				Dialog.message(passwordFormError)
				return
			}

			showProgressDialog(
				"pleaseWait_msg",
				showBuyDialog({
					featureType: BookingItemFeatureType.Users,
					count: 1,
					freeAmount: 0,
					reactivate: false,
				}),
			).then((accepted) => {
				if (accepted) {
					const operation = locator.operationProgressTracker.startNewOperation()
					const p = locator.userManagementFacade.createUser(
						userName.trim(),
						assertNotNull(emailAddress),
						passwordModel.getNewPassword(),
						0,
						1,
						operation.id,
					)
					showProgressDialog(
						() =>
							lang.get("createActionStatus_msg", {
								"{index}": 0,
								"{count}": 1,
							}),
						p,
						operation.progress,
					)
						.catch(ofClass(PreconditionFailedError, (e) => Dialog.message("createUserFailed_msg")))
						.then(() => dialog.close())
						.finally(() => operation.done())
				}
			})
		}

		Dialog.showActionDialog({
			title: lang.get("addUsers_action"),
			child: form,
			okAction: addUserOkAction,
		})
	})
}
