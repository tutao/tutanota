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
    this.newUsers.subscribe(this._updatePrice);
    this.createdUsers = ko.observableArray([]);

	
	this.isEditable = ko.observable(true);
	this.createStatus = ko.observable({type: "neutral", text: "emptyString_msg", params: {}});
	this.csvDialogVisible = ko.observable(false);
	this.csvData = ko.observable("name;mail.address;securePassword (optional)");
	this.csvData.subscribe(function(newValue) {
		this.csvImportStatus({type: "neutral", text: "emptyString_msg"});
	}, this);
	this.csvImportStatus = ko.observable({type: "neutral", text: "emptyString_msg"});
    this._availableDomains = this.adminUserListViewModel.getAvailableDomains();

    this.accountingInfo = ko.observable(null);

    var self = this;
    tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                self.accountingInfo(accountingInfo);
                self.addEmptyUser();
            });
        });
    });

    this._price = ko.observable(null);
    this.buttons = [
        new tutao.tutanota.ctrl.Button("adminUserAdd_action", 10,  this.addEmptyUser, null, false, "newUserAction", "add", "adminUserAdd_action"),
        new tutao.tutanota.ctrl.Button("import_action", 11,  this.openCsvDialog, null, false, "newUserAction", "add", "import_action")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.addEmptyUser = function() {
	this.newUsers.push(new tutao.tutanota.ctrl.AdminNewUser(this._availableDomains));
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.removeUser = function(user) {
    this.newUsers.remove(user);
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
    this.adminUserListViewModel.removeSelection();
    tutao.locator.settingsView.showChangeSettingsColumn();
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.isCreateAccountsPossible = function() {
    if (!this.isEditable() || this.newUsers().length == 0 || !this._price()) {
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

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummaryBookingText = function() {
    return this.newUsers().length + " " + tutao.lang("accounts_label") + " Tutanota Premium";
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummarySubscriptionText = function() {
    if (!this.accountingInfo()) {
        return "";
    } else if (this.accountingInfo().getPaymentInterval() == "12") {
        return tutao.lang("yearly_label") + ', ' + tutao.lang('automaticRenewal_label');
    } else {
        return tutao.lang("monthly_label") + ', ' + tutao.lang('automaticRenewal_label');
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummarySubscriptionInfoText = function() {
    if (!this.accountingInfo() || !this._price()) {
        return tutao.lang("loading_msg")    ;
    } else {
        return tutao.lang("endOfSubscriptionPeriod_label") + " " + tutao.tutanota.util.Formatter.dateToSimpleString(this._price().getPeriodEndDate());
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummaryPriceText = function() {
    if (!this.accountingInfo() || !this._price()) {
        return tutao.lang("loading_msg");
    } else {
        var netGrossText = this.accountingInfo().getBusiness() ? tutao.lang("net_label") : tutao.lang("gross_label");
        var periodText = (this.accountingInfo().getPaymentInterval() == "12") ? tutao.lang('perYear_label') : tutao.lang('perMonth_label');
        return tutao.util.BookingUtils.formatPrice(Number(this._price().getFuturePrice().getPrice())) + " " + periodText + " (" + netGrossText + ")";
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummaryPriceInfo1Text = function() {
    if (!this.accountingInfo() || !this._price()) {
        return tutao.lang("loading_msg");
    } else {
        return tutao.lang("oldTotalPrice_label") + " " + tutao.util.BookingUtils.formatPrice(Number(this._price().getCurrentPrice().getPrice()));
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummaryPriceInfo2Text = function() {
    if (!this.accountingInfo() || !this._price()) {
        return tutao.lang("loading_msg");
    } else if (this._price().getCurrentPeriodAddedPrice() != null && this._price().getCurrentPeriodAddedPrice() > 0) {
        return tutao.lang("priceForCurrentAccountingPeriod_label") + " " + tutao.util.BookingUtils.formatPrice(Number(this._price().getCurrentPeriodAddedPrice()));
    } else {
        return tutao.lang("emptyString_msg");
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getSummaryPaymentMethodInfoText = function() {
    if (!this.accountingInfo()) {
        return "";
    } else if (this.accountingInfo().getPaymentMethodInfo()) {
        return this.accountingInfo().getPaymentMethodInfo();
    } else {
        return tutao.lang(tutao.util.BookingUtils.getPaymentMethodNameTextId(this.accountingInfo().getPaymentMethod()));
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.getCreateUsersButtonTextId = function() {
    if (this.isBuy()) {
        return "buy_action";
    } else {
        return "createUsers_label";
    }
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype._updatePrice = function() {
    this._price(null);
    var self = this;
    tutao.util.BookingUtils.getPrice(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, this.newUsers().length).then(function(price) {
        self._price(price);
    });
};

tutao.tutanota.ctrl.AdminUserAddViewModel.prototype.isBuy = function() {
    return  (this._price() && Number(this._price().getCurrentPrice().getPrice()) != Number(this._price().getFuturePrice().getPrice()));
};
