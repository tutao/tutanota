"use strict";

tutao.provide('tutao.crypto.SjclAesCbc');

/**
 * AES 256 CBC with HMAC
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.SjclAesCbc = function() {
	// arbitrary fixed iv
	this.fixedIv = sjcl.codec.hex.toBits('88888888888888888888888888888888');
    this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 32;
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.generateRandomKey = function() {
	return sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes), false);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.keyToHex = function(key) {
	return sjcl.codec.hex.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.keyToBase64 = function(key) {
	return sjcl.codec.base64.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.hexToKey = function(hex) {
	try {
		return sjcl.codec.hex.toBits(hex);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.base64ToKey = function(base64) {
	try {
		return sjcl.codec.base64.toBits(base64);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.encryptUtf8 = function(key, utf8) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.decryptUtf8 = function(key, base64) {
	try {
		return sjcl.codec.utf8String.fromBits(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, true));
	} catch (e) {
		throw e; //throw new tutao.crypto.CryptoError("aes utf8 decryption failed", e);
	}
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.encryptUtf8Index = function(key, utf8) {
    try {
        return sjcl.codec.base64.fromBits(this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.decryptUtf8Index = function(key, base64) {
    try {
        return sjcl.codec.utf8String.fromBits(this._decrypt(key, sjcl.codec.base64.toBits(base64), false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.encryptBytes = function(key, base64) {
	return sjcl.codec.base64.fromBits(this._encrypt(key, sjcl.codec.base64.toBits(base64), true, true));
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.decryptBytes = function(key, base64) {
	try {
		return sjcl.codec.base64.fromBits(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, keyToEncrypt, false, false));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.decryptKey = function(key, base64) {
	try {
		return this._decrypt(key, sjcl.codec.base64.toBits(base64), false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, sjcl.codec.hex.toBits(hexKeyToEncrypt), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesCbc.prototype.decryptPrivateRsaKey = function(key, base64) {
	try {
		return sjcl.codec.hex.fromBits(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key decryption failed", e);
	}
};

/**
 * Encrypts a list of words with AES in CBC mode.
 * @protected
 * @param {Object} key The key to use for the encryption.
 * @param {Object} words The words to encrypt (sjcl internal structure).
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {Object} The encrypted text as bit array.
 */
tutao.crypto.SjclAesCbc.prototype._encrypt = function(key, words, randomIv, usePadding) {
	var iv;
	if (randomIv) {
		iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
	} else {
		// use the fixed iv, but do not append it to the ciphertext
		iv = this.fixedIv;
	}
    var splitKey = this._splitKey(key);
	var encrypted = sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(splitKey.aesKey), words, iv, [], usePadding);
    var merged = null;
	if (randomIv) {
		merged = sjcl.bitArray.concat(iv, encrypted);
	} else {
		merged = encrypted;
	}
    var mac = this._calculateHmac(splitKey.hmacKey, merged);
    return sjcl.bitArray.concat(merged, mac);
};

tutao.crypto.SjclAesCbc.prototype._splitKey = function(key) {
    return { aesKey: key, hmacKey: sjcl.hash.sha256.hash(key) };
};

tutao.crypto.SjclAesCbc.prototype._calculateHmac = function(key, data) {
    var maccer = new sjcl.misc.hmac(key, sjcl.hash.sha256);
    return maccer.encrypt(data);
};

/**
 * Decrypts a base64 coded string with AES in CBC mode into words.
 * @protected
 * @param {Object} key The key to use for the decryption.
 * @param {Object} words The bit array to decrypt.
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {Object} The decrypted words (CryptoJS internal structure).
 */
tutao.crypto.SjclAesCbc.prototype._decrypt = function(key, words, randomIv, usePadding) {
    var splitKey = this._splitKey(key);
	var iv;
	var ciphertext;
    var encryptedBitLength =  sjcl.bitArray.bitLength(words) - this._tagSizeBytes * 8;
    var encrypted = sjcl.bitArray.bitSlice(words, 0, encryptedBitLength);
    var hmac = sjcl.bitArray.bitSlice(words, encryptedBitLength);
    var calculatedHmac = this._calculateHmac(splitKey.hmacKey, encrypted);
    if (!sjcl.bitArray.equal(hmac, calculatedHmac)) {
        throw new tutao.crypto.CryptoError("bad hmac");
    }

	if (randomIv) {
		// take the iv from the front of the encrypted data
		iv = sjcl.bitArray.bitSlice(encrypted, 0, this._ivLengthBytes * 8);
		ciphertext = sjcl.bitArray.bitSlice(encrypted, this._ivLengthBytes * 8);
	} else {
		iv = this.fixedIv;
		ciphertext = encrypted;
	}
    return sjcl.mode.cbc.decrypt(new sjcl.cipher.aes(splitKey.aesKey), ciphertext, iv, [], usePadding);
};


/**
 * Encrypt bytes with the provided key
 * @param {Object} key The key to use for the encryption.
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.  Resolves to an exception if the encryption failed.
 */
tutao.crypto.SjclAesCbc.prototype.aesEncrypt = function (key, bytes) {
	var self = this;
	return new Promise(function(resolve, reject) {
		try {
			var plainTextBitArray = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
            var cipherTextBitArray = self._encrypt(key, plainTextBitArray, true, true);
			var cipherTextArrayBuffer = sjcl.codec.arrayBuffer.fromBits(cipherTextBitArray);
			resolve(new Uint8Array(cipherTextArrayBuffer));
		} catch(e){
			reject(e);
		}
	});
};


/**
 * Decrypt bytes with the provided key
 * @param {Object} key The key to use for the decryption.
 * @param {Uint8Array} bytes
 * @param {Number} decryptedBytesLength The number of bytes of the decrypted array.
 * @return {Promise.<Uint8Array, Error>} will return the decrypted bytes. Resolves to an exception if the encryption failed.
 */
tutao.crypto.SjclAesCbc.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
	var self = this;
	return new Promise(function(resolve, reject){
		try {
			var cipherTextBitArray = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
            var plainTextBitArray = self._decrypt(key, cipherTextBitArray, true, true);
			var plainTextArrayBuffer = sjcl.codec.arrayBuffer.fromBits(plainTextBitArray);
			resolve(new Uint8Array(plainTextArrayBuffer));
		} catch(e){
			reject(e);
		}
	});
};




