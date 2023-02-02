import { Hex, neverNull, ofClass } from "@tutao/tutanota-utils"
import type { AccountingInfo, Customer, CustomerInfo, UpgradePriceServiceReturn } from "../api/entities/sys/TypeRefs.js"
import {
	AccountingInfoTypeRef,
	createReferralCodeGetIn,
	createUpgradePriceServiceData,
	CustomerInfoTypeRef,
	CustomerTypeRef,
} from "../api/entities/sys/TypeRefs.js"
import { logins } from "../api/main/LoginController"
import type { InvoiceData, PaymentData } from "../api/common/TutanotaConstants"
import { Const, getPaymentMethodType, PaymentMethodType as PaymentMethod } from "../api/common/TutanotaConstants"
import { getByAbbreviation } from "../api/common/CountryList"
import { UpgradeSubscriptionPage, UpgradeSubscriptionPageAttrs } from "./UpgradeSubscriptionPage"
import { formatNameAndAddress } from "../misc/Formatter"
import m from "mithril"
import stream from "mithril/stream"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { assertTranslation } from "../misc/LanguageViewModel"
import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs } from "./InvoiceAndPaymentDataPage"
import { UpgradeCongratulationsPage, UpgradeCongratulationsPageAttrs } from "./UpgradeCongratulationsPage.js"
import { SignupPage, SignupPageAttrs } from "./SignupPage"
import { assertMainOrNode } from "../api/common/Env"
import { locator } from "../api/main/MainLocator"
import { StorageBehavior } from "../misc/UsageTestModel"
import { ReferralCodeService, UpgradePriceService } from "../api/entities/sys/Services.js"
import { FeatureListProvider, SelectedSubscriptionOptions, SubscriptionType } from "./FeatureListProvider"
import { UpgradeType } from "./SubscriptionUtils"
import { UpgradeConfirmSubscriptionPage } from "./UpgradeConfirmSubscriptionPage.js"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { UserError } from "../api/main/UserError.js"
import { PreconditionFailedError } from "../api/common/error/RestError.js"

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
	referralCode: string | null
	referralCodeMsg: TranslationKey | null
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
	return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then((customer) =>
		locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then((customerInfo) =>
			locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then((accountingInfo) => {
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
	const { customer, accountingInfo } = await loadCustomerAndInfo()
	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null)

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
		featureListProvider: featureListProvider,
		referralCode: null,
		referralCodeMsg: null,
	}
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
	]
	const wizardBuilder = createWizardDialog(upgradeData, wizardPages)
	wizardBuilder.dialog.show()
}

export async function loadSignupWizard(
	subscriptionParameters: SubscriptionParameters | null,
	registrationDataId: string | null,
	referralCode: string | null,
): Promise<void> {
	const usageTestModel = locator.usageTestModel

	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral)
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(registrationDataId)
	const prices = priceDataProvider.getRawPricingData()
	const featureListProvider = await FeatureListProvider.getInitializedInstance()
	let referralCodeMsg: TranslationKey | null = null
	if (referralCode != null) {
		await locator.serviceExecutor
			.get(ReferralCodeService, createReferralCodeGetIn({ referralCode }))
			.then(() => {
				referralCodeMsg = "referralSignup_msg"
			})
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					referralCode = null // set to null to make sure the invalid code is not used
					// display a message to the user about the invalid code
					referralCodeMsg = "referralSignupInvalid_msg"
				}),
			)
	}

	const campaignInfoTextId = prices.messageTextId ? assertTranslation(prices.messageTextId) : null

	if (referralCode != null && registrationDataId != null) {
		throw new UserError("referralSignupCampaignError_msg")
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
		campaignInfoTextId,
		upgradeType: UpgradeType.Signup,
		planPrices: priceDataProvider,
		currentSubscription: null,
		subscriptionParameters: subscriptionParameters,
		featureListProvider: featureListProvider,
		referralCode,
		referralCodeMsg,
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

	// for signup specifically, we only want the invoice and payment page as well as the confirmation page to show up if signing up for a paid account (and the user did not go back to the first page!)
	invoiceAttrs.setEnabledFunction(() => signupData.type !== SubscriptionType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])

	wizardBuilder.dialog.show()
}
