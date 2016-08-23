"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminBuyAliasViewModel.js');

/*
 * @implements tutao.tutanota.ctrl.BuyFeatureViewModel
 * @constructor
 */
tutao.tutanota.ctrl.AdminBuyAliasViewModel = function(adminEditUserViewModel) {
    this._buyOptions = [];
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "0", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "10", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "50", []));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyFeatureModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, "100", []));
    this.currentValue = ko.observable(null);
    this.used = ko.observable("-");

    var self = this;
    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            var sharedEmailAliases = Number(customerInfo.getSharedEmailAliases());
            var freeEmailAliases = (sharedEmailAliases%10);
            var bookEmailAliases = sharedEmailAliases - freeEmailAliases; // booked email aliases = all shared - free aliases
            self.updateCurrentValue(bookEmailAliases.toString());
            self._buyOptions[0].freeAmount(freeEmailAliases);

            var usedSharedEmailAliases = customerInfo.getUsedSharedEmailAliases();

            if (sharedEmailAliases > 0) {
                self.used(usedSharedEmailAliases);
            } else {
                self.used("-");
            }
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

