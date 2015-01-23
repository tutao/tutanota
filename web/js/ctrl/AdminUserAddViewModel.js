"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminUserAddViewModel');

/**
 * Shows a list of all users of a company
 * @constructor
 */
tutao.tutanota.ctrl.AdminUserAddViewModel = function(adminUserListViewModel) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    /**
     * @type {tutao.tutanota.ctrl.AdminUserListViewModel}
     */
    this.adminUserListViewModel = adminUserListViewModel;

    /**
     * @type {function(Array<tutao.tutanota.ctrl.AdminNewUser>=): Array<tutao.tutanota.ctrl.AdminNewUser>}
     */
	this.newUsers = ko.observableArray([]);
    this.createdUsers = ko.observableArray([]);
	this.addEmptyUser();
	
	this.isEditable = ko.observable(true);
	this.createStatus = ko.observable({type: "neutral", text: "emptyString_msg", params: {}});
	this.csvDialogVisible = ko.observable(false);
	this.csvData = ko.observable("name,mail.address,securePassword (optional)");
	this.csvData.subscribe(function(newValue) {
		this.csvImportStatus({type: "neutral", text: "emptyString_msg"});
	}, this);
	this.csvImportStatus = ko.observable({type: "neutral", text: "emptyString_msg"});
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.addEmptyUser = function() {
	this.newUsers.push(new tutao.tutanota.ctrl.AdminNewUser());
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.openCsvDialog = function() {
	this.csvDialogVisible(true);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.closeCsvDialog = function() {
	this.csvDialogVisible(false);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.importCsv = function() {
	var lines = this.csvData().split(/\r\n|\r|\n/);
	var users = [];
	for (var i = 0; i < lines.length; i++) {
		var lineParts = lines[i].split(",");
		if (lineParts.length < 2) {
			this.csvImportStatus({type: "invalid", text: "importCsvInvalid_msg", params: {'{1}': i }});
			return;
		} else {
			var user = new tutao.tutanota.ctrl.AdminNewUser();
			user.name(lineParts[0]);
			user.mailAddressPrefix(lineParts[1].split("@")[0]);
			if (lineParts.length > 2) {
				user.password(lineParts[2]);
			}
			users.push(user);
		}
	}
	this.newUsers(users);
	this.csvDialogVisible(false);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.cancel = function() {
    this.adminUserListViewModel.removeSelection();
    tutao.locator.settingsView.showChangeSettingsColumn();
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.isCreateAccountsPossible = function() {
    if (!this.isEditable()) {
        return false;
    }
    for(var i = 0; i < this.newUsers().length; i++) {
        if (!this.newUsers()[i].isCreateAccountPossible()) {
            return false;
        }
    }
    return true;
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.createAccounts = function() {
    if (!this.isCreateAccountsPossible()) {
        // TODO (timely) search in html for "css: { disabled:", replace with sth like knockout enabled-binding and remove all statements like this
        return;
    }
    var self = this;
    this.isEditable(false);

    var count = this.newUsers().length;
    self.createStatus({type: "neutral", text: "createActionStatus_msg", params: {"{index}": count - this.newUsers().length, "{count}": count}});
    if (self.newUsers().length > 0) {
        return Promise.each(self.newUsers(), function(newUser) {
            self.createStatus({type: "neutral", text: "createActionStatus_msg", params: {"{index}": count - self.newUsers().length, "{count}": count}});
            return newUser.create().then(function() {
                self.createdUsers.push(self.newUsers.shift());
            });
        }).then(function() {
            self.addEmptyUser();
            self.isEditable(true);
            self.createStatus({type: "valid", text: "createActionSuccess_msg"});
            self.adminUserListViewModel.update();
        }).caught(function(exception) {
            self.isEditable(true);
            self.createStatus({type: "invalid", text: "createActionFailed_msg"});
            throw exception;
        });
    }
};