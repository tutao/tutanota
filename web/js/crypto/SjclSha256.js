"use strict";

tutao.provide('tutao.crypto.SjclSha256');

/**
 * Sha256 implementation from the Sjcl library.
 * @constructor
 */
tutao.crypto.SjclSha256 = function() {
	this._hasher = new sjcl.hash.sha256();
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclSha256.prototype.hashHex = function(hexData) {
	this._hasher.reset();
	this._hasher.update(sjcl.codec.hex.toBits(hexData));
	return sjcl.codec.base64.fromBits(this._hasher.finalize());
};
