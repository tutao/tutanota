"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminNewUser');

/**
 * A new user that should be added to an existing customer
 * @constructor
 */
tutao.tutanota.ctrl.AdminNewUser = function(availableDomains){
    this.mailAddressPrefix = ko.observable("");
    this.mailAddressStatus = ko.observable({ type: "neutral", text: "mailAddressNeutral_msg"});

    this.name = ko.observable("");
    this.password = ko.observable(tutao.tutanota.util.PasswordUtils.generatePassword(10));
    this.state = ko.observable(tutao.tutanota.ctrl.AdminNewUser.STATE_NONE);
    this.domain = ko.observable("");
    this.availableDomains = availableDomains;

    this.mailAddress = ko.computed(function(){
        return tutao.tutanota.util.Formatter.getCleanedMailAddress(this.mailAddressPrefix() + "@" + this.domain());
    }, this);

    this.mailAddress.subscribe(this._verifyMailAddress, this);
};

tutao.tutanota.ctrl.AdminNewUser.prototype._verifyMailAddress = function(cleanedValue) {
    var self = this;
    if ( self.mailAddressPrefix().length < 1){
        this.mailAddressStatus({ type: "neutral", text: "mailAddressNeutral_msg"});
        return;
    }
    if (tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS.indexOf(self.domain()) != -1
        && self.mailAddressPrefix().trim().length < tutao.tutanota.ctrl.RegistrationViewModel.MINIMUM_MAIL_ADDRESS_PREFIX_LENGTH) {
            self.mailAddressStatus({ type: "invalid", text: "mailAddressInvalid_msg"});
        return
    }
    if (!tutao.tutanota.util.Formatter.isMailAddress(cleanedValue, true)) {
        self.mailAddressStatus({ type: "invalid", text: "mailAddressInvalid_msg"});
        return;
    }
    self.mailAddressStatus({ type: "invalid", text: "mailAddressBusy_msg"});

    setTimeout(function() {
        if (self.mailAddress() == cleanedValue) {
            tutao.entity.sys.DomainMailAddressAvailabilityReturn.load(new tutao.entity.sys.DomainMailAddressAvailabilityData().setMailAddress(cleanedValue), [], tutao.entity.EntityHelper.createAuthHeaders()).then(function(domainMailAddressAvailabilityReturn) {
                if (self.mailAddress() == cleanedValue) {
                    if (domainMailAddressAvailabilityReturn.getAvailable()) {
                        self.mailAddressStatus({ type: "valid", text: "mailAddressAvailable_msg"});
                    } else {
                        self.mailAddressStatus({ type: "invalid", text: "mailAddressNA_msg"});
                    }
                }
            });
        }
    }, 500);
};

/**
 * Provides the status of the password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.AdminNewUser.prototype.getPasswordStatus = function () {
    if (this.password() == "") {
        return { type: "neutral", text: "password1Neutral_msg" };
    } else if (this.getPasswordStrength() >= 80) {
        return { type: "valid", text: "passwordValid_msg" };
    } else if (this.password().trim().length < 1) {
        return { type: "invalid", text: "password1InvalidTooShort_msg" };
    } else {
        return { type: "neutral", text: "password1InvalidUnsecure_msg" };
    }
};

tutao.tutanota.ctrl.AdminNewUser.prototype.getPasswordStrength = function () {
    return tutao.tutanota.util.PasswordUtils.getPasswordStrength(this.password(), [])
};

tutao.tutanota.ctrl.AdminNewUser.STATE_NONE = "";
tutao.tutanota.ctrl.AdminNewUser.STATE_IN_PROGRESS = "progress";
tutao.tutanota.ctrl.AdminNewUser.STATE_SUCCESS = "success";
tutao.tutanota.ctrl.AdminNewUser.STATE_FAILED = "failed";

tutao.tutanota.ctrl.AdminNewUser.prototype.isCreateAccountPossible = function() {
    return this.mailAddressStatus().type == "valid" &&
        this.getPasswordStatus().type != "invalid";
};

/**
 * Create the new user
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.AdminNewUser.prototype.create = function () {
    var self = this;
    this.state(tutao.tutanota.ctrl.AdminNewUser.STATE_IN_PROGRESS);

    var adminGroupKey = tutao.locator.userController.getGroupKey(tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_ADMIN));
    var customerGroupKey = tutao.locator.userController.getGroupKey(tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_CUSTOMER));
    var userGroupKey = tutao.locator.aesCrypter.generateRandomKey();
    var userGroupInfoSessionKey = tutao.locator.aesCrypter.generateRandomKey();

    var userService = new tutao.entity.tutanota.UserAccountCreateData();
    return tutao.tutanota.ctrl.RegistrationViewModel.generateUserAccountUserData(userService, userGroupKey, userGroupInfoSessionKey, customerGroupKey, self.mailAddress(), self.name(), self.password()).then(function (userData) {
        return tutao.tutanota.ctrl.RegistrationViewModel.generateInternalGroupData(userService, userGroupKey, userGroupInfoSessionKey, adminGroupKey, customerGroupKey).then(function(userGroupData) {

            userService.setDate(tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE)
                .setUserData(userData)
                .setUserGroupData(userGroupData);
            return userService.setup({}, null);
        });
    }).then(function() {
        self.state(tutao.tutanota.ctrl.AdminNewUser.STATE_SUCCESS);
    }).caught(function(e) {
        self.state(tutao.tutanota.ctrl.AdminNewUser.STATE_FAILED);
        throw e;
    });
};
