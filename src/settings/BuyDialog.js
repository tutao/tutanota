// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {worker} from "../api/main/WorkerClient"
import {TextField} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Button, ButtonType} from "../gui/base/Button"
import {DialogType, Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {BookingItemFeatureType, PaymentMethodType} from "../api/common/TutanotaConstants"
import {neverNull} from "../api/common/utils/Utils"
import {formatDate, formatPrice} from "../misc/Formatter"
import {load} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {logins} from "../api/main/LoginController"

assertMainOrNode()

/**
 * Returns true if the order is accepted by the user, false otherwise.
 */
export function show(featureType: NumberString, count: number, freeAmount: number): Promise<boolean> {
	return worker.getPrice(featureType, count).then(price => {
		if (!_isPriceChange(price, featureType)) {
			return Promise.resolve(true)
		} else {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
					return load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
						let buy = _isBuy(price, featureType)
						let orderField = new TextField("bookingOrder_label").setValue(_getBookingText(price, featureType, count, freeAmount)).setDisabled()
						let buyField = (buy) ? new TextField("subscription_label", () => _getSubscriptionInfoText(price)).setValue(_getSubscriptionText(price)).setDisabled() : null
						let priceField = new TextField("price_label", () => _getPriceInfoText(price, featureType)).setValue(_getPriceText(price, featureType)).setDisabled()
						let paymentField = (buy) ? new TextField("paymentMethod_label").setValue(_getPaymentMethodInfoText(accountingInfo)).setDisabled() : null
						return Promise.fromCallback(cb => {
							let actionBar = new DialogHeaderBar()
							actionBar.setMiddle(() => lang.get("bookingSummary_label"))
							actionBar.addLeft(new Button("cancel_action", () => {
								dialog.close()
								cb(null, false)
							}).setType(ButtonType.Secondary))
							actionBar.addRight(new Button(buy ? "buy_action" : "order_action", () => {
								dialog.close()
								cb(null, true)
							}).setType(ButtonType.Primary))

							let dialog = new Dialog(DialogType.EditSmall, {
								view: (): Children => [
									m(".dialog-header.plr-l", m(actionBar)),
									m(".dialog-contentButtonsTop.plr-l.pb.text-break", m("", [
										m(orderField),
										buyField ? m(buyField) : null,
										m(priceField),
										paymentField ? m(paymentField) : null,
									]))
								]
							})
							dialog.show()
						})
					})
				})
			})
		}
	})
}

function _getBookingText(price: PriceServiceReturn, featureType: NumberString, count: number, freeAmount: number): string {
	if (_isSinglePriceType(price.futurePriceNextPeriod, featureType)) {
		if (count > 0) {
			return count + " " + lang.get("bookingItemUsers_label")
		} else {
			return lang.get("cancelUserAccounts_label", {"{1}": Math.abs(count)})
		}
	} else {
		let item = _getPriceItem(price.futurePriceNextPeriod, featureType)
		let newPackageCount = 0
		if (item != null) {
			newPackageCount = item.count
		}
		let visibleAmount = Math.max(count, freeAmount)
		if (featureType == BookingItemFeatureType.Storage) {
			if (count < 1000) {
				return lang.get("storageCapacity_label") + " " + visibleAmount + " GB"
			} else {
				return lang.get("storageCapacity_label") + " " + (visibleAmount / 1000) + " TB"
			}
		} else if (featureType == BookingItemFeatureType.Users) {
			if (count > 0) {
				return lang.get("packageUpgradeUserAccounts_label", {"{1}": newPackageCount})
			} else {
				return lang.get("packageDowngradeUserAccounts_label", {"{1}": newPackageCount})
			}
		} else if (featureType == BookingItemFeatureType.Aliases) {
			return visibleAmount + " " + lang.get("mailAddressAliases_label")
		} else {
			return "" // not possible
		}
	}
}

