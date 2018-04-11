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
import {ChooseAccountTypePage} from "./ChooseAccountTypePage"

assertMainOrNode()

export type UpgradeAccountTypeData = {
	subscriptionOptions:SubscriptionOptions,
	invoiceData:InvoiceData,
	paymentData:PaymentData,
	proUpgrade:boolean,
	price:string
}

export function show(): void {
	load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
			const upgradeData: UpgradeAccountTypeData = {
				subscriptionOptions: {
					businessUse: accountingInfo.business,
					paymentInterval: Number(accountingInfo.paymentInterval)
				},
				invoiceData: {
					invoiceAddress: accountingInfo.invoiceName != "" ? (accountingInfo.invoiceName + "\n" + accountingInfo.invoiceAddress) : accountingInfo.invoiceAddress,
					country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
					vatNumber: accountingInfo.invoiceVatIdNo // only for EU countries otherwise empty
				},
				paymentData: {
					paymentMethod: PaymentMethod.CreditCard,
					paymentMethodInfo: null,
					paymentToken: null,
					creditCardData: null,
					payPalData: null
				},
				price: "",
				proUpgrade: false
			}

			const wizardPages = [
				new ChooseAccountTypePage(upgradeData),
				new InvoiceAndPaymentDataPage(upgradeData),
				new UpgradeConfirmPage(upgradeData)
			]
			new WizardDialog(wizardPages).show()
		}))
}
