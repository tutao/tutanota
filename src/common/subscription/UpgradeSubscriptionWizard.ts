import type { Hex } from "@tutao/tutanota-utils"
import { defer } from "@tutao/tutanota-utils"
import { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs.js"
import {
	AvailablePlans,
	AvailablePlanType,
	getDefaultPaymentMethod,
	getPaymentMethodType,
	InvoiceData,
	NewPaidPlans,
	PaymentData,
	PlanType,
} from "../api/common/TutanotaConstants"
import { getByAbbreviation } from "../api/common/CountryList"
import { UpgradeSubscriptionPage, UpgradeSubscriptionPageAttrs } from "./UpgradeSubscriptionPage"
import m from "mithril"
import stream from "mithril/stream"
import { InfoLink, lang, TranslationKey, TranslationText } from "../misc/LanguageViewModel"
import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs } from "./InvoiceAndPaymentDataPage"
import { UpgradeCongratulationsPage, UpgradeCongratulationsPageAttrs } from "./UpgradeCongratulationsPage.js"
import { SignupPage, SignupPageAttrs } from "./SignupPage"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { locator } from "../api/main/CommonLocator"
import { StorageBehavior } from "../misc/UsageTestModel"
import { FeatureListProvider, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { queryAppStoreSubscriptionOwnership, UpgradeType } from "./SubscriptionUtils"
import { UpgradeConfirmSubscriptionPage } from "./UpgradeConfirmSubscriptionPage.js"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { LoginController } from "../api/main/LoginController.js"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership.js"
import { Dialog, DialogType } from "../gui/base/Dialog.js"

assertMainOrNode()
export type SubscriptionParameters = {
	subscription: string | null
	type: string | null
	interval: string | null // typed as string because m.parseQueryString returns an object with strings
}

export type NewAccountData = {
	mailAddress: string
	recoverCode: Hex
	password: string
}
export type UpgradeSubscriptionData = {
	options: SelectedSubscriptionOptions
	invoiceData: InvoiceData
	paymentData: PaymentData
	type: PlanType
	// Subscription price as a float
	price: string
	// Subscription price as a formatted string with the currency symbol and with decimal separator from local
	// On iOS: in the local currency
	// Else: in Euro
	displayPrice: string
	priceNextYear: string | null
	accountingInfo: AccountingInfo | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	customer: Customer | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	newAccountData: NewAccountData | null
	registrationDataId: string | null
	priceInfoTextId: TranslationKey | null
	upgradeType: UpgradeType
	planPrices: PriceAndConfigProvider
	currentPlan: PlanType | null
	subscriptionParameters: SubscriptionParameters | null
	featureListProvider: FeatureListProvider
	referralCode: string | null
	multipleUsersAllowed: boolean
	acceptedPlans: AvailablePlanType[]
	msg: TranslationText | null
}

export async function showUpgradeWizard(logins: LoginController, acceptedPlans: AvailablePlanType[] = NewPaidPlans, msg?: TranslationText): Promise<void> {
	const [customer, accountingInfo] = await Promise.all([logins.getUserController().loadCustomer(), logins.getUserController().loadAccountingInfo()])

	if (isIOSApp() && !(await locator.appStorePaymentPicker.shouldEnableAppStorePayment(getPaymentMethodType(accountingInfo)))) {
		Dialog.message("notAvailableInApp_msg")
		return
	}

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)

	const prices = priceDataProvider.getRawPricingData()
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
	const upgradeData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(prices.business),
			paymentInterval: stream(asPaymentInterval(accountingInfo.paymentInterval)),
		},
		invoiceData: {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo, // only for EU countries otherwise empty
		},
		paymentData: {
			paymentMethod: getPaymentMethodType(accountingInfo) || (await getDefaultPaymentMethod(locator.appStorePaymentPicker)),
			creditCardData: null,
		},
		price: "",
		displayPrice: "",
		type: PlanType.Revolutionary,
		priceNextYear: null,
		accountingInfo: accountingInfo,
		customer: customer,
		newAccountData: null,
		registrationDataId: null,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Initial,
		// Free used to be always selected here for current plan, but resulted in it displaying "free" as current plan for legacy users
		currentPlan: logins.getUserController().isFreeAccount() ? PlanType.Free : null,
		subscriptionParameters: null,
		planPrices: priceDataProvider,
		featureListProvider: featureListProvider,
		referralCode: null,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: msg != null ? msg : null,
	}

	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
	]
	if (isIOSApp()) {
		wizardPages.splice(1, 1) // do not show this page on AppStore payment since we are only able to show this single payment method on iOS
	}

	const deferred = defer<void>()
	const wizardBuilder = createWizardDialog(
		upgradeData,
		wizardPages,
		async () => {
			deferred.resolve()
		},
		DialogType.EditLarge,
	)
	wizardBuilder.dialog.show()
	return deferred.promise
}

