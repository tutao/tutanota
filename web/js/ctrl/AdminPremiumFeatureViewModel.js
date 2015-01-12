"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminPremiumFeatureViewModel');

tutao.tutanota.ctrl.AdminPremiumFeatureViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.promotionCode = ko.observable("");
    this.promotionCode.subscribe(this._checkCode);
    this.promotionCodeStatus = ko.observable({ type: "neutral", text: "promotionCodeEnterNeutral_msg" });
    this.busy = ko.observable(false);

    this.capcityUpdateActivated = ko.observable(false);
    var self = this;

    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer){
        customer.loadCustomerInfo().then(function(customerInfo){
            if ( customerInfo.getStorageCapacity() > 1){
                self.capcityUpdateActivated(true);
            }
        });
    });
};

/**
 * Checks the entered old password and updates the password status.
 */
tutao.tutanota.ctrl.AdminPremiumFeatureViewModel.prototype._checkCode = function() {
    var self = this;
    var codeToCheck = this.promotionCode().trim();
    if (codeToCheck == "") {
        this.promotionCodeStatus({ type: "neutral", text: "promotionCodeEnterNeutral_msg" });
    } else {
        this.promotionCodeStatus({ type: "neutral", text: "check_msg" });
        if (codeToCheck.match(/^[Cc][Bb]-[\d\w][\d\w][\d\w][\d\w]-[\d\w][\d\w][\d\w][\d\w]$/)){
            self.promotionCodeStatus({ type: "valid", text: "promotionCodeEnterValidFormat_msg" });
        }else{
            self.promotionCodeStatus({ type: "invalid", text: "promotionCodeEnterWrongFormat_msg" });
        }
    }
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.AdminPremiumFeatureViewModel.prototype.confirmPossible = function() {
    return  !this.busy() && this.promotionCodeStatus().type == "valid";
};

/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.AdminPremiumFeatureViewModel.prototype.confirm = function() {
    if (!this.confirmPossible()) {
        return;
    }
    var self = this;
    var service = new tutao.entity.sys.PremiumFeatureData();
    service.setFeatureName("storageCapacity5GB")
        .setActivationCode(this.promotionCode().trim());
    service.setup({}).then(function(){
        self.capcityUpdateActivated(true);
    }).caught(function(e){
        if (tutao.InvalidDataError.errorCode == e.errorCode ){
            tutao.tutanota.gui.alert(tutao.lang('promotionCodeInvalid_msg'));
        } else {
            throw e;
        }
    });
};
