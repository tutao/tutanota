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
	}, this);
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
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_NOTHING = 100;

/**
 * Provides all user setting ids.
 * @return {Array.<Number>} The Settings ids.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getUserSettings = function() {
	var s = tutao.tutanota.ctrl.SettingsViewModel;
	var settings = [s.DISPLAY_USER_INFO, s.DISPLAY_CHANGE_PASSWORD];
    if (tutao.locator.viewManager.getLoggedInUserAccountType() != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER) {
        settings.push(s.DISPLAY_MAIL_SETTINGS);
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
        if (!tutao.locator.viewManager.isFreeAccount()) {
            settings.push(s.DISPLAY_ADMIN_MESSAGES);
        }
        if (tutao.locator.viewManager.isFreeAccount() || tutao.locator.viewManager.isPremiumAccount()) {
            settings.push(s.DISPLAY_ADMIN_PREMIUM_FEATURES);
        }
        settings.push(s.DISPLAY_ADMIN_PAYMENT); // includes upgrade to premium
        if (!tutao.locator.viewManager.isFreeAccount()) {
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
        return ["userInfo_action", "changePasswordSettings_action", "adminUserList_action", "unsubscribe_action", "adminPremiumFeatures_action", "adminMessages_action", "adminEmailSettings_action", "adminInvoicing_action", "adminAccountInfo_action", "upgradeToPremium_action"][settings];
    } else {
        return ["userInfo_action", "changePasswordSettings_action", "adminUserList_action", "unsubscribe_action", "adminPremiumFeatures_action", "adminMessages_action", "adminEmailSettings_action", "adminInvoicing_action", "adminAccountInfo_action", "adminPayment_action"][settings];
    }
};

/**
 * Shows the given settings.
 * @param {Number} settings One of tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_*.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.show = function(settings) {
	this.displayed(settings);
	tutao.locator.settingsView.showChangeSettingsColumn();
};


tutao.tutanota.ctrl.SettingsViewModel.prototype.getActiveSettingText = function() {
    return tutao.lang(this.getSettingsTextId(this.displayed()));
};

tutao.tutanota.ctrl.SettingsViewModel.prototype.isActivateExtensionEnabled = function() {
    return !(tutao.env.mode == tutao.Mode.App && cordova.platformId == 'ios');
};