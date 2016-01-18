"use strict";

tutao.provide('tutao.tutanota.gui.ContactView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.ContactView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * These ids are returned by addViewColumn.
 */
tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST = null;
tutao.tutanota.gui.ContactView.COLUMN_CONTACT = null;

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.init = function(external, updateColumnTitleCallback) {
	this._swipeSlider = new tutao.tutanota.gui.SwipeSlider(this, "contactContent", updateColumnTitleCallback);
    tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST = this._swipeSlider.addViewColumn(0, 300, 400, 'searchAndContactListColumn', function() { return tutao.lang("contacts_label"); });
    tutao.tutanota.gui.ContactView.COLUMN_CONTACT = this._swipeSlider.addViewColumn(1, 600, 1000, 'contactColumn');

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
    this._swipeSlider.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.deactivate = function() {
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.getSwipeSlider = function() {
    return this._swipeSlider;
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.isShowLeftNeighbourColumnPossible = function() {
	return (this._swipeSlider.getLeftmostVisibleColumnId() == tutao.tutanota.gui.ContactView.COLUMN_CONTACT
    		&& (tutao.locator.contactViewModel.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_NONE || tutao.locator.contactViewModel.mode() == tutao.tutanota.ctrl.ContactViewModel.MODE_SHOW)); // allow showing contact list
};

/**
 * @inherit
 */
tutao.tutanota.gui.ContactView.prototype.isShowRightNeighbourColumnPossible = function() {
    return false;
};

/**
 * Makes sure that the contact list column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.showContactListColumn = function() {
    this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.ContactView.COLUMN_CONTACT_LIST);
};

/**
 * Makes sure that the contact column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.showContactColumn = function() {
    // set _firstActivation to false to make sure that the swipe slide does not switch to the default columns when selecting the contact view the first time
    this._swipeSlider._firstActivation = false;
    this._swipeSlider.getViewSlider().showViewColumn(tutao.tutanota.gui.ContactView.COLUMN_CONTACT);
};

/**
 * Returns true if the contact column is visible.
 */
tutao.tutanota.gui.ContactView.prototype.isContactColumnVisible = function() {
    return (this._swipeSlider.getRightmostVisibleColumnId() == tutao.tutanota.gui.ContactView.COLUMN_CONTACT);
};