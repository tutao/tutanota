"use strict";

tutao.provide('tutao.native.KeyPair');

/**
 * @param {tutao.native.KeyPair} keyPair
 * @constructor
 */
tutao.native.KeyPair = function (keyPair) {
    // @type {tutao.native.PublicKey}
    this.publicKey = keyPair.publicKey;
    // @type {tutao.native.PrivateKey}
    this.privateKey = keyPair.privateKey;
};
