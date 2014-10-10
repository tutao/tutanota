"use strict";

tutao.provide('tutao.native.CryptoInterface');

/**
 * All cryptographic functions
 * @interface
 */
tutao.native.CryptoInterface = function(){};

/**
 * Returns the newly generated key
 * @param {number=} keyLength
 * @promise
 * @return {Promise.<tutao.native.KeyPair, Error>} will return the keypair.
 */
tutao.native.CryptoInterface.prototype.generateRsaKey = function(keyLength) {};

/**
 * Encrypt bytes with the provided publicKey
 * @param {tutao.native.PublicKey} publicKey
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.
 */
tutao.native.CryptoInterface.prototype.rsaEncrypt = function (publicKey, bytes) {};

/**
 * Decrypt bytes with the provided privateKey
 * @param {tutao.native.PrivateKey} privateKey
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes.
 */
tutao.native.CryptoInterface.prototype.rsaDecrypt = function (privateKey, bytes) {};



/**
 * Create a 128 bit symmetric key from the given passphrase.
 * @param {string} passphrase The passphrase to use for key generation as utf8 string.
 * @param {string} salt 128 bit of random data, encoded as a hex string.
 * @return {Promise.<string>} Resolved with the hex codec key
 */
tutao.native.CryptoInterface.prototype.generateKeyFromPassphrase = function(passphrase, salt) {};