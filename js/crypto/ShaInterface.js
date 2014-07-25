"use strict";

goog.provide('tutao.crypto.ShaInterface');

/**
 * This Interface provides an abstraction of SHA hashing algorithm.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.crypto.ShaInterface = function() {};

/**
 * Create the hash of the given data.
 * @param {string} Hex coded bytes.
 * @return {string} Base64 coded hash.
 */
tutao.crypto.ShaInterface.prototype.hashHex = function() {};
