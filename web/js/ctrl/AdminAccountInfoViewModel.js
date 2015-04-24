"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminAccountInfoViewModel');

/**
 * Displays the account information. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AdminAccountInfoViewModel = function() {

	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this.records = [];
    this.records.push({ nameTextId: "accountType_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "domains_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "storageCapacity_label", infoTextId: null, valueObservable: ko.observable("") });

    var user = tutao.locator.userController.getLoggedInUser();
	this.records[0].valueObservable("Tutanota " + tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES[Number(user.getAccountType())]);

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
            if (capacity > 0) {
                self.records[2].valueObservable(capacity + " GB");
            } else {
                self.records[2].valueObservable(tutao.lang("storageCapacityNoLimit_label"));
            }
        });
    });
};
