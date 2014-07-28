"use strict";

goog.provide('tutao.tutanota.gui.CustomerView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.CustomerView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};


tutao.tutanota.gui.CustomerView.COLUMN_SETTINGS = null;
tutao.tutanota.gui.CustomerView.COLUMN_CHANGE_SETTINGS = null;

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.init = function(external) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this,"customerContent");
    tutao.tutanota.gui.CustomerView.COLUMN_SETTINGS = this._swipeSlider.addViewColumn(0, 100, 150, 'customerMenuColumn');
    tutao.tutanota.gui.CustomerView.COLUMN_CHANGE_SETTINGS = this._swipeSlider.addViewColumn(1, 400, 1000, 'customerListColumn');
};

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.activate = function() {
    this._swipeSlider.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.CustomerView.COLUMN_CHANGE_SETTINGS);
};

/**
 * @inherit
 */
tutao.tutanota.gui.CustomerView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

/**
 * Makes sure that the change settings column is visible.
 */
tutao.tutanota.gui.CustomerView.prototype.showChangeSettingsColumn = function() {
    this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.CustomerView.COLUMN_CHANGE_SETTINGS);
};
