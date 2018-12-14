// @flow
import {assertMainOrNode} from "../api/Env"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {load, serviceRequest} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {Const, PaymentMethodType as PaymentMethod} from "../api/common/TutanotaConstants"
import {getByAbbreviation} from "../api/common/CountryList"
import {WizardDialog} from "../gui/base/WizardDialog"
import {InvoiceAndPaymentDataPage} from "./InvoiceAndPaymentDataPage"
import {UpgradeConfirmPage} from "./UpgradeConfirmPage"
import {UpgradeSubscriptionPage} from "./UpgradeSubscriptionPage"
import {formatNameAndAddress} from "../misc/Formatter"
import {SignupPage} from "./SignupPage"
import {worker} from "../api/main/WorkerClient"
import {client} from "../misc/ClientDetector"
import m from "mithril"
import type {SubscriptionOptions, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {SubscriptionType} from "./SubscriptionUtils"
import stream from "mithril/stream/stream.js"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createUpgradePriceServiceData} from "../api/entities/sys/UpgradePriceServiceData"
import {SysService} from "../api/entities/sys/Services"
import {UpgradePriceServiceReturnTypeRef} from "../api/entities/sys/UpgradePriceServiceReturn"

assertMainOrNode()

const CAMPAIGN_KEY = "campaign"

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
	accountingInfo: ?AccountingInfo,
	newAccountData: ?NewAccountData,
	campaign: ?string,
	campaignInfoTextId: ?string,
	isInitialUpgrade: boolean,
	premiumPrices: PlanPrices,
	proPrices: PlanPrices
}


function getCampaign(): ?string {
	const tokenFromUrl = m.route.param()['token']
	if (tokenFromUrl) {
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

function loadUpgradePrices(): Promise<UpgradePriceServiceReturn> {
	let data = createUpgradePriceServiceData()
	data.date = Const.CURRENT_DATE
	data.campaign = getCampaign()
	return serviceRequest(SysService.UpgradePriceService, HttpMethod.GET, data, UpgradePriceServiceReturnTypeRef)
}

export function showUpgradeWizard(): void {
	load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
				return loadUpgradePrices().then(prices => {
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
							paymentMethod: accountingInfo.paymentMethod ? accountingInfo.paymentMethod : PaymentMethod.CreditCard,

							creditCardData: null,
						},
						price: "",
						type: SubscriptionType.Premium,
						priceNextYear: null,
						accountingInfo: accountingInfo,
						newAccountData: null,
						campaign: getCampaign(),
						campaignInfoTextId: prices.messageTextId,
						isInitialUpgrade: true,
						premiumPrices: prices.premiumPrices,
						proPrices: prices.proPrices,
					}
					return upgradeData
				})
			})
		)
		.then(upgradeData => {
				const wizardPages = [
					new UpgradeSubscriptionPage(upgradeData),
					new InvoiceAndPaymentDataPage(upgradeData),
					new UpgradeConfirmPage(upgradeData)
				]
				new WizardDialog(wizardPages, () => Promise.resolve()).show()
			}
		)
}


export function loadSignupWizard(): Promise<WizardDialog<UpgradeSubscriptionData>> {
	return loadUpgradePrices().then(prices => {
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
			newAccountData: null,
			campaign: getCampaign(),
			campaignInfoTextId: prices.messageTextId,
			isInitialUpgrade: true,
			premiumPrices: prices.premiumPrices,
			proPrices: prices.proPrices
		}
		const wizardPages = [
			new UpgradeSubscriptionPage(signupData),
			new SignupPage(signupData),
			new InvoiceAndPaymentDataPage(signupData),
			new UpgradeConfirmPage(signupData)
		]
		return new WizardDialog(wizardPages, () => {
			let promise
			if (logins.isUserLoggedIn()) {
				promise = worker.logout(false)
			} else {
				promise = Promise.resolve()
			}
			return promise.then(() => {
				if (signupData.newAccountData) {
					m.route.set("/login?loginWith=" + signupData.newAccountData.mailAddress)
				} else {
					m.route.set("/login")
				}
			})
		})
	})
}
