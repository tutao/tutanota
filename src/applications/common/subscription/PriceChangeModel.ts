import { assertNotNull } from "@tutao/utils"
import { assertMainOrNode } from "@tutao/app-env"
import { asPaymentInterval, getPriceItem, PaymentInterval } from "./utils/PriceUtils.js"
import { PriceData, PriceItemData, PriceServiceReturn } from "@tutao/entities/sys"
import { BookingItemFeatureType } from "../../../entities/sys/Utils"
import { TranslationKey } from "../../../ui/utils/LanguageViewModel"

assertMainOrNode()

export class PriceChangeModel {
	readonly currentItem: PriceItemData | null
	readonly futureItem: PriceItemData | null
	readonly currentPriceThisPeriod: number
	readonly futurePriceThisPeriod: number
	readonly currentTotalPriceThisPeriod: number
	readonly futureTotalPriceThisPeriod: number
	readonly priceDeltaThisPeriod: number
	readonly priceDeltaNextPeriod: number
	readonly currentPeriodProratedPrice: number | null

	constructor(
		private readonly price: PriceServiceReturn,
		readonly featureType: BookingItemFeatureType,
	) {
		this.currentItem = getPriceItem(price.currentPriceThisPeriod, featureType)
		this.futureItem = getPriceItem(price.futurePriceNextPeriod, featureType)
		this.currentPriceThisPeriod = this.getPriceFromPriceData(price.currentPriceThisPeriod, featureType)
		this.futurePriceThisPeriod = this.getPriceFromPriceData(price.futurePriceThisPeriod, featureType)
		this.currentTotalPriceThisPeriod = this.getTotalPriceFromPriceData(price.currentPriceThisPeriod)
		this.futureTotalPriceThisPeriod = this.getTotalPriceFromPriceData(price.futurePriceThisPeriod)
		this.priceDeltaThisPeriod = this.futureTotalPriceThisPeriod - this.currentTotalPriceThisPeriod
		this.priceDeltaNextPeriod = this.getTotalPriceFromPriceData(price.futurePriceNextPeriod) - this.getTotalPriceFromPriceData(price.currentPriceNextPeriod)
		this.currentPeriodProratedPrice = price.currentPeriodAddedPrice != null ? parseFloat(price.currentPeriodAddedPrice) : null
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
		return this.currentPriceThisPeriod < this.futurePriceThisPeriod
	}

	isUnbuy() {
		return this.currentPriceThisPeriod > this.futurePriceThisPeriod
	}

	isPriceChange() {
		return this.currentPriceThisPeriod !== this.futurePriceThisPeriod
	}

	isSinglePriceType() {
		return this.anyItem().singleType
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

	private anyItem() {
		return assertNotNull(this.futureItem ?? this.currentItem)
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

	private getTotalPriceFromPriceData(priceData: PriceData | null): number {
		if (priceData == null) {
			return 0
		}
		return parseFloat(priceData.price)
	}
}
