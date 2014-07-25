"use strict";

goog.provide('tutao.tutanota.gui.DbView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.DbView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

tutao.tutanota.gui.DbView.COLUMN_SELECTION = null;
tutao.tutanota.gui.DbView.COLUMN_INSTANCES = null;

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.init = function(external) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, 'dbContent');
    tutao.tutanota.gui.DbView.COLUMN_SELECTION = this._swipeSlider.addViewColumn(1, 190, 190, 'dbSelectionColumn');
    tutao.tutanota.gui.DbView.COLUMN_INSTANCES = this._swipeSlider.addViewColumn(0, 500, 1024, 'dbInstancesColumn');
};

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.activate = function() {
    this._swipeSlider.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.DbView.COLUMN_INSTANCES); // allow showing selection
};

/**
 * @inherit
 */
tutao.tutanota.gui.DbView.prototype.isShowRightNeighbourColumnPossible = function() {
    return (this._swipeSlider.getRightmostVisibleColumnId() == tutao.tutanota.gui.DbView.COLUMN_SELECTION); // allow showing instances
};
