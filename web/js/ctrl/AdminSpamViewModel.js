"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminSpamViewModel');

/**
 * Displays the account information. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AdminSpamViewModel = function() {

    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.state = new tutao.tutanota.util.SubmitStateMachine(true);
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);

    this.domainOrMailAddress = ko.observable("");

    this.availableListTypes = ko.observableArray();
    this.availableListTypes.push({value: tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_WHITELIST, text: tutao.lang("emailSenderWhitelist_action")});
    this.availableListTypes.push({value: tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_BLACKLIST, text: tutao.lang("emailSenderBlacklist_action")});
    this.availableListTypes.push({value: tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_DISCARD, text: tutao.lang("emailSenderDiscardlist_action")});

    this.selectedListType = ko.observable(this.availableListTypes()[0]);

    var user = tutao.locator.userController.getLoggedInUser();
    var self = this;

    this.customerServerProperties = ko.observable(null);

    this._customDomains = [];

    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo){
            var domainInfos = customerInfo.getDomainInfos();
            for (var i=0; i<domainInfos.length;i++){
                self._customDomains.push(domainInfos[i].getDomain());
            }
            if( customer.getServerProperties() == null ){
                var sessionKey = tutao.locator.aesCrypter.generateRandomKey();
                var memberships = user.getMemberships();
                var adminGroupKey = null;
                for (var i = 0; i < memberships.length; i++) {
                    if (memberships[i].getAdmin()) {
                        adminGroupKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), memberships[i].getSymEncGKey());
                    }
                }
                var groupEncSessionKey = tutao.locator.aesCrypter.encryptKey(adminGroupKey, sessionKey);
                var createServerPropertiesService = new tutao.entity.sys.CreateCustomerServerPropertiesData()
                    .setAdminGroupEncSessionKey(groupEncSessionKey);
                return createServerPropertiesService.setup({}, null).then(function(serverPropertiesReturn) {
                   return serverPropertiesReturn.getId();
                });
            }else {
                return customer.getServerProperties();
            }
        });
    }).then(function(serverPropertiesId){
        return tutao.entity.sys.CustomerServerProperties.load(serverPropertiesId).then(function(properties) {
            self.customerServerProperties(new tutao.entity.sys.CustomerServerPropertiesEditable(properties));
        })
    }).then(function() {
        self.state.entering(true);
    });
};


tutao.tutanota.ctrl.AdminSpamViewModel.prototype._getInputInvalidMessage = function() {
    var currentValue = this.domainOrMailAddress().toLowerCase().trim();

    if (currentValue == "" ) {
        return "emptyString_msg";
    }
    if (!tutao.tutanota.util.Formatter.isDomainName(currentValue) && !tutao.tutanota.util.Formatter.isMailAddress(currentValue, false)){
        return "invalidInputFormat_msg";
    }
    if (this._isInvalidRule(currentValue) ) {
        return "emailSenderInvalidRule_msg";
    }
    if (this._isExistingRule(currentValue) ) {
        return "emailSenderExistingRule_msg";
    }

    return null;
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype._isInvalidRule = function(currentDomainOrMailAddress) {
    if ( this.selectedListType().value != tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_WHITELIST) {
        if (tutao.tutanota.util.Formatter.isDomainName(currentDomainOrMailAddress)) {
            return currentDomainOrMailAddress == "tutao.de"
                || tutao.util.ArrayUtils.contains(tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS, currentDomainOrMailAddress)
                || tutao.util.ArrayUtils.contains(this._customDomains, currentDomainOrMailAddress);
        }
        if (tutao.tutanota.util.Formatter.isMailAddress(currentDomainOrMailAddress, false)) {
            var domain = currentDomainOrMailAddress.split("@")[1];
            return domain == "tutao.de"|| tutao.util.ArrayUtils.contains(this._customDomains, domain);
        }
    }
    return false;
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype._isExistingRule = function(currentDomainOrMailAddress) {
    var emailSenderList = this.customerServerProperties().emailSenderList();
    for(var i=0; i < emailSenderList.length; i++){
        if (currentDomainOrMailAddress == emailSenderList[i].value()) {
            return true;
        }
    }
    return false;
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype.addEmailSenderListEntry = function() {
    var self = this;
    if (!this.state.submitEnabled()) {
        return;
    }
    var currentValue = this.domainOrMailAddress().toLowerCase().trim();
    var newListEntry = new tutao.entity.sys.EmailSenderListElement(this.customerServerProperties().getCustomerServerProperties());
    newListEntry.setValue(currentValue);
    newListEntry.setHashedValue(tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.locator.shaCrypter.hash(tutao.util.EncodingConverter.stringToUtf8Uint8Array(currentValue))));
    newListEntry.setType(this.selectedListType().value);
    this.customerServerProperties().emailSenderList.push(new tutao.entity.sys.EmailSenderListElementEditable(newListEntry));
    this._updateServerProperties().then(function(){self.domainOrMailAddress("")});
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype.removeEmailSenderListEntry = function(emailSenderListEntry) {
    this.customerServerProperties().emailSenderList.remove(emailSenderListEntry);
    this._updateServerProperties();
};


tutao.tutanota.ctrl.AdminSpamViewModel.prototype._updateServerProperties = function() {
    var self = this;
    this.customerServerProperties().update();
    self.state.submitting(true);
    return this.customerServerProperties().getCustomerServerProperties().update().lastly(function(){
        self.state.entering(true)
    });
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype.getEmailSenderListEntries = function() {
    return this.customerServerProperties() == null ? [] : this.customerServerProperties().emailSenderList();
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype.getTextForType = function(emailSenderListType) {
    for( var i=0; i< this.availableListTypes().length; i++){
        if ( this.availableListTypes()[i].value == emailSenderListType) {
            return this.availableListTypes()[i].text;
        }
    }
    return "";
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype.getSpamRuleSetupLink = function() {
    var setupLink = "https://tutanota.uservoice.com/knowledgebase/articles/780147";
    if ( tutao.locator.languageViewModel.getCurrentLanguage() == "de" ){
        setupLink = "http://tutanota.uservoice.com/knowledgebase/articles/780153";
    }
    return setupLink;
};
