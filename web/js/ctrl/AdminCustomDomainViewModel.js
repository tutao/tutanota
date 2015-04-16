"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminCustomDomainViewModel');

tutao.tutanota.ctrl.AdminCustomDomainViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.customDomain = ko.observable("");
    this.customDomainStatus = ko.observable({ type: "neutral", text: "customDomainNeutral_msg"});

    this.customDomainSubmitStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });

    this.customDomain.subscribe(function(value){
        this._verifyCustomDomain(value);
    }, this);

    this.busy = ko.observable(false);

};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype._verifyCustomDomain = function(value) {
    var self = this;
    var cleanedValue = value.trim();
    if ( cleanedValue.length == 0){
        self.customDomainStatus({ type: "neutral", text: "customDomainNeutral_msg"});
    } else if (tutao.tutanota.util.Formatter.isDomainName(cleanedValue)) {
        self.customDomainStatus({ type: "valid", text: "promotionCodeEnterValidFormat_msg"});
    } else {
        self.customDomainStatus({ type: "invalid", text: "promotionCodeEnterWrongFormat_msg"});
    }
};

/**
 * Provides the information if the user may press the confirm button.
 * @return {boolean} True if the button can be presse, false otherwise.
 */
tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.confirmPossible = function() {
    return this.customDomainStatus().type == "valid";
};

/**
 * Called when the confirm button is clicked by the user.
 */
tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.confirm = function() {
    if (!this.confirmPossible()) {
        return;
    }

    this.busy(true);
    this.customDomainSubmitStatus({ type: "neutral", text: "pleaseWait_msg" });

    var self = this;
    var service = new tutao.entity.sys.CustomDomainData();
    service.setDomain(this.customDomain().trim().toLowerCase());
    service.setup({}, null).then(function() {
        self.customDomainSubmitStatus({ type: "valid", text: "finished_msg" });
    }).caught(function(){
        self.customDomainSubmitStatus({ type: "invalid", text: "customDomainError_msg" });
    }).finally(function(){
        self.busy(false);
    });
};