export async function loadSignupWizard(
	subscriptionParameters: SubscriptionParameters | null,
	registrationDataId: string | null,
	referralCode: string | null,
	acceptedPlans: AvailablePlanType[] = AvailablePlans,
): Promise<void> {
	const usageTestModel = locator.usageTestModel

	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral)
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(registrationDataId, locator.serviceExecutor, referralCode)
	const prices = priceDataProvider.getRawPricingData()
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)

	let message: TranslationText | null
	if (isIOSApp()) {
		const appstoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null)
		const enableAppStoreSubscription = await locator.appStorePaymentPicker.shouldEnableAppStorePayment(null)
		// if we are on iOS app we only show other plans if AppStore payments are enabled and there's no subscription for this Apple ID.
		if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription || !enableAppStoreSubscription) {
			acceptedPlans = acceptedPlans.filter((plan) => plan === PlanType.Free)
		}
		message =
			appstoreSubscriptionOwnership != MobilePaymentSubscriptionOwnership.NoSubscription
				? () => lang.get("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment })
				: null
	} else {
		message = null
	}

	const signupData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(prices.business),
			paymentInterval: stream(PaymentInterval.Yearly),
		},
		invoiceData: {
			invoiceAddress: "",
			country: null,
			vatNumber: "", // only for EU countries otherwise empty
		},
		paymentData: {
			paymentMethod: await getDefaultPaymentMethod(locator.appStorePaymentPicker),
			creditCardData: null,
		},
		price: "",
		displayPrice: "",
		priceNextYear: null,
		type: PlanType.Free,
		accountingInfo: null,
		customer: null,
		newAccountData: null,
		registrationDataId,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Signup,
		planPrices: priceDataProvider,
		currentPlan: null,
		subscriptionParameters: subscriptionParameters,
		featureListProvider: featureListProvider,
		referralCode,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: message,
	}

	const invoiceAttrs = new InvoiceAndPaymentDataPageAttrs(signupData)

	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(signupData)),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, invoiceAttrs),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, invoiceAttrs),
		wizardPageWrapper(UpgradeCongratulationsPage, new UpgradeCongratulationsPageAttrs(signupData)),
	]

	if (isIOSApp()) {
		wizardPages.splice(2, 1) // do not show this page on AppStore payment since we are only able to show this single payment method on iOS
	}

	const wizardBuilder = createWizardDialog(
		signupData,
		wizardPages,
		async () => {
			if (locator.logins.isUserLoggedIn()) {
				await locator.logins.logout(false)
			}

			if (signupData.newAccountData) {
				m.route.set("/login", {
					noAutoLogin: true,
					loginWith: signupData.newAccountData.mailAddress,
				})
			} else {
				m.route.set("/login", {
					noAutoLogin: true,
				})
			}
		},
		DialogType.EditLarge,
	)

	// for signup specifically, we only want the invoice and payment page as well as the confirmation page to show up if signing up for a paid account (and the user did not go back to the first page!)
	invoiceAttrs.setEnabledFunction(() => signupData.type !== PlanType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])

	wizardBuilder.dialog.show()
}
