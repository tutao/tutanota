"use strict";

goog.provide('tutao.event.ObservableInterface');

/**
 * The subject of the Observable pattern
 * @interface
 */
tutao.event.ObservableInterface = function() {};

/**
 * Adds the observer.
 * <b>Attention:</b> The observer will be invoked directly. Note that you are responsible
 * to bind the function another context (this) if needed.
 * @param {function()} observer The function that is called for notifications.
 */
tutao.event.ObservableInterface.prototype.addObserver = function(observer) {};

/**
 * Removes the observer
 * @param {function()} observer The observer function that shall be removed.
 */
tutao.event.ObservableInterface.prototype.removeObserver = function(observer) {};

/**
 * Notifies all observers with the provided data
 * @param {Object} data The data structure to hand over to observers.
 */
tutao.event.ObservableInterface.prototype.notifyObservers = function(data) {};
