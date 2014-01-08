"use strict";

goog.provide('tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel');

/**
 * The ViewModel for the pre-registration template.
 * @constructor
 */
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.domain = ko.observable("");
    this.domainFieldFocused = ko.observable(false);
	this.currentMailAddressPrefix = ko.observable("postmaster");
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

    this.state = ko.observable(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_NOT_RUNNING);

    this.verifyDomainStatus = ko.computed(function() {
        if (this.state() === tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_RUNNING) {
            return { type: "neutral", text: "verifyDomainRunning_msg" };
        } else if (this.state() === tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FAILED) {
            return { type: "invalid", text: "verifyDomainFailure_msg" };
        } else {
            return { type: "neutral", text: "verifyDomainNeutral_msg" };
        }
    }, this);
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_NOT_RUNNING = 0;
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_RUNNING = 1;
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FINISHED = 2;
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FAILED = 3;

/**
 * Sets the focus when the view is shown.
 */
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.activate = function(authToken) {
	var self = this;
	setTimeout(function() {
		self.domainFieldFocused(true);
	}, 0);
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.getRegistrationType = function() {
	return 'Starter';
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.isValidMailAddress = function() {
	return tutao.tutanota.util.Formatter.isMailAddress(this.getMailAddress());
};
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.getMailAddress = function() {
    return this.currentMailAddressPrefix().toLowerCase() + "@" + this.domain()
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.isFormEditable = function() {
	return (this.state() != tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_RUNNING);
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.isVerifyDomainPossible = function() {
    return this.isFormEditable()
        && this.currentMailAddressStatus().type == "valid";
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.verifyDomain = function() {
    var self = this;
    if (!this.isVerifyDomainPossible()) {
        return;
    }
    self.state(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_RUNNING);
    var data = new tutao.entity.sys.RegistrationVerifyDomainDataPost()
        .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
        .setCurrentAdminMailAddress(this.getMailAddress())
        .setup({}, null, function(returnData, exception) {
            if (exception) {
                self.state(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FAILED);
            } else {
                self.verificationMailSent = returnData.getMailSent();
                self.state(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FINISHED);
            }
        });
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.getFinishedMessage = function() {
    if(this.currentMailAddressPrefix().trim().toLowerCase() == "postmaster"
        ||this.currentMailAddressPrefix().trim().toLowerCase() == "hostmaster") {
        return 'verifyDomainMailSent_msg';
    } else {
        return 'verifyDomainStaffInformed_msg';
    }
};





