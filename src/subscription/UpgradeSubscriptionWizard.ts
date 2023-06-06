import type { Hex } from "@tutao/tutanota-utils"
import { defer } from "@tutao/tutanota-utils"
import {
	AccountingInfo,
	AccountingInfoTypeRef,
	createUpgradePriceServiceData,
	Customer,
	CustomerInfo,
	UpgradePriceServiceReturn,
} from "../api/entities/sys/TypeRefs.js"
import type { InvoiceData, PaymentData } from "../api/common/TutanotaConstants"
import {
	AvailablePlans,
	AvailablePlanType,
	Const,
	getPaymentMethodType,
	NewPaidPlans,
	PaymentMethodType as PaymentMethod,
	PlanType,
} from "../api/common/TutanotaConstants"
import { getByAbbreviation } from "../api/common/CountryList"
import { UpgradeSubscriptionPage, UpgradeSubscriptionPageAttrs } from "./UpgradeSubscriptionPage"
import m from "mithril"
import stream from "mithril/stream"
import type { TranslationKey, TranslationText } from "../misc/LanguageViewModel"
import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs } from "./InvoiceAndPaymentDataPage"
import { UpgradeCongratulationsPage, UpgradeCongratulationsPageAttrs } from "./UpgradeCongratulationsPage.js"
import { SignupPage, SignupPageAttrs } from "./SignupPage"
import { assertMainOrNode } from "../api/common/Env"
import { locator } from "../api/main/MainLocator"
import { StorageBehavior } from "../misc/UsageTestModel"
import { UpgradePriceService } from "../api/entities/sys/Services.js"
import { FeatureListProvider, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { UpgradeType } from "./SubscriptionUtils"
import { UpgradeConfirmSubscriptionPage } from "./UpgradeConfirmSubscriptionPage.js"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"

assertMainOrNode()
export type SubscriptionParameters = {
	subscription: string
	type: string
	interval: string // typed as string because m.parseQueryString returns an object with strings
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
	price: string
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

export function loadUpgradePrices(registrationDataId: string | null): Promise<UpgradePriceServiceReturn> {
	const data = createUpgradePriceServiceData({
		date: Const.CURRENT_DATE,
		campaign: registrationDataId,
	})
	return locator.serviceExecutor.get(UpgradePriceService, data)
}

async function loadCustomerAndInfo(): Promise<{
	customer: Customer
	customerInfo: CustomerInfo
	accountingInfo: AccountingInfo
}> {
	const customer = await locator.logins.getUserController().loadCustomer()
	const customerInfo = await locator.logins.getUserController().loadCustomerInfo()
	const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
	return {
		customer,
		customerInfo,
		accountingInfo,
	}
}

export async function showUpgradeWizard(acceptedPlans: AvailablePlanType[] = NewPaidPlans, msg?: TranslationText): Promise<PlanType> {
	const { customer, accountingInfo } = await loadCustomerAndInfo()
	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)

	const prices = priceDataProvider.getRawPricingData()
	const featureListProvider = await FeatureListProvider.getInitializedInstance()
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
			paymentMethod: getPaymentMethodType(accountingInfo) || PaymentMethod.CreditCard,
			creditCardData: null,
		},
		price: "",
		type: PlanType.Revolutionary,
		priceNextYear: null,
		accountingInfo: accountingInfo,
		customer: customer,
		newAccountData: null,
		registrationDataId: null,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Initial,
		currentPlan: PlanType.Free,
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
	const deferred = defer<PlanType>()

	const wizardBuilder = createWizardDialog(upgradeData, wizardPages, async () => {
		const customerInfo = await locator.logins.getUserController().loadCustomerInfo()
		deferred.resolve(customerInfo.plan as PlanType)
	})
	wizardBuilder.dialog.show()
	return deferred.promise
}

export async function loadSignupWizard(
	subscriptionParameters: SubscriptionParameters | null,
	registrationDataId: string | null,
	referralCode: string | null,
): Promise<void> {
	const usageTestModel = locator.usageTestModel

	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral)
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(registrationDataId, locator.serviceExecutor, referralCode)
	const prices = priceDataProvider.getRawPricingData()
	const featureListProvider = await FeatureListProvider.getInitializedInstance()

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
			paymentMethod: PaymentMethod.CreditCard,
			creditCardData: null,
		},
		price: "",
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
		acceptedPlans: AvailablePlans,
		msg: null,
	}

	const invoiceAttrs = new InvoiceAndPaymentDataPageAttrs(signupData)
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(signupData)),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, invoiceAttrs),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, invoiceAttrs),
		wizardPageWrapper(UpgradeCongratulationsPage, new UpgradeCongratulationsPageAttrs(signupData)),
	]
	const wizardBuilder = createWizardDialog(signupData, wizardPages, async () => {
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
	})

	// for signup specifically, we only want the invoice and payment page as well as the confirmation page to show up if signing up for a paid account (and the user did not go back to the first page!)
	invoiceAttrs.setEnabledFunction(() => signupData.type !== PlanType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])

	wizardBuilder.dialog.show()
}
