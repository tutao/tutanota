// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {worker} from "../api/main/WorkerClient"
import {Type} from "../gui/base/TextField"
import {ButtonType} from "../gui/base/ButtonN"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {BookingItemFeatureTypeEnum} from "../api/common/TutanotaConstants"
import {AccountType, BookingItemFeatureType, FeatureType} from "../api/common/TutanotaConstants"
import {neverNull} from "../api/common/utils/Utils"
import {formatDate} from "../misc/Formatter"
import {load} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {logins} from "../api/main/LoginController"
import {NotAuthorizedError} from "../api/common/error/RestError"
import {formatPrice, getPriceItem} from "./PriceUtils"
import {bookItem} from "./SubscriptionUtils"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import type {PriceServiceReturn} from "../api/entities/sys/PriceServiceReturn"
import type {PriceData} from "../api/entities/sys/PriceData"
import {showProgressDialog} from "../gui/ProgressDialog"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"

assertMainOrNode()

/**
 * Returns true if the order is accepted by the user, false otherwise.
 */
export function showBuyDialog(featureType: BookingItemFeatureTypeEnum, count: number, freeAmount: number, reactivate: boolean): Promise<boolean> {
	if (logins.isEnabled(FeatureType.HideBuyDialogs)) {
		return Promise.resolve(true)
	}
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
		if (customer.type === AccountType.PREMIUM && customer.canceledPremiumAccount) {
			return Dialog.error("subscriptionCancelledMessage_msg").return(false)
		} else {
			return worker.getPrice(featureType, count, reactivate).then(price => {
				if (!_isPriceChange(price, featureType)) {
					return Promise.resolve(true)
				} else {

					return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
						return load(AccountingInfoTypeRef, customerInfo.accountingInfo)
							.catch(NotAuthorizedError, e => {/* local admin */
							})
							.then(accountingInfo => {
								if (accountingInfo && (accountingInfo.paymentMethod == null)) {
									return Dialog.confirm("enterPaymentDataFirst_msg").then(confirm => {
										if (confirm) {
											m.route.set("/settings/invoice")
										}
										return false
									})
								} else {
									let buy = _isBuy(price, featureType)

									const orderFieldAttrs = {
										label: "bookingOrder_label",
										value: stream(_getBookingText(price, featureType, count, freeAmount)),
										type: Type.Area,
										disabled: true
									}

									const buyFieldAttrs = {
										label: "subscription_label",
										helpLabel: () => _getSubscriptionInfoText(price),
										value: stream(_getSubscriptionText(price)),
										disabled: true
									}

									const priceFieldAttrs = {
										label: "price_label",
										helpLabel: () => _getPriceInfoText(price, featureType),
										value: stream(_getPriceText(price, featureType)),
										disabled: true
									}

									return new Promise(resolve => {
										let dialog: Dialog
										const doAction = res => {
											dialog.close()
											resolve(res)
										}

										let actionBarAttrs: DialogHeaderBarAttrs = {
											left: [
												{
													label: "cancel_action",
													click: () => doAction(false),
													type: ButtonType.Secondary
												}
											],
											right: [
												{
													label: buy ? "buy_action" : "order_action",
													click: () => doAction(true),
													type: ButtonType.Primary
												}
											],
											middle: () => lang.get("bookingSummary_label")
										}

										dialog = new Dialog(DialogType.EditSmall, {
											view: (): Children => [
												m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
												m(".plr-l.pb", m("", [
													m(TextFieldN, orderFieldAttrs),
													buy ? m(TextFieldN, buyFieldAttrs) : null,
													m(TextFieldN, priceFieldAttrs),
												]))
											]
										}).setCloseHandler(() => doAction(false)).show()
									})
								}
							})
					})
				}
			})
		}
	})
}

/**
 * Shows the buy dialog to enable or disable the whitelabel package.
 * @param enable true if the whitelabel package should be enabled otherwise false.
 * @returns false if the execution was successful. True if the action has been cancelled by user or the precondition has failed.
 */
export function showWhitelabelBuyDialog(enable: boolean): Promise<boolean> {
	return showBuyDialogToBookItem(BookingItemFeatureType.Whitelabel, enable ? 1 : 0)
}

/**
 * Shows the buy dialog to enable or disable the sharing package.
 * @param enable true if the whitelabel package should be enabled otherwise false.
 * @returns false if the execution was successful. True if the action has been cancelled by user or the precondition has failed.
 */
export function showSharingBuyDialog(enable: boolean): Promise<boolean> {
	return (enable ? Promise.resolve(true) : Dialog.confirm("sharingDeletionWarning_msg")).then(ok => {
		if (ok) {
			return showBuyDialogToBookItem(BookingItemFeatureType.Sharing, enable ? 1 : 0)
		} else {
			return true
		}
	})
}

