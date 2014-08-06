"use strict";

tutao.provide('tutao.tutanota.gui.NotSupportedView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.NotSupportedView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.init = function() {
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.isForInternalUserOnly = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.activate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};
