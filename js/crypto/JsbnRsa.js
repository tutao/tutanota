"use strict";

goog.provide('tutao.crypto.JsbnRsa');

// private key format:
// [ n, d, p, q, pe, qe, c ]

// public key format:
// [ n ]
// e is fixed to 65537 which is recommended for RSA

// private key hex format: [ nLen ] [ n ] [ dLen ] [ d ] [ pLen ] [ p ] [ qLen ] [ q ] [ peLen ] [ pe ] [ qeLen ] [ qe ] [ cLen ] [ c ]
// nbr of hex chars:           4     nLen     4     dLen     4     pLen     4     qLen     4      peLen     4      qeLen     4     cLen

// public key hex format: [ nLen ] [ n ]
// nbr of hex chars:          4     nLen

/**
 * @constructor
 * @implements {tutao.crypto.RsaInterface}
 */
tutao.crypto.JsbnRsa = function() {
	this.keyLengthInBits = 2048;
	this.publicExponent = 65537;
	this.publicExponentAsHex = "10001";
	this._oaep = new tutao.crypto.Oaep();
};

/**
 * @inheritDoc
 */
tutao.crypto.JsbnRsa.prototype.generateKeyPair = function(callback) {
	// TODO (story rsa review): the minimal modulus length. 2047 bit?
	var rsa = new RSAKey();
	try {
		rsa.generate(this.keyLengthInBits, this.publicExponentAsHex);
		callback({ publicKey: [rsa.n], privateKey: [rsa.n, rsa.d, rsa.p, rsa.q, rsa.dmp1, rsa.dmq1, rsa.coeff]});
	} catch (e) {
		callback(null, new tutao.crypto.CryptoException("key generation failed", e));
	}
};

/**
 * Provides the length of the given string as hex string of 4 characters length. Padding to 4 characters is done with '0'.
 * @param {string} string A string to get the length of.
 * @return {string} A hex string containing the length of string.
 */
tutao.crypto.JsbnRsa.prototype._hexLen = function(string) {
	var hexLen = string.length.toString(16);
	while (hexLen.length < 4) {
        hexLen = "0" + hexLen;
    }
	return hexLen;
};

/**
 * @inheritDoc
 */
tutao.crypto.JsbnRsa.prototype.keyToHex = function(key) {
	var hex = "";
	for (var i = 0; i < key.length; i++) {
		var param = key[i].toString(16);
		if ((param.length % 2) == 1) {
			param = "0" + param;
		}
		hex += this._hexLen(param) + param;
	}
	return hex;
};

/**
 * @inheritDoc
 */
tutao.crypto.JsbnRsa.prototype.hexToKey = function(hex) {
    try {
		var key = [];
		var pos = 0;
		while (pos < hex.length) {
			var nextParamLen = parseInt(hex.substring(pos, pos + 4), 16);
			pos += 4;
			key.push(parseBigInt(hex.substring(pos, pos + nextParamLen), 16));
			pos += nextParamLen;
		}
        this._validateKeyLength(key);
        return key;
	} catch (e) {
		throw new tutao.crypto.CryptoException("hex to rsa key failed", e);
	}
};

/**
 * @param {Array} key
 * @private
 */
tutao.crypto.JsbnRsa.prototype._validateKeyLength = function(key) {
    if (key.length != 1 && key.length != 7) {
        throw new Error("invalid key params");
    }
    if (key[0].bitLength() < this.keyLengthInBits - 1 || key[0].bitLength() > this.keyLengthInBits) {
        throw new Error("invalid key length, expected: around " + this.keyLengthInBits + ", but was: " + key[0].bitLength());
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.JsbnRsa.prototype.encryptAesKey = function(publicKey, hex, callback) {
	try {
		var rsa = new RSAKey();
		rsa.n = publicKey[0];
		rsa.e = this.publicExponent;
		var bytes = tutao.util.EncodingConverter.hexToBytes(hex);
		var randomBytes = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(32));
		var paddedBytes = this._oaep.pad(bytes, this.keyLengthInBits, randomBytes);
		var paddedHex = tutao.util.EncodingConverter.bytesToHex(paddedBytes);

		var bigInt = parseBigInt(paddedHex, 16);
		var encrypted = rsa.doPublic(bigInt);

		var encryptedHex = encrypted.toString(16);
		if ((encryptedHex.length % 2) == 1) {
			encryptedHex = "0" + encryptedHex;
		}
		var base64 = tutao.util.EncodingConverter.hexToBase64(encryptedHex);

		callback(base64);
	} catch (e) {
		callback(null, new tutao.crypto.CryptoException("rsa encryption failed", e));
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.JsbnRsa.prototype.decryptAesKey = function(privateKey, base64, callback) {
	try {
		var rsa = new RSAKey();
		rsa.n = privateKey[0];
		rsa.d = privateKey[1];
		rsa.p = privateKey[2];
		rsa.q = privateKey[3];
		rsa.dmp1 = privateKey[4];
		rsa.dmq1 = privateKey[5];
		rsa.coeff = privateKey[6];
		var hex = tutao.util.EncodingConverter.base64ToHex(base64);
		var bigInt = parseBigInt(hex, 16);
		var paddedBigInt = rsa.doPrivate(bigInt);
		var decryptedHex = paddedBigInt.toString(16);
		// fill the hex string to have a padded block of exactly (keylength / 8 - 1 bytes) for the unpad function
		// two possible reasons for smaller string:
		// - one "0" of the byte might be missing because toString(16) does not consider this
		// - the bigint value might be smaller than (keylength / 8 - 1) bytes
		var expectedPaddedHexLength = (this.keyLengthInBits / 8 - 1) * 2;
		var fill = Array(expectedPaddedHexLength - decryptedHex.length + 1).join("0"); // creates the missing zeros
		decryptedHex = fill + decryptedHex;
		var paddedBytes = tutao.util.EncodingConverter.hexToBytes(decryptedHex);
		var bytes = this._oaep.unpad(paddedBytes, this.keyLengthInBits);
		callback(tutao.util.EncodingConverter.bytesToHex(bytes));
	} catch (e) {
		callback(null, new tutao.crypto.CryptoException("rsa decryption failed", e));
	}
};

/**
 * Adapter from the jsbn library to our RandomizerInterface
 * @constructor
 */
function SecureRandom() {

}

/**
 * Only this function is used by jsbn for getting random bytes. Each byte is a value between 0 and 255.
 * @param {Array} array An array to fill with random bytes. The length of the array defines the number of bytes to create.
 */
SecureRandom.prototype.nextBytes = function(array) {
	var hexString = tutao.locator.randomizer.generateRandomData(array.length);
	for (var i = 0; i < array.length; i++) {
		array[i] = parseInt(hexString.substring(i * 2, (i + 1) * 2), 16);
	}
};
