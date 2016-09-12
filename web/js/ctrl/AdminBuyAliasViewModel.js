"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminBuyAliasViewModel');

/*
 * @implements tutao.tutanota.ctrl.BuyFeatureViewModel
 * @constructor
 */
tutao.tutanota.ctrl.AdminBuyAliasViewModel = function(adminEditUserViewModel) {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._buyOptions = [];
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, 0));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, 20));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, 40));
    this._buyOptions.push(new tutao.tutanota.ctrl.BuyOptionModel(this, tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_EMAIL_ALIASES, 100));
    this._currentValue = ko.observable(null);
    this._usedAliases = ko.observable(0);
    this._activeAliases = ko.observable(0);
    this.customer = null;


    var self = this;
    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        self.customer = customer;
        return customer.loadCustomerInfo().then(function(customerInfo) {
            var includedAliases = Number(customerInfo.getIncludedEmailAliases());
            var promotionAliases = Number(customerInfo.getPromotionEmailAliases());
            self._buyOptions[0].freeAmount(Math.max(includedAliases, promotionAliases));
            return tutao.entity.sys.MailAddressAliasServiceReturn.load({}, null).then(function (mailAddressAliasServiceReturn) {
                self._usedAliases(Number(mailAddressAliasServiceReturn.getUsedAliases()));
                self._activeAliases(Number(mailAddressAliasServiceReturn.getEnabledAliases()));
            });
        });
    })
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.updateCurrentOption = function (newValue) {
    this._currentValue(newValue);
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getCurrentOption = function () {
    return this._currentValue();
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getBuyOptions = function () {
   return this._buyOptions;
};

tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getHeading = function () {
    return tutao.lang('amountUsedAndActivated_label', {"{used}": this._usedAliases(), "{active}": this._activeAliases()});
};


tutao.tutanota.ctrl.AdminBuyAliasViewModel.prototype.getInfoText = function () {
    return tutao.lang('buyEmailAliasInfo_msg');
};

