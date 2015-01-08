"use strict";

tutao.provide('tutao.tutanota.ctrl.AccountSettingsViewModel');

/**
 * Displays the account settings. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AccountSettingsViewModel = function() {

    var DEFAULT_STORAGE_CAPACITY = "1GB";

	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    var user = tutao.locator.userController.getLoggedInUser();

    this.records = [];
    this.records.push({ nameTextId: "accountType_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailAddress_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailName_label", infoTextId: "mailNameInfo_msg", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "storageCapacity_label", infoTextId: null, valueObservable: ko.observable(DEFAULT_STORAGE_CAPACITY) });
    this.showAddinLink = (user.getAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER);

    var self = this;
	var accountTypeNames = ["System", "Free", "Starter", "Premium", "Stream"];
	self.records[0].valueObservable("Tutanota " + accountTypeNames[Number(user.getAccountType())]);
	user.getUserGroup().loadGroupInfo().then(function(userGroup, exception) {
        self.records[1].valueObservable(userGroup.getMailAddress());
        self.records[2].valueObservable(userGroup.getName());
	}).caught(function(e) {
        self.records[1].valueObservable("?");
        self.records[2].valueObservable("?");
        throw e;
    });
};
