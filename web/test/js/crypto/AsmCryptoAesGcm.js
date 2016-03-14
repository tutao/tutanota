"use strict";

tutao.provide('tutao.crypto.AsmCryptoAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.AsmCryptoAesGcm = function() {
	// arbitrary fixed iv
	this.fixedIv = sjcl.codec.hex.toBits('8888888888888888888888888888888888888888888888888888888888888888');
	this.keyLength = 256;
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.generateRandomKey = function() {
	return sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.keyLength / 8), false);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.keyToHex = function(key) {
	return sjcl.codec.hex.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.keyToBase64 = function(key) {
	return sjcl.codec.base64.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.hexToKey = function(hex) {
	try {
		return sjcl.codec.hex.toBits(hex);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.base64ToKey = function(base64) {
	try {
		return sjcl.codec.base64.toBits(base64);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptUtf8 = function(key, utf8) {
	try {
		asmCrypto.AES_GCM.encrypt( cleartext, key, nonce, adata, 128 )
		// return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptUtf8 = function(key, base64) {
	try {
		return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw e; //throw new tutao.crypto.CryptoError("aes utf8 decryption failed", e);
	}
};


/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
    try {
        return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), false, true);
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptUtf8Index = function(key, base64) {
    try {
        return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptBytes = function(key, base64) {
	return this._encrypt(key, sjcl.codec.base64.toBits(base64), true, true);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptBytes = function(key, base64) {
	try {
		return sjcl.codec.base64.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return this._encrypt(key, keyToEncrypt, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptKey = function(key, base64) {
	try {
		return this._decrypt(key, base64, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return this._encrypt(key, sjcl.codec.hex.toBits(hexKeyToEncrypt), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
	try {
		return sjcl.codec.hex.fromBits(this._decrypt(key, base64, true, true));
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
 * @return {string} The encrypted text, base64 coded.
 */
tutao.crypto.AsmCryptoAesGcm.prototype._encrypt = function(key, words, randomIv, usePadding) {
	var iv;
	if (randomIv) {
		iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.keyLength / 8));
	} else {
		// use the fixed iv, but do not append it to the ciphertext
		iv = this.fixedIv;
	}
	var encrypted = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), words, iv, [], 128);
	if (randomIv) {
		return sjcl.codec.base64.fromBits(sjcl.bitArray.concat(iv, encrypted));
	} else {
		return sjcl.codec.base64.fromBits(encrypted);
	}
};

/**
 * Decrypts a base64 coded string with AES in CBC mode into words.
 * @protected
 * @param {Object} key The key to use for the decryption.
 * @param {string} base64 A base64 coded string that was encrypted with the same key before.
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {Object} The decrypted words (CryptoJS internal structure).
 */
tutao.crypto.AsmCryptoAesGcm.prototype._decrypt = function(key, base64, randomIv, usePadding) {
	var iv;
	var ciphertext;
	var encrypted = sjcl.codec.base64.toBits(base64);
	if (randomIv) {
		// take the iv from the front of the encrypted data
		iv = sjcl.bitArray.bitSlice(encrypted, 0, this.keyLength);
		ciphertext = sjcl.bitArray.bitSlice(encrypted, this.keyLength);
	} else {
		iv = this.fixedIv;
		ciphertext = encrypted;
	}
	return sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], 128);
};




