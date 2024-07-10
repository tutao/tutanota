import type { LoginController } from "../api/main/LoginController"
import { Dialog } from "../gui/base/Dialog"
import { generatedIdToTimestamp } from "../api/common/utils/EntityUtils"
import type { TranslationText } from "./LanguageViewModel"
import { lang } from "./LanguageViewModel"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	ConnectionError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	TooManyRequestsError,
} from "../api/common/error/RestError"
import { CancelledError } from "../api/common/error/CancelledError"
import {
	ApprovalStatus,
	AvailablePlans,
	AvailablePlanType,
	getCustomerApprovalStatus,
	KdfType,
	NewBusinessPlans,
	NewPaidPlans,
	NewPersonalPlans,
	SubscriptionType,
} from "../api/common/TutanotaConstants"
import type { ResetAction } from "../login/recover/RecoverLoginDialog"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { UserError } from "../api/main/UserError"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { showUserError } from "./ErrorHandlerImpl"
import type { SubscriptionParameters } from "../subscription/UpgradeSubscriptionWizard"
import { locator } from "../api/main/CommonLocator"
import { CredentialAuthenticationError } from "../api/common/error/CredentialAuthenticationError"
import type { Params } from "mithril"
import { LoginState } from "../login/LoginViewModel.js"

/**
 * Shows warnings if the invoices are not paid or the registration is not approved yet.
 * @param logins The `LoginController` used to retrieve the current users customer information from.
 * @param includeInvoiceNotPaidForAdmin If true, also shows a warning for an admin if the invoice is not paid (use at login), if false does not show this warning (use when sending an email).
 * @param defaultStatus This status is used if the actual status on the customer is "0"
 * @returns True if the user may still send emails, false otherwise.
 */
export function checkApprovalStatus(logins: LoginController, includeInvoiceNotPaidForAdmin: boolean, defaultStatus?: ApprovalStatus): Promise<boolean> {
	if (!logins.getUserController().isInternalUser()) {
		// external users are not authorized to load the customer
		return Promise.resolve(true)
	}

	return logins
		.getUserController()
		.loadCustomer()
		.then((customer) => {
			const approvalStatus = getCustomerApprovalStatus(customer)
			const status = approvalStatus === ApprovalStatus.REGISTRATION_APPROVED && defaultStatus != null ? defaultStatus : approvalStatus
			if (
				status === ApprovalStatus.REGISTRATION_APPROVAL_NEEDED ||
				status === ApprovalStatus.DELAYED ||
				status === ApprovalStatus.REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED
			) {
				return Dialog.message("waitingForApproval_msg").then(() => false)
			} else if (status === ApprovalStatus.DELAYED_AND_INITIALLY_ACCESSED) {
				if (new Date().getTime() - generatedIdToTimestamp(customer._id) > 2 * 24 * 60 * 60 * 1000) {
					return Dialog.message("requestApproval_msg").then(() => true)
				} else {
					return Dialog.message("waitingForApproval_msg").then(() => false)
				}
			} else if (status === ApprovalStatus.INVOICE_NOT_PAID) {
				if (logins.getUserController().isGlobalAdmin()) {
					if (includeInvoiceNotPaidForAdmin) {
						return Dialog.message(() => {
							return lang.get("invoiceNotPaid_msg")
						})
							.then(() => {
								// TODO: navigate to payment site in settings
								//m.route.set("/settings")
								//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
							})
							.then(() => true)
					} else {
						return true
					}
				} else {
					const errorMessage = () => lang.get("invoiceNotPaidUser_msg") + " " + lang.get("contactAdmin_msg")

					return Dialog.message(errorMessage).then(() => false)
				}
			} else if (status === ApprovalStatus.SPAM_SENDER) {
				Dialog.message("loginAbuseDetected_msg") // do not logout to avoid that we try to reload with mail editor open

				return false
			} else if (status === ApprovalStatus.PAID_SUBSCRIPTION_NEEDED) {
				const message = lang.get("upgradeNeeded_msg")
				return Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message).then((confirmed) => {
					if (confirmed) {
						import("../subscription/UpgradeSubscriptionWizard").then((m) => m.showUpgradeWizard(logins))
					}

					return false
				})
			} else {
				return true
			}
		})
}

export function getLoginErrorMessage(error: Error, isExternalLogin: boolean): TranslationText {
	switch (error.constructor) {
		case BadRequestError:
		case NotAuthenticatedError:
		case AccessDeactivatedError:
			return "loginFailed_msg"

		case AccessBlockedError:
			return "loginFailedOften_msg"

		case AccessExpiredError:
			return isExternalLogin ? "expiredLink_msg" : "inactiveAccount_msg"

		case TooManyRequestsError:
			return "tooManyAttempts_msg"

		case CancelledError:
			return "emptyString_msg"

		case CredentialAuthenticationError:
			return () =>
				lang.get("couldNotUnlockCredentials_msg", {
					"{reason}": error.message,
				})

		case ConnectionError:
			return "connectionLostLong_msg"

		default:
			return "emptyString_msg"
	}
}