/**
 * Shows the buy dialog to enable or disable the business package.
 * @param enable true if the business package should be enabled otherwise false.
 * @returns false if the execution was successful. True if the action has been cancelled by user or the precondition has failed.
 */
export function showBusinessBuyDialog(enable: boolean): Promise<boolean> {
	return (enable ? Promise.resolve(true) : Dialog.confirm("businessDeletionWarning_msg")).then(ok => {
		if (ok) {
			return showBuyDialogToBookItem(BookingItemFeatureType.Business, enable ? 1 : 0)
		} else {
			return true
		}
	})
}

/**
 * @returns True if it failed, false otherwise
 */
export function showBuyDialogToBookItem(bookingItemFeatureType: BookingItemFeatureTypeEnum, amount: number, freeAmount: number = 0, reactivate: boolean = false): Promise<boolean> {
	return showProgressDialog("pleaseWait_msg", showBuyDialog(bookingItemFeatureType, amount, freeAmount, reactivate))
		.then(accepted => {
			if (accepted) {
				return bookItem(bookingItemFeatureType, amount)
			} else {
				return true
			}
		})
}

function _getBookingText(price: PriceServiceReturn, featureType: NumberString, count: number, freeAmount: number): string {
	if (_isSinglePriceType(price.currentPriceThisPeriod, price.futurePriceNextPeriod, featureType)) {
		if (featureType === BookingItemFeatureType.Users) {
			if (count > 0) {
				let additionalFeatures = []
				if (_getPriceFromPriceData(price.futurePriceNextPeriod, BookingItemFeatureType.Whitelabel) > 0) {
					additionalFeatures.push(lang.get("whitelabelFeature_label"))
				}
				if (_getPriceFromPriceData(price.futurePriceNextPeriod, BookingItemFeatureType.Sharing) > 0) {
					additionalFeatures.push(lang.get("sharingFeature_label"))
				}
				if (_getPriceFromPriceData(price.futurePriceNextPeriod, BookingItemFeatureType.Business) > 0) {
					additionalFeatures.push(lang.get("businessFeature_label"))
				}
				if (additionalFeatures.length > 0) {
					return count + " " + lang.get("bookingItemUsersIncluding_label") + " " + additionalFeatures.join(", ")
				} else {
					return count + " " + lang.get("bookingItemUsers_label")
				}
			} else {
				return lang.get("cancelUserAccounts_label", {"{1}": Math.abs(count)})
			}


		} else if (featureType === BookingItemFeatureType.Whitelabel) {
			if (count > 0) {
				return lang.get("whitelabelBooking_label", {"{1}": neverNull(getPriceItem(price.futurePriceNextPeriod, BookingItemFeatureType.Whitelabel)).count})
			} else {
				return lang.get("cancelWhitelabelBooking_label", {"{1}": neverNull(getPriceItem(price.currentPriceNextPeriod, BookingItemFeatureType.Whitelabel)).count})
			}
		} else if (featureType === BookingItemFeatureType.Sharing) {
			if (count > 0) {
				return lang.get("sharingBooking_label", {"{1}": neverNull(getPriceItem(price.futurePriceNextPeriod, BookingItemFeatureType.Sharing)).count})
			} else {
				return lang.get("cancelSharingBooking_label", {"{1}": neverNull(getPriceItem(price.currentPriceNextPeriod, BookingItemFeatureType.Sharing)).count})
			}
		} else if (featureType === BookingItemFeatureType.Business) {
			if (count > 0) {
				return lang.get("businessBooking_label", {"{1}": neverNull(getPriceItem(price.futurePriceNextPeriod, BookingItemFeatureType.Business)).count})
			} else {
				return lang.get("cancelBusinessBooking_label", {"{1}": neverNull(getPriceItem(price.currentPriceNextPeriod, BookingItemFeatureType.Business)).count})
			}
		} else if (featureType === BookingItemFeatureType.ContactForm) {
			if (count > 0) {
				return count + " " + lang.get("contactForm_label")
			} else {
				return lang.get("cancelContactForm_label")
			}
		} else if (featureType === BookingItemFeatureType.SharedMailGroup) {
			if (count > 0) {
				return count + " " + lang.get((count === 1) ? "sharedMailbox_label" : "sharedMailboxes_label")
			} else {
				return lang.get("cancelSharedMailbox_label")
			}
		} else if (featureType === BookingItemFeatureType.LocalAdminGroup) {
			if (count > 0) {
				return count + " " + lang.get((count === 1) ? "localAdminGroup_label" : "localAdminGroups_label")
			} else {
				return lang.get("cancelLocalAdminGroup_label")
			}
		} else {
			return ""
		}
	} else {
		let item = getPriceItem(price.futurePriceNextPeriod, featureType)
		let newPackageCount = 0
		if (item != null) {
			newPackageCount = item.count
		}
		let visibleAmount = Math.max(count, freeAmount)
		if (featureType === BookingItemFeatureType.Storage) {
			if (count < 1000) {
				return lang.get("storageCapacity_label") + " " + visibleAmount + " GB"
			} else {
				return lang.get("storageCapacity_label") + " " + (visibleAmount / 1000) + " TB"
			}
		} else if (featureType === BookingItemFeatureType.Users) {
			if (count > 0) {
				return lang.get("packageUpgradeUserAccounts_label", {"{1}": newPackageCount})
			} else {
				return lang.get("packageDowngradeUserAccounts_label", {"{1}": newPackageCount})
			}
		} else if (featureType === BookingItemFeatureType.Alias) {
			return visibleAmount + " " + lang.get("mailAddressAliases_label")
		} else {
			return "" // not possible
		}
	}
}

