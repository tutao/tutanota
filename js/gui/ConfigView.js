"use strict";

goog.provide('tutao.tutanota.gui.ConfigView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.ConfigView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

tutao.tutanota.gui.ConfigView.COLUMN_CONFIG = null;

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.init = function(external) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, "configContent")
    tutao.tutanota.gui.ConfigView.COLUMN_CONFIG = this._swipeSlider.addViewColumn(0, 400, 1024, 'configColumn');
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.activate = function() {
    this._swipeSlider.activate();
	tutao.locator.configViewModel.init();
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};
