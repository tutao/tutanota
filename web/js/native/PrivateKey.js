"use strict";

tutao.provide('tutao.native.PrivateKey');

/**
 * @param {tutao.native.PrivateKey} key
 * @constructor
 */
tutao.native.PrivateKey = function (key) {
    // @type {number}
    this.version = key.version;

    // @type {number} In Bits
    this.keyLength = key.keyLength;
    // @type {string} Base64 encoded
    this.modulus = key.modulus;
    // @type {string} Base64 encoded
    this.privateExponent = key.privateExponent;
    // @type {string} Base64 encoded
    this.primeP = key.primeP;
    // @type {string} Base64 encoded
    this.primeQ = key.primeQ;
    // @type {string} Base64 encoded
    this.primeExponentP = key.primeExponentP;
    // @type {string} Base64 encoded
    this.primeExponentQ = key.primeExponentQ;
    // @type {string} Base64 encoded
    this.crtCoefficient = key.crtCoefficient;
};

