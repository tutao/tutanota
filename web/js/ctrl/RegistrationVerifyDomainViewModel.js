"use strict";

tutao.provide('tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel');

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
        } else {
            return { type: "neutral", text: "verifyDomainNeutral_msg" };
        }
    }, this);
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_NOT_RUNNING = 0;
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_RUNNING = 1;
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FINISHED = 2;
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_DISABLED = 4;

/**
 * Sets the focus when the view is shown.
 */
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.activate = function() {
	var self = this;
    var parameters = {};
    tutao.entity.sys.RegistrationConfigReturn.load(parameters, null).then(function(registrationConfigReturn) {
        if(registrationConfigReturn.getStarterEnabled()){
            setTimeout(function() {
                self.domainFieldFocused(true);
            }, 0);
        }else {
            self.state(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_DISABLED);
        }
    });
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.getRegistrationType = function() {
	return 'Starter';
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.isValidMailAddress = function() {
	return tutao.tutanota.util.Formatter.isMailAddress(this.getMailAddress());
};
tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.getMailAddress = function () {
    return tutao.tutanota.util.Formatter.getCleanedMailAddress(this.currentMailAddressPrefix() + "@" + this.domain());
};

tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.prototype.getDomain = function () {
    return this.domain().trim().toLowerCase();
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
        .setup({}, null).then(function(returnData, exception) {
            self.verificationMailSent = returnData.getMailSent();
            self.state(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_FINISHED);
        }).caught(function(e) {
            self.state(tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel.PROCESS_STATE_NOT_RUNNING);
            throw e;
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





