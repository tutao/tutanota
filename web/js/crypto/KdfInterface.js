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
 * return {Uint8Array} salt 16 byte of random data.
 */
tutao.crypto.KdfInterface.prototype.generateRandomSalt = function() {};

/**
 * Create a 128 bit symmetric key from the given passphrase.
 * @param {string} passphrase The passphrase to use for key generation as utf8 string.
 * @param {Uint8Array} salt 16 bytes of random data.
 * @param {Number} keyLengthType Defines the length of the key that shall be generated. One of tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_*.
 * @return {Promise.<bitArray>} Resolved with the key as bitArray.
 */
tutao.crypto.KdfInterface.prototype.generateKeyFromPassphrase = function(passphrase, salt, keyLengthType) {};
