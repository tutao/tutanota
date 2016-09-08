"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminBuyStorageViewModel.js');
/*
* @implements tutao.tutanota.ctrl.BuyFeatureViewModel
* @constructor
*/
tutao.tutanota.ctrl.AdminBuyStorageViewModel = function(adminEditUserViewModel) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._buyOptions = [];
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, 0));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, 10));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, 100));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, 1000));

    this._currentValue = ko.observable(0);
    this.busy = ko.observable(false);
    this._usedMemory = ko.observable(0);

    var self = this;
    var user = tutao.locator.userController.getLoggedInUser();
    this.busy(true);
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function (customerInfo) {
            var includedStorage = Number(customerInfo.getIncludedStorageCapacity());
            var promotionStorage = Number(customerInfo.getPromotionStorageCapacity());
            self._buyOptions[0].freeAmount(Math.max(includedStorage, promotionStorage));
        });
    }).then(function(){
        return tutao.locator.settingsViewModel.readCounterValue(tutao.entity.tutanota.TutanotaConstants.COUNTER_USED_MEMORY_INTERNAL, user.getCustomer()).then(function(usedMemoryInternal){
            return tutao.locator.settingsViewModel.readCounterValue(tutao.entity.tutanota.TutanotaConstants.COUNTER_USED_MEMORY_EXTERNAL, user.getCustomer()).then(function (usedMemoryExternal) {
                self._usedMemory(Number(usedMemoryInternal) + Number(usedMemoryExternal));
            })
        })
    }).lastly(function () {
        self.busy(false);
    });
};

tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.updateCurrentOption = function (newValue) {
    this._currentValue(newValue);
};

tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getCurrentOption = function () {
    return this._currentValue();
};


tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getBuyOptions = function () {
    return this._buyOptions;
};

tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getHeading = function () {
    return tutao.lang('storageCapacityUsed_label', {"{storage}": tutao.tutanota.util.Formatter.formatStorageSize(this._usedMemory())});
};


tutao.tutanota.ctrl.AdminBuyStorageViewModel.prototype.getInfoText = function () {
    return tutao.lang('buyStorageCapacityInfo_msg');
};