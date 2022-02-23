import m, {Children, Component, Vnode} from "mithril"
import {TextFieldN, TextFieldType} from "../gui/base/TextFieldN"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {lang, TranslationKey} from "../misc/LanguageViewModel"
import {AccountType, BookingItemFeatureType, FeatureType} from "../api/common/TutanotaConstants"
import {assertNotNull, filterInt, incrementDate, neverNull, ofClass} from "@tutao/tutanota-utils"
import {formatDate} from "../misc/Formatter"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {logins} from "../api/main/LoginController"
import {NotAuthorizedError} from "../api/common/error/RestError"
import {formatPrice, getPriceItem} from "./PriceUtils"
import {bookItem} from "./SubscriptionUtils"
import type {PriceServiceReturn} from "../api/entities/sys/PriceServiceReturn"
import type {PriceData} from "../api/entities/sys/PriceData"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import stream from "mithril/stream"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import {PriceItemData} from "../api/entities/sys/PriceItemData"

assertMainOrNode()

/**
 * Returns true if the order is accepted by the user, false otherwise.
 */
export async function showBuyDialog(featureType: BookingItemFeatureType, count: number, freeAmount: number, reactivate: boolean): Promise<boolean> {
	if (logins.isEnabled(FeatureType.HideBuyDialogs)) {
		return true
	}

	const customer = await locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
	if (customer.type === AccountType.PREMIUM && customer.canceledPremiumAccount) {
		await Dialog.message("subscriptionCancelledMessage_msg")
		return false
	} else {
		const price = await locator.bookingFacade.getPrice(featureType, count, reactivate)
		const priceChangeModel = new PriceChangeModel(price, featureType)
		if (!priceChangeModel.isPriceChange()) {
			return true
		} else {
			const customerInfo = await locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			const accountingInfo = await locator.entityClient
												.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
												.catch(ofClass(NotAuthorizedError, () => null))
			if (accountingInfo && accountingInfo.paymentMethod == null) {
				const confirm = await Dialog.confirm("enterPaymentDataFirst_msg")
				if (confirm) {
					m.route.set("/settings/invoice")
				}

				return false
			} else {
				return showDialog(
					priceChangeModel.isBuy() ? "buy_action" : "order_action",
					() => m(ConfirmSubscriptionView, {priceChangeModel, count, freeAmount})
				)
			}
		}
	}
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
export function showBuyDialogToBookItem(
	bookingItemFeatureType: BookingItemFeatureType,
	amount: number,
	freeAmount: number = 0,
	reactivate: boolean = false,
): Promise<boolean> {
	return showProgressDialog("pleaseWait_msg", showBuyDialog(bookingItemFeatureType, amount, freeAmount, reactivate)).then(accepted => {
		if (accepted) {
			return bookItem(bookingItemFeatureType, amount)
		} else {
			return true
		}
	})
}

function showDialog(okLabel: TranslationKey, view: () => Children) {
	return new Promise<boolean>(resolve => {
		let dialog: Dialog

		const doAction = (res: boolean) => {
			dialog.close()
			resolve(res)
		}

		dialog = Dialog.showActionDialog({
			title: () => lang.get("bookingSummary_label"),
			child: () => view(),
			okAction: () => doAction(true),
			cancelAction: () => doAction(false),
			type: DialogType.EditSmall,
		})
	})
}

interface ConfirmAttrs {
	priceChangeModel: PriceChangeModel,
	count: number,
	freeAmount: number,
}

class ConfirmSubscriptionView implements Component<ConfirmAttrs> {
	view({attrs}: Vnode<ConfirmAttrs>): Children {
		const {priceChangeModel, count, freeAmount} = attrs
		const chargeDate = incrementDate(priceChangeModel.periodEndDate(), 1)

		return m("", [
			m(TextFieldN, {
				label: "bookingOrder_label",
				value: stream(this.getBookingText(priceChangeModel, count, freeAmount)),
				type: TextFieldType.Area,
				disabled: true,
			}),
			priceChangeModel.isBuy()
				? m(TextFieldN, {
					label: "subscription_label",
					helpLabel: () => lang.get("nextChargeOn_label", {"{chargeDate}": formatDate(chargeDate)}),
					value: stream(this.getSubscriptionText(priceChangeModel)),
					disabled: true,
				})
				: null,
			m(TextFieldN, {
				label: "price_label",
				helpLabel: () => this.getPriceInfoText(priceChangeModel),
				value: stream(this.getPriceText(priceChangeModel)),
				disabled: true,
			}),
		])
	}

	private getBookingText(model: PriceChangeModel, count: number, freeAmount: number): string {
		if (model.isSinglePriceType()) {
			switch (model.featureType) {
				case BookingItemFeatureType.Users:
					if (count > 0) {
						const additionalFeatureLabels: string[] = []

						if (model.additionalFeatures.has(BookingItemFeatureType.Whitelabel)) {
							additionalFeatureLabels.push(lang.get("whitelabelFeature_label"))
						}

						if (model.additionalFeatures.has(BookingItemFeatureType.Sharing)) {
							additionalFeatureLabels.push(lang.get("sharingFeature_label"))
						}

						if (model.additionalFeatures.has(BookingItemFeatureType.Business)) {
							additionalFeatureLabels.push(lang.get("businessFeature_label"))
						}

						if (additionalFeatureLabels.length > 0) {
							return count + " " + lang.get("bookingItemUsersIncluding_label") + " " + additionalFeatureLabels.join(", ")
						} else {
							return count + " " + lang.get("bookingItemUsers_label")
						}
					} else {
						return lang.get("cancelUserAccounts_label", {
							"{1}": Math.abs(count),
						})
					}
				case BookingItemFeatureType.Whitelabel:
					if (count > 0) {
						return lang.get("whitelabelBooking_label", {"{1}": model.getFutureCount()})
					} else {
						return lang.get("cancelWhitelabelBooking_label", {"{1}": model.getCurrentCount()})
					}
				case BookingItemFeatureType.Sharing:
					if (count > 0) {
						return lang.get("sharingBooking_label", {
							"{1}": model.getFutureCount(),
						})
					} else {
						return lang.get("cancelSharingBooking_label", {
							"{1}": model.getCurrentCount(),
						})
					}
				case BookingItemFeatureType.Business:
					if (count > 0) {
						return lang.get("businessBooking_label", {
							"{1}": model.getFutureCount(),
						})
					} else {
						return lang.get("cancelBusinessBooking_label", {
							"{1}": model.getCurrentCount(),
						})
					}
				case BookingItemFeatureType.ContactForm:
					if (count > 0) {
						return count + " " + lang.get("contactForm_label")
					} else {
						return lang.get("cancelContactForm_label")
					}
				case BookingItemFeatureType.SharedMailGroup:
					if (count > 0) {
						return count + " " + lang.get(count === 1 ? "sharedMailbox_label" : "sharedMailboxes_label")
					} else {
						return lang.get("cancelSharedMailbox_label")
					}
				case BookingItemFeatureType.LocalAdminGroup:
					if (count > 0) {
						return count + " " + lang.get(count === 1 ? "localAdminGroup_label" : "localAdminGroups_label")
					} else {
						return lang.get("cancelLocalAdminGroup_label")
					}
				default:
					return ""
			}
		} else {
			let newPackageCount = 0

			if (model.futureItem != null) {
				newPackageCount = model.getFutureCount()
			}

			let visibleAmount = Math.max(count, freeAmount)

			switch (model.featureType) {
				case BookingItemFeatureType.Storage:
					if (count < 1000) {
						return lang.get("storageCapacity_label") + " " + visibleAmount + " GB"
					} else {
						return lang.get("storageCapacity_label") + " " + visibleAmount / 1000 + " TB"
					}
				case BookingItemFeatureType.Users:
					if (count > 0) {
						return lang.get("packageUpgradeUserAccounts_label", {
							"{1}": newPackageCount,
						})
					} else {
						return lang.get("packageDowngradeUserAccounts_label", {
							"{1}": newPackageCount,
						})
					}
				case BookingItemFeatureType.Alias:
					return visibleAmount + " " + lang.get("mailAddressAliases_label")
				default:
					return ""
			}
		}
	}

	private getSubscriptionText(model: PriceChangeModel): string {
		if (model.isYearly()) {
			return lang.get("pricing.yearly_label")
		} else {
			return lang.get("pricing.monthly_label")
		}
	}

	private getPriceText(model: PriceChangeModel): string {
		let netGrossText = model.taxIncluded() ? lang.get("gross_label") : lang.get("net_label")
		let periodText = model.isYearly() ? lang.get("pricing.perYear_label") : lang.get("pricing.perMonth_label")

		const futurePriceNextPeriod = model.futurePrice
		let currentPriceNextPeriod = model.currentPrice

		if (model.isSinglePriceType()) {
			const priceDiff = futurePriceNextPeriod - currentPriceNextPeriod
			return `${formatPrice(priceDiff, true)} ${periodText} (${netGrossText})`
		} else {
			return `${formatPrice(futurePriceNextPeriod, true)} ${periodText} (${netGrossText})`
		}
	}

	private getPriceInfoText(model: PriceChangeModel): string {
		if (model.isUnbuy()) {
			return lang.get("priceChangeValidFrom_label", {
				"{1}": formatDate(model.periodEndDate()),
			})
		} else if (model.addedPriceForCurrentPeriod() > 0) {
			return lang.get("priceForCurrentAccountingPeriod_label", {
				"{1}": formatPrice(model.addedPriceForCurrentPeriod(), true),
			})
		} else {
			return ""
		}
	}
}

class PriceChangeModel {
	readonly currentItem: PriceItemData | null
	readonly futureItem: PriceItemData | null
	readonly currentPrice: number
	readonly futurePrice: number
	readonly additionalFeatures: ReadonlySet<BookingItemFeatureType>

	constructor(
		private readonly price: PriceServiceReturn,
		readonly featureType: BookingItemFeatureType,
	) {
		this.currentItem = getPriceItem(price.currentPriceNextPeriod, featureType)
		this.futureItem = getPriceItem(price.futurePriceNextPeriod, featureType)
		this.currentPrice = this.getPriceFromPriceData(price.currentPriceNextPeriod, featureType)
		this.futurePrice = this.getPriceFromPriceData(price.futurePriceNextPeriod, featureType)

		if (this.featureType === BookingItemFeatureType.Users) {
			this.additionalFeatures = new Set(
				[BookingItemFeatureType.Whitelabel, BookingItemFeatureType.Sharing, BookingItemFeatureType.Business]
					.filter(f => this.getFuturePrice(f) > 0)
			)
		} else {
			this.additionalFeatures = new Set()
		}
	}

	isBuy() {
		return this.currentPrice < this.futurePrice
	}

	isUnbuy() {
		return this.currentPrice > this.futurePrice
	}

	isPriceChange() {
		return this.currentPrice !== this.futurePrice
	}

	isSinglePriceType() {
		return this.anyItem().singleType
	}

	getCurrentCount(): number {
		return filterInt(assertNotNull(this.currentItem).count)
	}

	getFutureCount(): number {
		return filterInt(assertNotNull(this.futureItem).count)
	}

	isYearly(): boolean {
		return assertNotNull(this.price.futurePriceNextPeriod ?? this.price.currentPriceNextPeriod).paymentInterval === "12"
	}

	taxIncluded(): boolean {
		return assertNotNull(this.price.futurePriceNextPeriod).taxIncluded
	}

	periodEndDate(): Date {
		return this.price.periodEndDate
	}

	addedPriceForCurrentPeriod(): number {
		return this.price.currentPeriodAddedPrice ? filterInt(this.price.currentPeriodAddedPrice) : 0
	}

	private anyItem() {
		return assertNotNull(this.futureItem ?? this.currentItem)
	}

	private getFuturePrice(featureType: BookingItemFeatureType) {
		return this.getPriceFromPriceData(this.price.futurePriceNextPeriod, featureType)
	}

	/**
	 * Returns the price for the feature type from the price data if available, otherwise 0.
	 */
	private getPriceFromPriceData(priceData: PriceData | null, featureType: NumberString): number {
		let item = getPriceItem(priceData, featureType)
		let itemPrice = item ? Number(item.price) : 0

		if (featureType === BookingItemFeatureType.Users) {
			itemPrice += this.getPriceFromPriceData(priceData, BookingItemFeatureType.Whitelabel)
			itemPrice += this.getPriceFromPriceData(priceData, BookingItemFeatureType.Sharing)
		}

		return itemPrice
	}
}