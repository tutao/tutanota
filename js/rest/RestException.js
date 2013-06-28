"use strict";

goog.provide('tutao.rest.RestException');

/**
 * A rest exception is thrown whenever a remote server invocation does not lead to the expected result.
 * @param {number} responseCode (http).
 * @constructor
 * @extends Error
 */
tutao.rest.RestException = function(responseCode) {
	this._responseCode = responseCode;
	this.stack = new Error().stack;
	this.message = "response code " + this._responseCode;
	this.name = "RestException(" + responseCode + ")";
};

tutao.inherit(tutao.rest.RestException, Error);

tutao.rest.RestException.prototype.getResponseCode = function() {
	  return this._responseCode;
};
