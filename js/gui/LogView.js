"use strict";

goog.provide('tutao.tutanota.gui.LogView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.LogView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.init = function(external) {
	var self = this;
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
		self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#logContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(1, 300, 300, function(x, width) {
		$('#logSelectionColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(0, 1280, 1980, function(x, width) {
		$('#logEventsColumn').css("width", width + "px");
	});

	this._firstActivation = true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		tutao.locator.logViewModel.showSelected();
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
	}
	tutao.locator.logViewModel.start();
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.deactivate = function() {
	tutao.locator.logViewModel.stop();
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

tutao.tutanota.gui.LogView.COLUMN_SELECTION = 0;
tutao.tutanota.gui.LogView.COLUMN_INSTANCES = 1;

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.swipeRecognized = function(type) {
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
tutao.tutanota.gui.LogView.prototype.showNeighbourColumn = function(left) {
	var columnToShow = (left) ? this._viewSlider.getLeftmostVisibleColumnId() - 1 : this._viewSlider.getRightmostVisibleColumnId() + 1;
	this._viewSlider.showViewColumn(columnToShow);
};

/**
 * @inherit
 */
tutao.tutanota.gui.LogView.prototype.isShowNeighbourColumnPossible = function(left) {
	if (left) {
		return (this._leftmostVisibleColumn() == tutao.tutanota.gui.LogView.COLUMN_INSTANCES); // allow showing selection
	} else {
		return (this._rightmostVisibleColumn() == tutao.tutanota.gui.LogView.COLUMN_SELECTION); // allow showing instances
	}
};