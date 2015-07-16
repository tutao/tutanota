"use strict";

tutao.provide('tutao.crypto.Oaep');

/**
 * @constructor
 * @see https://tools.ietf.org/html/rfc3447#section-7.1
 */
tutao.crypto.Oaep = function () {
    this.utils = new tutao.crypto.Utils();
};

/**
 * @param {Array.<number>} value The byte array to encode.
 * @param {number} keyLength The length of the RSA key in bit.
 * @param {Array.<number>} seed An array of random bytes of 256 bytes.
 * @return {Array.<number>} The padded byte array.
 */
tutao.crypto.Oaep.prototype.pad = function (value, keyLength, seed) {
    var hashLength = 32; // bytes sha256
    if (seed.length != hashLength) {
        throw new Error("invalid seed length: " + seed.length + ". expected: " + hashLength + " bytes!");
    }
    if (value.length > (keyLength / 8 - hashLength - 1)) {
        throw new Error("invalid value length: " + value.length + ". expected: max. " + (keyLength / 8 - hashLength - 1));
    }

    var block = this._getPSBlock(value, keyLength);

    var dbMask = this.utils.mgf1(seed, block.length - hashLength);

    for (var i = hashLength; i < block.length; i++) {
        block[i] ^= dbMask[i - hashLength];
    }

    // same as invoking sha256 directly because only one block is hashed
    var seedMask = this.utils.mgf1(block.slice(hashLength, block.length), hashLength);

    for (var i = 0; i < seedMask.length; i++) {
        block[i] = seed[i] ^ seedMask[i];
    }

    return block;
};

/**
 * @param {Array.<number>} value The byte array to unpad.
 * @param {number} keyLength The length of the RSA key in bit.
 * @return {Array.<number>} The unpadded byte array.
 */
tutao.crypto.Oaep.prototype.unpad = function (value, keyLength) {
    var hashLength = 32; // bytes sha256
    if (value.length != keyLength / 8 - 1) {
        throw new Error("invalid value length: " + value.length + ". expected: " + (keyLength / 8 - 1) + " bytes!");
    }

    var seedMask = this.utils.mgf1(value.slice(hashLength, value.length), hashLength);
    var seed = [];
    seed.length = hashLength;
    for (var i = 0; i < seedMask.length; i++) {
        seed[i] = value[i] ^ seedMask[i];
    }

    var dbMask = this.utils.mgf1(seed, value.length - hashLength);

    for (var i = hashLength; i < value.length; i++) {
        value[i] ^= dbMask[i - hashLength];
    }

    // check that the zeros and the one is there
    for (var index = 2 * hashLength; index < value.length; index++) {
        if (value[index] == 1) {
            // found the 0x01
            break;
        } else if (value[index] != 0 || index == value.length) {
            throw new Error("invalid padding");
        }
    }

    return value.slice(index + 1, value.length);
};

/**
 * Provides a block of keyLength / 8 - 1 bytes with the following format:
 * [ zeros ] [ label hash ] [ zeros ] [ 1 ] [ value ]
 *    32           32    keyLen-2*32-2  1  value.length
 * The label is the hash of an empty string like defined in PKCS#1 v2.1
 */
tutao.crypto.Oaep.prototype._getPSBlock = function (value, keyLength) {
    var hashLength = 32; // bytes sha256
    var blockLength = keyLength / 8 - 1; // the leading byte shall be 0 to make the resulting value in any case smaller than the modulus, so we just leave the byte off
    var block = [];
    block.length = blockLength;

    var hash = new sjcl.hash.sha256();
    hash.update([]); // empty label
    var defHash = sjcl.codec.bytes.fromBits(hash.finalize());

    var nbrOfZeros = block.length - (1 + value.length);
    for (var i = 0; i < block.length; i++) {
        if (i >= hashLength && i < 2 * hashLength) {
            block[i] = defHash[i - hashLength];
        } else if (i < nbrOfZeros) {
            block[i] = 0;
        } else if (i == nbrOfZeros) {
            block[i] = 1;
        } else {
            block[i] = value[i - nbrOfZeros - 1];
        }
    }
    return block;
};
