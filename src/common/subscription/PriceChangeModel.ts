import { assertNotNull, filterInt } from "@tutao/utils"
import { TranslationKey } from "../misc/LanguageViewModel.js"
import { assertMainOrNode, BookingItemFeatureType } from "@tutao/app-env"
import { asPaymentInterval, getPriceItem, PaymentInterval } from "./utils/PriceUtils.js"
import { sysTypeRefs } from "@tutao/typerefs"

assertMainOrNode()

export class PriceChangeModel {
	readonly currentItem: sysTypeRefs.PriceItemData | null
	readonly futureItem: sysTypeRefs.PriceItemData | null
	readonly currentPrice: number
	readonly futurePrice: number

	constructor(
		private readonly price: sysTypeRefs.PriceServiceReturn,
		readonly featureType: BookingItemFeatureType,
	) {
		this.currentItem = getPriceItem(price.currentPriceNextPeriod, featureType)
		this.futureItem = getPriceItem(price.futurePriceNextPeriod, featureType)
		this.currentPrice = this.getPriceFromPriceData(price.currentPriceNextPeriod, featureType)
		this.futurePrice = this.getPriceFromPriceData(price.futurePriceNextPeriod, featureType)
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
	private getPriceFromPriceData(priceData: sysTypeRefs.PriceData | null, featureType: NumberString): number {
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
