"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminBuyStorageViewModel.js');

tutao.tutanota.ctrl.AdminBuyStorageViewModel = function(adminEditUserViewModel) {


    this.headingTextId = "storageCapacity_label";
    this.infoTextId = "buyStorageCapacityInfo_label";

    this.infoRecord = { nameTextId: "storageCapacity_label", oTextId: "storageCapacityInfo_label", valueObservable: ko.observable("") };

    this._buyOptions = [];
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "0", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "10", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "100", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "1000", []));

    this.currentValue = ko.observable(null);
    this.busy = ko.observable(false);

    var self = this;
    var user = tutao.locator.userController.getLoggedInUser();
    this.busy(true);
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function (customerInfo) {
            var storageCapacity = customerInfo.getStorageCapacity();
            if (storageCapacity == null) {
                self.infoRecord.valueObservable(tutao.lang("storageCapacityNoLimit_label"));
            } else if (storageCapacity <= 1) {
                self.infoRecord.valueObservable("0 GB")
            } else {
                self.infoRecord.valueObservable(storageCapacity + " GB");
            }
            var sharedStorage = Number(storageCapacity);
            var bookedStorage = 0;
            var freeStorage = 0;
            if (sharedStorage > 1) {
                freeStorage = (sharedStorage % 10);
                bookedStorage = sharedStorage - freeStorage; // remove the 5GB free storage capacity
                self._buyOptions[0].freeAmount(freeStorage);
            }

            return self.updateCurrentValue(bookedStorage.toString());
        });
    }).lastly(function () {
        self.busy(false);
    });

};

tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.updateCurrentValue = function (newValue) {
    this.currentValue(newValue);
};


tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getBuyOptions = function () {
    return this._buyOptions;
};
