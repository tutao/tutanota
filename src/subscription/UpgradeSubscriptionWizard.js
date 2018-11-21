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

assertMainOrNode()

export type UpgradeSubscriptionData = {
	subscriptionOptions: SubscriptionOptions,
	invoiceData: InvoiceData,
	paymentData: PaymentData,
	proUpgrade: boolean,
	price: string,
	originalPrice: ?string,
	accountingInfo: AccountingInfo
}

export function show(): void {
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
					paymentMethodInfo: accountingInfo.paymentMethodInfo,
					creditCardData: null,
				},
				price: "",
				originalPrice: null,
				proUpgrade: false,
				accountingInfo: accountingInfo
			}

			const wizardPages = [
				new UpgradeSubscriptionPage(upgradeData),
				new InvoiceAndPaymentDataPage(upgradeData),
				new UpgradeConfirmPage(upgradeData)
			]
			new WizardDialog(wizardPages).show()
		}))
}
