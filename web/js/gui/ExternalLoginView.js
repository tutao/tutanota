"use strict";

tutao.provide('tutao.tutanota.gui.ExternalLoginView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.ExternalLoginView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.init = function(external, updateColumnTitleCallback) {
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
    this._updateColumnTitle = updateColumnTitleCallback;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.isForInternalUserOnly = function() {
	return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.activate = function() {
    this._updateColumnTitle(this.getWelcomeMessage(), null);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ExternalLoginView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

tutao.tutanota.gui.ExternalLoginView.prototype.getWelcomeMessage = function() {
    return tutao.lang("receiveMsg_label");
};