/**
 * Handle expected login errors
 * Any unexpected errors will be rethrown
 */
export function handleExpectedLoginError<E extends Error>(error: E, handler: (error: E) => void) {
	if (
		error instanceof BadRequestError ||
		error instanceof NotAuthenticatedError ||
		error instanceof AccessExpiredError ||
		error instanceof AccessBlockedError ||
		error instanceof AccessDeactivatedError ||
		error instanceof TooManyRequestsError ||
		error instanceof CancelledError ||
		error instanceof CredentialAuthenticationError ||
		error instanceof ConnectionError
	) {
		handler(error)
	} else {
		throw error
	}
}

export function getLoginErrorStateAndMessage(error: Error): { errorMessage: TranslationText; state: LoginState } {
	let errorMessage = getLoginErrorMessage(error, false)
	let state
	if (error instanceof BadRequestError || error instanceof NotAuthenticatedError) {
		state = LoginState.InvalidCredentials
	} else if (error instanceof AccessExpiredError) {
		state = LoginState.AccessExpired
	} else {
		state = LoginState.UnknownError
	}
	handleExpectedLoginError(error, noOp)
	return {
		errorMessage,
		state,
	}
}

export async function showSignupDialog(urlParams: Params) {
	const subscriptionParams = getSubscriptionParameters(urlParams)
	const registrationDataId = getRegistrationDataIdFromParams(urlParams)
	const referralCode = getReferralCodeFromParams(urlParams)
	const availablePlans = getAvailablePlansFromSubscriptionParameters(subscriptionParams)
	await showProgressDialog(
		"loading_msg",
		locator.worker.initialized.then(async () => {
			const { loadSignupWizard } = await import("../subscription/UpgradeSubscriptionWizard")
			await loadSignupWizard(subscriptionParams, registrationDataId, referralCode, availablePlans)
		}),
	).catch(
		ofClass(UserError, async (e) => {
			const m = await import("mithril")
			await showUserError(e)
			// redirects if there were invalid parameters, e.g. for referral codes and campaignIds
			m.route.set("/signup")
		}),
	)
}

function getAvailablePlansFromSubscriptionParameters(params: SubscriptionParameters | null): AvailablePlanType[] {
	// Default to all available plans if the params do not have the needed information
	if (params == null || params.type == null) return AvailablePlans

	try {
		const type = stringToSubscriptionType(params.type)
		switch (type) {
			case SubscriptionType.Business:
				return NewBusinessPlans
			case SubscriptionType.Personal:
				return NewPersonalPlans
			case SubscriptionType.PaidPersonal:
				return NewPaidPlans.filter((paidPlan) => NewPersonalPlans.includes(paidPlan))
		}
	} catch (e) {
		// If params.type is not a valid subscription type, return the default value
		return AvailablePlans
	}
}

export function stringToSubscriptionType(string: string): SubscriptionType {
	switch (string.toLowerCase()) {
		case "business":
			return SubscriptionType.Business
		case "private":
			return SubscriptionType.Personal
		case "privatepaid":
			return SubscriptionType.PaidPersonal
		default:
			throw new Error(`Failed to get subscription type: ${string}`)
	}
}

function getSubscriptionParameters(hashParams: Params): SubscriptionParameters | null {
	const { subscription, type, interval } = hashParams
	const isSubscriptionString = typeof subscription === "string"
	const isTypeString = typeof type === "string"
	const isIntervalString = typeof interval === "string"

	if (!isSubscriptionString && !isTypeString && !isIntervalString) return null

	return {
		subscription: isSubscriptionString ? subscription : null,
		type: isTypeString ? type : null,
		interval: isIntervalString ? interval : null,
	}
}

export function getReferralCodeFromParams(urlParams: Params): string | null {
	if (typeof urlParams.ref === "string") {
		return urlParams.ref
	}
	return null
}

export function getRegistrationDataIdFromParams(hashParams: Params): string | null {
	if (typeof hashParams.token === "string") {
		return hashParams.token
	}
	return null
}

async function loadRedeemGiftCardWizard(urlHash: string): Promise<Dialog> {
	const wizard = await import("../subscription/giftcards/RedeemGiftCardWizard")
	return wizard.loadRedeemGiftCardWizard(urlHash)
}

export async function showGiftCardDialog(urlHash: string) {
	showProgressDialog("loading_msg", loadRedeemGiftCardWizard(urlHash))
		.then((dialog) => dialog.show())
		.catch((e) => {
			if (e instanceof NotAuthorizedError || e instanceof NotFoundError) {
				throw new UserError("invalidGiftCard_msg")
			} else {
				throw e
			}
		})
		.catch(ofClass(UserError, showUserError))
}

export async function showRecoverDialog(mailAddress: string, resetAction: ResetAction) {
	const dialog = await import("../login/recover/RecoverLoginDialog")
	dialog.show(mailAddress, resetAction)
}

export type ExternalUserKeyDeriver = {
	kdfType: KdfType
	salt: Uint8Array
}
