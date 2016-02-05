"use strict";

tutao.provide('tutao.tutanota.ctrl.SettingsViewModel');

/**
 * Handles the user settings in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.SettingsViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.adminUserListViewModel = ko.observable(null);

	this.displayed = ko.observable(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_USER_INFO);
	this.displayed.subscribe(function(displayed) {
        var self = this;
        if (displayed == tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_USER_LIST) {
            self.adminUserListViewModel(new tutao.tutanota.ctrl.AdminUserListViewModel());
        } else {
            setTimeout(function() {
                self.adminUserListViewModel(null);
            }, 0);
        }
        if (displayed == tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_INBOX_RULES_SETTINGS) {
            tutao.locator.inboxRulesViewModel.init();
        }
	}, this);
    this.bookingAvailable = ko.observable(false);
};

tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_USER_INFO = 0;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_CHANGE_PASSWORD = 1;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_USER_LIST = 2;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_DELETE_ACCOUNT = 3;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PREMIUM_FEATURES = 4;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_MESSAGES = 5;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_MAIL_SETTINGS = 6;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_INVOICING = 7;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_ACCOUNT_INFO = 8;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT = 9;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_SPAM = 10;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_INBOX_RULES_SETTINGS = 11;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_NOTHING = 100;

/**
 * Provides all user setting ids.
 * @return {Array.<Number>} The Settings ids.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getUserSettings = function() {
	var s = tutao.tutanota.ctrl.SettingsViewModel;
	var settings = [s.DISPLAY_USER_INFO, s.DISPLAY_CHANGE_PASSWORD];
    if (!tutao.locator.viewManager.isOutlookAccount()) {
        settings.push(s.DISPLAY_MAIL_SETTINGS);
        settings.push(s.DISPLAY_INBOX_RULES_SETTINGS);
    }
	return settings;
};

/**
 * Provides all account settings ids.
 * @return {Array.<Number>} The Settings ids.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getAccountSettings = function() {
    var s = tutao.tutanota.ctrl.SettingsViewModel;
    var settings = [];

    if (tutao.locator.userController.isLoggedInUserAdmin() ) {
        settings.push(s.DISPLAY_ADMIN_ACCOUNT_INFO);
        settings.push(s.DISPLAY_ADMIN_USER_LIST);
        settings.push(s.DISPLAY_ADMIN_MESSAGES);
        settings.push(s.DISPLAY_ADMIN_SPAM);
        if (this.isActivateExtensionEnabled()) {
            if (tutao.locator.viewManager.isFreeAccount() || tutao.locator.viewManager.isPremiumAccount()) {
                settings.push(s.DISPLAY_ADMIN_PREMIUM_FEATURES);
            }
            settings.push(s.DISPLAY_ADMIN_PAYMENT); // includes upgrade to premium
        }
        if (!tutao.locator.viewManager.isFreeAccount() || this.bookingAvailable()) {
            settings.push(s.DISPLAY_ADMIN_INVOICING);
        }
        if (tutao.locator.viewManager.isFreeAccount() || tutao.locator.viewManager.isPremiumAccount()) {
            settings.push(s.DISPLAY_ADMIN_DELETE_ACCOUNT);
        }
    }
    return settings;
};

/**
 * Provides the text id for the given setting.
 * @param {Number} settings One of tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_*.
 * @return {String} text id for the setting number
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getSettingsTextId = function(settings) {
    if (tutao.locator.viewManager.isFreeAccount()) {
        return ["userInfo_action", "changePasswordSettings_action", "adminUserList_action", "unsubscribe_action", "adminPremiumFeatures_action", "display_action", "adminEmailSettings_action", "adminInvoicing_action", "adminAccountInfo_action", "upgradeToPremium_action", "adminSpam_action", "inboxRulesSettings_action"][settings];
    } else {
        return ["userInfo_action", "changePasswordSettings_action", "adminUserList_action", "unsubscribe_action", "adminPremiumFeatures_action", "display_action", "adminEmailSettings_action", "adminInvoicing_action", "adminAccountInfo_action", "adminPayment_action", "adminSpam_action", "inboxRulesSettings_action"][settings];
    }
};

/**
 * Shows the given settings.
 * @param {Number} settings One of tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_*.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.show = function(settings) {
    if (settings == tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_INBOX_RULES_SETTINGS && tutao.locator.viewManager.isFreeAccount()) {
        tutao.locator.viewManager.showNotAvailableForFreeDialog();
    } else {
        this.displayed(settings);
        tutao.locator.settingsView.showChangeSettingsColumn();
        if (!this.bookingAvailable() && tutao.locator.viewManager.isFreeAccount()) {
            // check if this was a premium user before and the payment data settings should be visible
            var self = this;
            var user = tutao.locator.userController.getLoggedInUser();
            user.loadCustomer().then(function(customer) {
                return customer.loadCustomerInfo().then(function(customerInfo) {
                    return tutao.entity.sys.Booking.loadRange(customerInfo.getBookings().getItems(), tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 1, true).then(function(bookings) {
                        self.bookingAvailable(bookings.length > 0);
                    });
                });
            });
        }
    }
};


tutao.tutanota.ctrl.SettingsViewModel.prototype.getActiveSettingText = function() {
    return tutao.lang(this.getSettingsTextId(this.displayed()));
};

tutao.tutanota.ctrl.SettingsViewModel.prototype.getSettingsDetailsColumnText = function() {
    if (this.displayed() == tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_USER_LIST) {
        if (this.adminUserListViewModel().newViewModel()) {
            return tutao.lang("addUsers_action");
        } else {
            return tutao.lang("editUser_label");
        }
    } else {
        return "";
    }
};

tutao.tutanota.ctrl.SettingsViewModel.prototype.isActivateExtensionEnabled = function() {
    return tutao.env.mode == tutao.Mode.Browser;
};