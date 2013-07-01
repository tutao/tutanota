"use strict";

goog.provide('tutao.tutanota.ctrl.bubbleinput.Bubble');

/**
 * Creates a new Bubble from the following args:
 * @param {*} entity The backing entity.
 * @param {ko.observable} text The text displayed by the bubble.
 * @param {ko.observable} state The state of the bubble (must be mapped to a css class).
 * @return {tutao.tutanota.ctrl.bubbleinput.BubbleInputViewModel.Bubble}
 */
tutao.tutanota.ctrl.bubbleinput.Bubble = function(entity, text, state) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.entity = entity;
	this.text = text;
	this.state = state;
	this.selected = ko.observable(false);
};

/**
 * Inverts the selection state: Selects or deselects this bubble depending on it's current state.
 */
tutao.tutanota.ctrl.bubbleinput.Bubble.prototype.invertSelection = function() {
	this.selected(!this.selected());
};

