"use strict";

goog.provide('tutao.crypto.CryptoError');

/**
 * A crypto exception is thrown whenever an encryption/decryption or conversion of keys fails.
 * @param {string} message An information about the exception.
 * @param {Error=} error The original error that was thrown.
 * @constructor
 */
tutao.crypto.CryptoError = function(message, error) {
	this.stack = new Error().stack;
	if (!error) {
		this.message = message;
	} else {
		this.message = message + ", original message: " + error.message;
	}
	this.name = "CryptoError";
	this.error = error;
};

goog.inherits(tutao.crypto.CryptoError, Error);
