"use strict";

tutao.provide('tutao.tutanota.ctrl.BuyDialogViewModel');

/**
 * The ViewModel for buying or cancelling items.
 * @constructor
 */
tutao.tutanota.ctrl.BuyDialogViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.visible = ko.observable(false);
    this._resolveFunction = null;
    this._accountingInfo = null;
    this._price = null;
    this.loaded = ko.observable(false);
    this._featureType = null;
    this._count = 0;
};

/**
 * Shows the dialog.
 * @return {Promise<?boolean>} Provides true if the dialog was accepted, false otherwise.
 */
tutao.tutanota.ctrl.BuyDialogViewModel.prototype.showDialog = function(featureType, count) {
    var self = this;
    self.loaded(false);
    this._featureType = featureType;
    this._count = count;
    return tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                return tutao.util.BookingUtils.getPrice(featureType, count).then(function(price) {
                    self._price = price;
                    self._accountingInfo = accountingInfo;
                    self.loaded(true);
                });
            });
        });
    }).then(function() {
        if (!self.isPriceChange()) {
            return Promise.resolve(true);
        } else {
            return new Promise(function (resolve, reject) {
                self._resolveFunction = resolve;
                self.visible(true);
            });
        }
    })
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype._getItem = function(priceData) {
    var items = priceData.getItems();
    for (var i = 0; i < items.length; i++) {
        if (items[i].getFeatureType() == this._featureType) {
            return items[i];
        }
    }
    return null; // should not happen
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.ok = function() {
    this.visible(false);
    this._resolveFunction(true);
};


tutao.tutanota.ctrl.BuyDialogViewModel.prototype.cancel = function() {
    this.visible(false);
    this._resolveFunction(false);
};


tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getBookingText = function() {
    if (!this.loaded()) {
        return tutao.lang("loading_msg");
    } else {
        var item = this._getItem(this._price.getFuturePriceNextPeriod());
        if (item.getSingleType()) {
            if (this._count > 0) {
                return this._count + " " + tutao.lang("bookingItemUsers_label");
            } else {
                return tutao.lang("cancelUserAccounts_label", {"{1}": Math.abs(this._count)});
            }
        } else {
            var newPackageCount = item.getCount();
            if (this._count > 0) {
                return tutao.lang("packageUpgradeUserAccounts_label", {"{1}": newPackageCount});
            } else {
                return tutao.lang("packageDowngradeUserAccounts_label", {"{1}": newPackageCount});
            }
        }
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getSubscriptionText = function() {
    if (!this.loaded()) {
        return tutao.lang("loading_msg");
    } else if (this._price.getFuturePriceNextPeriod().getPaymentInterval() == "12") {
        return tutao.lang("yearly_label") + ', ' + tutao.lang('automaticRenewal_label');
    } else {
        return tutao.lang("monthly_label") + ', ' + tutao.lang('automaticRenewal_label');
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getSubscriptionInfoText = function() {
    if (!this.loaded()) {
        return tutao.lang("loading_msg");
    } else {
        return tutao.lang("endOfSubscriptionPeriod_label", { "{1}": tutao.tutanota.util.Formatter.formatDate(this._price.getPeriodEndDate()) });
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getPriceText = function() {
    if (!this.loaded()) {
        return tutao.lang("loading_msg");
    } else {
        var netGrossText = this._price.getFuturePriceNextPeriod().getTaxIncluded() ? tutao.lang("gross_label") : tutao.lang("net_label");
        var periodText = (this._price.getFuturePriceNextPeriod().getPaymentInterval() == "12") ? tutao.lang('perYear_label') : tutao.lang('perMonth_label');
        if (this._getItem(this._price.getFuturePriceNextPeriod()).getSingleType()) {
            return tutao.util.BookingUtils.formatPrice(Number(this._price.getFuturePriceNextPeriod().getPrice()) - Number(this._price.getCurrentPriceNextPeriod().getPrice())) + " " + periodText + " (" + netGrossText + ")";
        } else {
            return tutao.util.BookingUtils.formatPrice(Number(this._price.getFuturePriceNextPeriod().getPrice())) + " " + periodText + " (" + netGrossText + ")";
        }
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getPriceInfoText = function() {
    if (!this.loaded()) {
        return tutao.lang("loading_msg");
    } else if (this._price.getCurrentPeriodAddedPrice() != null && this._price.getCurrentPeriodAddedPrice() > 0) {
        return tutao.lang("priceForCurrentAccountingPeriod_label", { "{1}": tutao.util.BookingUtils.formatPrice(Number(this._price.getCurrentPeriodAddedPrice())) });
    } else if (this.isUnbuy()) {
        return tutao.lang("priceChangeValidFrom_label", { "{1}": tutao.tutanota.util.Formatter.formatDate(this._price.getPeriodEndDate()) });
    } else {
        return "";
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getPaymentMethodInfoText = function() {
    if (!this.loaded()) {
        return tutao.lang("loading_msg");
    } else if (this._accountingInfo.getPaymentMethodInfo()) {
        return this._accountingInfo.getPaymentMethodInfo();
    } else {
        return tutao.lang(tutao.util.BookingUtils.getPaymentMethodNameTextId(this._accountingInfo.getPaymentMethod()));
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.getSubmitButtonTextId = function() {
    if (this.isBuy()) {
        return "buy_action";
    } else {
        return "order_action";
    }
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.isBuy = function() {
    return (this.loaded() && Number(this._price.getCurrentPriceNextPeriod().getPrice()) < Number(this._price.getFuturePriceNextPeriod().getPrice()));
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.isUnbuy = function() {
    return (this.loaded() && Number(this._price.getCurrentPriceNextPeriod().getPrice()) > Number(this._price.getFuturePriceNextPeriod().getPrice()));
};

tutao.tutanota.ctrl.BuyDialogViewModel.prototype.isPriceChange = function() {
    return (this.loaded() && Number(this._price.getCurrentPriceNextPeriod().getPrice()) != Number(this._price.getFuturePriceNextPeriod().getPrice()));
};
