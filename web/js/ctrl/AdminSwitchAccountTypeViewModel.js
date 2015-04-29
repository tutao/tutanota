"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminSwitchAccountTypeViewModel');

tutao.tutanota.ctrl.AdminSwitchAccountTypeViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.state = new tutao.tutanota.util.SubmitStateMachine();
    this.selectedAccountType = ko.observable(undefined);
    this.accountTypes = ko.observableArray();
    this._customerAccountType = null;
    var self = this;
    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        self._customerAccountType = customer.getType();
        if( customer.getType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM || customer.getType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE ){
            self.accountTypes.push(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM);
            self.accountTypes.push(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE);
        } else {
            self.accountTypes.push(customer.getType());
        }
        self.selectedAccountType(customer.getType());
    });
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);
    this.state.entering(true);
};


/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.AdminSwitchAccountTypeViewModel.prototype.confirm = function() {
    if (!this.state.submitEnabled()) {
        return;
    }
    var self = this;
    this.state.submitting(true);
    var service = new tutao.entity.sys.SwitchAccountTypeData();
    service.setAccountType(this.selectedAccountType());

    service.setup({}, null).then(function() {
        self.state.success(true);
    }).caught(tutao.InvalidDataError, function(exception) {
        self.state.setFailureMessage("accountSwitchTooManyActiveUsers_msg");
        self.state.failure(true);
    }).caught(function(error){
        self.state.failure(true);
    });
};



tutao.tutanota.ctrl.AdminSwitchAccountTypeViewModel.prototype._getInputInvalidMessage = function() {
    if (!this.selectedAccountType()) {
        return "emptyString_msg";
    }
    if ( this.selectedAccountType() == this._customerAccountType){
        return "emptyString_msg";
    }
    return null; // input is valid
};

tutao.tutanota.ctrl.AdminSwitchAccountTypeViewModel.prototype.getAccountTypeText = function(accountType) {
    return tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES[Number(accountType)];
};