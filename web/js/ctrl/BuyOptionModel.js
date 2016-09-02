/**
 * Created by bdeterding on 15.08.16.
 */


tutao.provide('tutao.tutanota.ctrl.BuyOptionModel.js');


tutao.tutanota.ctrl.BuyOptionModel = function(parentModel, featureType, featureAmount) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._parent = parentModel;
    this._featureType = featureType;
    this.active = ko.observable(false);
    this._featureAmount = featureAmount;
    this.freeAmount = ko.observable("0");
    this.price = ko.observable("");
    this.busy = ko.observable(true);

    this.paymentInterval = ko.observable("");
    this.paymentIntervalText = ko.observable("");


    var self = this;
    // init price
    tutao.util.BookingUtils.getPrice(this._featureType, featureAmount, null, null, null).then(function(newPrice) {
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
    }).lastly(function(){
        self.busy(false);
    });
};


tutao.tutanota.ctrl.BuyOptionModel.prototype.getFeatureText = function () {
    if (this._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE){
        if ( this._featureAmount == 0) {
            return this.freeAmount() + " GB";
        } else if (this._featureAmount < 1000) {
            return this._featureAmount + " GB";
        } else {
            return (this._featureAmount / 1000) + " TB";
        }
    } else  if (this._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES ){
        if ( this._featureAmount == 0){
            return this.freeAmount() + " " + tutao.lang("mailAddressAliasesShort_label");
        } else {
            return this._featureAmount + " " + tutao.lang("mailAddressAliasesShort_label");
        }
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
    tutao.locator.buyDialogViewModel.showDialog(this._featureType, this._featureAmount).then(function(accepted) {
        if (accepted) {
            var service = new tutao.entity.sys.BookingServiceData();
            service.setAmount(self._featureAmount);
            service.setFeatureType(self._featureType);
            service.setDate(tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE);
            return service.setup({}, null).then(function () {
                self._parent.updateCurrentValue(service.getAmount());
            })
        }
    }).caught(tutao.PreconditionFailedError, function (error) {
        if (self._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES){
            return tutao.locator.modalDialogViewModel.showAlert(tutao.lang("emailAliasesToManyActivatedForBooking_msg"));
        } else if (self._featureType == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE){
            return tutao.locator.modalDialogViewModel.showAlert(tutao.lang("storageCapacityToManyUsedForBooking_msg"));
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
    return this._featureAmount != this._parent.currentValue();
};