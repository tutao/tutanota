"use strict";

tutao.provide('tutao.crypto.SjclRandomizer');

/**
 * This random number implementation uses the sjcl random number generator internally. It is the Fortuna algorithm with small modifications to suite to the JavaScript environment.
 * See http://crypto.stanford.edu/sjcl/acsac.pdf for the corresponding whitepaper.
 * @constructor
 * @implements {tutao.crypto.RandomizerInterface}
 */
tutao.crypto.SjclRandomizer = function() {
	this.random = new sjcl.prng(6);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclRandomizer.prototype.addEntropy = function(number, entropy, source) {
	this.random.addEntropy(number, entropy, source);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclRandomizer.prototype.isReady = function() {
	return this.random.isReady() !== 0;
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclRandomizer.prototype.generateRandomData = function(nbrOfBytes) {
	try {
		// read the minimal number of words to get nbrOfBytes
		var nbrOfWords = Math.floor((nbrOfBytes + 3) / 4);
		var words = this.random.randomWords(nbrOfWords);
		var arrayBuffer = sjcl.codec.arrayBuffer.fromBits(words);
		// simply cut off the exceeding bytes
		return new Uint8Array(new Uint8Array(arrayBuffer, 0, nbrOfBytes)); // truncate the arraybuffer as precaution
	} catch (e) {
		throw new tutao.crypto.CryptoError("error during random number generation", e);
	}
};
