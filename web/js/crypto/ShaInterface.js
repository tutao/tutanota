"use strict";

tutao.provide('tutao.crypto.ShaInterface');

/**
 * This Interface provides an abstraction of SHA hashing algorithm.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.crypto.ShaInterface = function() {};

/**
 * Create the hash of the given data.
 * @param {Uint8Array} uint8Array The bytes.
 * @return {Uint8Array} The hash.
 */
tutao.crypto.ShaInterface.prototype.hash = function(uint8Array) {};
