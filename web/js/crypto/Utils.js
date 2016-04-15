"use strict";

tutao.provide('tutao.crypto.Utils');

/**
 * @constructor
 */
tutao.crypto.Utils = function () {

};

/**
 * @param {Array.<Number>} seed An array of byte values.
 * @param {Number} length The length of the return value in bytes.
 */
tutao.crypto.Utils.prototype.mgf1 = function (seed, length) {
    var C = null;
    var counter = 0;
    var hash = new sjcl.hash.sha256();
    var T = [];

    var seedSjclArray = sjcl.codec.bytes.toBits(seed);

    do {
        C = this.i2osp(counter);
        var cSjclArray = sjcl.codec.bytes.toBits(C);

        hash.update(seedSjclArray);
        hash.update(cSjclArray);
        T = sjcl.bitArray.concat(T, hash.finalize());
    } while (++counter < Math.ceil(length / (256 / 8)));

    var slice = sjcl.bitArray.bitSlice(T, 0, length * 8);
    return sjcl.codec.bytes.fromBits(slice);
};

/**
 * converts an integer to a 4 byte array
 */
tutao.crypto.Utils.prototype.i2osp = function (i) {
    var array = [];
    array.push((i >> 24) & 255);
    array.push((i >> 16) & 255);
    array.push((i >> 8) & 255);
    array.push((i >> 0) & 255);
    return array;
};

tutao.crypto.Utils.PADDING_BLOCK_LENGTH = 16;

tutao.crypto.Utils.pad = function(bytes) {
    var paddingLength = tutao.crypto.Utils.PADDING_BLOCK_LENGTH - (bytes.byteLength % tutao.crypto.Utils.PADDING_BLOCK_LENGTH);
    var padding = new Uint8Array(paddingLength);
    padding.fill(paddingLength);
    return tutao.crypto.Utils.concat(bytes, padding);
};

tutao.crypto.Utils.unpad = function(bytes) {
    var paddingLength = bytes[bytes.byteLength - 1];
    if (paddingLength == 0 || paddingLength > bytes.byteLength || paddingLength > tutao.crypto.Utils.PADDING_BLOCK_LENGTH) {
        throw new tutao.crypto.CryptoError("invalid padding: " + paddingLength);
    }
    var length = bytes.byteLength - paddingLength;
	var result = new Uint8Array(length);
    result.set(bytes.subarray(0,length)); // or is a subarray fine here instead of a copy?
	return result;
};

tutao.crypto.Utils.concat = function(bytes1, bytes2) {
    var dstBuffer = new Uint8Array(bytes1.byteLength + bytes2.byteLength);
    dstBuffer.set(bytes1, 0);
    dstBuffer.set(bytes2, bytes1.byteLength);
    return dstBuffer;
};

/**
 * Creates the auth verifier from the password key.
 * @param passwordKey The key.
 * @returns {string} The auth verifier, encoded as base64 string.
 */
tutao.crypto.Utils.createAuthVerifier = function (passwordKey) {
    return tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.locator.shaCrypter.hash(tutao.util.EncodingConverter.keyToUint8Array(passwordKey)));
};
