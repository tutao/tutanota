//@flow
import type {BookingItemFeatureTypeEnum, PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel.js"
import {neverNull} from "../api/common/utils/Utils"
import {logins} from "../api/main/LoginController"
import {load} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {Dialog} from "../gui/base/Dialog"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import type {PriceData} from "../api/entities/sys/PriceData"
import type {PriceItemData} from "../api/entities/sys/PriceItemData"
import type {Booking} from "../api/entities/sys/Booking"
import type {SubscriptionData, SubscriptionTypeEnum, UpgradePriceTypeEnum} from "./SubscriptionUtils"
import {getUpgradePrice} from "./SubscriptionUtils"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"

export function getPaymentMethodName(paymentMethod: ?PaymentMethodTypeEnum): string {
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
		return accountingInfo.paymentMethod === PaymentMethodType.CreditCard ? lang.get("endsWith_label") + " "
			+ neverNull(accountingInfo.paymentMethodInfo) : neverNull(accountingInfo.paymentMethodInfo)
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
		return (value % 1 !== 0) ?
			lang.formats.priceWithCurrency.format(value)
			: lang.formats.priceWithCurrencyWithoutFractionDigits.format(value)
	} else {
		return (value % 1 !== 0) ?
			lang.formats.priceWithoutCurrency.format(value)
			: lang.formats.priceWithoutCurrencyWithoutFractionDigits.format(value)
	}
}

export function getFormattedUpgradePrice(attrs: SubscriptionData, subscription: SubscriptionTypeEnum, type: UpgradePriceTypeEnum): string {
	return formatPrice(getUpgradePrice(attrs, subscription, type), true)
}

export function formatPriceWithInfo(price: number, paymentInterval: number, taxIncluded: boolean): string {
	const netOrGross = taxIncluded ? lang.get("gross_label") : lang.get("net_label")
	const yearlyOrMonthly = paymentInterval === 12 ? lang.get("pricing.perYear_label") : lang.get("pricing.perMonth_label")
	return formatPrice(price, true) + " " + yearlyOrMonthly + " (" + netOrGross + ")"
}

/**
 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
 */
export function getPriceItem(priceData: ?PriceData, featureType: NumberString): ?PriceItemData {
	if (priceData) {
		return priceData.items.find(item => {
			return (item.featureType === featureType)
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
		let bookingItem = booking.items.find(item => item.featureType === featureType)
		return bookingItem ? Number(bookingItem.currentCount) : 0
	} else {
		return 0
	}
}

export function createNotAvailableForFreeClickHandler(includedInPremium: boolean,
                                                      click: clickHandler,
                                                      available: () => boolean): clickHandler {
	return (e, dom) => {
		if (!available()) {
			showNotAvailableForFreeDialog(includedInPremium)
		} else {
			click(e, dom)
		}
	}
}

/**
 * Returns whether premium is active and shows one of the showNotAvailableForFreeDialog or subscription cancelled dialogs if needed.
 */
export function checkPremiumSubscription(included: boolean): Promise<boolean> {
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(included)
		return Promise.resolve(false)
	}
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then((customer) => {
		if (customer.canceledPremiumAccount) {
			return Dialog.error("subscriptionCancelledMessage_msg").return(false)
		} else {
			return Promise.resolve(true)
		}
	})
}
