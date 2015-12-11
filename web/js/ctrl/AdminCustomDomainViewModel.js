"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminCustomDomainViewModel');

tutao.tutanota.ctrl.AdminCustomDomainViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.customDomain = ko.observable("");
    this.customDomainStatus = ko.observable({ type: "neutral", text: tutao.lang("customDomainNeutral_msg")});

    this.customDomainSubmitStatus = ko.observable({ type: "neutral", text: tutao.lang("emptyString_msg") });

    this.customDomain.subscribe(function(value){
        this._verifyCustomDomain(value);
    }, this);

    this.busy = ko.observable(false);
    this.invalidDnsRecords = ko.observableArray();

    var self = this;
    this.customDomains = ko.observableArray();

    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        customer.loadCustomerInfo().then(function(customerInfo) {
            var domainNames = "-";
            var domainInfos = customerInfo.getDomainInfos();
            return Promise.each(domainInfos, function(domainInfo) {
                self.customDomains.push(domainInfo.getDomain());
            });
        });
    });
};


tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.deleteCustomDomain = function(customDomain) {
    var self = this;
    var service = new tutao.entity.sys.CustomDomainData();
    service.setDomain(customDomain.trim().toLowerCase());
    service.erase({}, null).then(function() {
        self.customDomainSubmitStatus({ type: "valid", text: tutao.lang("finished_msg") });
        self.customDomains.remove(service.getDomain());
    }).caught(tutao.PreconditionFailedError, function (exception) {
        self.customDomainSubmitStatus({ type: "invalid", text: tutao.lang( "customDomainDeletePreconditionFailed_msg", {"{domainName}":service.getDomain()})});
    });
};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype._verifyCustomDomain = function(value) {
    var self = this;
    var cleanedValue = value.trim().toLowerCase();
    if ( cleanedValue.length == 0){
        self.customDomainStatus({ type: "neutral", text: tutao.lang("customDomainNeutral_msg")});
    } else if (self.customDomains.indexOf(cleanedValue) >= 0) {
        self.customDomainStatus({ type: "invalid", text: tutao.lang("customDomainDomainAssigned_msg")});
    } else if (tutao.tutanota.util.Formatter.isDomainName(cleanedValue)) {
        self.customDomainStatus({ type: "valid", text: tutao.lang("validInputFormat_msg")});
    } else {
        self.customDomainStatus({ type: "invalid", text: tutao.lang("invalidInputFormat_msg")});
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
    this.customDomainSubmitStatus({ type: "neutral", text: tutao.lang("pleaseWait_msg") });

    var self = this;
    var service = new tutao.entity.sys.CustomDomainData();
    service.setDomain(this.customDomain().trim().toLowerCase());
    service.setup({}, null).then(function(status) {
        if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_OK){
            self.customDomainSubmitStatus({ type: "valid", text: tutao.lang("finished_msg") });
            if (self.customDomains.indexOf(service.getDomain()) < 0) {
                self.customDomains.push(service.getDomain());
            }
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_DNS_LOOKUP_FAILED){
            self.customDomainSubmitStatus({ type: "invalid", text: tutao.lang("customDomainErrorDnsLookupFailure_msg") });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_INVALID_DNS_RECORD){
            self.customDomainSubmitStatus({ type: "invalid", text: tutao.lang("customDomainErrorInvalidDnsRecord_msg") });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_MISSING_MX_RECORD){
            self.customDomainSubmitStatus({ type: "invalid", text: tutao.lang("customDomainErrorMissingMxEntry_msg") });
        }else if ( status.getStatusCode() == tutao.entity.tutanota.TutanotaConstants.CUSTOM_DOMAIN_STATUS_MISSING_SPF_RECORD){
            self.customDomainSubmitStatus({ type: "invalid", text: tutao.lang("customDomainErrorMissingSpfEntry_msg") });
        }else {
           self.customDomainSubmitStatus({type: "invalid", text: tutao.lang("customDomainErrorDomainNotAvailable_msg")});
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





