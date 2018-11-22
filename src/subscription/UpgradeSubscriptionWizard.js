// @flow
import {assertMainOrNode} from "../api/Env"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {load} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import {PaymentMethodType as PaymentMethod} from "../api/common/TutanotaConstants"
import {getByAbbreviation} from "../api/common/CountryList"
import {WizardDialog} from "../gui/base/WizardDialog"
import {InvoiceAndPaymentDataPage} from "./InvoiceAndPaymentDataPage"
import {UpgradeConfirmPage} from "./UpgradeConfirmPage"
import {UpgradeSubscriptionPage} from "./UpgradeSubscriptionPage"
import {formatNameAndAddress} from "../misc/Formatter"
import {SignupPage} from "./SignupPage"
import {worker} from "../api/main/WorkerClient"
import m from "mithril"

assertMainOrNode()

export const SubscriptionType = {
	Free: 'Free',
	Premium: 'Premium',
	Pro: 'Pro'
}

export type NewAccountData = {
	mailAddress: string,
	recoverCode: Hex,
	password: string,
}

export type SubscriptionTypeEnum = $Values<typeof SubscriptionType>;

export type UpgradeSubscriptionData = {
	subscriptionOptions: SubscriptionOptions,
	invoiceData: InvoiceData,
	paymentData: PaymentData,
	type: SubscriptionTypeEnum,
	price: string,
	originalPrice: ?string,
	accountingInfo: ?AccountingInfo,
	newAccountData: ?NewAccountData
}

export function showUpgradeWizard(): void {
	load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
				const upgradeData: UpgradeSubscriptionData = {
					subscriptionOptions: {
						businessUse: accountingInfo.business,
						paymentInterval: Number(accountingInfo.paymentInterval)
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
					originalPrice: null,
					accountingInfo: accountingInfo,
					newAccountData: null
				}
				return upgradeData
			})
		)
		.then(upgradeData => {
				const wizardPages = [
					new UpgradeSubscriptionPage(upgradeData, false),
					new InvoiceAndPaymentDataPage(upgradeData),
					new UpgradeConfirmPage(upgradeData)
				]
				new WizardDialog(wizardPages, () => Promise.resolve()).show()
			}
		)
}


export function showSignupWizard(): void {
	const signupData: UpgradeSubscriptionData = {
		subscriptionOptions: {
			businessUse: false,
			paymentInterval: 12
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
		originalPrice: null,
		type: SubscriptionType.Free,
		accountingInfo: null,
		newAccountData: null
	}
	const wizardPages = [
		new UpgradeSubscriptionPage(signupData, true),
		new SignupPage(signupData),
		new InvoiceAndPaymentDataPage(signupData),
		new UpgradeConfirmPage(signupData)
	]
	new WizardDialog(wizardPages, () => {
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
	}).show()
}
