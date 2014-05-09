"use strict";

goog.provide('tutao.tutanota.ctrl.Button');

/**
 * Defines a button.
 * @constructor
 * @param {string} label The label visible on the button.
 * @param {number} priority The higher the value the higher the priority. Priority 0 buttons are only in the more menu.
 * @param {function} clickCallback Is called when the button is clicked.
 * @param {boolean=} directClick True if the click event shall not be deferred by a setTimeout (needed to avoid alert/confirm popup bugs).
 * @param {string=} id The id to set for the button.
 */
tutao.tutanota.ctrl.Button = function(label, priority, clickCallback, directClick, id) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._label = label;
	this._priority = priority;
	this._clickCallback = clickCallback;
	this._directClick = (directClick) ? true : false;
	this.width = ko.observable(null); // is set by setDomWidth binding
    this.id = id;
};

/**
 * Provides the label of the button.
 * @return {string} The label.
 */
tutao.tutanota.ctrl.Button.prototype.getLabel = function() {
	return this._label;
};

/**
 * Provides the priority of the button.
 * @return {number} 0 or positive number value.
 */
tutao.tutanota.ctrl.Button.prototype.getPriority = function() {
	return this._priority;
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
