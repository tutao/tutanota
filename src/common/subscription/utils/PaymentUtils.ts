import type { AccountingInfo } from "../../api/entities/sys/TypeRefs"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { type InvoiceData, PaymentMethodType } from "../../api/common/TutanotaConstants"
import { Country, CountryType } from "../../api/common/CountryList"
import { CCViewModel } from "../SimplifiedCreditCardInput"
import { PowSolution } from "../../api/common/pow-worker"
import { NewAccountData } from "../UpgradeSubscriptionWizard"
import { locator } from "../../api/main/CommonLocator"
import { runCaptchaFlow } from "../captcha/Captcha"
import { client } from "../../misc/ClientDetector"
import { SubscriptionApp } from "./SubscriptionUtils"
import { SessionType } from "../../api/common/SessionType"
import { credentialsToUnencrypted } from "../../misc/credentials/Credentials"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { InvalidDataError, PreconditionFailedError } from "../../api/common/error/RestError"
import { ofClass } from "@tutao/tutanota-utils"
import { Dialog } from "../../gui/base/Dialog"

function isOnAccountAllowed(country: Country, accountingInfo: AccountingInfo, isBusiness: boolean): boolean {
	if (!country) {
		return false
	} else if (accountingInfo.paymentMethod === PaymentMethodType.Invoice) {
		return true
	} else if (isBusiness && country.t !== CountryType.OTHER) {
		return true
	} else {
		return false
	}
}

export function validatePaymentData({
	paymentMethod,
	country,
	accountingInfo,
	isBusiness,
	ccViewModel,
}: {
	paymentMethod: PaymentMethodType
	country: Country
	accountingInfo: AccountingInfo
	isBusiness: boolean
	ccViewModel: CCViewModel
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
			name: lang.get("paymentMethodOnAccount_label"),
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
				await logins.createSession(mailAddress, password, SessionType.Temporary)
				await logins.getUserController().deleteSession(true)

				const sessionData = await logins.createSession(mailAddress, password, SessionType.Persistent)
				const unencryptedCredentials = credentialsToUnencrypted(sessionData.credentials, sessionData.databaseKey)
				try {
					await locator.credentialsProvider.store(unencryptedCredentials)
				} catch (e) {}
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
