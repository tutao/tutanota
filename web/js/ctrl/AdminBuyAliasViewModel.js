"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminBuyAliasViewModel');

/*
 * @implements tutao.tutanota.ctrl.BuyFeatureViewModel
 * @constructor
 */
tutao.tutanota.ctrl.AdminBuyAliasViewModel = function(adminEditUserViewModel) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._buyOptions = [];
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "0", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "10", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "50", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "100", []));
    this.currentValue = ko.observable(null);
    this.used = ko.observable("0");

    var self = this;
    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            var sharedEmailAliases = Number(customerInfo.getSharedEmailAliases());
            var freeEmailAliases = (sharedEmailAliases%10);
            var bookEmailAliases = sharedEmailAliases - freeEmailAliases; // booked email aliases = all shared - free aliases
            self.updateCurrentValue(bookEmailAliases.toString());
            self._buyOptions[0].freeAmount(freeEmailAliases);

            self.used(customerInfo.getUsedSharedEmailAliases());
        });
    })
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.updateCurrentValue = function (newValue) {
    this.currentValue(newValue);
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getBuyOptions = function () {
   return this._buyOptions;
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getHeading = function () {
    return tutao.lang('emailAliasesUsed_label') + ": " + this.used();
};


tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getInfoText = function () {
    return tutao.lang('buyEmailAliasInfo_msg');
};

