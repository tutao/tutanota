import type {BookingItemFeatureType, PaymentMethodType} from "../api/common/TutanotaConstants"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {neverNull} from "@tutao/tutanota-utils"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import type {PriceData} from "../api/entities/sys/PriceData"
import type {PriceItemData} from "../api/entities/sys/PriceItemData"
import type {Booking} from "../api/entities/sys/Booking"
import type {SubscriptionData, SubscriptionType, UpgradePriceType} from "./SubscriptionUtils"
import {getPlanPrices, UpgradePriceType} from "./SubscriptionUtils"
export function getPaymentMethodName(paymentMethod: PaymentMethodType null): string {
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

/**
 * Return actual price for given subscription data. In case of yearly subscription, the yearly value is returned, and monthly otherwise.
 */
export function getSubscriptionPrice(data: SubscriptionData, subscription: SubscriptionType, type: UpgradePriceType): number {
    const prices = getPlanPrices(data.planPrices, subscription)

    if (prices) {
        let monthlyPriceString
        let monthsFactor = data.options.paymentInterval() === 12 ? 10 : 1
        let discount = 0

        if (type === UpgradePriceType.PlanReferencePrice) {
            monthlyPriceString = prices.monthlyReferencePrice

            if (data.options.paymentInterval() === 12) {
                monthsFactor = 12
            }
        } else if (type === UpgradePriceType.PlanActualPrice) {
            monthlyPriceString = prices.monthlyPrice

            if (data.options.paymentInterval() === 12) {
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
    } else {
        // Free plan
        return 0
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
    if (priceData) {
        return priceData.items.find(item => {
            return item.featureType === featureType
        })
    } else {
        return null
    }
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