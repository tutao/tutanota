"use strict";

goog.provide('tutao.tutanota.ctrl.PreRegistrationViewModel');

/**
 * The ViewModel for the pre-registration template.
 * @constructor
 */
tutao.tutanota.ctrl.PreRegistrationViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.accountType = ko.observable(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER);
	this.domain = ko.observable("");
    this.domainFieldFocused = ko.observable(false);
	this.currentMailAddressPrefix = ko.observable("");
	this.currentMailAddressStatus = ko.observable({ type: "neutral", text: "mailAddressNeutral_msg"});
    this.currentMailAddressStatus = ko.computed(function() {
        if (this.currentMailAddressPrefix().trim() == "") {
            return { type: "neutral", text: "mailAddressNeutral_msg" };
        } else if (this.isValidMailAddress()) {
            return { type: "valid", text: "mailAddressValid_msg" };
        } else {
            return { type: "invalid", text: "mailAddressInvalid_msg" };
        }
    }, this);

    this.state = ko.observable(tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_NOT_RUNNING);

    this.verifyDomainStatus = ko.computed(function() {
        if (this.state() === tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_NOT_RUNNING) {
            return { type: "neutral", text: "verifyDomainNeutral_msg" };
        } else if (this.state() === tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_RUNNING) {
            return { type: "neutral", text: "verifyDomainRunning_msg" };
        } else if (this.state() === tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_FAILED) {
            return { type: "invalid", text: "verifyDomainFailure_msg" };
        }
    }, this);
};

tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_NOT_RUNNING = 0;
tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_RUNNING = 1;
tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_FINISHED = 2;
tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_FAILED = 3;

/**
 * Sets the focus when the view is shown.
 */
tutao.tutanota.ctrl.PreRegistrationViewModel.prototype.activate = function(authToken) {
	var self = this;
	setTimeout(function() {
		self.domainFieldFocused(true);
	}, 0);
};

tutao.tutanota.ctrl.PreRegistrationViewModel.prototype.getRegistrationType = function() {
	return 'Starter';
};

tutao.tutanota.ctrl.PreRegistrationViewModel.prototype.isValidMailAddress = function() {
	return tutao.tutanota.util.Formatter.isMailAddress(this.currentMailAddressPrefix().toLowerCase() + "@" + this.domain());
};

tutao.tutanota.ctrl.PreRegistrationViewModel.prototype.isFormEditable = function() {
	return (this.state() != tutao.tutanota.ctrl.PreRegistrationViewModel.PROCESS_STATE_RUNNING);
};

tutao.tutanota.ctrl.PreRegistrationViewModel.prototype.isVerifyDomainPossible = function() {
    return this.isFormEditable()
        && this.currentMailAddressStatus().type == "valid";
};

tutao.tutanota.ctrl.PreRegistrationViewModel.prototype.verifyDomain = function() {

};



