import type {BookingItemFeatureType} from "../../common/TutanotaConstants"
import {Const} from "../../common/TutanotaConstants"
import {createPriceServiceData} from "../../entities/sys/TypeRefs.js"
import {createPriceRequestData} from "../../entities/sys/TypeRefs.js"
import type {PriceServiceReturn} from "../../entities/sys/TypeRefs.js"
import {neverNull} from "@tutao/tutanota-utils"
import type {PriceData} from "../../entities/sys/TypeRefs.js"
import type {PriceItemData} from "../../entities/sys/TypeRefs.js"
import {assertWorkerOrNode} from "../../common/Env"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {PriceService} from "../../entities/sys/Services"

assertWorkerOrNode()

export class BookingFacade {
	constructor(
		private readonly serviceExecutor: IServiceExecutor,
	) {
	}

	/**
	 * Provides the price for a given feature type and count.
	 * @param  type The booking feature type, one of tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_*.
	 * @param  count Number of items, may be negative.
	 * @param  reactivate  If true a user or group is reactivated instead of created - not used for aliases, storage or branding
	 * @param  paymentInterval. If not provided the customers payment interval is used.
	 * @param  accountType The account type, one of tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_*. If not provided, the customers account type is used.
	 * @param  business Business or private.
	 * @return Resolves to PriceServiceReturn or an exception if the loading failed.
	 */
	getPrice(type: BookingItemFeatureType, count: number, reactivate: boolean): Promise<PriceServiceReturn> {
		const priceRequestData = createPriceRequestData({
			featureType: type,
			count: String(count),
			reactivate,
			paymentInterval: null,
			accountType: null,
			business: null
		})
		const serviceData = createPriceServiceData({
			date: Const.CURRENT_DATE,
			priceRequest: priceRequestData,
			campaign: null,
		})
		return this.serviceExecutor.get(PriceService, serviceData)
	}

	/**
	 * Provides the price for a given feature type and count.
	 * @return Resolves to PriceServiceReturn or an exception if the loading failed.
	 */
	getCurrentPrice(): Promise<PriceServiceReturn> {
		const serviceData = createPriceServiceData()
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
			return neverNull(priceData).items.find(p => p.featureType === featureType) ?? null
		}

		return null
	}
}
