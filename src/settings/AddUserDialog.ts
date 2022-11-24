import m from "mithril"
import {lang, TranslationText} from "../misc/LanguageViewModel"
import {BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {logins} from "../api/main/LoginController"
import {PasswordForm, PasswordModel} from "./PasswordForm"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {assertNotNull, ofClass} from "@tutao/tutanota-utils"
import {showProgressDialog, showWorkerProgressDialog} from "../gui/dialogs/ProgressDialog"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {showBuyDialog} from "../subscription/BuyDialog"
import {TextField} from "../gui/base/TextField.js"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import {getAvailableDomains} from "./mailaddress/MailAddressesUtils.js"

assertMainOrNode()

export function show(): Promise<void> {
	return getAvailableDomains(locator.entityClient, logins).then(availableDomains => {
		let emailAddress: string | null = null
		let errorMsg: TranslationText | null = "mailAddressNeutral_msg"
		let isVerificationBusy = false
		let userName = ""
		const passwordModel = new PasswordModel(logins, {checkOldPassword: false, enforceStrength: false, repeatInput: false})
		let form = {
			view: () => {
				return [
					m(TextField, {
						label: "name_label",
						helpLabel: () => lang.get("loginNameInfoAdmin_msg"),
						value: userName,
						oninput: (value) => userName = value,
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
						onBusyStateChanged: isBusy => {
							isVerificationBusy = isBusy
						},
					}),
					m(PasswordForm, {model: passwordModel})
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

			showProgressDialog("pleaseWait_msg", showBuyDialog({
				featureType: BookingItemFeatureType.Users,
				count: 1,
				freeAmount: 0,
				reactivate: false
			})).then(accepted => {
				if (accepted) {
					let p = locator.userManagementFacade.createUser(userName.trim(), assertNotNull(emailAddress), passwordModel.getNewPassword(), 0, 1)
					showWorkerProgressDialog(
						locator.worker,
						() =>
							lang.get("createActionStatus_msg", {
								"{index}": 0,
								"{count}": 1,
							}),
						p,
					)
						.catch(ofClass(PreconditionFailedError, e => Dialog.message("createUserFailed_msg")))
						.then(() => dialog.close())
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