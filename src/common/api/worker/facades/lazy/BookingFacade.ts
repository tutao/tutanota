import { Const } from "@tutao/app-env"
import { neverNull } from "@tutao/utils"
import { assertWorkerOrNode, BookingItemFeatureType } from "@tutao/app-env"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { sysServices, sysTypeRefs } from "@tutao/typerefs"

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
	getPrice(type: BookingItemFeatureType, count: number, reactivate: boolean): Promise<sysTypeRefs.PriceServiceReturn> {
		const priceRequestData = sysTypeRefs.createPriceRequestData({
			featureType: type,
			count: String(count),
			reactivate,
			paymentInterval: null,
			accountType: null,
			business: null,
		})
		const serviceData = sysTypeRefs.createPriceServiceData({
			date: Const.CURRENT_DATE,
			priceRequest: priceRequestData,
		})
		return this.serviceExecutor.get(sysServices.PriceService, serviceData)
	}

	/**
	 * Provides the price for a given feature type and count.
	 * @return Resolves to PriceServiceReturn or an exception if the loading failed.
	 */
	getCurrentPrice(): Promise<sysTypeRefs.PriceServiceReturn> {
		const serviceData = sysTypeRefs.createPriceServiceData({
			date: null,
			priceRequest: null,
		})
		return this.serviceExecutor.get(sysServices.PriceService, serviceData)
	}

	/**
	 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
	 * @param  priceData The given price data.
	 * @param  featureType The booking item feature type
	 * @return The price item or null
	 */
	getPriceItem(priceData: sysTypeRefs.PriceData | null, featureType: NumberString): sysTypeRefs.PriceItemData | null {
		if (priceData != null) {
			return neverNull(priceData).items.find((p) => p.featureType === featureType) ?? null
		}

		return null
	}
}
