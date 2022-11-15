import type {Hex} from "@tutao/tutanota-utils"
import {neverNull} from "@tutao/tutanota-utils"
import type {AccountingInfo, Customer, CustomerInfo, UpgradePriceServiceReturn} from "../api/entities/sys/TypeRefs.js"
import {AccountingInfoTypeRef, createUpgradePriceServiceData, CustomerInfoTypeRef, CustomerTypeRef} from "../api/entities/sys/TypeRefs.js"
import {logins} from "../api/main/LoginController"
import type {InvoiceData, PaymentData} from "../api/common/TutanotaConstants"
import {Const, getPaymentMethodType, PaymentMethodType as PaymentMethod} from "../api/common/TutanotaConstants"
import {getByAbbreviation} from "../api/common/CountryList"
import {UpgradeSubscriptionPage, UpgradeSubscriptionPageAttrs} from "./UpgradeSubscriptionPage"
import {formatNameAndAddress} from "../misc/Formatter"
import m from "mithril"
import stream from "mithril/stream"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {assertTranslation} from "../misc/LanguageViewModel"
import {createWizardDialog, wizardPageWrapper} from "../gui/base/WizardDialog.js"
import {Dialog} from "../gui/base/Dialog"
import {InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs} from "./InvoiceAndPaymentDataPage"
import {UpgradeConfirmPage, UpgradeConfirmPageAttrs} from "./UpgradeConfirmPage"
import {SignupPage, SignupPageAttrs} from "./SignupPage"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import {StorageBehavior} from "../misc/UsageTestModel"
import {UpgradePriceService} from "../api/entities/sys/Services.js"
import {getFeatureListProvider, SelectedSubscriptionOptions, FeatureListProvider, SubscriptionType} from "./FeatureListProvider"
import {UpgradeType} from "./SubscriptionUtils"
import {getPricesAndConfigProvider, PriceAndConfigProvider} from "./PriceUtils"

assertMainOrNode()
export type SubscriptionParameters = {
	subscription: string
	type: string
	interval: string // typed as string because m.parseQueryString returns an object with strings
}

/** Subscription type passed from the website */
export const SubscriptionTypeParameter = Object.freeze({
	FREE: "free",
	PREMIUM: "premium",
	TEAMS: "teams",
	PRO: "pro",
})
export type NewAccountData = {
	mailAddress: string
	recoverCode: Hex
	password: string
}
export type UpgradeSubscriptionData = {
	options: SelectedSubscriptionOptions
	invoiceData: InvoiceData
	paymentData: PaymentData
	type: SubscriptionType
	price: string
	priceNextYear: string | null
	accountingInfo: AccountingInfo | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	customer: Customer | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	newAccountData: NewAccountData | null
	registrationDataId: string | null
	campaignInfoTextId: TranslationKey | null
	upgradeType: UpgradeType
	planPrices: PriceAndConfigProvider
	currentSubscription: SubscriptionType | null
	subscriptionParameters: SubscriptionParameters | null
	featureListProvider: FeatureListProvider
}

export function loadUpgradePrices(registrationDataId: string | null): Promise<UpgradePriceServiceReturn> {
	const data = createUpgradePriceServiceData({
		date: Const.CURRENT_DATE,
		campaign: registrationDataId,
	})
	return locator.serviceExecutor.get(UpgradePriceService, data)
}

function loadCustomerAndInfo(): Promise<{
	customer: Customer
	customerInfo: CustomerInfo
	accountingInfo: AccountingInfo
}> {
	return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer =>
		locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo =>
			locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
				return {
					customer,
					customerInfo,
					accountingInfo,
				}
			}),
		),
	)
}

export async function showUpgradeWizard(): Promise<void> {
	const {customer, accountingInfo} = await loadCustomerAndInfo()
	const priceDataProvider = await getPricesAndConfigProvider(null)

	const prices = priceDataProvider.getRawPricingData()
	const featureListProvider = await getFeatureListProvider()
	const upgradeData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(prices.business),
			paymentInterval: stream(Number(accountingInfo.paymentInterval)),
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
		type: SubscriptionType.Premium,
		priceNextYear: null,
		accountingInfo: accountingInfo,
		customer: customer,
		newAccountData: null,
		registrationDataId: null,
		campaignInfoTextId: prices.messageTextId ? assertTranslation(prices.messageTextId) : null,
		upgradeType: UpgradeType.Initial,
		currentSubscription: SubscriptionType.Free,
		subscriptionParameters: null,
		planPrices: priceDataProvider,
		featureListProvider: featureListProvider
	}
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
		wizardPageWrapper(UpgradeConfirmPage, new UpgradeConfirmPageAttrs(upgradeData)),
	]
	const wizardBuilder = createWizardDialog(upgradeData, wizardPages)
	wizardBuilder.dialog.show()
}

export async function loadSignupWizard(subscriptionParameters: SubscriptionParameters | null, registrationDataId: string | null): Promise<void> {
	const usageTestModel = locator.usageTestModel

	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral)
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

	const priceDataProvider = await getPricesAndConfigProvider(registrationDataId)
	const prices = priceDataProvider.getRawPricingData()
	const featureListProvider = await getFeatureListProvider()
	const signupData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(prices.business),
			paymentInterval: stream(12),
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
		type: SubscriptionType.Free,
		accountingInfo: null,
		customer: null,
		newAccountData: null,
		registrationDataId,
		campaignInfoTextId: prices.messageTextId ? assertTranslation(prices.messageTextId) : null,
		upgradeType: UpgradeType.Signup,
		planPrices: priceDataProvider,
		currentSubscription: null,
		subscriptionParameters: subscriptionParameters,
		featureListProvider: featureListProvider
	}

	const invoiceAttrs = new InvoiceAndPaymentDataPageAttrs(signupData)
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(signupData)),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, invoiceAttrs),
		wizardPageWrapper(UpgradeConfirmPage, new UpgradeConfirmPageAttrs(signupData)),
	]
	const wizardBuilder = createWizardDialog(signupData, wizardPages, async () => {
		if (logins.isUserLoggedIn()) {
			await logins.logout(false)
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

	// for signup specifically, we only want the invoice and payment page to show up if signing up for a paid account (and the user did not go back to the first page!)
	invoiceAttrs.setEnabledFunction(() => signupData.type !== SubscriptionType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])

	wizardBuilder.dialog.show()
}