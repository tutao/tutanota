//@flow
import {logins} from "../api/main/LoginController"
import {Dialog} from "../gui/base/Dialog"
import {generatedIdToTimestamp} from "../api/common/utils/Encoding"
import type {TranslationKey} from "./LanguageViewModel"
import {lang} from "./LanguageViewModel"
import {getHttpOrigin} from "../api/common/Env"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	ConnectionError,
	NotAuthenticatedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {CancelledError} from "../api/common/error/CancelledError"
import {client} from "./ClientDetector"
import {TutanotaError} from "../api/common/error/TutanotaError"

/**
 * Shows warnings if the invoices is not paid or the registration is not approved yet.
 * @param includeInvoiceNotPaidForAdmin If true, also shows a warning for an admin if the invoice is not paid (use at login), if false does not show this warning (use when sending an email).
 * @param defaultStatus This status is used if the actual status on the customer is "0"
 * @returns True if the user may still send emails, false otherwise.
 */
export function checkApprovalStatus(includeInvoiceNotPaidForAdmin: boolean, defaultStatus: ?string): Promise<boolean> {
	if (!logins.getUserController().isInternalUser()) { // external users are not authorized to load the customer
		return Promise.resolve(true)
	}
	return logins.getUserController().loadCustomer().then(customer => {
		let status = (customer.approvalStatus === "0" && defaultStatus) ? defaultStatus : customer.approvalStatus
		if (["1", "5", "7"].indexOf(status) !== -1) {
			return Dialog.error("waitingForApproval_msg").return(false)
		} else if (status === "6") {
			if ((new Date().getTime() - generatedIdToTimestamp(customer._id)) > (2 * 24 * 60 * 60 * 1000)) {
				return Dialog.error("requestApproval_msg").return(true)
			} else {
				return Dialog.error("waitingForApproval_msg").return(false)
			}
		} else if (status === "3") {
			if (logins.getUserController().isGlobalAdmin()) {
				if (includeInvoiceNotPaidForAdmin) {
					return Dialog.error(() => {
						return lang.get("invoiceNotPaid_msg", {"{1}": getHttpOrigin()})
					}).then(() => {
						// TODO: navigate to payment site in settings
						//m.route.set("/settings")
						//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
					}).return(true)
				} else {
					return true
				}
			} else {
				return Dialog.error("invoiceNotPaidUser_msg").return(false)
			}
		} else if (status === "4") {
			Dialog.error("loginAbuseDetected_msg") // do not logout to avoid that we try to reload with mail editor open
			return false
		} else {
			return true
		}
	})
}

// TODO Use in LoginViewController.handleSession
export function getLoginErrorMessage(error: TutanotaError): TranslationKey {

	console.log(error.constructor)
	switch (error.constructor) {
		case BadRequestError:
		case NotAuthenticatedError:
		case AccessDeactivatedError:
			return "loginFailed_msg"
		case AccessBlockedError:
			return "loginFailedOften_msg"
		case AccessExpiredError:
			return "inactiveAccount_msg"
		case TooManyRequestsError:
			return "tooManyAttempts_msg"
		case CancelledError:
			return "emptyString_msg"
		case ConnectionError:
			return client.isIE() ? "loginFailed_msg" : "emptyString_msg"
		default:
			return "emptyString_msg"
	}
}