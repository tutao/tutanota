"use strict";

tutao.provide('tutao.tutanota.gui.NotFoundView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.NotFoundView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.init = function() {
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.isForInternalUserOnly = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.activate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.NotFoundView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};
