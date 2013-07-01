"use strict";

goog.provide('tutao.tutanota.util.LocalStore');

/**
 * Stores some data in the local storage.
 * @param {String} id The id of the data.
 * @param {String} data The data.
 * @return {boolean} True if the data could be stored, false if the local storage is not available.
 */
tutao.tutanota.util.LocalStore.store = function(id, data) {
	// exception is thrown if local store is not available
	try {
		localStorage.setItem(id, data);
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * Checks if some data exists in the local storage.
 * @param {String} id The id of the data.
 * @return {boolean} True if the data exists in the local store, false otherwise.
 */
tutao.tutanota.util.LocalStore.contains = function(id) {
	return (localStorage.getItem(id) != null);
};

/**
 * Loads some data from the local storage.
 * @param {String} id The id of the data.
 * @return {String} The loaded data or null if none was found.
 */
tutao.tutanota.util.LocalStore.load = function(id) {
	return localStorage.getItem(id);
};

/**
 * Removes some data from the local storage.
 * @param {String} id The id of the data.
 */
tutao.tutanota.util.LocalStore.remove = function(id) {
	localStorage.removeItem(id);
};

