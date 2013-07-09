"use strict";

goog.provide('tutao.tutanota.ctrl.SettingsViewModel');

/**
 * Handles the user settings in Tutanota.
 * @constructor
 */
tutao.tutanota.ctrl.SettingsViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.displayed = ko.observable(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_NOTHING);
};

tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ACCOUNT_SETTINGS = 0;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_SECURITY_SETTINGS = 1;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_CHANGE_PASSWORD = 2;
tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_NOTHING = 100;

/**
 * Provides all settings ids.
 * @return {Array.<Number>} The Settings ids.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getSettings = function() {
	var s = tutao.tutanota.ctrl.SettingsViewModel;
	return [s.DISPLAY_ACCOUNT_SETTINGS, s.DISPLAY_SECURITY_SETTINGS, s.DISPLAY_CHANGE_PASSWORD];
};

/**
 * Provides the text id for the given setting.
 * @param {Number} settings One of tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_*.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.getSettingsTextId = function(settings) {
	return ["accountSettings_action", "securitySettings_action", "changePasswordSettings_action"][settings];
};

/**
 * Shows the given settings.
 * @param {Number} settings One of tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_*.
 */
tutao.tutanota.ctrl.SettingsViewModel.prototype.show = function(settings) {
	this.displayed(settings);
	tutao.locator.settingsView.showChangeSettingsColumn();
};
