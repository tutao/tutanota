"use strict";

goog.provide('tutao.crypto.SimpleRandomizer');

/**
 * @constructor
 * @implements {tutao.crypto.RandomizerInterface}
 */
tutao.crypto.SimpleRandomizer = function() {

};

/**
 * @inheritDoc
 */
tutao.crypto.SimpleRandomizer.prototype.addEntropy = function(number, entropy, source) {
	// nothing to do
};

/**
 * @inheritDoc
 */
tutao.crypto.SimpleRandomizer.prototype.isReady = function() {
	return true;
};

/**
 * @inheritDoc
 */
tutao.crypto.SimpleRandomizer.prototype.generateRandomData = function(nbrOfBytes) {
	var hexChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
	var hexString = "";
	for (var i = 0; i < nbrOfBytes * 2; i++) {
        hexString += hexChars[Math.floor(Math.random() * 16)];
    }
	return hexString;
};
