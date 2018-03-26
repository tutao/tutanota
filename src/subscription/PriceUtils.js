//@flow
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel.js"


export function getPaymentMethodName(paymentMethod: PaymentMethodTypeEnum): string {
	if (paymentMethod == PaymentMethodType.Invoice) {
		return lang.get("paymentMethodOnAccount_label")
	} else if (paymentMethod == PaymentMethodType.CreditCard) {
		return lang.get("paymentMethodCreditCard_label")
	} else if (paymentMethod == PaymentMethodType.Sepa) {
		return "SEPA"
	} else if (paymentMethod == PaymentMethodType.Paypal) {
		return "PayPal"
	} else {
		return ""
	}
}


export function getPaymentMethodInfoText(accountingInfo: AccountingInfo): string {
	if (accountingInfo.paymentMethodInfo) {
		return accountingInfo.paymentMethodInfo
	} else {
		return getPaymentMethodName(accountingInfo.paymentMethod)
	}
}
