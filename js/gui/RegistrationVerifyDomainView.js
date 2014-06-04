"use strict";

goog.provide('tutao.tutanota.gui.RegistrationVerifyDomainView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.RegistrationVerifyDomainView= function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.init = function() {
    this._swipeSlider = tutao.tutanota.gui.SwipeSlider.none();
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.isForInternalUserOnly = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.activate = function() {
    tutao.locator.registrationVerifyDomainViewModel.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.isShowLeftNeighbourColumnPossible = function() {
    return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};
