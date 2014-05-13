"use strict";

goog.provide('tutao.tutanota.gui.ConfigView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.ConfigView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.init = function(external) {
	var self = this;
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
		self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#configContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(0, 400, 1024	, function(x, width) {
		$('#configColumn').css("width", width + "px");
	});

	this._firstActivation = true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
	}
	tutao.locator.configViewModel.init();
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

tutao.tutanota.gui.ConfigView.COLUMN_CONFIG = 0;

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.swipeRecognized = function(type) {
	if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN) {
		if (this.isShowNeighbourColumnPossible(true)) {
			this.showNeighbourColumn(true);
		}
	} else if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN) {
		if (this.isShowNeighbourColumnPossible(false)) {
			this.showNeighbourColumn(false);
		}
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.showNeighbourColumn = function(left) {
	var columnToShow = (left) ? this._viewSlider.getLeftmostVisibleColumnId() - 1 : this._viewSlider.getRightmostVisibleColumnId() + 1;
	this._viewSlider.showViewColumn(columnToShow);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ConfigView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};

