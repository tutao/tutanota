import type {BookingItemFeatureTypeEnum} from "../api/common/TutanotaConstants"
//@flow
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel.js"
import {formatPrice} from "../misc/Formatter"


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


export function formatPriceDataWithInfo(priceData: PriceData): string {
	return formatPriceWithInfo(Number(priceData.price), Number(priceData.paymentInterval), priceData.taxIncluded)
}

export function formatPriceWithInfo(price: number, paymentInterval: number, taxIncluded: boolean): string {
	const netOrGross = taxIncluded ? lang.get("gross_label") : lang.get("net_label")
	const yearlyOrMonthly = paymentInterval == 12 ? lang.get("perYear_label") : lang.get("perMonth_label")
	return formatPrice(price, true) + " " + yearlyOrMonthly + " (" + netOrGross + ")"
}

/**
 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
 */
export function getPriceItem(priceData: ?PriceData, featureType: NumberString): ?PriceItemData {
	if (priceData) {
		return priceData.items.find(item => {
			return (item.featureType == featureType)
		})
	} else {
		return null
	}
}

export function getCountFromPriceData(priceData: ?PriceData, featureType: BookingItemFeatureTypeEnum): number {
	const priceItem = getPriceItem(priceData, featureType)
	return priceItem ? Number(priceItem.count) : 0
}


/**
 * Returns the price for the feature type from the price data if available. otherwise 0.
 * @return The price
 */
export function getPriceFromPriceData(priceData: ?PriceData, featureType: NumberString): number {
	let item = getPriceItem(priceData, featureType);
	if (item) {
		return Number(item.price);
	} else {
		return 0;
	}
}

export function getCurrentCount(featureType: BookingItemFeatureTypeEnum, booking: ?Booking): number {
	if (booking) {
		let bookingItem = booking.items.find(item => item.featureType == featureType)
		return bookingItem ? Number(bookingItem.currentCount) : 0
	} else {
		return 0
	}
}