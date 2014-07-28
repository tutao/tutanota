"use strict";

goog.provide('tutao.crypto.WorkerRandomizer');

/**
 * This randomizer does not generate random numbers itself but acts as a proxy. It only provides random numbers if it was feeded with values via setNextRandomBytes().
 * @constructor
 * @implements {tutao.crypto.RandomizerInterface}
 */
tutao.crypto.WorkerRandomizer = function() {
	this._nextBytes = "";
	this.requestedBytes = 0;
};

/**
 * @inheritDoc
 */
tutao.crypto.WorkerRandomizer.prototype.addEntropy = function(number, entropy, source) {};

/**
 * @inheritDoc
 */
tutao.crypto.WorkerRandomizer.prototype.isReady = function() {
	return true;
};

/**
 * @inheritDoc
 */
tutao.crypto.WorkerRandomizer.prototype.generateRandomData = function(nbrOfBytes) {
	if (this._nextBytes.length / 2 < nbrOfBytes) {
        throw new Error("WorkerRandomizer does not have random numbers.");
	}
	var bytes = this._nextBytes.substring(0, nbrOfBytes * 2);
	this._nextBytes = this._nextBytes.substring(nbrOfBytes * 2);
	return bytes;
};

/**
 * Adds bytes to this randomizer which are provided in the subsequent calls to generateRandomData().
 * @param {string} bytes Hex coded random bytes.
 */
tutao.crypto.WorkerRandomizer.prototype.setNextRandomBytes = function(bytes) {
	this._nextBytes = this._nextBytes.concat(bytes);
};
