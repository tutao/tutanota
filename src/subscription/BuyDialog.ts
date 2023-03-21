import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull, filterInt, incrementDate, neverNull, ofClass } from "@tutao/tutanota-utils"
import { TextField, TextFieldType } from "../gui/base/TextField.js"
import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { AccountType, BookingItemFeatureType, FeatureType } from "../api/common/TutanotaConstants.js"
import { formatDate } from "../misc/Formatter.js"
import type { PriceData, PriceServiceReturn } from "../api/entities/sys/TypeRefs.js"
import { AccountingInfoTypeRef, CustomerInfoTypeRef, CustomerTypeRef, PriceItemData } from "../api/entities/sys/TypeRefs.js"
import { NotAuthorizedError } from "../api/common/error/RestError.js"
import { asPaymentInterval, formatPrice, getPriceItem, PaymentInterval } from "./PriceUtils.js"
import { bookItem } from "./SubscriptionUtils.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { locator } from "../api/main/MainLocator.js"
import { assertMainOrNode } from "../api/common/Env.js"

assertMainOrNode()

export interface BookingParams {
	featureType: BookingItemFeatureType
	count: number
	freeAmount: number
	reactivate: boolean
}

/**
 * Returns true if the order is accepted by the user, false otherwise.
 */
export async function showBuyDialog(params: BookingParams): Promise<boolean> {
	if (locator.logins.isEnabled(FeatureType.HideBuyDialogs)) {
		return true
	}
	const priceChangeModel = await showProgressDialog("pleaseWait_msg", prepareDialog(params))
	if (priceChangeModel) {
		return showDialog(priceChangeModel.getActionLabel(), () =>
			m(ConfirmSubscriptionView, { priceChangeModel, count: params.count, freeAmount: params.freeAmount }),
		)
	} else {
		return false
	}
}

async function prepareDialog({ featureType, count, reactivate }: BookingParams): Promise<PriceChangeModel | null> {
	const customer = await locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
	if (customer.type === AccountType.PREMIUM && customer.canceledPremiumAccount) {
		await Dialog.message("subscriptionCancelledMessage_msg")
		return null
	} else {
		const price = await locator.bookingFacade.getPrice(featureType, count, reactivate)
		const priceChangeModel = new PriceChangeModel(price, featureType)
		const customerInfo = await locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
		const accountingInfo = await locator.entityClient
			.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
			.catch(ofClass(NotAuthorizedError, () => null))
		if (accountingInfo && accountingInfo.paymentMethod == null) {
			const confirm = await Dialog.confirm("enterPaymentDataFirst_msg")
			if (confirm) {
				m.route.set("/settings/invoice")
			}

			return null
		} else {
			return priceChangeModel
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
export async function showSharingBuyDialog(enable: boolean): Promise<boolean> {
	const ok = enable ? true : await Dialog.confirm("sharingDeletionWarning_msg")
	if (ok) {
		return showBuyDialogToBookItem(BookingItemFeatureType.Sharing, enable ? 1 : 0)
	} else {
		return true
	}
}

/**
 * Shows the buy dialog to enable or disable the business package.
 * @param enable true if the business package should be enabled otherwise false.
 * @returns false if the execution was successful. True if the action has been cancelled by user or the precondition has failed.
 */
export async function showBusinessBuyDialog(enable: boolean): Promise<boolean> {
	const ok = enable ? true : await Dialog.confirm("businessDeletionWarning_msg")
	if (ok) {
		return showBuyDialogToBookItem(BookingItemFeatureType.Business, enable ? 1 : 0)
	} else {
		return true
	}
}

/**
 * @returns True if it failed, false otherwise
 */
export async function showBuyDialogToBookItem(
	bookingItemFeatureType: BookingItemFeatureType,
	count: number,
	freeAmount: number = 0,
	reactivate: boolean = false,
): Promise<boolean> {
	const accepted = await showBuyDialog({ featureType: bookingItemFeatureType, count, freeAmount, reactivate })
	if (accepted) {
		return bookItem(bookingItemFeatureType, count)
	} else {
		return true
	}
}

function showDialog(okLabel: TranslationKey, view: () => Children) {
	return new Promise<boolean>((resolve) => {
		let dialog: Dialog

		const doAction = (res: boolean) => {
			dialog.close()
			resolve(res)
		}

		dialog = Dialog.showActionDialog({
			okActionTextId: okLabel,
			title: () => lang.get("bookingSummary_label"),
			child: () => view(),
			okAction: () => doAction(true),
			cancelAction: () => doAction(false),
			type: DialogType.EditSmall,
		})
	})
}

interface ConfirmAttrs {
	priceChangeModel: PriceChangeModel
	count: number
	freeAmount: number
}

class ConfirmSubscriptionView implements Component<ConfirmAttrs> {
	view({ attrs }: Vnode<ConfirmAttrs>): Children {
		const { priceChangeModel, count, freeAmount } = attrs
		const chargeDate = incrementDate(priceChangeModel.periodEndDate(), 1)

		return m("", [
			m(TextField, {
				label: "bookingOrder_label",
				value: this.getBookingText(priceChangeModel, count, freeAmount),
				type: TextFieldType.Area,
				disabled: true,
			}),
			priceChangeModel.isBuy()
				? m(TextField, {
						label: "subscription_label",
						helpLabel: () => lang.get("nextChargeOn_label", { "{chargeDate}": formatDate(chargeDate) }),
						value: this.getSubscriptionText(priceChangeModel),
						disabled: true,
				  })
				: null,
			m(TextField, {
				label: "price_label",
				helpLabel: () => this.getPriceInfoText(priceChangeModel),
				value: this.getPriceText(priceChangeModel),
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
						return lang.get("whitelabelBooking_label", { "{1}": model.getFutureCount() })
					} else {
						return lang.get("cancelWhitelabelBooking_label", { "{1}": model.getCurrentCount() })
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

			const visibleAmount = Math.max(count, freeAmount)

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

	constructor(private readonly price: PriceServiceReturn, readonly featureType: BookingItemFeatureType) {
		this.currentItem = getPriceItem(price.currentPriceNextPeriod, featureType)
		this.futureItem = getPriceItem(price.futurePriceNextPeriod, featureType)
		this.currentPrice = this.getPriceFromPriceData(price.currentPriceNextPeriod, featureType)
		this.futurePrice = this.getPriceFromPriceData(price.futurePriceNextPeriod, featureType)

		if (this.featureType === BookingItemFeatureType.Users) {
			this.additionalFeatures = new Set(
				[BookingItemFeatureType.Whitelabel, BookingItemFeatureType.Sharing, BookingItemFeatureType.Business].filter((f) => this.getFuturePrice(f) > 0),
			)
		} else {
			this.additionalFeatures = new Set()
		}
	}

	getActionLabel(): TranslationKey {
		if (!this.isPriceChange()) {
			return "accept_action"
		}
		if (this.isBuy()) {
			return "buy_action"
		}
		return "order_action"
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
		const period = assertNotNull(this.price.futurePriceNextPeriod ?? this.price.currentPriceNextPeriod)
		return asPaymentInterval(period.paymentInterval) === PaymentInterval.Yearly
	}

	taxIncluded(): boolean {
		return assertNotNull(this.price.futurePriceNextPeriod).taxIncluded
	}

	periodEndDate(): Date {
		// return a copy to prevent the date from being changed by the caller
		return new Date(this.price.periodEndDate)
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
			itemPrice += this.getPriceFromPriceData(priceData, BookingItemFeatureType.Business)
		}

		return itemPrice
	}
}
