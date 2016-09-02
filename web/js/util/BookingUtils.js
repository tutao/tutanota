"use strict";

tutao.provide('tutao.util.BookingUtils');

/**
 * Provides the price for a given feature type and count.
 * @param {string} bookingItemFeatureType The booking feature type, one of tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_*.
 * @param {number} count Number of items, may be negative.
 * @param {number=} paymentInterval. If not provided the customers payment interval is used.
 * @param {string=} accountType The account type, one of tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_*. If not provided, the customers account type is used.
 * @param {boolean=} business Business or private.
 * @return {Promise.<tutao.entity.sys.PriceServiceReturn>} Resolves to PriceServiceReturn or an exception if the loading failed.
 */
tutao.util.BookingUtils.getPrice = function(bookingItemFeatureType, count, paymentInterval, accountType, business) {
    var data = new tutao.entity.sys.PriceServiceData()
        .setDate(tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE);
    var priceRequestData = new tutao.entity.sys.PriceRequestData(data)
        .setFeatureType(bookingItemFeatureType)
        .setCount(String(count))
        .setPaymentInterval(paymentInterval ? String(paymentInterval) : null)
        .setAccountType(accountType ? accountType : null)
        .setBusiness((business == undefined) ? null : business);
    data.setPriceRequest(priceRequestData);

    return tutao.entity.sys.PriceServiceReturn.load(data, {}, null);
};

/**
 * Provides the price for a given feature type and count.
 * @return {Promise.<tutao.entity.sys.PriceServiceReturn>} Resolves to PriceServiceReturn or an exception if the loading failed.
 */
tutao.util.BookingUtils.getCurrentPrice = function() {
    var data = new tutao.entity.sys.PriceServiceData();
    return tutao.entity.sys.PriceServiceReturn.load(data, {}, null);
};

/**
 * Formats the given price including currency.
 * @param {Number} price The given price.
 * @param {boolean} includeCurrency true if the currency should be included.
 * @returns {string} The price string.
 */
tutao.util.BookingUtils.formatPrice = function(price, includeCurrency ) {
    var string = price.toFixed(2).replace(".", ",");
    var currency = includeCurrency ? (" " + tutao.entity.tutanota.TutanotaConstants.CURRENCY_SYMBOL_EUR) : "";
    if (string.indexOf(",") == -1) {
        return string + ",00" + currency;
    } else if (string.indexOf(",") == string.length - 2) {
        return string + "0" + currency;
    } else {
        return string + currency;
    }
};

/**
 * Provides the name of the given payment method.
 * @param {string} paymentMethod One of tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_*.
 */
tutao.util.BookingUtils.getPaymentMethodNameTextId = function(paymentMethod) {
    if (paymentMethod == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_INVOICE) {
        return "paymentMethodOnAccount_label";
    } else if (paymentMethod == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_CREDIT_CARD) {
        return "paymentMethodCreditCard_label";
    } else if (paymentMethod == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_SEPA) {
        return "@SEPA";
    } else if (paymentMethod == tutao.entity.tutanota.TutanotaConstants.PAYMENT_METHOD_PAY_PAL) {
        return "@PayPal";
    } else {
        return "";
    }
};
