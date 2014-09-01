"use strict";

tutao.provide('tutao.native.PublicKey');

/**
 * @param {tutao.native.PublicKey} key
 * @constructor
 */
tutao.native.PublicKey = function (key) {
    // @type {number}
    this.version = key.version;
    // @type {number} In Bits
    this.keyLength = key.keyLength;
    // @type {string} base64 encoded
    this.modulus = key.modulus;
    // @type {number}
    this.publicExponent = key.publicExponent;
};
