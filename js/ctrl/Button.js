"use strict";

goog.provide('tutao.tutanota.ctrl.Button');

/**
 * Defines a button.
 * @constructor
 * @param {string} label The label visible on the button.
 * @param {number} visibility One of tutao.tutanota.ctrl.Button.VISIBILITY_*.
 * @param {function} clickCallback Is called when the button is clicked.
 * @param {boolean=} directClick True if the click event shall not be deferred by a setTimeout (needed to avoid alert/confirm popup bugs).
 */
tutao.tutanota.ctrl.Button = function(label, visibility, clickCallback, directClick) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._label = label;
	this._visibility = visibility;
	this._clickCallback = clickCallback;
	this._directClick = (directClick) ? true : false;
	this.width = ko.observable(null); // is set by setDomWidth binding
};

/**
 * The button is always visible (i.e. never hidden in the "more" button).
 */
tutao.tutanota.ctrl.Button.VISIBILITY_VISIBLE = 0;

/**
 * If enough space is left, the button is visible, otherwise it is hidden in the "more" button.
 */
tutao.tutanota.ctrl.Button.VISIBILITY_OPTIONAL = 1;

/**
 * The button is always hidden in the "more" button.
 */
tutao.tutanota.ctrl.Button.VISIBILITY_HIDDEN = 2;

/**
 * Provides the label of the button.
 * @return {string} The label.
 */
tutao.tutanota.ctrl.Button.prototype.getLabel = function() {
	return this._label;
};

/**
 * Provides the visibility type of the button.
 * @return {number} One of tutao.tutanota.ctrl.Button.VISIBILITY_*.
 */
tutao.tutanota.ctrl.Button.prototype.getVisibility = function() {
	return this._visibility;
};

/**
 * Executes the click functionality.
 * @param {Object} vm The view model.
 * @param {Event} event The click event.
 */
tutao.tutanota.ctrl.Button.prototype.click = function(vm, event) {
	if (this._directClick) {
		// needed e.g. for opening a file chooser because a setTimeout in between would not work
		this._clickCallback(vm, event);
	} else {
		var self = this;
		// setTimeout because otherwise problems with alert/confirm dialogs appear
		setTimeout(function() {
			self._clickCallback(vm, event);
		}, 0);
	}
};
