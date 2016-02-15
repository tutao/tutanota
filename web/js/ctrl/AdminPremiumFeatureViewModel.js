"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminPremiumFeatureViewModel');

tutao.tutanota.ctrl.AdminPremiumFeatureViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.promotionCode = ko.observable("");

    this.state = new tutao.tutanota.util.SubmitStateMachine(true);
    this.state.setInputInvalidMessageListener(this._checkCode);

    this.promotionCode.subscribe(function(newValue) {
        if (this.state.failure()) {
            this.state.entering(true);
        }
    }, this);

    var self=this;
    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer){
        customer.loadCustomerInfo().then(function(customerInfo){
            self.state.entering(true);
        });
    });
};

/**
 * Checks the entered old password and updates the password status.
 */
tutao.tutanota.ctrl.AdminPremiumFeatureViewModel.prototype._checkCode = function() {
    var codeToCheck = this.promotionCode().trim();
    if (codeToCheck == "") {
        return "emptyString_msg";
    }
    if ( !codeToCheck.match(/^[a-zA-Z][a-zA-Z]-[\d\w][\d\w][\d\w][\d\w]-[\d\w][\d\w][\d\w][\d\w]$/)) {
        return "invalidInputFormat_msg";
    }
    return null;
};

/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.AdminPremiumFeatureViewModel.prototype.submitPromotionCode = function() {
    var self = this;
    if (!self.state.submitEnabled()) {
        return;
    }
    var service = new tutao.entity.sys.PremiumFeatureData();
    service.setFeatureName("")
        .setActivationCode(this.promotionCode().trim());
    self.state.submitting(true);
    service.setup({}, null).then(function(retVal){
        if (retVal.getActivatedFeature() == "0") {
            self.state.setSuccessMessage("promotionCodeStorageSuccess_msg");
        }else {
            self.state.setSuccessMessage("promotionCodeAliasSuccess_msg");
        }
        self.state.success(true);
    }).caught(function(e){
        if (tutao.InvalidDataError.errorCode == e.errorCode ){
            self.state.setFailureMessage("promotionCodeInvalid_msg");
            self.state.failure(true);
        } else {
            throw e;
        }
    });
};
