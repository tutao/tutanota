//"use strict";

goog.provide('tutao.tutanota.gui.MonitorView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.MonitorView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.init = function(external) {
	var self = this;
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
		self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#monitorContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(2, 190, 190, function(x, width) {
		$('#monitorSelectionColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(0, 400, 600	, function(x, width) {
		$('#monitorCountersColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(1, 500, 1024	, function(x, width) {
		$('#monitorDiagramColumn').css("width", width + "px");
	});

	this._firstActivation = true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
	}
	tutao.locator.monitorViewModel.init();
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

tutao.tutanota.gui.MonitorView.COLUMN_SELECTION = 0;
tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS = 1;
tutao.tutanota.gui.MonitorView.COLUMN_DIAGRAM = 2;

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.swipeRecognized = function(type) {
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
tutao.tutanota.gui.MonitorView.prototype.showNeighbourColumn = function(left) {
	var columnToShow = (left) ? this._viewSlider.getLeftmostVisibleColumnId() - 1 : this._viewSlider.getRightmostVisibleColumnId() + 1;
	this._viewSlider.showViewColumn(columnToShow);
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.isShowNeighbourColumnPossible = function(left) {
	if (left) {
		return (this._leftmostVisibleColumn() >= tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS); // allow showing selection or counters 
	} else {
		return (this._rightmostVisibleColumn() <= tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS); // allow showing diagram or counters
	}
};

/**
 * Makes sure that the diagram column is visible.
 */
tutao.tutanota.gui.MonitorView.prototype.showDiagramColumn = function() {
	this._viewSlider.showViewColumn(tutao.tutanota.gui.MonitorView.COLUMN_DIAGRAM);
};
