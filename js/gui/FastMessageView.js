"use strict";

goog.provide('tutao.tutanota.gui.FastMessageView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.FastMessageView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
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
tutao.tutanota.gui.FastMessageView.prototype.windowSizeChanged = function(width, height) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.swipeRecognized = function(type) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.FastMessageView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
