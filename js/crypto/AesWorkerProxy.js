"use strict";

goog.provide('tutao.crypto.AesWorkerProxy');

/**
 * @constructor
 * @param {tutao.crypto.AesInterface=} aes The actual AES implementation. If not provided, then SjclAes is used.
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.AesWorkerProxy = function(aes) {
	if (aes) {
		this._aes = aes;
	} else {
		this._aes = new tutao.crypto.SjclAes();
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.generateRandomKey = function() {
	return this._aes.generateRandomKey();
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.keyToHex = function(key) {
	return this._aes.keyToHex(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.keyToBase64 = function(key) {
	return this._aes.keyToBase64(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.hexToKey = function(hex) {
	return this._aes.hexToKey(hex);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.base64ToKey = function(base64) {
	return this._aes.base64ToKey(base64);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.encryptUtf8 = function(key, utf8, randomIv) {
	return this._aes.encryptUtf8(key, utf8, randomIv);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.decryptUtf8 = function(key, base64, randomIv) {
	return this._aes.decryptUtf8(key, base64, randomIv);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.encryptKey = function(key, keyToEncrypt) {
	return this._aes.encryptKey(key, keyToEncrypt);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.decryptKey = function(key, base64) {
	return this._aes.decryptKey(key, base64);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	return this._aes.encryptPrivateRsaKey(key, hexKeyToEncrypt);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.decryptPrivateRsaKey = function(key, base64) {
	return this._aes.decryptPrivateRsaKey(key, base64);
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.encryptArrayBuffer = function(key, srcBuffer, callback) {
	// pass random data for the iv padding
	var data = { key: this.keyToHex(key), data: srcBuffer, randomData: tutao.locator.randomizer.generateRandomData(32) };
	tutao.locator.clientWorkerProxy.sendCommand("encryptArrayBuffer", data, function(encrypted, errorMessage) {
		if (errorMessage) {
			callback(null, new tutao.crypto.CryptoException(errorMessage));
		} else {
			callback(encrypted);
		}
	});
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.decryptArrayBuffer = function(key, srcBuffer, decryptedSize, callback) {
	var data = { key: this.keyToHex(key), data: srcBuffer, decryptedSize: decryptedSize };
	tutao.locator.clientWorkerProxy.sendCommand("decryptArrayBuffer", data, function(decrypted, errorMessage) {
		if (errorMessage) {
			callback(null, new tutao.crypto.CryptoException(errorMessage));
		} else {
			callback(decrypted);
		}
	});
};

/**
 * @inheritDoc
 */
tutao.crypto.AesWorkerProxy.prototype.decryptBase64 = function(key, srcBase64, decryptedSize, callback) {
	throw new tutao.crypto.CryptoException("legacy implementation, not meant to be used with a worker!");
};
