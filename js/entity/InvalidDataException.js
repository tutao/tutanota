"use strict";

goog.provide('tutao.entity.InvalidDataException');

/**
 * This exception indicates that some data is invalid.
 * @param {string} message An information about the exception.
 * @constructor
 */
tutao.entity.InvalidDataException = function(message) {
	this.stack = new Error().stack;
	this.message = message;
	this.name = "InvalidDataException";
};

tutao.inherit(tutao.entity.InvalidDataException, Error);
