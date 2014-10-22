"use strict";

tutao.provide('tutao.tutanota.gui.SettingsView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.SettingsView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

tutao.tutanota.gui.SettingsView.COLUMN_SETTINGS = null;
tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS = null;
tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS_DETAILS = null;

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.init = function(external, updateColumnTitleCallback) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, 'settingsContent', updateColumnTitleCallback);
    tutao.tutanota.gui.SettingsView.COLUMN_SETTINGS = this._swipeSlider.addViewColumn(0, 150, 200, 'settingsColumn', "settings_label");
    tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS = this._swipeSlider.addViewColumn(1, 400, 600, 'changeSettingsColumn', tutao.locator.settingsViewModel.getActiveSettingTextId);
    tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS_DETAILS = this._swipeSlider.addViewColumn(1, 400, 600, 'changeSettingsDetailsColumn');
};

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.activate = function() {
    this._swipeSlider.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS);
};

/**
 * @inherit
 */
tutao.tutanota.gui.SettingsView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

/**
 * Makes sure that the change settings column is visible.
 */
tutao.tutanota.gui.SettingsView.prototype.showChangeSettingsColumn = function() {
    this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS);
};

/**
 * Makes sure that the change settings details column is visible.
 */
tutao.tutanota.gui.SettingsView.prototype.showChangeSettingsDetailsColumn = function() {
    this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.SettingsView.COLUMN_CHANGE_SETTINGS_DETAILS);
};