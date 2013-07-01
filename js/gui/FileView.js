"use strict";

goog.provide('tutao.tutanota.gui.FileView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.FileView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.init = function() {
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();

	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#fileContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(0, 300, 1024, function(x, width) {
		$('#filesColumn').css("width", width + "px");
	});

	this._firstActivation = true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		if (tutao.tutanota.util.ClientDetector.isTouchSupported()) {
			// the timeout is a workaround for the bug that the contact list scrolls horizontally
			// on iPad until the orientation is changed (see iss119)
			this._filesScroller = new iScroll('innerFileColumn', {useTransition: true});
		}
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
		tutao.locator.fileViewModel.init();
	} else {
		this.filesUpdated();
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.swipeRecognized = function(type) {
};

/**
 * Must be called when the shown contact is changed. Updates iScroll.
 */
tutao.tutanota.gui.FileView.prototype.filesUpdated = function() {
	if (this._filesScroller) {
		this._filesScroller.refresh();
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.FileView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
