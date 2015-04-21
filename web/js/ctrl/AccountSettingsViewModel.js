"use strict";

tutao.provide('tutao.tutanota.ctrl.AccountSettingsViewModel');

/**
 * Displays the account settings. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AccountSettingsViewModel = function() {

	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    var user = tutao.locator.userController.getLoggedInUser();

    this.records = [];
    this.records.push({ nameTextId: "accountType_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailAddress_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailAddressAliases_label", infoTextId: "mailAddressAliasesInfo_label", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailName_label", infoTextId: "mailNameInfo_msg", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "storageCapacity_label", infoTextId: null, valueObservable: ko.observable("") });
    this.showAddinLink = (user.getAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER);

    var self = this;
	self.records[0].valueObservable("Tutanota " + tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_NAMES[Number(user.getAccountType())]);
	user.getUserGroup().loadGroupInfo().then(function(userGroup, exception) {
        self.records[1].valueObservable(userGroup.getMailAddress());
        var aliasNames = "-";
        var aliases = userGroup.getMailAddressAliases();
        Promise.each(aliases, function(alias) {
            if (aliasNames == "-") {
                aliasNames = alias.getMailAddress();
            } else {
                aliasNames += ", " + alias.getMailAddress();
            }
        });
        self.records[2].valueObservable(aliasNames);
        self.records[3].valueObservable(userGroup.getName());
	}).caught(function(e) {
        self.records[1].valueObservable("?");
        self.records[2].valueObservable("?");
        self.records[3].valueObservable("?");
        throw e;
    });

    user.loadCustomer().then(function(customer) {
        customer.loadCustomerInfo().then(function(customerInfo){
            var capacity = customerInfo.getStorageCapacity();
            if (capacity > 0) {
                self.records[4].valueObservable(capacity + " GB");
            } else {
                self.records[4].valueObservable(tutao.lang("storageCapacityNoLimit_label"));
            }
        });
    });
};
