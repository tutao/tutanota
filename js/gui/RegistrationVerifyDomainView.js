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
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.windowSizeChanged = function(width, height) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.swipeRecognized = function(type) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationVerifyDomainView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
