"use strict";

tutao.provide('tutao.tutanota.ctrl.bubbleinput.Bubble');

/**
 * Creates a new Bubble from the following args:
 * @param {*} entity The backing entity.
 * @param {ko.observable} text The text displayed by the bubble.
 * @param {ko.observable} tooltip The tooltip text displayed by the bubble.
 * @param {ko.observable} state The state of the bubble (must be mapped to a css class).
 * @param {bool} showDeleteIcon If true, shows a delete icon which removes this bubble when clicked.
 * @param {(function(): Array.<tutao.tutanota.ctrl.Button>|undefined)} subButtonsCallback A function that returns a list of buttons that shall be shown when clicking this bubble.
 * @constructor
 */
tutao.tutanota.ctrl.bubbleinput.Bubble = function(entity, text, tooltip, state, showDeleteIcon, subButtonsCallback) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.entity = entity;
	this.text = text;
	this.tooltip = tooltip;
	this.state = state;
	this.selected = ko.observable(false);
    this.showDeleteIcon = showDeleteIcon;

	this._subButtonsCallback = subButtonsCallback;
	this._subButtonsVisible = ko.observable(false);
	this.subButtons = ko.observableArray();
	// receives the dom element via the domInit binding. this allows the position of the sub-buttons menu to be adjusted below the clicked bubble.
	this.buttonDomElement = ko.observable(null);
	this.buttonDomElement.subscribe(function(value) {
		console.log(value);
	});
	this.subButtonsText = ko.observable(this.tooltip());


};

/**
 * Inverts the selection state: Selects or deselects this bubble depending on it's current state.
 */
tutao.tutanota.ctrl.bubbleinput.Bubble.prototype.invertSelection = function() {
	this.selected(!this.selected());
};


/**
 * Executes the click functionality.
 */
tutao.tutanota.ctrl.bubbleinput.Bubble.prototype.click = function() {
	if (this.subButtonsVisible()) {
		this.hideSubButtons();
	} else {
		this._showSubButtons();
	}
};

/**
 * Makes the sub-button menu visible.
 */
tutao.tutanota.ctrl.bubbleinput.Bubble.prototype._showSubButtons = function() {
	var subButtons = ko.utils.arrayFilter(this._subButtonsCallback(this), function(button) {
		return button.isVisible();
	});

	for (var i=0; i<subButtons.length; i++) {
		subButtons[i].setHideButtonsHandler(this.hideSubButtons);
	}
	this.subButtons(subButtons);
	this._subButtonsVisible(true);
	tutao.locator.viewManager.buttonWithSubButtons(this);
};

/**
 * Hides the sub-button menu.
 */
tutao.tutanota.ctrl.bubbleinput.Bubble.prototype.hideSubButtons = function(vm, event) {
	// when tapping on the menu item also the parent modalDialog receives an event. the menu item hides the more menu itself, so hide it here only if the modalDialog itself was tapped
	if (!event || event.target.className.indexOf("modalDialog") != -1) {
		this.subButtons([]);
		this._subButtonsVisible(false);
	}
};

/**
 * Provides the information if the sub-buttons menu is visible.
 * @returns {boolean} True if the sub-buttons are visible, false otherwise.
 */
tutao.tutanota.ctrl.bubbleinput.Bubble.prototype.subButtonsVisible = function() {
	return this._subButtonsVisible();
};







