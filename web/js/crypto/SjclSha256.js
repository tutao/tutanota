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
tutao.crypto.SjclSha256.prototype.hash = function(uint8Array) {
	this._hasher.reset();
	this._hasher.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer));
	return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(this._hasher.finalize()));
};
