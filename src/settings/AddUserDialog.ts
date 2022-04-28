import m from "mithril"
import {lang, TranslationText} from "../misc/LanguageViewModel"
import {AccountType, BookingItemFeatureType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {logins} from "../api/main/LoginController"
import {PasswordForm} from "./PasswordForm"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {CustomerTypeRef} from "../api/entities/sys/TypeRefs.js"
import {CustomerInfoTypeRef} from "../api/entities/sys/TypeRefs.js"
import {addAll, assertNotNull, neverNull, ofClass} from "@tutao/tutanota-utils"
import {getCustomMailDomains} from "../api/common/utils/Utils"
import {showProgressDialog, showWorkerProgressDialog} from "../gui/dialogs/ProgressDialog"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {showBuyDialog} from "../subscription/BuyDialog"
import stream from "mithril/stream"
import {TextFieldAttrs, TextFieldN} from "../gui/base/TextFieldN"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

export function show(): Promise<void> {
	return getAvailableDomains().then(availableDomains => {
		let emailAddress: string | null = null
		let errorMsg: TranslationText | null = null
		let isVerificationBusy = false
		let userName = ""
		const passwordForm = new PasswordForm(false, false, false)
		const nameFieldAttrs: TextFieldAttrs = {
			label: "name_label",
			helpLabel: () => lang.get("loginNameInfoAdmin_msg"),
			value: userName,
			oninput: (value) => userName = value.trim(),
		}
		let form = {
			view: () => {
				return [
					m(TextFieldN, nameFieldAttrs),
					m(SelectMailAddressForm, {
						availableDomains,
						onEmailChanged: (email, verificationResult) => {
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
					m(passwordForm)
				]
			},
		}

		let addUserOkAction = (dialog: Dialog) => {
			if (isVerificationBusy) return
			const passwordFormError = passwordForm.getErrorMessageId()

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
					let p = locator.userManagementFacade.createUser(userName, assertNotNull(emailAddress), passwordForm.getNewPassword(), 0, 1)
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

export function getAvailableDomains(onlyCustomDomains?: boolean): Promise<string[]> {
	return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
		return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
			let availableDomains = getCustomMailDomains(customerInfo).map(info => info.domain)

			if (
				!onlyCustomDomains &&
				logins.getUserController().user.accountType !== AccountType.STARTER &&
				(availableDomains.length === 0 || logins.getUserController().isGlobalAdmin())
			) {
				addAll(availableDomains, TUTANOTA_MAIL_ADDRESS_DOMAINS)
			}

			return availableDomains
		})
	})
}