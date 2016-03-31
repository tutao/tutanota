"use strict";

tutao.provide('tutao.crypto.AesInterfaceAsync');

/**
 * This Interface provides an abstraction of the AES cryptographic implementation.
 * A concrete instance is bound by the Locator.
 * @interface
 */
tutao.crypto.AesInterfaceAsync = function() {};

/**
 * Result for an  async AES operation `aesResultCallback` .
 *
 * @callback aesResultCallback
 * @param {string} type Result type of the async operation 'result' or 'error'
 * @param {Uint8Array?} result Result array in case of type 'result'
 * @param {string?} msg Optional message in case of type 'error'.
 */

/**
 * Encrypt bytes with the provided key
 * @param {bitArray} key The key to use for the encryption.
 * @param {Uint8Array} bytes
 * @param {aesResultCallback} resultCallback Function to handle the result.
 */
tutao.crypto.AesInterfaceAsync.prototype.encryptBytes = function (key, bytes, resultCallback) {};


/**
 * Decrypt bytes with the provided key
 * @param {bitArray} key The key to use for the decryption.
 * @param {Uint8Array} bytes
 * @param {Number} decryptedBytesLength The number of bytes of the decrypted array (backward compatibility for AES_128_CBC).
 * @param {aesResultCallback} resultCallback Function to handle the result.
 */
tutao.crypto.AesInterfaceAsync.prototype.decryptBytes = function (key, bytes, decryptedBytesLength, resultCallback) {};
