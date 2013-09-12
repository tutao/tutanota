"use strict";

goog.provide('tutao.event.Observable');

/**
 * The subject of the Observable pattern
 * @constructor
 */
tutao.event.Observable = function() {
	/**
	 * @type {Array.<Function>}
	 * @protected
	 */
	this._observers = [];
};

/**
 * Adds the observer.
 * <b>Attention:</b> The observer will be invoked directly. Note that you are responsible
 * to bind the function another context (this) if needed.
 * @param {function()} observer The function that is called for notifications.
 */
tutao.event.Observable.prototype.addObserver = function(observer) {
	this._observers.push(observer);
};

/**
 * Removes the observer
 * @param {function()} observer The observer function that shall be removed.
 */
tutao.event.Observable.prototype.removeObserver = function(observer) {
	tutao.util.ArrayUtils.remove(this._observers, observer);
};

/**
 * Notifies all observers with the provided data
 * @param {Object} data The data structure to hand over to observers.
 */
tutao.event.Observable.prototype.notifyObservers = function(data) {
	for (var i = 0; i < this._observers.length; i++) {
		this._observers[i](data);
	}
};
