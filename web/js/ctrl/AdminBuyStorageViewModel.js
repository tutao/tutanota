"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminBuyStorageViewModel.js');
/*
* @implements tutao.tutanota.ctrl.BuyFeatureViewModel
* @constructor
*/
tutao.tutanota.ctrl.AdminBuyStorageViewModel = function(adminEditUserViewModel) {

    this._buyOptions = [];
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "0", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "10", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "100", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, "1000", []));

    this.currentValue = ko.observable(null);
    this.busy = ko.observable(false);
    this.usedMemory = ko.observable(0);

    var self = this;
    var user = tutao.locator.userController.getLoggedInUser();
    this.busy(true);
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function (customerInfo) {
            var storageCapacity = customerInfo.getStorageCapacity();
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
    }).then(function(){
        return tutao.locator.settingsViewModel.readCounterValue(tutao.entity.tutanota.TutanotaConstants.COUNTER_USED_MEMORY_INTERNAL, user.getCustomer()).then(function(usedMemoryInternal){
            return tutao.locator.settingsViewModel.readCounterValue(tutao.entity.tutanota.TutanotaConstants.COUNTER_USED_MEMORY_EXTERNAL, user.getCustomer()).then(function (usedMemoryExternal) {
                self.usedMemory(Number(usedMemoryInternal) + Number(usedMemoryExternal));
            })
        })
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

tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getHeading = function () {
    return tutao.lang('storageCapacityUsed_label') + ": "+ tutao.tutanota.util.Formatter.formatStorageSize(this.usedMemory());
};


tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getInfoText = function () {
    return tutao.lang('buyStorageCapacityInfo_msg');
};