import { AccountingInfo, AccountingInfoTypeRef, Braintree3ds2Request, InvoiceInfoTypeRef } from "../../api/entities/sys/TypeRefs"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { getClientType, type InvoiceData, Keys, PaymentData, PaymentDataResultType, PaymentMethodType, PlanType } from "../../api/common/TutanotaConstants"
import { Country, CountryType } from "../../api/common/CountryList"
import { PowSolution } from "../../api/common/pow-worker"
import { NewAccountData, type UpgradeSubscriptionData } from "../UpgradeSubscriptionWizard"
import { locator } from "../../api/main/CommonLocator"
import { runCaptchaFlow } from "../captcha/Captcha"
import { client } from "../../misc/ClientDetector"
import { getPreconditionFailedPaymentMsg, PaymentErrorCode, SubscriptionApp } from "./SubscriptionUtils"
import { SessionType } from "../../api/common/SessionType"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { InvalidDataError, PreconditionFailedError } from "../../api/common/error/RestError"
import { assertNotNull, neverNull, newPromise, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import { SignupViewModel } from "../../signup/SignupView"
import { PaymentInterval } from "./PriceUtils"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import m from "mithril"
import { Button, ButtonType } from "../../gui/base/Button"
import { EntityEventsListener } from "../../api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils"

export function isOnAccountAllowed(country: Country | null, accountingInfo: AccountingInfo, isBusiness: boolean): boolean {
	if (!country) {
		return false
	} else if (accountingInfo.paymentMethod === PaymentMethodType.Invoice) {
		return true
	} else {
		return isBusiness && country.t !== CountryType.OTHER
	}
}

/**
 * Displays a progress dialog that allows to cancel the verification and opens a new window to do the actual verification with the bank.
 */
function verifyCreditCard(accountingInfo: AccountingInfo, braintree3ds: Braintree3ds2Request, price: string): Promise<boolean> {
	return locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo)).then((invoiceInfo) => {
		let invoiceInfoWrapper = {
			invoiceInfo,
		}
		let resolve: (arg0: boolean) => void
		let progressDialogPromise: Promise<boolean> = newPromise((res) => (resolve = res))
		let progressDialog: Dialog

		const closeAction = () => {
			// user did not complete the 3ds dialog and PaymentDataService.POST was not invoked
			progressDialog.close()
			setTimeout(() => resolve(false), DefaultAnimationTime)
		}

		progressDialog = new Dialog(DialogType.Alert, {
			view: () => [
				m(".dialog-contentButtonsBottom.text-break.selectable", lang.get("creditCardPendingVerification_msg")),
				m(
					".flex-center.dialog-buttons",
					m(Button, {
						label: "cancel_action",
						click: closeAction,
						type: ButtonType.Primary,
					}),
				),
			],
		})
			.setCloseHandler(closeAction)
			.addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: closeAction,
				help: "close_alt",
			})
			.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: closeAction,
				help: "close_alt",
			})
		let entityEventListener: EntityEventsListener = (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => {
			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
					return locator.entityClient.load(InvoiceInfoTypeRef, update.instanceId).then((invoiceInfo) => {
						invoiceInfoWrapper.invoiceInfo = invoiceInfo
						if (!invoiceInfo.paymentErrorInfo) {
							// user successfully verified the card
							progressDialog.close()
							resolve(true)
						} else if (invoiceInfo.paymentErrorInfo && invoiceInfo.paymentErrorInfo.errorCode === "card.3ds2_pending") {
							// keep waiting. this error code is set before starting the 3DS2 verification and we just received the event very late
						} else if (invoiceInfo.paymentErrorInfo && invoiceInfo.paymentErrorInfo.errorCode !== null) {
							// verification error during 3ds verification
							let error = "3dsFailedOther"

							switch (invoiceInfo.paymentErrorInfo.errorCode as PaymentErrorCode) {
								case "card.cvv_invalid":
									error = "cvvInvalid"
									break
								case "card.number_invalid":
									error = "ccNumberInvalid"
									break

								case "card.date_invalid":
									error = "expirationDate"
									break
								case "card.insufficient_funds":
									error = "insufficientFunds"
									break
								case "card.expired_card":
									error = "cardExpired"
									break
								case "card.3ds2_failed":
									error = "3dsFailed"
									break
							}

							Dialog.message(getPreconditionFailedPaymentMsg(invoiceInfo.paymentErrorInfo.errorCode))
							resolve(false)
							progressDialog.close()
						}

						m.redraw()
					})
				}
			}).then(noOp)
		}

		locator.eventController.addEntityListener(entityEventListener)
		const app = client.isCalendarApp() ? "calendar" : "mail"
		let params = `clientToken=${encodeURIComponent(braintree3ds.clientToken)}&nonce=${encodeURIComponent(braintree3ds.nonce)}&bin=${encodeURIComponent(
			braintree3ds.bin,
		)}&price=${encodeURIComponent(price)}&message=${encodeURIComponent(lang.get("creditCardVerification_msg"))}&clientType=${getClientType()}&app=${app}`
		Dialog.message("creditCardVerificationNeededPopup_msg").then(() => {
			const paymentUrlString = locator.domainConfigProvider().getCurrentDomainConfig().paymentUrl
			const paymentUrl = new URL(paymentUrlString)
			paymentUrl.hash += params
			window.open(paymentUrl)
			progressDialog.show()
		})
		return progressDialogPromise.finally(() => locator.eventController.removeEntityListener(entityEventListener))
	})
}

