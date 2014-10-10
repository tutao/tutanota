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
 * Create a 128 bit symmetric key from the given passphrase.
 * @param {string} passphrase The passphrase to use for key generation as utf8 string.
 * @param {string} salt 128 bit of random data, encoded as a hex string.
 * @return {Promise.<string>} Resolved with the hex codec key
 */
tutao.native.CryptoInterface.prototype.generateKeyFromPassphrase = function(passphrase, salt) {};

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
 * Returns the newly generated key
 * @return {Uint8Array} will return the key.
 */
tutao.native.CryptoInterface.prototype.generateAesKey = function() {};

/**
 * Encrypt bytes with the provided key
 * @param {Uint8Array} key The key to use for the encryption.
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.  Resolves to an exception if the encryption failed.
 */
tutao.native.CryptoInterface.prototype.aesEncrypt = function (key, bytes) {};

/**
 * Encrypts a file with the provided key
 * @param {Uint8Array} key The key to use for the encryption.
 * @param {string} fileUrl The file that should be encrypted
 * @return {Promise.<string, Error>} will return the URI of the encrypted file. Resolves to an exception if the encryption failed.
 */
tutao.native.CryptoInterface.prototype.aesEncryptFile = function (key, fileUrl) {};

/**
 * Decrypt bytes with the provided key
 * @param {Uint8Array} key The key to use for the decryption.
 * @param {Uint8Array} bytes
 * @param {Number} decryptedBytesLength The number of bytes of the decrypted array.
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes. Resolves to an exception if the encryption failed.
 */
tutao.native.CryptoInterface.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {};

/**
 * Decrypt bytes with the provided key
 * @param {Uint8Array} key The key to use for the decryption.
 * @param {string} fileUrl The file that should be decrypted
 * @return {Promise.<string, Error>} will return the URI of the decrypted file. Resolves to an exception if the encryption failed.
 */
tutao.native.CryptoInterface.prototype.aesDecryptFile = function (key, fileUrl) {};