function _getSubscriptionText(price: PriceServiceReturn): string {
	if (neverNull(price.futurePriceNextPeriod).paymentInterval === "12") {
		return lang.get("pricing.yearly_label") + ', ' + lang.get('automaticRenewal_label')
	} else {
		return lang.get("pricing.monthly_label") + ', ' + lang.get('automaticRenewal_label')
	}
}

function _getSubscriptionInfoText(price: PriceServiceReturn): string {
	return lang.get("endOfSubscriptionPeriod_label", {"{1}": formatDate(price.periodEndDate)})
}

function _getPriceText(price: PriceServiceReturn, featureType: NumberString): string {
	let netGrossText = neverNull(price.futurePriceNextPeriod).taxIncluded ? lang.get("gross_label") : lang.get("net_label")
	let periodText = (neverNull(price.futurePriceNextPeriod).paymentInterval === "12")
		? lang.get('pricing.perYear_label') : lang.get('pricing.perMonth_label')
	let futurePriceNextPeriod = _getPriceFromPriceData(price.futurePriceNextPeriod, featureType)
	let currentPriceNextPeriod = _getPriceFromPriceData(price.currentPriceNextPeriod, featureType)

	if (_isSinglePriceType(price.currentPriceThisPeriod, price.futurePriceNextPeriod, featureType)) {
		let priceDiff = futurePriceNextPeriod - currentPriceNextPeriod
		return formatPrice(priceDiff, true) + " " + periodText + " (" + netGrossText + ")"
	} else {
		return formatPrice(futurePriceNextPeriod, true) + " " + periodText + " (" + netGrossText + ")"
	}
}

function _getPriceInfoText(price: PriceServiceReturn, featureType: NumberString): string {
	if (_isUnbuy(price, featureType)) {
		return lang.get("priceChangeValidFrom_label", {"{1}": formatDate(price.periodEndDate)})
	} else if (price.currentPeriodAddedPrice && Number(price.currentPeriodAddedPrice) >= 0) {
		return lang.get("priceForCurrentAccountingPeriod_label", {"{1}": formatPrice(Number(price.currentPeriodAddedPrice), true)})
	} else {
		return ""
	}
}

function _isPriceChange(price: PriceServiceReturn, featureType: NumberString): boolean {
	return (_getPriceFromPriceData(price.currentPriceNextPeriod, featureType)
		!== _getPriceFromPriceData(price.futurePriceNextPeriod, featureType))
}

function _isBuy(price: PriceServiceReturn, featureType: NumberString): boolean {
	return (_getPriceFromPriceData(price.currentPriceNextPeriod, featureType)
		< _getPriceFromPriceData(price.futurePriceNextPeriod, featureType))
}

function _isUnbuy(price: PriceServiceReturn, featureType: NumberString): boolean {
	return (_getPriceFromPriceData(price.currentPriceNextPeriod, featureType)
		> _getPriceFromPriceData(price.futurePriceNextPeriod, featureType))
}

function _isSinglePriceType(currentPriceData: ?PriceData, futurePriceData: ?PriceData, featureType: NumberString): boolean {
	let item = getPriceItem(futurePriceData, featureType) || getPriceItem(currentPriceData, featureType)
	return neverNull(item).singleType
}


/**
 * Returns the price for the feature type from the price data if available, otherwise 0.
 */
function _getPriceFromPriceData(priceData: ?PriceData, featureType: NumberString): number {
	let item = getPriceItem(priceData, featureType)
	let itemPrice = item ? Number(item.price) : 0
	if (featureType === BookingItemFeatureType.Users) {
		itemPrice += _getPriceFromPriceData(priceData, BookingItemFeatureType.Whitelabel)
		itemPrice += _getPriceFromPriceData(priceData, BookingItemFeatureType.Sharing)
	}
	return itemPrice
}


