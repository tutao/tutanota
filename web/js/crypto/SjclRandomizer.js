"use strict";

tutao.provide('tutao.crypto.SjclRandomizer');

/**
 * This random number implementation uses the sjcl random number generator internally. It is the Fortuna algorithm with small modifications to suite to the JavaScript environment.
 * See http://crypto.stanford.edu/sjcl/acsac.pdf for the corresponding whitepaper.
 * @constructor
 * @implements {tutao.crypto.RandomizerInterface}
 */
tutao.crypto.SjclRandomizer = function() {
	this.random = sjcl.random;
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
		var hex = sjcl.codec.hex.fromBits(words);
		// simply cut off the exceeding bytes
		return hex.substring(0, nbrOfBytes * 2);
	} catch (e) {
		throw new tutao.crypto.CryptoError("error during random number generation", e);
	}
};
