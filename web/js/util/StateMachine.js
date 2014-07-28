"use strict";

goog.provide('tutao.tutanota.util.StateMachine');

tutao.tutanota.util.StateMachine = function() {
	this._states = {}; // stateName: { trigger: function, transitions: { eventName: nextState }, properties: { propertyName: propertyValue } }
	this._state = ko.observable(null); // contains the current state name
	this._startStateName = null;
};

/**
 * @param {string} name
 * @param {Object} properties
 * @param {function()=} trigger Called when this state is entered.
 */
tutao.tutanota.util.StateMachine.prototype.addState = function(name, properties, trigger) {
	// the first state is the start state
	if (Object.keys(this._states).length == 0) {
		tutao.util.Assert.assert(!trigger, "no trigger allowed");
		this._startStateName = name;
		this._state(name);
	} else {
		// check that the propertyNames are the same as in the start state
		var startProperties = Object.keys(this._states[this._startStateName].properties);
		tutao.util.Assert.assert(startProperties.length == Object.keys(properties).length, "different properties for state " + name);
		for (var i=0; i<startProperties.length; i++) {
			tutao.util.Assert.assert(properties[startProperties[i]] !== undefined, "different properties for state " + name);
		}
	}
	this._states[name] = { trigger: trigger, transitions: {}, properties: properties};
};

tutao.tutanota.util.StateMachine.prototype.addTransition = function(sourceStateName, eventName, targetStateName) {
	tutao.util.Assert.assert(this._states[sourceStateName], "source state not found: " + sourceStateName);
	tutao.util.Assert.assert(this._states[targetStateName], "target state not found: " + targetStateName);
	this._states[sourceStateName].transitions[eventName] = targetStateName;
};

tutao.tutanota.util.StateMachine.prototype.reset = function() {
	this._state(this._startStateName);
};

tutao.tutanota.util.StateMachine.prototype.event = function(eventName) {
	var nextStateName = this._states[this._state()].transitions[eventName];
	tutao.util.Assert.assert(nextStateName, "invalid transition: " + this._state() + " -> " + eventName);
	this._state(nextStateName);
	if (this._states[this._state()].trigger) {
		this._states[this._state()].trigger();
	}
};

tutao.tutanota.util.StateMachine.prototype.getState = function() {
	return this._state();
};

tutao.tutanota.util.StateMachine.prototype.getProperty = function(propertyName) {
	var p = this._states[this._state()].properties[propertyName];
	tutao.util.Assert.assert(p !== undefined, "invalid property: " + propertyName);
	return p;
};
