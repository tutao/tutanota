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