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
    if (this.domainOrMailAddress().trim() == "" ) {
        return "emptyString_msg";
    }
    if (!tutao.tutanota.util.Formatter.isDomainName(this.domainOrMailAddress()) && !tutao.tutanota.util.Formatter.isMailAddress(this.domainOrMailAddress())){
        return "invalidInputFormat_msg";
    }
    if (this._isInvalidRule() ) {
        return "emailSenderInvalidRule_msg";
    }
    return null;
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype._isInvalidRule = function() {
    if ( this.selectedListType().value != tutao.entity.tutanota.TutanotaConstants.EMAIL_SENDER_LIST_TYPE_WHITELIST) {
        if (tutao.tutanota.util.Formatter.isDomainName(this.domainOrMailAddress())) {
            return this.domainOrMailAddress() == "tutao.de"
                || tutao.util.ArrayUtils.contains(tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS, this.domainOrMailAddress())
                || tutao.util.ArrayUtils.contains(this._customDomains, this.domainOrMailAddress());
        }
        if (tutao.tutanota.util.Formatter.isMailAddress(this.domainOrMailAddress())) {
            var domain = this.domainOrMailAddress().split("@")[1];
            return domain == "tutao.de"|| tutao.util.ArrayUtils.contains(this._customDomains, domain);
        }
    }
    return false;
};


tutao.tutanota.ctrl.AdminSpamViewModel.prototype.addEmailSenderListEntry = function() {

    if (!this.state.submitEnabled()) {
        return;
    }
    var currentValue = this.domainOrMailAddress().trim();
    var newListEntry = new tutao.entity.sys.EmailSenderListElement(this.customerServerProperties().getCustomerServerProperties());
    newListEntry.setValue(currentValue);
    newListEntry.setHashedValue(tutao.locator.shaCrypter.hashHex(tutao.util.EncodingConverter.utf8ToHex(currentValue)));
    newListEntry.setType(this.selectedListType().value);
    this.customerServerProperties().emailSenderList.push(new tutao.entity.sys.EmailSenderListElementEditable(newListEntry));
    this._updateServerProperties();
};

tutao.tutanota.ctrl.AdminSpamViewModel.prototype.removeEmailSenderListEntry = function(emailSenderListEntryIndex) {
    this.customerServerProperties().emailSenderList.splice(emailSenderListEntryIndex, 1);
    this._updateServerProperties();
};


tutao.tutanota.ctrl.AdminSpamViewModel.prototype._updateServerProperties = function() {
    var self = this;
    this.customerServerProperties().update();
    self.state.submitting(true);
    this.customerServerProperties().getCustomerServerProperties().update().lastly(function(){
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




