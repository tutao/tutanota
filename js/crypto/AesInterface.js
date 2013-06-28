"use strict";

goog.provide('tutao.crypto.AesInterface');

/**
 * This Interface provides an abstraction of the AES cryptographic implementation.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.crypto.AesInterface = function() {};

/**
 * Create a random 128 bit symmetric AES key.
 * @return {Object} The key.
 */
tutao.crypto.AesInterface.prototype.generateRandomKey = function() {};

/**
 * Converts the given key to a hex string.
 * @param {Object} key The key.
 * @return {String} The hex string representation of the key.
 */
tutao.crypto.AesInterface.prototype.keyToHex = function(key) {};

/**
 * Converts the given key to a base64 coded string.
 * @param {Object} key The key.
 * @return {String} The base64 coded string representation of the key.
 */
tutao.crypto.AesInterface.prototype.keyToBase64 = function(key) {};

/**
 * Converts the given hex string to a key.
 * @param {String} hex The hex string representation of the key.
 * @return {Object} The key.
 * @throws {tutao.crypto.CryptoException} If the conversion fails.
 */
tutao.crypto.AesInterface.prototype.hexToKey = function(hex) {};

/**
 * Converts the given base64 coded string to a key.
 * @param {String} base64 The base64 coded string representation of the key.
 * @return {Object} The key.
 * @throws {tutao.crypto.CryptoException} If the conversion fails.
 */
tutao.crypto.AesInterface.prototype.base64ToKey = function(base64) {};

/**
 * Encrypts an utf8 coded string with AES in CBC mode.
 * @param {Object} key The key to use for the encryption.
 * @param {String} utf8 Utf8 coded data.
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @return {String} The encrypted text, base64 coded.
 * @throws {tutao.crypto.CryptoException} If the encryption fails.
 */
tutao.crypto.AesInterface.prototype.encryptUtf8 = function(key, utf8, randomIv) {};

/**
 * Decrypts a base64 coded binary data with AES in CBC mode.
 * @param {Object} key The key to use for the decryption.
 * @param {String} base64 A base64 coded string that was encrypted with the same key before.
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @return {String} The decrypted text, utf8 coded.
 * @throws {tutao.crypto.CryptoException} If the decryption fails.
 */
tutao.crypto.AesInterface.prototype.decryptUtf8 = function(key, base64, randomIv) {};

/**
 * Encrypts a hex coded key with AES in CBC mode.
 * @param {Object} key The key to use for the encryption.
 * @param {Object} keyToEncrypt The key that shall be encrypted.
 * @return {String} The encrypted key, base64 coded.
 * @throws {tutao.crypto.CryptoException} If the encryption fails.
 */
tutao.crypto.AesInterface.prototype.encryptKey = function(key, keyToEncrypt) {};

/**
 * Decrypts a base64 coded key with AES in CBC mode.
 * @param {Object} key The key to use for the decryption.
 * @param {String} base64 The key that shall be decrypted, base64 coded.
 * @return {Object} The decrypted key.
 * @throws {tutao.crypto.CryptoException} If the decryption fails.
 */
tutao.crypto.AesInterface.prototype.decryptKey = function(key, base64) {};

/**
 * Encrypts a hex coded RSA private key with AES in CBC mode.
 * @param {Object} key The key to use for the encryption.
 * @param {String} keyToEncrypt The key that shall be encrypted, hex coded.
 * @return {String} The encrypted key, base64 coded.
 * @throws {tutao.crypto.CryptoException} If the encryption fails.
 */
tutao.crypto.AesInterface.prototype.encryptPrivateRsaKey = function(key, hexRsaPrivateKey) {};

/**
 * Decrypts an encrypted private RSA key with AES in CBC mode.
 * @param {Object} key The key to use for the decryption.
 * @param {String} base64 The key that shall be decrypted, base64 coded.
 * @return {String} The decrypted private RSA key, hex coded.
 * @throws {tutao.crypto.CryptoException} If the decryption fails.
 */
tutao.crypto.AesInterface.prototype.decryptPrivateRsaKey = function(key, base64) {};

/**
 * Encrypts the content of an array buffer with AES in CBC mode.
 * @param {Object} key The key to use for the encryption.
 * @param {ArrayBuffer} arrayBuffer The plain text data.
 * @param {function(?ArrayBuffer,tutao.crypto.CryptoException=)} callback Called when finished receiving the encrypted array buffer. Receives an exception if the encryption failed.
 */
tutao.crypto.AesInterface.prototype.encryptArrayBuffer = function(key, arrayBuffer, callback) {};

/**
 * Decrypts the content of an array buffer with AES in CBC mode.
 * @param {Object} key The key to use for the decryption.
 * @param {ArrayBuffer} arrayBuffer The encrypted data.
 * @param {number} decryptedSize The number of bytes the decrypted data.
 * @param {function(?ArrayBuffer,tutao.crypto.CryptoException=)} callback Called when finished receiving the decrypted array buffer. Receives an exception if the decryption failed.
 */
tutao.crypto.AesInterface.prototype.decryptArrayBuffer = function(key, arrayBuffer, decryptedSize, callback) {};

/**
 * LEGACY: Decrypts the content of base64 coded binary data in CBC mode and provides the decrypted data as base64.
 * @param {Object} key The key to use for the decryption.
 * @param {String} srcBase64 The encrypted data, base64 coded.
 * @param {number} decryptedSize The number of bytes the decrypted data.
 * @param {function(?String,tutao.crypto.CryptoException=)} callback Called when finished receiving the decrypted base64 data. Receives an exception if the decryption failed.
 */
tutao.crypto.AesInterface.prototype.decryptBase64 = function(key, srcBase64, decryptedSize, callback) {};
