// @flow
import {neverNull} from "@tutao/tutanota-utils"
import type {Customer} from "../api/entities/sys/Customer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {load, serviceRequest} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import type {InvoiceData, PaymentData} from "../api/common/TutanotaConstants"
import {Const, getPaymentMethodType, PaymentMethodType as PaymentMethod} from "../api/common/TutanotaConstants"
import {getByAbbreviation} from "../api/common/CountryList"
import {UpgradeSubscriptionPage, UpgradeSubscriptionPageAttrs} from "./UpgradeSubscriptionPage"
import {formatNameAndAddress} from "../misc/Formatter"
import {client} from "../misc/ClientDetector"
import m from "mithril"
import type {SubscriptionOptions, SubscriptionPlanPrices, SubscriptionTypeEnum, UpgradeTypeEnum} from "./SubscriptionUtils"
import {SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import stream from "mithril/stream/stream.js"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createUpgradePriceServiceData} from "../api/entities/sys/UpgradePriceServiceData"
import {SysService} from "../api/entities/sys/Services"
import type {UpgradePriceServiceReturn} from "../api/entities/sys/UpgradePriceServiceReturn"
import {UpgradePriceServiceReturnTypeRef} from "../api/entities/sys/UpgradePriceServiceReturn"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {assertTranslation} from "../misc/LanguageViewModel"
import {createWizardDialog, WizardPageWrapper} from "../gui/base/WizardDialogN"
import {Dialog} from "../gui/base/Dialog"
import {InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs} from "./InvoiceAndPaymentDataPage"
import {UpgradeConfirmPage, UpgradeConfirmPageAttrs} from "./UpgradeConfirmPage"
import {SignupPage, SignupPageAttrs} from "./SignupPage"
import {assertMainOrNode} from "../api/common/Env"
import type {Hex} from "@tutao/tutanota-utils/"

assertMainOrNode()

const CAMPAIGN_KEY = "campaign"

export type SubscriptionParameters = {
	subscription: string,
	type: string,
	interval: string, // typed as string because m.parseQueryString returns an object with strings
}

/** Subscription type passed from the website */
export const SubscriptionTypeParameter = Object.freeze({
	FREE: "free",
	PREMIUM: "premium",
	TEAMS: "teams",
	PRO: "pro",
}
)
export type NewAccountData = {
	mailAddress: string,
	recoverCode: Hex,
	password: string,
}

export type UpgradeSubscriptionData = {
	options: SubscriptionOptions,
	invoiceData: InvoiceData,
	paymentData: PaymentData,
	type: SubscriptionTypeEnum,
	price: string,
	priceNextYear: ?string,
	accountingInfo: ?AccountingInfo, // not initially set for signup but loaded in InvoiceAndPaymentDataPage
	customer: ?Customer, // not initially set for signup but loaded in InvoiceAndPaymentDataPage
	newAccountData: ?NewAccountData,
	campaign: ?string,
	campaignInfoTextId: ?TranslationKey,
	upgradeType: UpgradeTypeEnum,
	planPrices: SubscriptionPlanPrices,
	currentSubscription: ?SubscriptionTypeEnum,
	subscriptionParameters: ?SubscriptionParameters
}

const TOKEN_PARAM_NAME = "#token="

function getCampaign(): ?string {
	const hashString = location.hash
	if (hashString.startsWith(TOKEN_PARAM_NAME)) {
		const tokenFromUrl = hashString.substring(TOKEN_PARAM_NAME.length)
		if (client.localStorage()) {
			localStorage.setItem(CAMPAIGN_KEY, tokenFromUrl)
		}
		return tokenFromUrl
	} else if (client.localStorage()) {
		return localStorage.getItem(CAMPAIGN_KEY)
	} else {
		return null
	}
}

export function deleteCampaign(): void {
	if (client.localStorage()) {
		localStorage.removeItem(CAMPAIGN_KEY)
	}
}

