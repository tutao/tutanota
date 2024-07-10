import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull, filterInt, incrementDate, ofClass } from "@tutao/tutanota-utils"
import { TextField, TextFieldType } from "../gui/base/TextField.js"
import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { BookingItemFeatureType, FeatureType } from "../api/common/TutanotaConstants.js"
import { formatDate } from "../misc/Formatter.js"
import type { PriceData, PriceServiceReturn } from "../api/entities/sys/TypeRefs.js"
import { AccountingInfoTypeRef, PriceItemData } from "../api/entities/sys/TypeRefs.js"
import { NotAuthorizedError } from "../api/common/error/RestError.js"
import { asPaymentInterval, formatPrice, getPriceItem, PaymentInterval } from "./PriceUtils.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { locator } from "../api/main/CommonLocator.js"
import { assertMainOrNode } from "../api/common/Env.js"

assertMainOrNode()

export interface BookingParams {
	featureType: BookingItemFeatureType
	bookingText: TranslationKey
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
			m(ConfirmSubscriptionView, { priceChangeModel, count: params.count, freeAmount: params.freeAmount, bookingText: params.bookingText }),
		)
	} else {
		return false
	}
}

async function prepareDialog({ featureType, count, reactivate }: BookingParams): Promise<PriceChangeModel | null> {
	const price = await locator.bookingFacade.getPrice(featureType, count, reactivate)
	const priceChangeModel = new PriceChangeModel(price, featureType)
	const customerInfo = await locator.logins.getUserController().loadCustomerInfo()
	const accountingInfo = await locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).catch(ofClass(NotAuthorizedError, () => null))
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
	bookingText: TranslationKey
}

class ConfirmSubscriptionView implements Component<ConfirmAttrs> {
	view({ attrs }: Vnode<ConfirmAttrs>): Children {
		const { priceChangeModel, count, freeAmount } = attrs
		const chargeDate = incrementDate(priceChangeModel.periodEndDate(), 1)

		return m("", [
			m(TextField, {
				label: "bookingOrder_label",
				value: lang.get(attrs.bookingText, {
					"{1}": Math.abs(count),
				}),
				type: TextFieldType.Area,
				isReadOnly: true,
			}),
			priceChangeModel.isBuy()
				? m(TextField, {
						label: "subscription_label",
						helpLabel: () => lang.get("nextChargeOn_label", { "{chargeDate}": formatDate(chargeDate) }),
						value: this.getSubscriptionText(priceChangeModel),
						isReadOnly: true,
				  })
				: null,
			m(TextField, {
				label: "price_label",
				helpLabel: () => this.getPriceInfoText(priceChangeModel),
				value: this.getPriceText(priceChangeModel),
				isReadOnly: true,
			}),
		])
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

		if (this.featureType === BookingItemFeatureType.LegacyUsers) {
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

		if (featureType === BookingItemFeatureType.LegacyUsers) {
			itemPrice += this.getPriceFromPriceData(priceData, BookingItemFeatureType.Whitelabel)
			itemPrice += this.getPriceFromPriceData(priceData, BookingItemFeatureType.Sharing)
			itemPrice += this.getPriceFromPriceData(priceData, BookingItemFeatureType.Business)
		}

		return itemPrice
	}
}
