"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminCustomDomainViewModel');

tutao.tutanota.ctrl.AdminCustomDomainViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.customDomain = ko.observable("");
    this.customDomainStatus = ko.observable({ type: "neutral", text: tutao.lang("customDomainNeutral_msg")});

    this.customDomainSubmitStatus = ko.observable({ type: "neutral", text: tutao.lang("emptyString_msg") });
    /** use null to remove a catch all group. */
    this.availableCatchAllGroups = ko.observableArray([null]);
    this._userGroupInfos = ko.observableArray();

    this.customDomain.subscribe(function(value){
        this._verifyCustomDomain(value);
    }, this);

    this.busy = ko.observable(false);
    this.invalidDnsRecords = ko.observableArray();

    var self = this;
    this.customDomains = ko.observableArray();

    var user = tutao.locator.userController.getLoggedInUser();
    this.busy(true);
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            var domainNames = "-";
            var domainInfos = customerInfo.getDomainInfos();
            return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.GroupInfo, customer.getUserGroups(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(userGroupInfos){
                return Promise.each(userGroupInfos, function(userGroupInfo) {
                    // only add enabled groups to the available groups.
                    if (userGroupInfo.getDeleted() == null) {
                        self.availableCatchAllGroups.push(userGroupInfo.getGroup());
                    }
                    // list of user group infos to resolve email addresses for catch all group.
                    self._userGroupInfos.push(userGroupInfo);
                });
            }).then(function(){
                return Promise.each(domainInfos, function(domainInfo) {
                    self.customDomains.push({ domain: domainInfo.getDomain(), catchAllGroup: ko.observable(domainInfo.getCatchAllUserGroup()), originCatchAllGroup: ko.observable(domainInfo.getCatchAllUserGroup())});
                });
            });
        });
    }).lastly(function () {
        self.busy(false);
    });
};


tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.deleteCustomDomain = function(customDomainEntry) {
    var self = this;
    var service = new tutao.entity.sys.CustomDomainData();
    service.setDomain(customDomainEntry.domain.trim().toLowerCase());
    service.erase({}, null).then(function() {
        self.customDomainSubmitStatus({ type: "valid", text: tutao.lang("finished_msg") });
        self.customDomains.remove(customDomainEntry);
    }).caught(tutao.PreconditionFailedError, function (exception) {
        self.customDomainSubmitStatus({ type: "invalid", text: tutao.lang( "customDomainDeletePreconditionFailed_msg", {"{domainName}":service.getDomain()})});
    });
};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype._verifyCustomDomain = function(value) {
    var self = this;
    var cleanedValue = value.trim().toLowerCase();
    if ( cleanedValue.length == 0){
        self.customDomainStatus({ type: "neutral", text: tutao.lang("customDomainNeutral_msg")});
    } else if (self.containsCustomDomain(cleanedValue)) {
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
    if (tutao.locator.viewManager.isFreeAccount()) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
        return;
    }

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
            if (!self.containsCustomDomain(service.getDomain())) {
                self.customDomains.push({ domain: service.getDomain(), catchAllGroup: ko.observable(null), originCatchAllGroup : ko.observable(null)});
            }
            self.customDomain("");
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


/** Returns a textual representation for the group id to select a catch all group for a custom domain. */
tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.getTextForGroup = function(userGroupId) {
    if (userGroupId == null) {
        return tutao.lang("comboBoxSelectionNone_msg");
    }

    for( var i=0;i<this._userGroupInfos().length; i++){
        if (this._userGroupInfos()[i].getGroup() == userGroupId) {
            return this._userGroupInfos()[i].getMailAddress();
        }
    }
    // should not happen, but show the user group id in this case instead of throwing an error.
    return userGroupId;
};

/** Checks if a domain is already in the list of custom domains. */
tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.containsCustomDomain = function(domain) {
    var localCustomDomains = this.customDomains();
    for( var i=0;i<localCustomDomains.length; i++){
        if (localCustomDomains[i].domain == domain) {
            return true;
        }
    }
    return false;
};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.isNewCatchAllValue = function(customDomainEntry) {
    return customDomainEntry.catchAllGroup() != customDomainEntry.originCatchAllGroup();
};

tutao.tutanota.ctrl.AdminCustomDomainViewModel.prototype.updateCustomDomain = function(customDomainEntry){
    if (this.busy()){
        return;
    }
    var self = this;
    var service = new tutao.entity.sys.CustomDomainData();
    service.setDomain(customDomainEntry.domain.trim().toLowerCase());
    service.setCatchAllUserGroup(customDomainEntry.catchAllGroup());
    this.busy(true);
    service.update({}, null).then(function() {
        self.customDomainSubmitStatus({ type: "valid", text: tutao.lang("finished_msg") });
        customDomainEntry.originCatchAllGroup(customDomainEntry.catchAllGroup());
    }).lastly(function () {
        self.busy(false);
    });
};



