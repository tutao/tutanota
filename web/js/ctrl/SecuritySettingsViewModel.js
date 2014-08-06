"use strict";

tutao.provide('tutao.tutanota.ctrl.SecuritySettingsViewModel');

/**
 * Displays the security settings. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.SecuritySettingsViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.records = [];
	this.records.push({ nameTextId: "lastSuccessfulLogin_label", infoTextId: "lastSuccessfulLoginInfo_msg", valueObservable: ko.observable("") });
	this.records.push({ nameTextId: "failedLogins_label", infoTextId: "failedLoginsInfo_msg", valueObservable: ko.observable("") });
	
	var self = this;
	var user = tutao.locator.userController.getLoggedInUser();
	tutao.entity.sys.Login.loadRange(user.getSuccessfulLogins(), tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 2, true).then(function(logins) {
		var loginTimestamp = 0;
		if (logins.length < 2) {
			self.records[0].valueObservable("-");
			loginTimestamp = 0;
		} else {
			self.records[0].valueObservable(tutao.tutanota.util.Formatter.formatFullDateTime(logins[1].getTime()));
			loginTimestamp = logins[1].getTime().getTime();
		}
		var successfulLoginId = tutao.util.EncodingConverter.timestampToGeneratedId(loginTimestamp);
		tutao.entity.sys.Login.loadRange(user.getFailedLogins(), successfulLoginId, 100, false).then(function(failedLogins) {
            self.records[1].valueObservable(failedLogins.length);
		}).caught(function(exception) {
            self.records[1].valueObservable("?");
        });
	}).caught(function(exception) {
        self.records[0].valueObservable("?");
    });
};
