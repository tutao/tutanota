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
	this.passwordStatus = ko.observable({ type: "neutral", text: "passwordEnterNeutral_msg" });

    this.deleteAccountStatus = ko.observable({ type: "neutral", text: "deleteAccountInfo_msg" });
    this.busy = ko.observable(false);
};

/**
 * Checks the entered old password and updates the password status.
 */
tutao.tutanota.ctrl.AdminDeleteAccountViewModel.prototype.checkPassword = function() {
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
	if (this.confirmPossible()) {
        this.password("");
        if (tutao.tutanota.gui.confirm(tutao.locator.languageViewModel.get("deleteAccountConfirm_msg"))) {
            this.busy(true);
            this.deleteAccountStatus({ type: "neutral", text: "deleteAccountWait_msg" });
            var customerService = new tutao.entity.sys.DeleteCustomerData();
            customerService.setUndelete(false);
            customerService.setCustomer(tutao.locator.userController.getLoggedInUser().getCustomer());
            customerService.setReason(this.reason());
            customerService.erase({}, null).then(function() {
                tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("deleteAccountDeleted_msg"));
                tutao.locator.navigator.logout(false, false);
            });
        }
	}
};
