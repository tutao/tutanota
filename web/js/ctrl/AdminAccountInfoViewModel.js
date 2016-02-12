"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminAccountInfoViewModel');

/**
 * Displays the account information. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AdminAccountInfoViewModel = function() {

	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.records = [];
    this.records.push({ nameTextId: "accountType_label", infoTextId: null, valueObservable: ko.computed(function() {
        return "Tutanota " + tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES[Number(tutao.locator.viewManager.getLoggedInUserAccountType())];
    }) });
    this.records.push({ nameTextId: "domains_label", infoTextId: "addDomainInfo_msg", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "storageCapacity_label", infoTextId: "storageCapacityInfo_label", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailAddressAliases_label", infoTextId: "emailAliasInfo_label", valueObservable: ko.observable("") });

    var user = tutao.locator.userController.getLoggedInUser();

    var self = this;
    user.loadCustomer().then(function(customer) {
        customer.loadCustomerInfo().then(function(customerInfo) {
            var domainNames = "-";
            var domainInfos = customerInfo.getDomainInfos();
            Promise.each(domainInfos, function(domainInfo) {
                if (domainNames == "-") {
                    domainNames = domainInfo.getDomain();
                } else {
                    domainNames += ", " + domainInfo.getDomain();
                }
            });
            self.records[1].valueObservable(domainNames);

            var capacity = customerInfo.getStorageCapacity();
            if ( capacity == 1  ){
                self.records[2].valueObservable("-");
            }else if (capacity > 1) {
                self.records[2].valueObservable(capacity + " GB");
            } else {
                self.records[2].valueObservable(tutao.lang("storageCapacityNoLimit_label"));
            }

            var sharedEmailAliases = customerInfo.getSharedEmailAliases();
            var usedSharedEmailAliases = customerInfo.getUsedSharedEmailAliases();
            if (sharedEmailAliases > 0) {
                self.records[3].valueObservable(sharedEmailAliases + " "+  tutao.lang('emailAliasesTotal_label') + " / " + usedSharedEmailAliases + " "+  tutao.lang('emailAliasesUsed_label'));
            } else {
                self.records[3].valueObservable("-");
            }
        });
    });
};
