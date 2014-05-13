"use strict";

goog.provide('tutao.tutanota.gui.ContactView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.ContactView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this._leftmostVisibleColumn = ko.observable(-1);
	this._rightmostVisibleColumn = ko.observable(-1);
};

/**
 * These ids are actually returned by addViewColumn.
 */
tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST = 0;
tutao.tutanota.gui.ContactView.COLUMN_CONTACT = 1;

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.init = function() {
	var self = this;
	// configure view slider
	this._viewSlider = new tutao.tutanota.ctrl.ViewSlider();

	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	this._viewSlider.setViewPositionAndSizeReceiver(function(x, y, initial) {
		self._leftmostVisibleColumn(self._viewSlider.getLeftmostVisibleColumnId());
		self._rightmostVisibleColumn(self._viewSlider.getRightmostVisibleColumnId());
		tutao.tutanota.gui.viewPositionAndSizeReceiver("#contactContent", x, y, initial);
	});
	this._viewSlider.addViewColumn(0, 300, 400, function(x, width) {
		$('#searchAndContactListColumn').css("width", width + "px");
	});
	this._viewSlider.addViewColumn(1, 600, 1000, function(x, width) {
		$('#contactColumn').css("width", width + "px");
	});

	this._firstActivation = true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.isForInternalUserOnly = function() {
	return true;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.activate = function() {
	this._viewSlider.setScreenWidth(tutao.tutanota.gui.getWindowWidth());
	if (this._firstActivation) {
		this._firstActivation = false;
		// only show the default view columns if this is the first activation, otherwise we want to see the last visible view columns
		this._viewSlider.showDefault();
		tutao.locator.contactListViewModel.init();
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.windowSizeChanged = function(width, height) {
	this._viewSlider.setScreenWidth(width);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.swipeRecognized = function(type) {
	if (type == tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN) {
		if (this.isShowNeighbourColumnPossible(true)) {
			this.showNeighbourColumn(true);
		}
	}
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.showNeighbourColumn = function(left) {
	var columnToShow = (left) ? this._viewSlider.getLeftmostVisibleColumnId() - 1 : this._viewSlider.getRightmostVisibleColumnId() + 1;
	this._viewSlider.showViewColumn(columnToShow);
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.isShowNeighbourColumnPossible = function(left) {
	if (left) {
		return (this._leftmostVisibleColumn() == tutao.tutanota.gui.ContactView.COLUMN_CONTACT 
				&& (tutao.locator.contactViewModel.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NONE || tutao.locator.contactViewModel.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW)); // allow showing contact list
	} else {
		return false;
	}
};

/**
 * Makes sure that the contact list column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.showContactListColumn = function() {
	this._viewSlider.showViewColumn(tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST);
};

/**
 * Makes sure that the contact column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.showContactColumn = function() {
	this._viewSlider.showViewColumn(tutao.tutanota.gui.ContactView.COLUMN_CONTACT);
};
