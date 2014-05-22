//"use strict";

goog.provide('tutao.tutanota.gui.MonitorView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.MonitorView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

tutao.tutanota.gui.MonitorView.COLUMN_SELECTION = null;
tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS = null;
tutao.tutanota.gui.MonitorView.COLUMN_DIAGRAM = null;

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.init = function(external) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, 'monitorContent');
    tutao.tutanota.gui.MonitorView.COLUMN_SELECTION = this._swipeSlider.addViewColumn(2, 190, 190, 'monitorSelectionColumn');
    tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS = this._swipeSlider.addViewColumn(0, 400, 600, 'monitorCountersColumn');
    tutao.tutanota.gui.MonitorView.COLUMN_DIAGRAM = this._swipeSlider.addViewColumn(1, 500, 1024, 'monitorDiagramColumn');
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
    this._swipeSlider.activate();
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
tutao.tutanota.gui.MonitorView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return (this._swipeSlider.getLeftmostVisibleColumnId() >= tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS); // allow showing selection or counters
};

/**
 * @inherit
 */
tutao.tutanota.gui.MonitorView.prototype.isShowRightNeighbourColumnPossible = function() {
    return (this._swipeSlider.getRightmostVisibleColumnId() <= tutao.tutanota.gui.MonitorView.COLUMN_COUNTERS); // allow showing diagram or counters
};

/**
 * Makes sure that the diagram column is visible.
 */
tutao.tutanota.gui.MonitorView.prototype.showDiagramColumn = function() {
	this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.MonitorView.COLUMN_DIAGRAM);
};
