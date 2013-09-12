"use strict";

goog.provide('tutao.crypto.RsaInterface');

/**
 * This Interface provides an abstraction of the RSA cryptographic implementation.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.crypto.RsaInterface = function() {};

/**
 * Generates a 2048 bit RSA key pair.
 * @param {function({publicKey: Object, privateKey: Object}=, tutao.crypto.CryptoException=)} callback This callback is called providing the generated key pair or an exception if the key generation fails.
 */
tutao.crypto.RsaInterface.prototype.generateKeyPair = function(callback) {};

/**
 * Converts the given key to a hex string.
 * @param {Object} key The key which may be a public or a private key.
 * @return {String} The hex string representation of the key.
 */
tutao.crypto.RsaInterface.prototype.keyToHex = function(key) {};

/**
 * Converts the given hex string to a key.
 * @param {String} hex The hex string representation of the key which might be a public or a private key.
 * @return {Object} The key.
 * @throws {tutao.crypto.CryptoException} If the conversion fails.
 */
tutao.crypto.RsaInterface.prototype.hexToKey = function(hex) {};

/**
 * Encrypts a hex coded AES key with RSA to a base64 coded string.
 * @param {Object} publicKey The key to use for the encryption.
 * @param {string} hexAesKey Hex coded AES key, max 256 bytes = 512 characters.
 * @param {function(string=, tutao.crypto.CryptoException=)} callback This callback is called providing the encrypted string, base64 coded, max 344 characters or an exception if the enryption fails.
 */
tutao.crypto.RsaInterface.prototype.encryptAesKey = function(publicKey, hexAesKey, callback) {};

/**
 * Decrypts a base64 coded string with RSA to a hex coded string.
 * @param {Object} privateKey The key to use for the decryption.
 * @param {string} base64 The data to decrypt, max 344 characters.
 * @param {function(string=, tutao.crypto.CryptoException=)} callback This callback is called providing the decrypted string, hex coded, max 256 bytes = 512 characters or an exception if the decryption fails.
 */
tutao.crypto.RsaInterface.prototype.decryptAesKey = function(privateKey, base64, callback) {};
