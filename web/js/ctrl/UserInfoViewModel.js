"use strict";

tutao.provide('tutao.tutanota.ctrl.UserInfoViewModel');

/**
 * Displays user information. This view model is created dynamically.
 * @constructor
 */
tutao.tutanota.ctrl.UserInfoViewModel = function() {

	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    var user = tutao.locator.userController.getLoggedInUser();

    this.records = [];
    this.records.push({ nameTextId: "mailAddress_label", infoTextId: null, valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailAddressAliases_label", infoTextId: "mailAddressAliasesInfo_label", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "mailName_label", infoTextId: "mailNameInfo_msg", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "lastSuccessfulLogin_label", infoTextId: "lastSuccessfulLoginInfo_msg", valueObservable: ko.observable("") });
    this.records.push({ nameTextId: "failedLogins_label", infoTextId: "failedLoginsInfo_msg", valueObservable: ko.observable("") });
    this.showAddinLink = (user.getAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER);

    var self = this;
	user.getUserGroup().loadGroupInfo().then(function(userGroupInfo) {
        self.records[0].valueObservable(userGroupInfo.getMailAddress());
        var aliasNames = "-";
        var aliases = userGroupInfo.getMailAddressAliases();
        Promise.each(aliases, function(alias) {
            if (aliasNames == "-") {
                aliasNames = alias.getMailAddress();
            } else {
                aliasNames += ", " + alias.getMailAddress();
            }
        }).then(function(){
            self.records[1].valueObservable(aliasNames);
            self.records[2].valueObservable(userGroupInfo.getName());
        });
	}).caught(function(e) {
        self.records[0].valueObservable("?");
        self.records[1].valueObservable("?");
        self.records[2].valueObservable("?");
        throw e;
    });

    tutao.entity.sys.Login.loadRange(user.getSuccessfulLogins(), tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 2, true).then(function(logins) {
        var loginTimestamp = 0;
        if (logins.length < 2) {
            self.records[3].valueObservable("-");
            loginTimestamp = 0;
        } else {
            self.records[3].valueObservable(tutao.tutanota.util.Formatter.formatFullDateTime(logins[1].getTime()));
            loginTimestamp = logins[1].getTime().getTime();
        }
        var successfulLoginId = tutao.util.EncodingConverter.timestampToGeneratedId(loginTimestamp);
        tutao.entity.sys.Login.loadRange(user.getFailedLogins(), successfulLoginId, 100, false).then(function(failedLogins) {
            self.records[4].valueObservable(failedLogins.length);
        }).caught(function(exception) {
            self.records[4].valueObservable("?");
        });
    }).caught(function(exception) {
        self.records[3].valueObservable("?");
    });
};
