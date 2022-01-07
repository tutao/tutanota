//@flow
import type {LoginController} from "../api/main/LoginController"
import {Dialog} from "../gui/base/Dialog"
import {generatedIdToTimestamp} from "../api/common/utils/EntityUtils"
import type {TranslationText} from "./LanguageViewModel"
import {lang} from "./LanguageViewModel"
import {getHttpOrigin} from "../api/common/Env"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	ConnectionError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {CancelledError} from "../api/common/error/CancelledError"
import type {ApprovalStatusEnum} from "../api/common/TutanotaConstants"
import {ApprovalStatus} from "../api/common/TutanotaConstants"
import type {ResetAction} from "../login/recover/RecoverLoginDialog"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {UserError} from "../api/main/UserError"
import {ofClass} from "@tutao/tutanota-utils"
import {showUserError} from "./ErrorHandlerImpl"
import type {SubscriptionParameters} from "../subscription/UpgradeSubscriptionWizard"
import {locator} from "../api/main/MainLocator"
import {CredentialAuthenticationError} from "../api/common/error/CredentialAuthenticationError"
import {client} from "./ClientDetector"

/**
 * Shows warnings if the invoices is not paid or the registration is not approved yet.
 * @param includeInvoiceNotPaidForAdmin If true, also shows a warning for an admin if the invoice is not paid (use at login), if false does not show this warning (use when sending an email).
 * @param defaultStatus This status is used if the actual status on the customer is "0"
 * @returns True if the user may still send emails, false otherwise.
 */
export function checkApprovalStatus(logins: LoginController, includeInvoiceNotPaidForAdmin: boolean, defaultStatus: ?ApprovalStatusEnum): Promise<boolean> {
	if (!logins.getUserController().isInternalUser()) { // external users are not authorized to load the customer
		return Promise.resolve(true)
	}
	return logins.getUserController().loadCustomer().then(customer => {
		let status = (customer.approvalStatus === ApprovalStatus.REGISTRATION_APPROVED
			&& defaultStatus) ? defaultStatus : customer.approvalStatus
		if ([
			ApprovalStatus.REGISTRATION_APPROVAL_NEEDED,
			ApprovalStatus.DELAYED,
			ApprovalStatus.REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED
		].indexOf(status) !== -1) {
			return Dialog.message("waitingForApproval_msg").then(() => false)
		} else if (status === ApprovalStatus.DELAYED_AND_INITIALLY_ACCESSED) {
			if ((new Date().getTime() - generatedIdToTimestamp(customer._id)) > (2 * 24 * 60 * 60 * 1000)) {
				return Dialog.message("requestApproval_msg").then(() => true)
			} else {
				return Dialog.message("waitingForApproval_msg").then(() => false)
			}
		} else if (status === ApprovalStatus.INVOICE_NOT_PAID) {
			if (logins.getUserController().isGlobalAdmin()) {
				if (includeInvoiceNotPaidForAdmin) {
					return Dialog.message(() => {
						return lang.get("invoiceNotPaid_msg", {"{1}": getHttpOrigin()})
					}).then(() => {
						// TODO: navigate to payment site in settings
						//m.route.set("/settings")
						//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
					}).then(() => true)
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
			let message = lang.get(customer.businessUse ? "businessUseUpgradeNeeded_msg" : "upgradeNeeded_msg")
			return Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message, lang.getInfoLink("premiumProBusiness_link"))
			             .then(confirmed => {
				             if (confirmed) {
					             import("../subscription/UpgradeSubscriptionWizard")
						             .then(m => m.showUpgradeWizard())
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
			return () => lang.get("couldNotUnlockCredentials_msg", {"{reason}": error.message})
		case ConnectionError:
		default:
			return "emptyString_msg"
	}
}

const CAMPAIGN_KEY = "campaign"


export async function showSignupDialog(hashParams: QueryParams) {
	const subscriptionParams = getSubscriptionParameters(hashParams)
	const campaign = getCampaignFromParams(hashParams) ?? getCampaignFromLocalStorage()
	const dialog = await showProgressDialog(
		'loading_msg',
		locator.worker.initialized.then(async () => {
			const {loadSignupWizard} = await import("../subscription/UpgradeSubscriptionWizard")
			return loadSignupWizard(subscriptionParams, campaign)
		})
	)
	dialog.show()
}

function getSubscriptionParameters(hashParams: QueryParams): ?SubscriptionParameters {
	if (typeof hashParams.subscription === "string"
		&& typeof hashParams.type === "string"
		&& typeof hashParams.interval === "string") {
		const {subscription, type, interval} = hashParams
		return {
			subscription,
			type,
			interval
		}
	} else {
		return null
	}
}

export function getCampaignFromParams(hashParams: QueryParams): ?string {
	if (typeof hashParams.token === "string") {
		// we store the campaing token inside local storage to be able to use that key later when upgrading a Free account to Premium.
		// This might happen if the user decide to not upgrade to premium during signup.
		const token = hashParams.token
		if (client.localStorage()) {
			localStorage.setItem(CAMPAIGN_KEY, token)
		}
		return token
	}
	return null
}

export function getCampaignFromLocalStorage(): ?string {
	if (client.localStorage()) {
		return localStorage.getItem(CAMPAIGN_KEY)
	}
	return null
}

export function deleteCampaign(): void {
	if (client.localStorage()) {
		localStorage.removeItem(CAMPAIGN_KEY)
	}
}

export async function showGiftCardDialog(urlHash: string) {
	const showWizardPromise =
		import("../subscription/giftcards/GiftCardUtils")
			.then(({getTokenFromUrl}) => getTokenFromUrl(urlHash))
			.then(async ([id, key]) => {
				return locator.giftCardFacade.getGiftCardInfo(id, key)
				              .then(giftCardInfo => import("../subscription/giftcards/RedeemGiftCardWizard")
					              .then((wizard) => wizard.loadRedeemGiftCardWizard(giftCardInfo, key)))
			})
	showProgressDialog("loading_msg", showWizardPromise)
		.then(dialog => dialog.show())
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