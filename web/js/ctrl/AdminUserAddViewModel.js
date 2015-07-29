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

	this.createStatus = ko.observable({type: "neutral", text: "emptyString_msg", params: {}});
	this.csvDialogVisible = ko.observable(false);
	this.csvData = ko.observable("name;mail.address;securePassword (optional)");
	this.csvData.subscribe(function(newValue) {
		this.csvImportStatus({type: "neutral", text: "emptyString_msg"});
	}, this);
	this.csvImportStatus = ko.observable({type: "neutral", text: "emptyString_msg"});
    this._availableDomains = this.adminUserListViewModel.getAvailableDomains();

    this.state = new tutao.tutanota.util.SubmitStateMachine();
    this.state.setInputInvalidMessageListener(this._getInputInvalidMessage);
    this.state.setSuccessMessage("createActionSuccess_msg");
    this.state.setFailureMessage("createActionFailed_msg");
    this.state.entering(true);
    this.addEmptyUser();

    this.buttons = [
        new tutao.tutanota.ctrl.Button("adminUserAdd_action", 10,  this.addEmptyUser, this._isEntering, false, "newUserAction", "add", "adminUserAdd_action"),
        new tutao.tutanota.ctrl.Button("import_action", 11,  this.openCsvDialog, this._isEntering, false, "newUserAction", "add", "import_action")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype._isEntering = function() {
    return this.state.entering();
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.addEmptyUser = function() {
    if (!this._isEntering()) {
        return;
    }
	this.newUsers.push(new tutao.tutanota.ctrl.AdminNewUser(this._availableDomains));
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.removeUser = function(user) {
    if (!this._isEntering()) {
        return;
    }
    this.newUsers.remove(user);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.openCsvDialog = function() {
    if (!this.state.entering()) {
        return;
    }
	this.csvDialogVisible(true);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.closeCsvDialog = function() {
	this.csvDialogVisible(false);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.importCsv = function() {
	var lines = this.csvData().split(/\r\n|\r|\n/);
	var users = [];
	for (var i = 0; i < lines.length; i++) {
		var lineParts = lines[i].split(";");
        if (lines[i] == "") {
            // just skip blank lines
        } else if (lineParts.length < 2) {
			this.csvImportStatus({type: "invalid", text: "importCsvInvalid_msg", params: {'{1}': i }});
			return;
		} else {
			var user = new tutao.tutanota.ctrl.AdminNewUser(this._availableDomains);
			user.name(lineParts[0]);
			user.mailAddressPrefix(lineParts[1].split("@")[0]);
            user.domain(lineParts[1].split("@")[1]);
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
    if (!this.state.cancelEnabled()) {
        return;
    }
    this.adminUserListViewModel.removeSelection();
    tutao.locator.settingsView.showChangeSettingsColumn();
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype._getInputInvalidMessage = function() {
    if (this.newUsers().length == 0) {
        return "emptyString_msg";
    }
    for(var i = 0; i < this.newUsers().length; i++) {
        if (!this.newUsers()[i].isCreateAccountPossible()) {
            return "emptyString_msg";
        }
    }
    return null;
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.createAccounts = function() {
    if (!this.state.submitEnabled()) {
        // TODO (timely) search in html for "css: { disabled:", replace with sth like knockout enabled-binding and remove all statements like this
        return;
    }
    var self = this;
    var count = self.newUsers().length;
    self.state.submitting(true);
    tutao.locator.buyDialogViewModel.showDialog(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, count).then(function(confirmed) {
        if (confirmed) {
            self.state.setSubmittingMessage("@" + tutao.lang("createActionStatus_msg", {"{index}": 0, "{count}": count}));
            return Promise.each(self.newUsers(), function(newUser) {
                self.state.setSubmittingMessage("@" + tutao.lang("createActionStatus_msg", {"{index}": count - self.newUsers().length, "{count}": count}));
                return newUser.create().then(function() {
                    self.createdUsers.push(self.newUsers.shift());
                });
            }).then(function() {
                self.state.success(true);
                self.adminUserListViewModel.update();
            }).caught(function(exception) {
                self.state.failure(true);
                throw exception;
            });
        } else {
            self.state.entering(true);
        }
    });
};