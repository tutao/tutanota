/**
 * Created by bdeterding on 15.08.16.
 */


tutao.provide('tutao.tutanota.ctrl.BuyOptionModel.js');

/**
 *
 * @param {tutao.tutanota.ctrl.BuyFeatureViewModel} parentModel
 * @param {string} featureType The booking item feature type.
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

        // Get the current count from the price service - stored in current price next period.
        var currentPriceItemNextPeriod = tutao.util.BookingUtils.getPriceItem(newPrice.getCurrentPriceNextPeriod(), self._featureType);
        if ( currentPriceItemNextPeriod != null) {
            currentCount = Number(currentPriceItemNextPeriod.getCount());
        }

        if (self._featureAmount == currentCount) {
            self._parent.updateCurrentOption(self);
        }

        // format price. if no price is available show zero price.
        var futurePriceNextPeriod = tutao.util.BookingUtils.getPriceFromPriceData(newPrice.getFuturePriceNextPeriod(), self._featureType);
        self.price(tutao.util.BookingUtils.formatPrice(futurePriceNextPeriod, true, tutao.locator.settingsViewModel.decimalSeparator()));

        var paymentInterval = newPrice.getFuturePriceNextPeriod().getPaymentInterval();
        if (paymentInterval == "12") {
            self.paymentIntervalText(tutao.lang('perYear_label'));
        } else {
            self.paymentIntervalText(tutao.lang('perMonth_label'));
        }

    }).lastly(function(){
        self.busy(false);
    });
};

tutao.tutanota.ctrl.BuyOptionModel.prototype.loading = function() {
    return this.price().length == 0;
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
        return tutao.lang("mailAddressAliasesShort_label", {"{amount}" : visibleAmount});
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
        self.busy(false);
        return;
    }

    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function (customerInfo) {
            return customerInfo.loadAccountingInfo().then(function (accountingInfo) {
                if (!accountingInfo.getInvoiceCountry()) {
                    return tutao.tutanota.gui.alert(tutao.lang("enterPaymentDataFirst_msg")).then(function() {
                        self.busy(false);
                        tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
                    });
                } else {
                    return  tutao.locator.buyDialogViewModel.showDialog(self._featureType, self._featureAmount, self.freeAmount()).then(function(accepted) {
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
                }
            });
        });
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







