"use strict";

tutao.provide('tutao.tutanota.gui.RegistrationView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.RegistrationView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.init = function(external, updateColumnTitleCallback) {
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
    this._updateColumnTitle = updateColumnTitleCallback;
};


/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.isForInternalUserOnly = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.activate = function(parameters) {
    tutao.locator.registrationViewModel.activate(parameters.authToken);
    this._updateColumnTitle(this.getWelcomeMessage(), null);
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.getWelcomeMessage = function() {
    return tutao.lang('registrationHeadline_msg');
};

