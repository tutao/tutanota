"use strict";

goog.provide('tutao.tutanota.gui.NotSupportedView');

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
tutao.tutanota.gui.NotSupportedView.prototype.windowSizeChanged = function(width, height) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.swipeRecognized = function(type) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.NotSupportedView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
