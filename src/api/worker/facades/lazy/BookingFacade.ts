import type { BookingItemFeatureType } from "../../../common/TutanotaConstants.js"
import { Const } from "../../../common/TutanotaConstants.js"
import type { PriceData, PriceItemData, PriceServiceReturn } from "../../../entities/sys/TypeRefs.js"
import { createPriceRequestData, createPriceServiceData } from "../../../entities/sys/TypeRefs.js"
import { neverNull } from "@tutao/tutanota-utils"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { PriceService } from "../../../entities/sys/Services.js"

assertWorkerOrNode()

export class BookingFacade {
	constructor(private readonly serviceExecutor: IServiceExecutor) {}

	/**
	 * Provides the price for a given feature type and count.
	 * @param  type The booking feature type, one of tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_*.
	 * @param  count Number of items, may be negative.
	 * @param  reactivate  If true a user or group is reactivated instead of created - not used for aliases, storage or branding
	 * @return Resolves to PriceServiceReturn or an exception if the loading failed.
	 */
	getPrice(type: BookingItemFeatureType, count: number, reactivate: boolean): Promise<PriceServiceReturn> {
		const priceRequestData = createPriceRequestData({
			featureType: type,
			count: String(count),
			reactivate,
			paymentInterval: null,
			accountType: null,
			business: null,
		})
		const serviceData = createPriceServiceData({
			date: Const.CURRENT_DATE,
			priceRequest: priceRequestData,
		})
		return this.serviceExecutor.get(PriceService, serviceData)
	}

	/**
	 * Provides the price for a given feature type and count.
	 * @return Resolves to PriceServiceReturn or an exception if the loading failed.
	 */
	getCurrentPrice(): Promise<PriceServiceReturn> {
		const serviceData = createPriceServiceData({
			date: null,
			priceRequest: null,
		})
		return this.serviceExecutor.get(PriceService, serviceData)
	}

	/**
	 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
	 * @param  priceData The given price data.
	 * @param  featureType The booking item feature type
	 * @return The price item or null
	 */
	getPriceItem(priceData: PriceData | null, featureType: NumberString): PriceItemData | null {
		if (priceData != null) {
			return neverNull(priceData).items.find((p) => p.featureType === featureType) ?? null
		}

		return null
	}
}
