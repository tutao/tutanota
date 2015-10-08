"use strict";

tutao.provide('tutao.tutanota.gui.LoginView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.LoginView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.init = function(external, updateColumnTitleCallback) {
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
    this._updateColumnTitle = updateColumnTitleCallback;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.isForInternalUserOnly = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.activate = function() {
    this._updateColumnTitle(this.getWelcomeMessage(), null);
};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

tutao.tutanota.gui.LoginView.prototype.getWelcomeMessage = function() {
    return tutao.lang("login_action");
};