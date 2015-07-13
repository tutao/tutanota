"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminDeleteAccountViewModel');

/**
 * Handles deleting the customer account. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AdminDeleteAccountViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.reason = ko.observable("");

	this.password = ko.observable("");
    this.password.subscribe(this._checkPassword);
	this.passwordStatus = ko.observable({ type: "neutral", text: "passwordEnterNeutral_msg" });

    this.deleteAccountStatus = ko.observable({ type: "neutral", text: "deleteAccountInfo_msg" });
    this.busy = ko.observable(false);

    // unsubscribe premium
    this.state = new tutao.tutanota.util.SubmitStateMachine();
    this.state.entering(true);
};


/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.AdminDeleteAccountViewModel.prototype.unsubscribePremium = function() {
    if (!this.state.submitEnabled()) {
        return;
    }
    var self = this;
    this.state.submitting(true);
    var service = new tutao.entity.sys.SwitchAccountTypeData();
    service.setAccountType(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE);

    service.setup({}, null).then(function() {
        self.state.success(true);
    }).caught(tutao.InvalidDataError, function(exception) {
        self.state.setFailureMessage("accountSwitchTooManyActiveUsers_msg");
        self.state.failure(true);
    }).caught(function(error){
        self.state.failure(true);
    });
};


/**
 * Checks the entered old password and updates the password status.
 */
tutao.tutanota.ctrl.AdminDeleteAccountViewModel.prototype._checkPassword = function() {
    var self = this;
    if (this.password().trim() == "") {
        this.passwordStatus({ type: "neutral", text: "passwordEnterNeutral_msg" });
    } else {
        this.passwordStatus({ type: "neutral", text: "check_msg" });
        tutao.locator.crypto.generateKeyFromPassphrase(self.password(), tutao.locator.userController.getHexSalt()).then(function(hexKey) {
            var v = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexKey));
            if(v == tutao.locator.userController.getAuthVerifier()) {
                self.passwordStatus({ type: "valid", text: "passwordValid_msg" });
            } else {
                self.passwordStatus({ type: "invalid", text: "passwordWrongInvalid_msg" });
            }
        });
    }
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.AdminDeleteAccountViewModel.prototype.confirmPossible = function() {
	return  !this.busy() && this.passwordStatus().type == "valid";
};

/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.AdminDeleteAccountViewModel.prototype.confirm = function() {
	if (!this.confirmPossible()) {
        return;
    }
    var self = this;
    this.password("");
    tutao.tutanota.gui.confirm(tutao.lang("deleteAccountConfirm_msg")).then(function(confirmed) {
        if (confirmed) {
            self.busy(true);
            self.deleteAccountStatus({ type: "neutral", text: "deleteAccountWait_msg" });
            var customerService = new tutao.entity.sys.DeleteCustomerData();
            customerService.setUndelete(false);
            customerService.setCustomer(tutao.locator.userController.getLoggedInUser().getCustomer());
            customerService.setReason(self.reason());
            tutao.locator.eventBus.notifyNewDataReceived = function() {}; // avoid NotAuthenticatedError
            return customerService.erase({}, null).then(function() {
                return tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("deleteAccountDeleted_msg")).then(function() {
                    tutao.locator.navigator.logout(false, false);
                });
            });
        }
    });
};
