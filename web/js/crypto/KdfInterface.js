"use strict";

tutao.provide('tutao.crypto.KdfInterface');

/**
 * This Interface provides an abstraction of a key derivation function implementation.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.crypto.KdfInterface = function() {};

/**
 * Create a 128 bit random salt value.
 * return {string} salt 128 bit of random data, encoded as a hex string.
 */
tutao.crypto.KdfInterface.prototype.generateRandomSalt = function() {};

/**
 * Create a 128 bit symmetric key from the given passphrase.
 * @param {string} passphrase The passphrase to use for key generation as utf8 string.
 * @param {string} salt 128 bit of random data, encoded as a hex string.
 * @return {Promise.<string>} Resolved with the hex codec key
 */
tutao.crypto.KdfInterface.prototype.generateKeyFromPassphrase = function(passphrase, salt) {};
