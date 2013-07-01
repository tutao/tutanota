"use strict";

goog.provide('tutao.tutanota.gui.LoginView');

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
tutao.tutanota.gui.LoginView.prototype.init = function() {

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
	tutao.locator.loginViewModel.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.windowSizeChanged = function(width, height) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.swipeRecognized = function(type) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.LoginView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
