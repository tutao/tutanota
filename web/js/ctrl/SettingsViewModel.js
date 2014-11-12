"use strict";

tutao.provide('tutao.tutanota.ctrl.SettingsViewModel');

/**
 * Handles the user settings in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.SettingsViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.adminUserListViewModel = ko.observable(null);

	this.displayed = ko.observable(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ACCOUNT_SETTINGS);
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

tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ACCOUNT_SETTINGS = 0;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_SECURITY_SETTINGS = 1;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_CHANGE_PASSWORD = 2;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_USER_LIST = 3;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_DELETE_ACCOUNT = 4;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_NOTHING = 100;

/**
 * Provides all settings ids.
 * @return {Array.<Number>} The Settings ids.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getSettings = function() {
	var s = tutao.tutanota.ctrl.SettingsViewModel;
	var settings = [s.DISPLAY_ACCOUNT_SETTINGS, s.DISPLAY_SECURITY_SETTINGS, s.DISPLAY_CHANGE_PASSWORD];
	if (tutao.locator.userController.isLoggedInUserAdmin() ) {
		settings.push(s.DISPLAY_ADMIN_USER_LIST);
        if (tutao.locator.viewManager.getLoggedInUserAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE) {
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
	return ["accountSettings_action", "securitySettings_action", "changePasswordSettings_action", "adminUserList_action", "adminDeleteAccount_action"][settings];
};

/**
 * Shows the given settings.
 * @param {Number} settings One of tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_*.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.show = function(settings) {
	this.displayed(settings);
	tutao.locator.settingsView.showChangeSettingsColumn();
};


tutao.tutanota.ctrl.SettingsViewModel.prototype.getActiveSettingTextId = function() {
    return this.getSettingsTextId(this.displayed());
};
