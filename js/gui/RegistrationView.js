"use strict";

goog.provide('tutao.tutanota.gui.RegistrationView');

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
tutao.tutanota.gui.RegistrationView.prototype.init = function() {

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
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.windowSizeChanged = function(width, height) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.swipeRecognized = function(type) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
