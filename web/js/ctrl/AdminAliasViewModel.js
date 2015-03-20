"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminAliasViewModel');

tutao.tutanota.ctrl.AdminAliasViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.mailAddressPrefix = ko.observable("");
    this.domain = ko.observable(tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS[0]);
    this.availableDomains = ko.observableArray(tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS);
    this.mailAddressStatus = ko.observable({ type: "neutral", text: "mailAddressNeutral_msg"});

    this.mailAddress = ko.computed(function() {
        return tutao.tutanota.util.Formatter.getCleanedMailAddress(this.mailAddressPrefix() + "@" + this.domain());
    }, this);

    this.mailAddress.subscribe(this._verifyMailAddressFree, this);

    this.aliasSubmitStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
    this.inputEnabled = ko.observable(false);

    this.maxNbrOfAliases = ko.observable(null);

    var self = this;
    tutao.entity.sys.MailAddressAliasServiceReturn.load({}, null).then(function(mailAddressAliasServiceReturn) {
        self.maxNbrOfAliases(mailAddressAliasServiceReturn.getNbrOfFreeAliases());
        if (self.maxNbrOfAliases() > tutao.locator.userController.getUserGroupInfo().getMailAddressAliases().length) {
            self.inputEnabled(true);
        } else {
            self.mailAddressStatus({ type: "neutral", text: "adminMaxNbrOfAliasesReached_msg"});
        }
    });
};

tutao.tutanota.ctrl.AdminAliasViewModel.prototype._verifyMailAddressFree = function(cleanedValue) {
    var self = this;
    if (!cleanedValue || self.mailAddressPrefix().length < tutao.tutanota.ctrl.RegistrationViewModel.MINIMUM_MAIL_ADDRESS_PREFIX_LENGTH) {
        self.mailAddressStatus({ type: "invalid", text: "mailAddressInvalid_msg"});
        return;
    } else if (!tutao.tutanota.util.Formatter.isMailAddress(cleanedValue)) {
        self.mailAddressStatus({ type: "invalid", text: "mailAddressInvalid_msg"});
        return;
    }

    self.mailAddressStatus({ type: "invalid", text: "mailAddressBusy_msg"});

    setTimeout(function() {
        if (self.mailAddress() == cleanedValue) {
            var params = [];
            tutao.entity.sys.MailAddressAvailabilityReturn.load(new tutao.entity.sys.MailAddressAvailabilityData().setMailAddress(cleanedValue), params, []).then(function(mailAddressAvailabilityReturn) {
                if (self.mailAddress() == cleanedValue) {
                    if (mailAddressAvailabilityReturn.getAvailable()) {
                        self.mailAddressStatus({ type: "valid", text: "mailAddressAvailable_msg"});
                    } else {
                        self.mailAddressStatus({ type: "invalid", text: "mailAddressNA_msg"});
                    }
                }
            }).caught(tutao.AccessDeactivatedError, function (exception) {
                self.mailAddressStatus({ type: "invalid", text: "mailAddressDelay_msg"});
            });
        }
    }, 500);
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.AdminAliasViewModel.prototype.confirmPossible = function() {
    return this.inputEnabled() && this.mailAddressStatus().type == "valid";
};

/**
 * Called when the confirm button is clicked by the user.
 */
tutao.tutanota.ctrl.AdminAliasViewModel.prototype.confirm = function() {
    if (!this.confirmPossible()) {
        return;
    }

    this.inputEnabled(false);
    this.aliasSubmitStatus({ type: "neutral", text: "pleaseWait_msg" });

    var self = this;
    var service = new tutao.entity.sys.MailAddressAliasServiceData();
    service.setGroup(tutao.locator.userController.getUserGroupId())
        .setMailAddress(this.mailAddress());
    service.setup({}, null).then(function() {
        self.aliasSubmitStatus({ type: "valid", text: "finished_msg" });
    });
};
