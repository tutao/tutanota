"use strict";

tutao.provide('SecureRandom');

/**
 * This randomizer does not generate random numbers itself but acts as a proxy. It only provides random numbers if it was feeded with values via setNextRandomBytes().
 * @constructor
 */
var SecureRandom = function() {
};

SecureRandom._nextBytes = [];

/**
 * Only this function is used by jsbn for getting random bytes. Each byte is a value between 0 and 255.
 * @param {Array} array An array to fill with random bytes. The length of the array defines the number of bytes to create.
 */
SecureRandom.prototype.nextBytes = function(array) {
    if (SecureRandom._nextBytes.length < array.length) {
        throw new Error("SecureRandom does not have random numbers.");
    }
    var bytes = SecureRandom._nextBytes.splice(0,array.length);
    for (var i=0;i<array.length;i++) {
        array[i] = bytes[i];
    }
};

/**
 * Adds bytes to this randomizer which are provided in the subsequent calls to generateRandomData().
 * @param {Array} array An array of random bytes
 */
SecureRandom.setNextRandomBytes = function(bytes) {
    SecureRandom._nextBytes = SecureRandom._nextBytes.concat(bytes);
};
