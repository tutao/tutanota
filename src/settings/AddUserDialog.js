// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {AccountType, BookingItemFeatureType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {logins} from "../api/main/LoginController"
import {PasswordForm} from "./PasswordForm"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {load} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {addAll} from "../api/common/utils/ArrayUtils"
import {getCustomMailDomains, neverNull} from "../api/common/utils/Utils"
import {worker} from "../api/main/WorkerClient"
import {showProgressDialog, showWorkerProgressDialog} from "../gui/ProgressDialog"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {showBuyDialog} from "../subscription/BuyDialog"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "../gui/base/TextFieldN"


assertMainOrNode()

export function show(): Promise<void> {
	return getAvailableDomains().then(availableDomains => {
			let emailAddress
			let errorMsg
			let isVerificationBusy = false
			let userName = ""

			const passwordForm = new PasswordForm(false, false, false, null)

			const nameFieldAttrs = {
				label: "name_label",
				helpLabel: () => lang.get("loginNameInfoAdmin_msg"),
				value: stream(userName),
				oninput: (value) => userName = value.trim()
			}

			const mailAddressFormAttrs = {
				availableDomains,
				onEmailChanged: (email, verificationResult) => {
					if (verificationResult.isValid) {
						emailAddress = email
						errorMsg = null
					} else {
						errorMsg = verificationResult.errorId
					}
				},
				onBusyStateChanged: (isBusy) => {isVerificationBusy = isBusy}
			}

			let form = {
				view: () => {
					return [
						m(TextFieldN, nameFieldAttrs),
						m(SelectMailAddressForm, mailAddressFormAttrs),
						m(passwordForm)
					]
				}
			}

			let addUserOkAction = (dialog) => {
				if (isVerificationBusy) return

				const passwordFormError = passwordForm.getErrorMessageId()
				if (errorMsg) {
					Dialog.error(errorMsg)
					return
				} else if (passwordFormError) {
					Dialog.error(passwordFormError)
					return
				}

				showProgressDialog("pleaseWait_msg", showBuyDialog(BookingItemFeatureType.Users, 1, 0, false))
					.then(accepted => {
						if (accepted) {
							let p = worker.createUser(userName, emailAddress, passwordForm.getNewPassword(), 0, 1)
							showWorkerProgressDialog(worker, () => lang.get("createActionStatus_msg", {
								"{index}": 0,
								"{count}": 1
							}), p)
								.catch(PreconditionFailedError, e => Dialog.error("createUserFailed_msg"))
								.then(dialog.close())
						}
					})
			}

			Dialog.showActionDialog({
				title: lang.get("addUsers_action"),
				child: form,
				okAction: addUserOkAction
			})
		}
	)
}

export function getAvailableDomains(onlyCustomDomains: ?boolean): Promise<string[]> {
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
		return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
			let availableDomains = getCustomMailDomains(customerInfo).map(info => info.domain)
			if (!onlyCustomDomains && logins.getUserController().user.accountType !== AccountType.STARTER &&
				(availableDomains.length === 0 || logins.getUserController().isGlobalAdmin())) {
				addAll(availableDomains, TUTANOTA_MAIL_ADDRESS_DOMAINS)
			}
			return availableDomains
		})
	})
}
