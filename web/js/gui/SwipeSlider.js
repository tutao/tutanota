"use strict";

tutao.provide('tutao.tutanota.gui.SwipeSlider');

/**
 * Connects the view slider of a div with the swipe recognition.
 * @constructor
 * @param {tutao.tutanota.ctrl.View} view The view that is slided.
 * @param {string} contentDivId The name of the content div this SwipeSlider is responsible for.
 * @param {function()} updateColumnCallback Callback funciton to notify the receiver about visible column changes
 */
tutao.tutanota.gui.SwipeSlider = function(view, contentDivId, updateColumnCallback) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

    this._view = view;

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);

    this._viewSlider = null;
    if (view) {
        var self = this;
        // configure view slider
        this._viewSlider = new tutao.tutanota.ctrl.ViewSlider(updateColumnCallback);
        this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
        this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
            self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
            self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
            return tutao.tutanota.gui.viewPositionAndSizeReceiver("#" + contentDivId, x, y, initial);
        });
    }
    this._firstActivation = true;
};

tutao.tutanota.gui.SwipeSlider.none = function() {
    return new tutao.tutanota.gui.SwipeSlider(null, null);
};

tutao.tutanota.gui.SwipeSlider.prototype.addViewColumn = function(prio, minWidth, maxWidth, columnDivId, titleTextProvider) {
    var titleTextProviderFunction = titleTextProvider;

    if (!titleTextProvider) {
        titleTextProviderFunction = function() {
            return "";
        };
    }
    var columnId = this._viewSlider.addViewColumn(prio, minWidth, maxWidth, function(x, width) {
        $('#' + columnDivId).css("width", width + "px");
    }, titleTextProviderFunction);
    return columnId;
};

tutao.tutanota.gui.SwipeSlider.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
	}
};

tutao.tutanota.gui.SwipeSlider.prototype.windowSizeChanged = function(width, height) {
    if (this._viewSlider) {
	    this._viewSlider.setScreenWidth(width);
    }
};

tutao.tutanota.gui.SwipeSlider.prototype.swipeRecognized = function(type) {
    // empty
};

tutao.tutanota.gui.SwipeSlider.prototype.showLeftNeighbourColumn = function() {
	this._viewSlider.showViewColumn(this._viewSlider.getLeftmostVisibleColumnId() - 1);
};

tutao.tutanota.gui.SwipeSlider.prototype.showRightNeighbourColumn = function() {
    this._viewSlider.showViewColumn(this._viewSlider.getRightmostVisibleColumnId() + 1);
};

tutao.tutanota.gui.SwipeSlider.prototype.getViewSlider = function() {
    return this._viewSlider;
};

tutao.tutanota.gui.SwipeSlider.prototype.getLeftmostVisibleColumnId = function() {
    return this._leftmostVisibleColumn();
};

tutao.tutanota.gui.SwipeSlider.prototype.getRightmostVisibleColumnId = function() {
    return this._rightmostVisibleColumn();
};