export async function updatePaymentData(
	paymentInterval: PaymentInterval,
	invoiceData: InvoiceData,
	paymentData: PaymentData | null,
	confirmedCountry: Country | null,
	isSignup: boolean,
	price: string | null,
	accountingInfo: AccountingInfo,
): Promise<boolean> {
	const paymentResult = await locator.customerFacade.updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry)
	const statusCode = paymentResult.result

	if (statusCode === PaymentDataResultType.OK) {
		// show dialog
		let braintree3ds = paymentResult.braintree3dsRequest
		if (braintree3ds) {
			return verifyCreditCard(accountingInfo, braintree3ds, price!)
		} else {
			return true
		}
	} else if (statusCode === PaymentDataResultType.COUNTRY_MISMATCH) {
		const countryName = invoiceData.country ? invoiceData.country.n : ""
		const confirmMessage = lang.getTranslation("confirmCountry_msg", {
			"{1}": countryName,
		})
		const confirmed = await Dialog.confirm(confirmMessage)
		if (confirmed) {
			return updatePaymentData(paymentInterval, invoiceData, paymentData, invoiceData.country, isSignup, price, accountingInfo) // add confirmed invoice country
		} else {
			return false
		}
	} else if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) {
		await Dialog.message(
			lang.makeTranslation("invalidVatIdNumber_msg", lang.get("invalidVatIdNumber_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) {
		await Dialog.message(
			lang.makeTranslation("creditCardDeclined_msg", lang.get("creditCardDeclined_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
		await Dialog.message("creditCardCVVInvalid_msg")
	} else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
		await Dialog.message(
			lang.makeTranslation(
				"paymentProviderNotAvailableError_msg",
				lang.get("paymentProviderNotAvailableError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
		await Dialog.message(
			lang.makeTranslation(
				"paymentAccountRejected_msg",
				lang.get("paymentAccountRejected_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) {
		await Dialog.message("creditCardExprationDateInvalid_msg")
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) {
		await Dialog.message(
			lang.makeTranslation(
				"creditCardNumberInvalid_msg",
				lang.get("creditCardNumberInvalid_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) {
		await Dialog.message(
			lang.makeTranslation(
				"invalidVatIdValidationFailed_msg",
				lang.get("invalidVatIdValidationFailed_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_VERIFICATION_LIMIT_REACHED) {
		await Dialog.message(
			lang.makeTranslation(
				"creditCardVerificationLimitReached_msg",
				lang.get("creditCardVerificationLimitReached_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else {
		await Dialog.message(
			lang.makeTranslation(
				"otherPaymentProviderError_msg",
				lang.get("otherPaymentProviderError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	}

	return false
}

export function validatePaymentData({
	paymentMethod,
	country,
	accountingInfo,
	isBusiness,
}: {
	paymentMethod: PaymentMethodType
	country: Country | null
	accountingInfo: AccountingInfo
	isBusiness: boolean
}): TranslationKey | null {
	if (!paymentMethod) {
		return "invoicePaymentMethodInfo_msg"
	} else if (paymentMethod === PaymentMethodType.Invoice) {
		if (!isOnAccountAllowed(country, accountingInfo, isBusiness)) {
			return "paymentMethodNotAvailable_msg"
		} else {
			return null
		}
	} else if (paymentMethod === PaymentMethodType.Paypal) {
		return accountingInfo.paypalBillingAgreement != null ? null : "paymentDataPayPalLogin_msg"
	} else {
		return null
	}
}

export function getVisiblePaymentMethods({
	isBusiness,
	isBankTransferAllowed,
	accountingInfo,
}: {
	isBusiness: boolean
	isBankTransferAllowed: boolean
	accountingInfo: AccountingInfo | null
}): Array<{
	name: string
	value: PaymentMethodType
}> {
	const availablePaymentMethods = [
		{
			name: lang.get("paymentMethodCreditCard_label"),
			value: PaymentMethodType.CreditCard,
		},
		{
			name: "PayPal",
			value: PaymentMethodType.Paypal,
		},
	]

	// show bank transfer in case of business use, even if it is not available for the selected country
	if ((isBusiness && isBankTransferAllowed) || accountingInfo?.paymentMethod === PaymentMethodType.Invoice) {
		availablePaymentMethods.push({
			name: lang.get("invoice_label"),
			value: PaymentMethodType.Invoice,
		})
	}

	// show account balance only if this is the current payment method
	if (accountingInfo?.paymentMethod === PaymentMethodType.AccountBalance) {
		availablePaymentMethods.push({
			name: lang.get("paymentMethodAccountBalance_label"),
			value: PaymentMethodType.AccountBalance,
		})
	}

	return availablePaymentMethods
}

export function validateInvoiceData({ address, isBusiness }: { address: string; isBusiness: boolean }): TranslationKey | null {
	if (isBusiness && (address.trim() === "" || address.split("\n").length > 5)) {
		return "invoiceAddressInfoBusiness_msg"
	} else if (address.split("\n").length > 4) {
		return "invoiceAddressInfoBusiness_msg"
	}
	// no error
	return null
}

export function getInvoiceData({
	address,
	country,
	isBusiness,
	vatNumber,
}: {
	address: string
	country: Country
	isBusiness: boolean
	vatNumber: string
}): InvoiceData {
	return {
		invoiceAddress: address,
		country: country,
		vatNumber: country?.t === CountryType.EU && isBusiness ? vatNumber : "",
	}
}

/**
 * @return Signs the user up, if no captcha is needed or it has been solved correctly
 */
export async function signup(
	mailAddress: string,
	password: string,
	registrationCode: string,
	isBusinessUse: boolean,
	isPaidSubscription: boolean,
	campaignToken: string | null,
	powChallengeSolution: Promise<PowSolution>,
): Promise<NewAccountData | void> {
	const { customerFacade, logins, identityKeyCreator } = locator

	const operation = locator.operationProgressTracker.startNewOperation()
	const signupActionPromise = customerFacade.generateSignupKeys(operation.id).then(async (keyPairs) => {
		const regDataId = await runCaptchaFlow({
			mailAddress,
			isBusinessUse,
			isPaidSubscription,
			campaignToken,
			powChallengeSolution,
		})
		if (regDataId) {
			const app = client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail
			const recoverCode = await customerFacade.signup(keyPairs, regDataId, mailAddress, password, registrationCode, lang.code, app)
			let userGroupId
			if (!logins.isUserLoggedIn()) {
				// we do not know the userGroupId at group creation time,
				// so we log in and create the identity key pair now

				// Create a throwaway temporary session
				// This will prevent postloginutils from showing the `shouldShowUpgrade` Dialog on the payment page
				const sessionData = await logins.createSession(mailAddress, password, SessionType.Temporary)

				userGroupId = sessionData.userGroupInfo.group
			} else {
				userGroupId = logins.getUserController().userGroupInfo.group
			}
			await identityKeyCreator.createIdentityKeyPair(
				userGroupId,
				{
					object: keyPairs[0], // user group key pair
					version: 0, //new group
				},
				[],
			)

			return {
				mailAddress,
				password,
				recoverCode,
			}
		}
	})
	return showProgressDialog("createAccountRunning_msg", signupActionPromise, operation.progress)
		.catch(
			ofClass(InvalidDataError, () => {
				Dialog.message("invalidRegistrationCode_msg")
			}),
		)
		.catch(
			ofClass(PreconditionFailedError, (e) => {
				Dialog.message("invalidSignup_msg")
			}),
		)
		.finally(() => operation.done())
}

export async function createAccount(data: UpgradeSubscriptionData | SignupViewModel, onFailure?: () => void) {
	if (data.customer) return
	data.emailInputStore = assertNotNull(data.emailInputStore)
	data.passwordInputStore = assertNotNull(data.passwordInputStore)
	data.powChallengeSolutionPromise = assertNotNull(data.powChallengeSolutionPromise)
	data.registrationCode = assertNotNull(data.registrationCode)
	const newAccountData = await signup(
		data.emailInputStore,
		data.passwordInputStore,
		data.registrationCode,
		data.options.businessUse(),
		data.targetPlanType !== PlanType.Free,
		data.registrationDataId,
		data.powChallengeSolutionPromise,
	)

	if (newAccountData == null) {
		if (onFailure) onFailure()
		return
	}

	data.newAccountData = newAccountData

	if (!data.customer || !data.accountingInfo) {
		const userController = locator.logins.getUserController()
		data.customer = await userController.loadCustomer()
		const customerInfo = await userController.loadCustomerInfo()
		data.accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
	}

	// If the user has selected a paid plan we want to prevent them from selecting a free plan at this point,
	// since the account will be PAID_SUBSCRIPTION_NEEDED state if the user selects free
	data.acceptedPlans = data.acceptedPlans.filter((plan) => plan !== PlanType.Free)
}
