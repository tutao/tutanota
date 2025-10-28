import type { AccountingInfo } from "../../api/entities/sys/TypeRefs"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { type InvoiceData, PaymentMethodType } from "../../api/common/TutanotaConstants"
import { Country, CountryType } from "../../api/common/CountryList"
import { CCViewModel } from "../SimplifiedCreditCardInput"

function isOnAccountAllowed(country: Country, accountingInfo: AccountingInfo, isBusiness: boolean): boolean {
	if (!country) {
		return false
	} else if (accountingInfo.paymentMethod === PaymentMethodType.Invoice) {
		return true
	} else if (isBusiness && country.t !== CountryType.OTHER) {
		return true
	} else {
		return false
	}
}

export function validatePaymentData({
	paymentMethod,
	country,
	accountingInfo,
	isBusiness,
	ccViewModel,
}: {
	paymentMethod: PaymentMethodType
	country: Country
	accountingInfo: AccountingInfo
	isBusiness: boolean
	ccViewModel: CCViewModel
}): TranslationKey | null {
	if (!paymentMethod) {
		// FIXME
		return "invoicePaymentMethodInfo_msg"
	} else if (paymentMethod === PaymentMethodType.Invoice) {
		if (!isOnAccountAllowed(country, accountingInfo, isBusiness)) {
			return "paymentMethodNotAvailable_msg"
		} else {
			return null
		}
	} else if (paymentMethod === PaymentMethodType.Paypal) {
		return accountingInfo.paypalBillingAgreement != null ? null : "paymentDataPayPalLogin_msg"
	} else if (paymentMethod === PaymentMethodType.CreditCard) {
		return ccViewModel.validateCreditCardPaymentData()
	} else {
		return null
	}
}

export function getVisiblePaymentMethods({
	isBusiness,
	isBankTransferAllowed,
	accountingInfo,
}: {
	isBusiness: boolean
	isBankTransferAllowed: boolean
	accountingInfo: AccountingInfo | null
}): Array<{
	name: string
	value: PaymentMethodType
}> {
	const availablePaymentMethods = [
		{
			name: lang.get("paymentMethodCreditCard_label"),
			value: PaymentMethodType.CreditCard,
		},
		// {
		// 	name: "PayPal",
		// 	value: PaymentMethodType.Paypal,
		// },
	]

	// show bank transfer in case of business use, even if it is not available for the selected country
	if ((isBusiness && isBankTransferAllowed) || accountingInfo?.paymentMethod === PaymentMethodType.Invoice) {
		availablePaymentMethods.push({
			name: lang.get("paymentMethodOnAccount_label"),
			value: PaymentMethodType.Invoice,
		})
	}

	// show account balance only if this is the current payment method
	if (accountingInfo?.paymentMethod === PaymentMethodType.AccountBalance) {
		availablePaymentMethods.push({
			name: lang.get("paymentMethodAccountBalance_label"),
			value: PaymentMethodType.AccountBalance,
		})
	}

	return availablePaymentMethods
}

export function validateInvoiceData({ address, isBusiness }: { address: string; isBusiness: boolean }): TranslationKey | null {
	if (isBusiness && (address.trim() === "" || address.split("\n").length > 5)) {
		return "invoiceAddressInfoBusiness_msg"
	} else if (address.split("\n").length > 4) {
		return "invoiceAddressInfoBusiness_msg"
	}
	// no error
	return null
}

export function getInvoiceData({
	address,
	country,
	isBusiness,
	vatNumber,
}: {
	address: string
	country: Country
	isBusiness: boolean
	vatNumber: string
}): InvoiceData {
	return {
		invoiceAddress: address,
		country: country,
		vatNumber: country?.t === CountryType.EU && isBusiness ? vatNumber : "",
	}
}
