"use strict";

tutao.provide('tutao.tutanota.gui.FileView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.FileView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.init = function(external, updateColumnTitleCallback) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, "fileContent", updateColumnTitleCallback);
	this._swipeSlider.addViewColumn(0, 300, 1024, 'filesColumn');
	this._firstActivation = true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.activate = function() {
    this._swipeSlider.activate();
	if (this._firstActivation) {
		this._firstActivation = false;
		tutao.locator.fileViewModel.init();
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};
