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
    this.invalidDnsRecords = ko.observableArray();

};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype._verifyCustomDomain = function(value) {
    var self = this;
    var cleanedValue = value.trim();
    if ( cleanedValue.length == 0){
        self.customDomainStatus({ type: "neutral", text: "customDomainNeutral_msg"});
    } else if (tutao.tutanota.util.Formatter.isDomainName(cleanedValue)) {
        self.customDomainStatus({ type: "valid", text: "validInputFormat_msg"});
    } else {
        self.customDomainStatus({ type: "invalid", text: "invalidInputFormat_msg"});
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
    service.setup({}, null).then(function(status) {
        if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_OK){
            self.customDomainSubmitStatus({ type: "valid", text: "finished_msg" });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_DNS_LOOKUP_FAILED){
            self.customDomainSubmitStatus({ type: "invalid", text: "customDomainErrorDnsLookupFailure_msg" });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_INVALID_DNS_RECORD){
            self.customDomainSubmitStatus({ type: "invalid", text: "customDomainErrorInvalidDnsRecord_msg" });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_MISSING_MX_RECORD){
            self.customDomainSubmitStatus({ type: "invalid", text: "customDomainErrorMissingMxEntry_msg" });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_MISSING_SPF_RECORD){
            self.customDomainSubmitStatus({ type: "invalid", text: "customDomainErrorMissingSpfEntry_msg" });
        }else {
           self.customDomainSubmitStatus({type: "invalid", text: "customDomainErrorDomainNotAvailable_msg"});
        }

        self.invalidDnsRecords(status.getInvalidDnsRecords());

    }).finally(function(){
        self.busy(false);
    });
};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.getCustomDomainSetupLink = function() {
    var setupLink = "https://tutanota.uservoice.com/knowledgebase/articles/666088";
    if ( tutao.locator.languageViewModel.getCurrentLanguage() == "de" ){
        setupLink = "https://tutanota.uservoice.com/knowledgebase/articles/666070"
    }
    return setupLink;
};





