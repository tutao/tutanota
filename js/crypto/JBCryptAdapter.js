"use strict";

goog.provide('tutao.crypto.JBCryptAdapter');

/**
 * @constructor
 * @implements {tutao.crypto.KdfInterface}
 */
tutao.crypto.JBCryptAdapter = function() {
	this.keyLength = 128;
	this.logRounds = 8; // pbkdf2 number of iterations
};

/**
 * @inheritDoc
 */
tutao.crypto.JBCryptAdapter.prototype.generateRandomSalt = function() {
	return tutao.locator.randomizer.generateRandomData(this.keyLength / 8);
};

/**
 * @inheritDoc
 */
tutao.crypto.JBCryptAdapter.prototype.generateKeyFromPassphrase = function(passphrase, salt, callback) {
	var self = this;

	// jbcrypt needs the salt and password as unsigned bytes
	var saltBytes = this._unsignedToSignedBytes(tutao.util.EncodingConverter.hexToBytes(salt));
	var passphraseBytes = this._unsignedToSignedBytes(tutao.util.EncodingConverter.hexToBytes(tutao.util.EncodingConverter.utf8ToHex(passphrase)));

	// create a new instance for each call to make sure that no concurrency problems occur (the bcrypt library uses setTimeouts)
	var b = new bCrypt();
	b.crypt_raw(passphraseBytes, saltBytes, this.logRounds, function(key) {
		var hexKey = tutao.util.EncodingConverter.bytesToHex(self._signedToUnsignedBytes(key));
		callback(hexKey);
	}, function() {});
};

/**
 * Converts an array of signed byte values (-128 to 127) to unsigned bytes (0 to 255).
 * @param {Array.<number>} signedBytes The signed byte values.
 * @return {Array.<number>} The unsigned byte values.
 */
tutao.crypto.JBCryptAdapter.prototype._signedToUnsignedBytes = function(signedBytes) {
	var unsignedBytes = [];
	for (var i = 0; i < signedBytes.length; i++) {
		if (signedBytes[i] < 0) {
			unsignedBytes.push(256 + signedBytes[i]);
		} else {
			unsignedBytes.push(signedBytes[i]);
		}
	}
	return unsignedBytes;
};

/**
 * Converts an array of unsigned byte values (0 to 255) to unsigned bytes (-128 to 127).
 * @param {Array.<number>} unsignedBytes The unsigned byte values.
 * @return {Array.<number>} The signed byte values.
 */
tutao.crypto.JBCryptAdapter.prototype._unsignedToSignedBytes = function(unsignedBytes) {
	var signedBytes = [];
	for (var i = 0; i < unsignedBytes.length; i++) {
		if (unsignedBytes[i] > 127) {
			signedBytes.push(unsignedBytes[i] - 256);
		} else {
			signedBytes.push(unsignedBytes[i]);
		}
	}
	return signedBytes;
};
