"use strict";

goog.provide('tutao.tutanota.ctrl.AccountSettingsViewModel');

/**
 * Displays the account settings. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.AccountSettingsViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.records = [];
	this.records.push({ nameTextId: "accountType_label", infoTextId: null, valueObservable: ko.observable("") });
	this.records.push({ nameTextId: "mailAddress_label", infoTextId: null, valueObservable: ko.observable("") });
	this.records.push({ nameTextId: "mailName_label", infoTextId: "mailNameInfo_msg", valueObservable: ko.observable("") });

	var self = this;
	var user = tutao.locator.userController.getLoggedInUser();
	var accountTypeNames = ["System", "Free", "Starter", "Premium", "Stream"];
	self.records[0].valueObservable("Tutanota " + accountTypeNames[Number(user.getAccountType())]);
	user.getUserGroup().loadGroupInfo(function(userGroup, exception) {
		if (exception) {
            console.log(exception);
			self.records[1].valueObservable("?");
			self.records[2].valueObservable("?");
		} else {
			self.records[1].valueObservable(userGroup.getMailAddress());
			self.records[2].valueObservable(userGroup.getName());
		}
	});
};
