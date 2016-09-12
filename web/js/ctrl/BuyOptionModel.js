/**
 * Created by bdeterding on 15.08.16.
 */


tutao.provide('tutao.tutanota.ctrl.BuyOptionModel.js');

/**
 *
 * @param {tutao.tutanota.ctrl.BuyFeatureViewModel} parentModel
 * @param {string} featureType The booking item feature type.s
 * @param {Number} featureAmount
 * @constructor
 */
tutao.tutanota.ctrl.BuyOptionModel = function(parentModel, featureType, featureAmount) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._parent = parentModel;
    this._featureType = featureType;
    this.active = ko.observable(false);
    this._featureAmount = featureAmount;
    this.freeAmount = ko.observable(0);
    this.price = ko.observable("");
    this.busy = ko.observable(true);

    this.paymentInterval = ko.observable("");
    this.paymentIntervalText = ko.observable("");

    var self = this;

    // init price
    tutao.util.BookingUtils.getPrice(this._featureType, featureAmount, null, null, null).then(function(newPrice) {
        var currentCount = 0;

        var items = [];
        if ( newPrice.getCurrentPriceNextPeriod() != null ) { // current price is not set when no booking has been executed before, e.g. for free accounts.
            items = newPrice.getCurrentPriceNextPeriod().getItems();
        }
        return Promise.each(items, function(priceItem){
            if (priceItem.getFeatureType() == self._featureType){
                currentCount = Number(priceItem.getCount());
            }
        }).then(function(){
            if (self._featureAmount == currentCount) {
                self._parent.updateCurrentOption(self);
            }
            return Promise.each(newPrice.getFuturePriceNextPeriod().getItems(), function(priceItem){
                if ( priceItem.getFeatureType() == self._featureType){
                    var paymentInterval = newPrice.getFuturePriceNextPeriod().getPaymentInterval();
                    self.price(tutao.util.BookingUtils.formatPrice(Number(priceItem.getPrice()), true));
                    if (paymentInterval == "12") {
                        self.paymentIntervalText(tutao.lang('perYear_label'));
                    } else {
                        self.paymentIntervalText(tutao.lang('perMonth_label'));
                    }
                }
            });
        });
    }).lastly(function(){
        self.busy(false);
    });
};


tutao.tutanota.ctrl.BuyOptionModel.prototype.getFeatureText = function () {
    var visibleAmount = this.getVisibleAmount();
    if (this._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE){
         if (visibleAmount < 1000) {
            return visibleAmount + " GB";
        } else {
            return (visibleAmount / 1000) + " TB";
        }
    } else  if (this._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES ){
        return visibleAmount + " " + tutao.lang("mailAddressAliasesShort_label");
    } else {
        return "";  // should not happen
    }
};


tutao.tutanota.ctrl.BuyOptionModel.prototype.buy = function () {
    if (!this.isBuyEnabled()) {
        return;
    }
    var self = this;
    self.busy(true);
    if (tutao.locator.viewManager.isFreeAccount() || this._parent.customer.getCanceledPremiumAccount() ) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
        return;
    }

    tutao.locator.buyDialogViewModel.showDialog(this._featureType, this._featureAmount).then(function(accepted) {
        if (accepted) {
            var service = new tutao.entity.sys.BookingServiceData();
            service.setAmount(self._featureAmount.toString());
            service.setFeatureType(self._featureType);
            service.setDate(tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE);
            return service.setup({}, null).then(function () {
                self._parent.updateCurrentOption(self);
            })
        }
    }).caught(tutao.PreconditionFailedError, function (error) {
        if (self._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES){
            return tutao.locator.modalDialogViewModel.showAlert(tutao.lang("emailAliasesTooManyActivatedForBooking_msg"));
        } else if (self._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE){
            return tutao.locator.modalDialogViewModel.showAlert(tutao.lang("storageCapacityTooManyUsedForBooking_msg"));
        } else {
            throw error;
        }
    }).lastly(function(){
        self.busy(false);
    });
};

tutao.tutanota.ctrl.BuyOptionModel.prototype.isBuyEnabled = function () {
    return  this.isBuyVisible() && !this.busy();
};

tutao.tutanota.ctrl.BuyOptionModel.prototype.isBuyVisible = function () {
    return  this._parent.getCurrentOption() != this && (this == this._parent.getBuyOptions()[0] || this.getVisibleAmount() > this._parent.getBuyOptions()[0].getVisibleAmount());
};

tutao.tutanota.ctrl.BuyOptionModel.prototype.getStatusText = function () {
    if ( this._parent.getCurrentOption() == this) {
        return tutao.lang('active_label');
    } else {
        return tutao.lang('included_label');
    }
};

tutao.tutanota.ctrl.BuyOptionModel.prototype.getVisibleAmount = function () {
    return Math.max(this._featureAmount, this.freeAmount());
};







