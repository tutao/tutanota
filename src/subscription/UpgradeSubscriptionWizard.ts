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
import type {SubscriptionOptions, SubscriptionPlanPrices} from "./SubscriptionUtils"
import {SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import stream from "mithril/stream"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {assertTranslation} from "../misc/LanguageViewModel"
import {createWizardDialog, wizardPageWrapper} from "../gui/base/WizardDialogN"
import {Dialog} from "../gui/base/Dialog"
import {InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs} from "./InvoiceAndPaymentDataPage"
import {UpgradeConfirmPage, UpgradeConfirmPageAttrs} from "./UpgradeConfirmPage"
import {SignupPage, SignupPageAttrs} from "./SignupPage"
import {assertMainOrNode} from "../api/common/Env"
import {getCampaignFromLocalStorage} from "../misc/LoginUtils"
import {locator} from "../api/main/MainLocator"
import {TtlBehavior} from "../misc/UsageTestModel"
import {UpgradePriceService} from "../api/entities/sys/Services.js"

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
	options: SubscriptionOptions
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
	campaign: string | null
	campaignInfoTextId: TranslationKey | null
	upgradeType: UpgradeType
	planPrices: SubscriptionPlanPrices
	currentSubscription: SubscriptionType | null
	subscriptionParameters: SubscriptionParameters | null
}

export function loadUpgradePrices(campaign: string | null): Promise<UpgradePriceServiceReturn> {
	const data = createUpgradePriceServiceData({
		date: Const.CURRENT_DATE,
		campaign,
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

export function showUpgradeWizard(): void {
	loadCustomerAndInfo().then(({customer, accountingInfo}) => {
		const campaign = getCampaignFromLocalStorage()
		return loadUpgradePrices(campaign).then(prices => {
			const planPrices: SubscriptionPlanPrices = {
				Premium: prices.premiumPrices,
				PremiumBusiness: prices.premiumBusinessPrices,
				Teams: prices.teamsPrices,
				TeamsBusiness: prices.teamsBusinessPrices,
				Pro: prices.proPrices,
			}
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
				campaign,
				campaignInfoTextId: prices.messageTextId ? assertTranslation(prices.messageTextId) : null,
				upgradeType: UpgradeType.Initial,
				planPrices: planPrices,
				currentSubscription: SubscriptionType.Free,
				subscriptionParameters: null,
			}
			const wizardPages = [
				wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
				wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
				wizardPageWrapper(UpgradeConfirmPage, new UpgradeConfirmPageAttrs(upgradeData)),
			]
			const wizardBuilder = createWizardDialog(upgradeData, wizardPages)
			wizardBuilder.dialog.show()
		})
	})
}

export async function loadSignupWizard(subscriptionParameters: SubscriptionParameters | null, campaign: string | null): Promise<Dialog> {
	locator.usageTestController.addTests(await locator.usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly))

	const prices = await loadUpgradePrices(campaign)
	const planPrices: SubscriptionPlanPrices = {
		Premium: prices.premiumPrices,
		PremiumBusiness: prices.premiumBusinessPrices,
		Teams: prices.teamsPrices,
		TeamsBusiness: prices.teamsBusinessPrices,
		Pro: prices.proPrices,
	}
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
		campaign,
		campaignInfoTextId: prices.messageTextId ? assertTranslation(prices.messageTextId) : null,
		upgradeType: UpgradeType.Signup,
		planPrices: planPrices,
		currentSubscription: null,
		subscriptionParameters: subscriptionParameters,
	}
	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(signupData)),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(signupData)),
		wizardPageWrapper(UpgradeConfirmPage, new UpgradeConfirmPageAttrs(signupData)),
	]
	const wizardBuilder = createWizardDialog(signupData, wizardPages, async () => {
		if (logins.isUserLoggedIn()) {
			await logins.logout(false)
		}

		if (signupData.newAccountData) {
			m.route.set("/login", {
				loginWith: signupData.newAccountData.mailAddress,
			})
		} else {
			m.route.set("/login", {
				noAutoLogin: true,
			})
		}
	})
	return wizardBuilder.dialog
}