function _getSubscriptionText(price: PriceServiceReturn): string {
	if (neverNull(price.futurePriceNextPeriod).paymentInterval == "12") {
		return lang.get("yearly_label") + ', ' + lang.get('automaticRenewal_label')
	} else {
		return lang.get("monthly_label") + ', ' + lang.get('automaticRenewal_label')
	}
}

function _getSubscriptionInfoText(price: PriceServiceReturn): string {
	return lang.get("endOfSubscriptionPeriod_label", {"{1}": formatDate(price.periodEndDate)})
}

function _getPriceText(price: PriceServiceReturn, featureType: NumberString): string {
	let netGrossText = neverNull(price.futurePriceNextPeriod).taxIncluded ? lang.get("gross_label") : lang.get("net_label")
	let periodText = (neverNull(price.futurePriceNextPeriod).paymentInterval == "12") ? lang.get('perYear_label') : lang.get('perMonth_label')
	let futurePrice = _getPriceFromPriceData(price.futurePriceNextPeriod, featureType)
	let currentPriceNextPeriod = _getPriceFromPriceData(price.currentPriceNextPeriod, featureType)

	if (_isSinglePriceType(price.futurePriceNextPeriod, featureType)) {
		let priceDiff = futurePrice - currentPriceNextPeriod
		return formatPrice(priceDiff, true) + " " + periodText + " (" + netGrossText + ")"
	} else {
		return formatPrice(futurePrice, true) + " " + periodText + " (" + netGrossText + ")"
	}
}

function _getPriceInfoText(price: PriceServiceReturn, featureType: NumberString): string {
	if (price.currentPeriodAddedPrice && Number(price.currentPeriodAddedPrice) > 0) {
		return lang.get("priceForCurrentAccountingPeriod_label", {"{1}": formatPrice(Number(price.currentPeriodAddedPrice), true)})
	} else if (_isUnbuy(price, featureType)) {
		return lang.get("priceChangeValidFrom_label", {"{1}": formatDate(price.periodEndDate)})
	} else {
		return ""
	}
}

function _getPaymentMethodInfoText(accountingInfo: AccountingInfo): string {
	if (accountingInfo.paymentMethodInfo) {
		return accountingInfo.paymentMethodInfo
	} else {
		return _getPaymentMethodName(accountingInfo.paymentMethod)
	}
}

function _getPaymentMethodName(paymentMethod): string {
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

function _isPriceChange(price: PriceServiceReturn, featureType: NumberString): boolean {
	return (_getPriceFromPriceData(price.currentPriceNextPeriod, featureType) != _getPriceFromPriceData(price.futurePriceNextPeriod, featureType))
}

function _isBuy(price: PriceServiceReturn, featureType: NumberString): boolean {
	return (_getPriceFromPriceData(price.currentPriceNextPeriod, featureType) < _getPriceFromPriceData(price.futurePriceNextPeriod, featureType))
}

function _isUnbuy(price: PriceServiceReturn, featureType: NumberString): boolean {
	return (_getPriceFromPriceData(price.currentPriceNextPeriod, featureType) > _getPriceFromPriceData(price.futurePriceNextPeriod, featureType))
}

function _isSinglePriceType(priceData: ?PriceData, featureType: NumberString): boolean {
	let item = _getPriceItem(priceData, featureType)
	if (item != null) {
		return item.singleType
	} else {
		// special case for zero price.
		return featureType == BookingItemFeatureType.Users
	}
}

/**
 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
 */
function _getPriceItem(priceData: ?PriceData, featureType: NumberString): ?PriceItemData {
	if (priceData) {
		return priceData.items.find(item => {
			return (item.featureType == featureType)
		})
	} else {
		return null
	}
}

/**
 * Returns the price for the feature type from the price data if available, otherwise 0.
 */
function _getPriceFromPriceData(priceData: ?PriceData, featureType: NumberString): number {
	let item = _getPriceItem(priceData, featureType)
	if (item) {
		return Number(item.price)
	} else {
		return 0
	}
}
