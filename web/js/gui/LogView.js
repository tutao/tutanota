"use strict";

goog.provide('tutao.tutanota.gui.LogView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.LogView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

tutao.tutanota.gui.LogView.COLUMN_SELECTION = null;
tutao.tutanota.gui.LogView.COLUMN_INSTANCES = null;

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.init = function(external) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, 'logContent');
    tutao.tutanota.gui.LogView.COLUMN_SELECTION = this._swipeSlider.addViewColumn(1, 300, 300, 'logSelectionColumn');
    tutao.tutanota.gui.LogView.COLUMN_INSTANCES = this._swipeSlider.addViewColumn(0, 1280, 1980, 'logEventsColumn');
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.activate = function() {
    this._swipeSlider.activate();
	tutao.locator.logViewModel.start();
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.deactivate = function() {
	tutao.locator.logViewModel.stop();
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.LogView.COLUMN_INSTANCES); // allow showing selection
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.isShowRightNeighbourColumnPossible = function() {
    return (this._swipeSlider.getRightmostVisibleColumnId() == tutao.tutanota.gui.LogView.COLUMN_SELECTION); // allow showing instances
};
