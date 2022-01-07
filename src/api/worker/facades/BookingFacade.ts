import type {BookingItemFeatureType} from "../../common/TutanotaConstants"
import {Const} from "../../common/TutanotaConstants"
import {createPriceServiceData} from "../../entities/sys/PriceServiceData"
import {createPriceRequestData} from "../../entities/sys/PriceRequestData"
import {serviceRequest} from "../ServiceRequestWorker"
import type {PriceServiceReturn} from "../../entities/sys/PriceServiceReturn"
import {PriceServiceReturnTypeRef} from "../../entities/sys/PriceServiceReturn"
import {neverNull} from "@tutao/tutanota-utils"
import {HttpMethod} from "../../common/EntityFunctions"
import {SysService} from "../../entities/sys/Services"
import type {PriceData} from "../../entities/sys/PriceData"
import type {PriceItemData} from "../../entities/sys/PriceItemData"
import {assertWorkerOrNode} from "../../common/Env"
assertWorkerOrNode()
export class BookingFacade {
    constructor() {}

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
        let serviceData = createPriceServiceData()
        serviceData.date = Const.CURRENT_DATE
        let priceRequestData = createPriceRequestData()
        priceRequestData.featureType = type
        priceRequestData.count = String(count)
        priceRequestData.reactivate = reactivate
        priceRequestData.paymentInterval = null
        priceRequestData.accountType = null
        priceRequestData.business = null
        serviceData.priceRequest = priceRequestData
        serviceData.campaign = null
        return serviceRequest(SysService.PriceService, HttpMethod.GET, serviceData, PriceServiceReturnTypeRef)
    }

    /**
     * Provides the price for a given feature type and count.
     * @return Resolves to PriceServiceReturn or an exception if the loading failed.
     */
    getCurrentPrice(): Promise<PriceServiceReturn> {
        let serviceData = createPriceServiceData()
        return serviceRequest(SysService.PriceService, HttpMethod.GET, serviceData, PriceServiceReturnTypeRef)
    }

    /**
     * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
     * @param  priceData The given price data.
     * @param  featureType The booking item feature type
     * @return The price item or null
     */
    getPriceItem(priceData: PriceData | null, featureType: NumberString): PriceItemData | null {
        if (priceData != null) {
            return neverNull(priceData).items.find(p => p.featureType === featureType)
        }

        return null
    }
}
export const bookingFacade: BookingFacade = new BookingFacade()