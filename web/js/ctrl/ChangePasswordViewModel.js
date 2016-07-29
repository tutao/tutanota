"use strict";

tutao.provide('tutao.tutanota.ctrl.ChangePasswordViewModel');

/**
 * Handles changing the users password. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.ChangePasswordViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.overallState = ko.observable(null);

	this.oldPassword = ko.observable("");
	this.oldPassword.subscribe(this._oldPasswordUpdated, this);
	this.oldPasswordStatus = ko.observable({ type: "neutral", text: "oldPasswordNeutral_msg" }); 
	this.password1 = ko.observable("");
	this.password2 = ko.observable("");

	this.changePasswordStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
	this.changePasswordButtonTextId = ko.observable(null);

	var s = new tutao.tutanota.util.StateMachine();
	this.state = s;
	s.addState("EnterPasswords",    {});
	s.addState("ActivatePassword",  {}, this._activateNewPassword);
	s.addState("PasswordActivated", {});
	s.addState("FinishNoSuccess",   {});

    s.addTransition("EnterPasswords", "userConfirm", "ActivatePassword");
    s.addTransition("ActivatePassword", "serverError", "EnterPasswords");
	s.addTransition("ActivatePassword", "activationOk", "PasswordActivated");
	
    this.changePasswordStatus({ type: "neutral", text: "emptyString_msg" });
    this.changePasswordButtonTextId("pwChangeButtonChangePw_action");
    this.overallState("allowed");
};

/**
 * Must be called when the old password was changed (directly after each character).
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype._oldPasswordUpdated = function() {
	this.oldPasswordStatus({ type: "neutral", text: "oldPasswordNeutral_msg" });
};

/**
 * Provides the password strength in %.
 * @return {Number} The strength of the password.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype.getPasswordStrength = function() {
    var reserved = tutao.locator.userController.getMailAddresses().slice();
    reserved.push(tutao.locator.userController.getUserGroupInfo().getName());
	return tutao.tutanota.util.PasswordUtils.getPasswordStrength(this.password1(), reserved);
};

/**
 * Provides the status of the first entered new password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype.getPassword1Status = function() {
	if (this.password1() == "") {
		return { type: "neutral", text: "password1Neutral_msg" };
	} else if (this.password1() == this.oldPassword()) {
		return { type: "invalid", text: "password1InvalidSame_msg" };
	} else if (this.getPasswordStrength() >= 80) {
		return { type: "valid", text: "passwordValid_msg" };
	} else {
		return { type: "invalid", text: "password1InvalidUnsecure_msg" };
	}
};

/**
 * Provides the status of the second entered new password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype.getPassword2Status = function() {
	if (this.password2() == "") {
		return { type: "neutral", text: "password2Neutral_msg" };
	} else if (this.password1() == this.password2()) {
		return { type: "valid", text: "passwordValid_msg" };
	} else {
		return { type: "invalid", text: "password2Invalid_msg" };
	}
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype.confirmPossible = function() {
	if (this.state.getState() == 'EnterPasswords') {
		return (this.oldPasswordStatus().type == "valid" && this.getPassword1Status().type == "valid" && this.getPassword2Status().type == "valid");
	} else {
		return false;
	}
};

/**
 * Called when the confirm button is clicked by the user. Triggers the next state in the state machine.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype.confirm = function() {
	if (this.confirmPossible()) {
		this.state.event("userConfirm");
	}
};

/**
 * Checks the entered old password and updates the password status.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype.checkOldPassword = function() {
	var self = this;
	if (this.oldPassword().trim() == "") {
		this.oldPasswordStatus({ type: "neutral", text: "oldPasswordNeutral_msg" });
	} else {
		this.oldPasswordStatus({ type: "neutral", text: "check_msg" });
		tutao.locator.kdfCrypter.generateKeyFromPassphrase(self.oldPassword(), tutao.locator.userController.getSalt(), tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function(key) {
			var v = tutao.util.EncodingConverter.base64ToBase64Url(tutao.crypto.Utils.createAuthVerifier(key));
			if(v == tutao.locator.userController.getAuthVerifier()) {
				self.oldPasswordStatus({ type: "valid", text: "passwordValid_msg" });
			} else {
				self.oldPasswordStatus({ type: "invalid", text: "oldPasswordInvalid_msg" });
			}
		});
	}
};

/**
 * Activates the new password.
 */
tutao.tutanota.ctrl.ChangePasswordViewModel.prototype._activateNewPassword = function() {
	this.changePasswordStatus({ type: "neutral", text: "emptyString_msg" });
	var self = this;
	var salt = tutao.locator.kdfCrypter.generateRandomSalt();
	tutao.locator.kdfCrypter.generateKeyFromPassphrase(self.password1(), salt, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function(userPassphraseKey) {
		var pwEncUserGroupKey = tutao.locator.aesCrypter.encryptKey(userPassphraseKey, tutao.locator.userController.getUserGroupKey());
		var verifier = tutao.crypto.Utils.createAuthVerifier(userPassphraseKey);
		
		var service = new tutao.entity.sys.ChangePasswordData();
		service.setSalt(tutao.util.EncodingConverter.uint8ArrayToBase64(salt));
		service.setVerifier(verifier);
		service.setPwEncUserGroupKey(pwEncUserGroupKey);
		return service.setup({}, null).then(function(dummy) {
            tutao.locator.userController.passwordChanged(userPassphraseKey, salt);
            self.changePasswordStatus({ type: "valid", text: "pwChangeValid_msg" });
            self.state.event("activationOk");
		}).caught(tutao.TooManyRequestsError, function(exception) {
            self.changePasswordStatus({ type: "invalid", text: "tooManyAttempts_msg" });
            self.state.event("activationTooManyAttempts");
        }).caught(function(e) {
            self.state.event("serverError");
            throw e;
        });
	});
};
