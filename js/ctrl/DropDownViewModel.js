"use strict";

goog.provide('tutao.tutanota.ctrl.DropDownViewModel');

/**
 * Displays a drop down with a custom value. If the custom value is selected, the drop down is replaced by a text field.
 *
 * Always use with the dropdown-template (see index.html).
 *
 * @param {function(): Array.<Object.<string,string>>} optionsFunction Contains an array of Objects which should contain the two attributes 'id' and 'name',
 * wrapped in a function to allow dynamic language changes.
 * @param {function(): *} selectedIdObservable The observable that holds the selectedId.
 * @param {*} customId The id of the custom value.
 * @param {function(): *} customValueObservable The observable that holds the custom value.
 * @return {tutao.tutanota.ctrl.DropDownViewModel}
 */
tutao.tutanota.ctrl.DropDownViewModel = function(optionsFunction, selectedIdObservable, customId, customValueObservable) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	// the options in the dropdown list
	this.options = ko.computed(function() {
		return optionsFunction();
	});
	// the observable that holds the selected item
	this.selectedIdObservable = selectedIdObservable;
	// the item in the dropdown list which when selected makes the text field appear
	this.customId = customId;
	// the observable that holds the custom value from the text field
	this.customValueObservable = customValueObservable;

	this.selectedId = ko.computed({
		read: function() {
			return this.selectedIdObservable();
		},
		write: function(value) {
			// not clear why the value may be null
			if (!value) {
				return;
			}
			this.selectedIdObservable(value);
			if (value === this.customId) {
				// set focus to the input field, because it was just made visible
				this.inputActive(true);
			}
		},
		owner: this
	});

	// indicates if the dropdown list has the focus
	this.selectActive = ko.observable(false);

	// indicates if the input has the focus
	this.inputActive = ko.observable(false);
	this.inputActive.subscribe(function(active) {
		if (!active) {
			if (customValueObservable() === "") {
				this.selectedIdObservable("0");
			}
		}
	}, this);

};

/**
 * @return {boolean} true, if the select item is visible, false otherwise.
 */
tutao.tutanota.ctrl.DropDownViewModel.prototype.selectVisible = function() {
	return (this.selectedIdObservable() !== this.customId);
};
