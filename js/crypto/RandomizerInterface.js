"use strict";

goog.provide('tutao.crypto.RandomizerInterface');

/**
 * This Interface provides an abstraction of the random number generator implementation.
 * A concrete instance is bound by the ServiceLocator.
 * @interface
 */
tutao.crypto.RandomizerInterface = function() {};

tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE = "mouse";
tutao.crypto.RandomizerInterface.ENTROPY_SRC_KEY = "key";
tutao.crypto.RandomizerInterface.ENTROPY_SRC_RANDOM = "random";
tutao.crypto.RandomizerInterface.ENTROPY_SRC_STATIC = "static";
tutao.crypto.RandomizerInterface.ENTROPY_SRC_PING = "ping";

/**
 * Adds entropy to the random number generator algorithm
 * @param {number} number Any number value.
 * @param {string} source The source of the number. One of tutao.crypto.RandomizerInterface.ENTROPY_SRC_*.
 * @return {number} entropy The amount of entropy in the number in bit.
 */
tutao.crypto.RandomizerInterface.prototype.addEntropy = function(number, entropy, source) {};

/**
 * Verifies if the randomizer is ready to serve.
 * @return {boolean} true, if it is ready, false otherwise.
 */
tutao.crypto.RandomizerInterface.prototype.isReady = function() {};


/**
 * Generates random data. The function initRandomDataGenerator must have been called prior to the first call to this function.
 * @param {number} nbrOfBytes The number of bytes the random data shall have.
 * @return {string} A hex coded string of random data.
 * @throws {tutao.crypto.CryptoException} if the randomizer is not seeded (isReady == false)
 */
tutao.crypto.RandomizerInterface.prototype.generateRandomData = function(nbrOfBytes) {};
