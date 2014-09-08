"use strict";

tutao.provide('tutao.crypto.CryptoError');

/**
 * A crypto exception is thrown whenever an encryption/decryption or conversion of keys fails.
 * @param {string} message An information about the exception.
 * @param {Error=} error The original error that was thrown.
 * @constructor
 */
tutao.crypto.CryptoError = function(message, error) {
	if (!error) {
		this.message = message;
	} else if (typeof error == "string") {
        this.message = error;
    } else {
		this.message = message + ", original message: " + error.message;
	}

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, tutao.crypto.CryptoError);
    } else {
        var error = new Error();
        if (!error.stack){
            // fill the stack trace on ios devices
            try {
                throw error;
            } catch (e) {
            }
        }
        this.stack = this.name + ". " + this.message + "\n" + error.stack.split("\n").slice(1).join("\n"); // removes first line from stack
    }

	this.name = "CryptoError";
	this.error = error;
};

tutao.crypto.CryptoError.prototype = Object.create(Error.prototype);
tutao.crypto.CryptoError.prototype.constructor = tutao.crypto.CryptoError;