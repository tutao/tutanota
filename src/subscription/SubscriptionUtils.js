//@flow
import {lang} from "../misc/LanguageViewModel"
import type {SegmentControlItem} from "./SegmentControl"

export type SubscriptionOptions = {
	businessUse: Stream<boolean>,
	paymentInterval: Stream<number>
}

export const SubscriptionType = {
	Free: 'Free',
	Premium: 'Premium',
	Pro: 'Pro'
}
export type SubscriptionTypeEnum = $Values<typeof SubscriptionType>;

export const PaymentIntervalItems: SegmentControlItem<number>[] = [
	{name: lang.get("pricing.yearly_label"), value: 12},
	{name: lang.get("pricing.monthly_label"), value: 1}
]

export const BusinessUseItems: SegmentControlItem<boolean>[] = [
	{name: lang.get("pricing.privateUse_label"), value: false},
	{name: lang.get("pricing.businessUse_label"), value: true}
]

// keep this function here because we also need it on the website
export function formatPrice(value: number, includeCurrency: boolean): string {
	// round to two digits first because small deviations may exist at far away decimal places
	value = Math.round(value * 100) / 100
	if (includeCurrency) {
		return (value % 1 !== 0) ?
			lang.formats.priceWithCurrency.format(value)
			: lang.formats.priceWithCurrencyWithoutFractionDigits.format(value)
	} else {
		return (value % 1 !== 0) ?
			lang.formats.priceWithoutCurrency.format(value)
			: lang.formats.priceWithoutCurrencyWithoutFractionDigits.format(value)
	}
}

export type SubscriptionData = {
	options: SubscriptionOptions,
	premiumPrices: PlanPrices,
	proPrices: PlanPrices
}

export const UpgradePriceType = {
	PlanReferencePrice: "0",
	PlanActualPrice: "1",
	PlanNextYearsPrice: "2",
	AdditionalUserPrice: "3",
	ContactFormPrice: "4",
}
export type UpgradePriceTypeEnum = $Values<typeof UpgradePriceType>;

export function getUpgradePrice(attrs: SubscriptionData, premium: boolean, type: UpgradePriceTypeEnum): number {
	let prices = premium ? attrs.premiumPrices : attrs.proPrices
	let monthlyPriceString
	let monthsFactor = (attrs.options.paymentInterval() === 12) ? 10 : 1
	let discount = 0
	if (type === UpgradePriceType.PlanReferencePrice) {
		monthlyPriceString = prices.monthlyReferencePrice
		if (attrs.options.paymentInterval() === 12) {
			monthsFactor = 12
		}
	} else if (type === UpgradePriceType.PlanActualPrice) {
		monthlyPriceString = prices.monthlyPrice
		if (attrs.options.paymentInterval() === 12) {
			discount = Number(prices.firstYearDiscount)
		}
	} else if (type === UpgradePriceType.PlanNextYearsPrice) {
		monthlyPriceString = prices.monthlyPrice
	} else if (type === UpgradePriceType.AdditionalUserPrice) {
		monthlyPriceString = prices.additionalUserPriceMonthly
	} else if (type === UpgradePriceType.ContactFormPrice) {
		monthlyPriceString = prices.contactFormPriceMonthly
	}
	return Number(monthlyPriceString) * monthsFactor - discount
}

export function getFormattetUpgradePrice(attrs: SubscriptionData, premium: boolean, type: UpgradePriceTypeEnum): string {
	return formatPrice(getUpgradePrice(attrs, premium, type), true)
}