"use strict";

goog.provide('tutao.entity.NotAuthorizedException');

/**
 * This exception indicates that the user is not authorized to access some data.
 * @param {string} message An information about the exception.
 * @constructor
 */
tutao.entity.NotAuthorizedException = function(message) {
	this.stack = new Error().stack;
	this.message = message;
	this.name = "NotAuthorizedException";
};

tutao.inherit(tutao.entity.NotAuthorizedException, Error);
