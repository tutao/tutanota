import type {BookingItemFeatureTypeEnum} from "../../common/TutanotaConstants"
// @flow
import {Const, PaymentMethodType} from "../../common/TutanotaConstants"
import {createPriceServiceData} from "../../entities/sys/PriceServiceData"
import {createPriceRequestData} from "../../entities/sys/PriceRequestData"
import {serviceRequest} from "../EntityWorker"
import {PriceServiceReturnTypeRef} from "../../entities/sys/PriceServiceReturn"
import {neverNull} from "../../common/utils/Utils"
import {assertWorkerOrNode} from "../../Env"
import {HttpMethod} from "../../common/EntityFunctions"

assertWorkerOrNode()

export class BookingFacade {

	constructor() {

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
	getPrice(type: BookingItemFeatureTypeEnum, count: number, reactivate: boolean, paymentInterval: ?number, accountType: ?NumberString, business: ?boolean, campaign: ?string): Promise<PriceServiceReturn> {
		let serviceData = createPriceServiceData()
		serviceData.date = Const.CURRENT_DATE
		let priceRequestData = createPriceRequestData()
		priceRequestData.featureType = type
		priceRequestData.count = String(count)
		priceRequestData.reactivate = reactivate
		priceRequestData.paymentInterval = paymentInterval ? String(paymentInterval) : null
		priceRequestData.accountType = accountType ? accountType : null
		priceRequestData.business = business == undefined ? null : business
		serviceData.priceRequest = priceRequestData
		serviceData.campaign = campaign
		return serviceRequest("priceservice", HttpMethod.GET, serviceData, PriceServiceReturnTypeRef)
	}


	/**
	 * Provides the price for a given feature type and count.
	 * @return Resolves to PriceServiceReturn or an exception if the loading failed.
	 */
	getCurrentPrice(): Promise<PriceServiceReturn> {
		let serviceData = createPriceServiceData()
		return serviceRequest("priceservice", HttpMethod.GET, serviceData, PriceServiceReturnTypeRef)
	}

	/**
	 * Formats the given price including currency.
	 * @param price The given price.
	 * @param includeCurrency true if the currency should be included.
	 * @param decimalSeparator The decimal separator for the currency format.
	 * @returns The price string.
	 */
	formatPrice(price: number, includeCurrency: boolean, decimalSeparator: string): string {
		let string = price.toFixed(2).replace(".", decimalSeparator);
		let currency = includeCurrency ? (" " + Const.CURRENCY_SYMBOL_EUR) : "";
		if (string.indexOf(decimalSeparator) === -1) {
			return string + decimalSeparator + "00" + currency;
		} else if (string.indexOf(decimalSeparator) === string.length - 2) {
			return string + "0" + currency;
		} else {
			return string + currency;
		}
	}

	/**
	 * TODO: move to main area
	 * Provides the name of the given payment method.
	 * @param  paymentMethod One of tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_*.
	 */
	getPaymentMethodNameTextId(paymentMethod: NumberString): string | lazy<string> {
		if (paymentMethod === PaymentMethodType.Invoice) {
			return "paymentMethodOnAccount_label";
		} else if (paymentMethod === PaymentMethodType.CreditCard) {
			return "paymentMethodCreditCard_label";
		} else if (paymentMethod === PaymentMethodType.Sepa) {
			return () => "SEPA";
		} else if (paymentMethod === PaymentMethodType.Paypal) {
			return () => "PayPal";
		} else {
			return () => "";
		}
	};


	/**
	 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
	 * @param  priceData The given price data.
	 * @param  featureType The booking item feature type
	 * @return The price item or null
	 */
	getPriceItem(priceData: ?PriceData, featureType: NumberString): ?PriceItemData {
		if (priceData != null) {
			return neverNull(priceData).items.find(p => p.featureType === featureType);
		}
		return null;
	}
}

export const bookingFacade: BookingFacade = new BookingFacade()
