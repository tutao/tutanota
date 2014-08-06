"use strict";

goog.provide('tutao.tutanota.gui.FastMessageView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.FastMessageView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.init = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.isForInternalUserOnly = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.activate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

