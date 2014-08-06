"use strict";

tutao.provide('tutao.crypto.RsaWorkerProxy');

/**
 * An RsaWorkerProxy is a proxy for an actual RSA implementation that executes the encryption and decryption in the worker.
 * @constructor
 * @param {tutao.crypto.RsaInterface=} rsa The actual RSA implementation. If not provided, then JsbnRsa is used.
 * @implements {tutao.crypto.RsaInterface}
 */
tutao.crypto.RsaWorkerProxy = function(rsa) {
	if (rsa) {
		this._rsa = rsa;
	} else {
		this._rsa = new tutao.crypto.JsbnRsa();
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.RsaWorkerProxy.prototype.generateKeyPair = function(callback) {
	var self = this;
	tutao.locator.clientWorkerProxy.sendCommand("generateKeyPair", {randomData: tutao.locator.randomizer.generateRandomData(258)}, function(data, errorMessage) {
		if (errorMessage) {
            self.generateKeyPair(callback);
			//TODO (timely) correct retry after out-of-random-data-exception: callback(null, new tutao.crypto.CryptoError(errorMessage));
		} else {
			callback({publicKey: self.hexToKey(data.publicKeyHex), privateKey: self.hexToKey(data.privateKeyHex)});
		}
	});
};

/**
 * @inheritDoc
 */
tutao.crypto.RsaWorkerProxy.prototype.keyToHex = function(key) {
	return this._rsa.keyToHex(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.RsaWorkerProxy.prototype.hexToKey = function(hex) {
	return this._rsa.hexToKey(hex);
};

/**
 * @inheritDoc
 */
tutao.crypto.RsaWorkerProxy.prototype.encryptAesKey = function(publicKey, hex, callback) {
	var self = this;
	// pass random data for the oaep padding
	var data = { key: this.keyToHex(publicKey), data: hex, randomData: tutao.locator.randomizer.generateRandomData(32) };
	tutao.locator.clientWorkerProxy.sendCommand("encryptAesKey", data, function(encrypted, errorMessage) {
		if (errorMessage) {
			callback(null, new tutao.crypto.CryptoError(errorMessage));
		} else {
			callback(encrypted);
		}
	});
};

/**
 * @inheritDoc
 */
tutao.crypto.RsaWorkerProxy.prototype.decryptAesKey = function(privateKey, base64, callback) {
	var self = this;
	var data = { key: this.keyToHex(privateKey), data: base64 };
	tutao.locator.clientWorkerProxy.sendCommand("decryptAesKey", data, function(encrypted, errorMessage) {
		if (errorMessage) {
			callback(null, new tutao.crypto.CryptoError(errorMessage));
		} else {
			callback(encrypted);
		}
	});
};
