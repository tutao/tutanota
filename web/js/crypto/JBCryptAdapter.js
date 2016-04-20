"use strict";

tutao.provide('tutao.crypto.JBCryptAdapter');

/**
 * @constructor
 * @implements {tutao.crypto.KdfInterface}
 */
tutao.crypto.JBCryptAdapter = function() {
	this.keyLength = 128;
	this.logRounds = 8; // number of iterations
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
tutao.crypto.JBCryptAdapter.prototype.generateKeyFromPassphrase = function(passphrase, salt, keyLengthType) {
	var self = this;

	// jbcrypt needs the salt and password as signed bytes
	var saltBytes = this._uint8ArrayToSignedBytes(salt);
	// hash the password first to avoid login with multiples of a password, i.e. "hello" and "hellohello" produce the same key if the same salt is used 
	var passphraseBytes = this._uint8ArrayToSignedBytes(tutao.locator.shaCrypter.hash(tutao.util.EncodingConverter.stringToUtf8Uint8Array(passphrase)));

	// create a new instance for each call to make sure that no concurrency problems occur (the bcrypt library uses setTimeouts)
	var b = new bCrypt();
    return new Promise(function(resolve, reject) {
        b.crypt_raw(passphraseBytes, saltBytes, self.logRounds, function(signedBytes) {
            if (keyLengthType == tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT) {
                var key = tutao.util.EncodingConverter.uint8ArrayToKey(self._signedBytesToUint8Array(signedBytes));
                resolve(key);
            } else if (keyLengthType == tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT) {
                b.crypt_raw(signedBytes, saltBytes, self.logRounds, function(signedBytes2) {
                    var key = tutao.util.EncodingConverter.uint8ArrayToKey(self._signedBytesToUint8Array(signedBytes.concat(signedBytes2)));
                    resolve(key);
                }, function() {});
            } else {
                reject(new Error("invalid key length type: " + keyLengthType));
            }

        }, function() {});
    });
};

/**
 * Converts an array of signed byte values (-128 to 127) to an Uint8Array (values 0 to 255).
 * @param {Array.<number>} signedBytes The signed byte values.
 * @return {Uint8Array} The unsigned byte values.
 */
tutao.crypto.JBCryptAdapter.prototype._signedBytesToUint8Array = function(signedBytes) {
	return new Uint8Array(new Int8Array(signedBytes).buffer);
};

/**
 * Converts an uint8Array (value 0 to 255) to an Array with unsigned bytes (-128 to 127).
 * @param {Uint8Array} unsignedBytes The unsigned byte values.
 * @return {Array.<number>} The signed byte values.
 */
tutao.crypto.JBCryptAdapter.prototype._uint8ArrayToSignedBytes = function(unsignedBytes) {
    return [].slice.call(new Int8Array(unsignedBytes.buffer))
};
