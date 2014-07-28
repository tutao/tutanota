"use strict";

goog.provide('tutao.tutanota.ctrl.bubbleinput.Suggestion');

/**
 * Suggestions are provided to the user whenever he writes text to the input field.
 * @constructor
 */
tutao.tutanota.ctrl.bubbleinput.Suggestion = function(id, text) {
	this.id = id;
	this.text = text;
};
