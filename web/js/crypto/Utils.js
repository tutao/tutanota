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
    var dstBuffer = new Uint8Array(bytes.byteLength + paddingLength);
    dstBuffer.set(bytes, 0);
    dstBuffer.set(padding, bytes.byteLength);
    return dstBuffer;
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