export function loadUpgradePrices(): Promise<UpgradePriceServiceReturn> {
	let data = createUpgradePriceServiceData()
	data.date = Const.CURRENT_DATE
	data.campaign = getCampaign()
	return serviceRequest(SysService.UpgradePriceService, HttpMethod.GET, data, UpgradePriceServiceReturnTypeRef)
}

function loadCustomerAndInfo(): Promise<{customer: Customer, customerInfo: CustomerInfo, accountingInfo: AccountingInfo}> {
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then((customer) => load(CustomerInfoTypeRef, customer.customerInfo)
			.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo)
				.then(accountingInfo => {
					return {customer, customerInfo, accountingInfo}
				})))
}

export function showUpgradeWizard(): void {
	loadCustomerAndInfo()
		.then(({customer, accountingInfo}) => {
				return loadUpgradePrices().then(prices => {
					const planPrices: SubscriptionPlanPrices = {
						Premium: prices.premiumPrices,
						PremiumBusiness: prices.premiumBusinessPrices,
						Teams: prices.teamsPrices,
						TeamsBusiness: prices.teamsBusinessPrices,
						Pro: prices.proPrices
					}
					const upgradeData: UpgradeSubscriptionData = {
						options: {
							businessUse: stream(prices.business),
							paymentInterval: stream(Number(accountingInfo.paymentInterval)),
						},
						invoiceData: {
							invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
							country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
							vatNumber: accountingInfo.invoiceVatIdNo // only for EU countries otherwise empty
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
						campaign: getCampaign(),
						campaignInfoTextId: prices.messageTextId ? assertTranslation(prices.messageTextId) : null,
						upgradeType: UpgradeType.Initial,
						planPrices: planPrices,
						currentSubscription: SubscriptionType.Free,
						subscriptionParameters: null
					}
					const wizardPages = [
						new WizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
						new WizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
						new WizardPageWrapper(UpgradeConfirmPage, new UpgradeConfirmPageAttrs(upgradeData)),
					]
					const wizardBuilder = createWizardDialog(upgradeData, wizardPages)
					wizardBuilder.dialog.show()
				})
			}
		)
}

export function loadSignupWizard(subscriptionParameters: ?SubscriptionParameters): Promise<Dialog> {
	return loadUpgradePrices().then(prices => {
		const planPrices: SubscriptionPlanPrices = {
			Premium: prices.premiumPrices,
			PremiumBusiness: prices.premiumBusinessPrices,
			Teams: prices.teamsPrices,
			TeamsBusiness: prices.teamsBusinessPrices,
			Pro: prices.proPrices
		}
		const signupData: UpgradeSubscriptionData = {
			options: {
				businessUse: stream(prices.business),
				paymentInterval: stream(12),
			},
			invoiceData: {
				invoiceAddress: "",
				country: null,
				vatNumber: "" // only for EU countries otherwise empty
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
			campaign: getCampaign(),
			campaignInfoTextId: prices.messageTextId ? assertTranslation(prices.messageTextId) : null,
			upgradeType: UpgradeType.Signup,
			planPrices: planPrices,
			currentSubscription: null,
			subscriptionParameters: subscriptionParameters
		}
		const wizardPages = [
			new WizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(signupData)),
			new WizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
			new WizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(signupData)),
			new WizardPageWrapper(UpgradeConfirmPage, new UpgradeConfirmPageAttrs(signupData)),
		]

		const wizardBuilder = createWizardDialog(signupData, wizardPages, () => {
			let promise
			if (logins.isUserLoggedIn()) {
				promise = logins.logout(false)
			} else {
				promise = Promise.resolve()
			}
			return promise.then(() => {
				if (signupData.newAccountData) {
					m.route.set("/login", {loginWith: signupData.newAccountData.mailAddress})
				} else {
					m.route.set("/login", {noAutoLogin: true})
				}
			})
		})
		const wizard = wizardBuilder.dialog
		//we only return the dialog so that it can be shown
		return wizard
	})
}

