import type {BookingItemFeatureType} from "../api/common/TutanotaConstants"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {neverNull} from "@tutao/tutanota-utils"
import type {AccountingInfo} from "../api/entities/sys/TypeRefs.js"
import type {PriceData} from "../api/entities/sys/TypeRefs.js"
import type {PriceItemData} from "../api/entities/sys/TypeRefs.js"
import type {Booking} from "../api/entities/sys/TypeRefs.js"
import {getPlanPrices, SubscriptionType, UpgradePriceType, WebsitePlanPrices} from "./SubscriptionDataProvider";

export function getPaymentMethodName(paymentMethod: PaymentMethodType): string {
	if (paymentMethod === PaymentMethodType.Invoice) {
		return lang.get("paymentMethodOnAccount_label")
	} else if (paymentMethod === PaymentMethodType.CreditCard) {
		return lang.get("paymentMethodCreditCard_label")
	} else if (paymentMethod === PaymentMethodType.Sepa) {
		return "SEPA"
	} else if (paymentMethod === PaymentMethodType.Paypal) {
		return "PayPal"
	} else if (paymentMethod === PaymentMethodType.AccountBalance) {
		return lang.get("paymentMethodAccountBalance_label")
	} else {
		return "<" + lang.get("comboBoxSelectionNone_msg") + ">"
	}
}

export function getPaymentMethodInfoText(accountingInfo: AccountingInfo): string {
	if (accountingInfo.paymentMethodInfo) {
		return accountingInfo.paymentMethod === PaymentMethodType.CreditCard
			? lang.get("endsWith_label") + " " + neverNull(accountingInfo.paymentMethodInfo)
			: neverNull(accountingInfo.paymentMethodInfo)
	} else {
		return ""
	}
}

export function formatPriceDataWithInfo(priceData: PriceData): string {
	return formatPriceWithInfo(Number(priceData.price), Number(priceData.paymentInterval), priceData.taxIncluded)
}

// Used on website, keep it in sync
export function formatPrice(value: number, includeCurrency: boolean): string {
	// round to two digits first because small deviations may exist at far away decimal places
	value = Math.round(value * 100) / 100

	if (includeCurrency) {
		return value % 1 !== 0 ? lang.formats.priceWithCurrency.format(value) : lang.formats.priceWithCurrencyWithoutFractionDigits.format(value)
	} else {
		return value % 1 !== 0 ? lang.formats.priceWithoutCurrency.format(value) : lang.formats.priceWithoutCurrencyWithoutFractionDigits.format(value)
	}
}

export function getSubscriptionPrice(
	paymentInterval: number,
	subscription: SubscriptionType,
	type: UpgradePriceType
): number {
	if (subscription === SubscriptionType.Free) return 0
	return paymentInterval === 12
		? getYearlySubscriptionPrice(subscription, type)
		: getMonthlySubscriptionPrice(subscription, type)
}

export function getYearlySubscriptionPrice(
	subscription: SubscriptionType,
	upgrade: UpgradePriceType
): number {
	const prices = getPlanPrices(subscription)
	const monthlyPrice = getPriceForUpgradeType(upgrade, prices)
	const discount = Number(prices.firstYearDiscount)
	return (monthlyPrice * 10) / 12 - discount
}

export function getMonthlySubscriptionPrice(
	subscription: SubscriptionType,
	upgrade: UpgradePriceType
): number {
	const prices = getPlanPrices(subscription)
	return getPriceForUpgradeType(upgrade, prices)
}

function getPriceForUpgradeType(upgrade: UpgradePriceType, prices: WebsitePlanPrices): number {
	switch (upgrade) {
		case UpgradePriceType.PlanReferencePrice:
			return Number(prices.monthlyReferencePrice)
		case UpgradePriceType.PlanActualPrice:
		case UpgradePriceType.PlanNextYearsPrice:
			return Number(prices.monthlyPrice)
		case UpgradePriceType.AdditionalUserPrice:
			return Number(prices.additionalUserPriceMonthly)
		case UpgradePriceType.ContactFormPrice:
			return Number(prices.contactFormPriceMonthly)
	}
}

/**
 * Formats the monthly price of the subscription (even for yearly subscriptions).
 */
export function formatMonthlyPrice(subscriptionPrice: number, paymentInterval: number): string {
	const monthlyPrice = isYearlyPayment(paymentInterval) ? subscriptionPrice / 12 : subscriptionPrice
	return formatPrice(monthlyPrice, true)
}

export function isYearlyPayment(periods: number): boolean {
	return periods === 12
}

export function formatPriceWithInfo(price: number, paymentInterval: number, taxIncluded: boolean): string {
	const netOrGross = taxIncluded ? lang.get("gross_label") : lang.get("net_label")
	const yearlyOrMonthly = isYearlyPayment(paymentInterval) ? lang.get("pricing.perYear_label") : lang.get("pricing.perMonth_label")
	const formattedPrice = formatPrice(price, true)
	return `${formattedPrice} ${yearlyOrMonthly} (${netOrGross})`
}

/**
 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
 */
export function getPriceItem(priceData: PriceData | null, featureType: NumberString): PriceItemData | null {
	return priceData?.items.find(item => item.featureType === featureType) ?? null
}

export function getCountFromPriceData(priceData: PriceData | null, featureType: BookingItemFeatureType): number {
	const priceItem = getPriceItem(priceData, featureType)
	return priceItem ? Number(priceItem.count) : 0
}

/**
 * Returns the price for the feature type from the price data if available. otherwise 0.
 * @return The price
 */
export function getPriceFromPriceData(priceData: PriceData | null, featureType: NumberString): number {
	let item = getPriceItem(priceData, featureType)

	if (item) {
		return Number(item.price)
	} else {
		return 0
	}
}

export function getCurrentCount(featureType: BookingItemFeatureType, booking: Booking | null): number {
	if (booking) {
		let bookingItem = booking.items.find(item => item.featureType === featureType)
		return bookingItem ? Number(bookingItem.currentCount) : 0
	} else {
		return 0
	}
}