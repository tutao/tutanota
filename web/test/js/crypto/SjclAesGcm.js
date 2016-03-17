"use strict";

tutao.provide('tutao.crypto.SjclAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.SjclAesGcm = function() {
	// arbitrary fixed iv
	this.fixedIv = sjcl.codec.hex.toBits('8888888888888888888888888888888888888888888888888888888888888888');
	this.keyLength = 256;
	this.ivLength = 128; // in bits
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.generateRandomKey = function() {
	return sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.keyLength / 8), false);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.keyToHex = function(key) {
	return sjcl.codec.hex.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.keyToBase64 = function(key) {
	return sjcl.codec.base64.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.hexToKey = function(hex) {
	try {
		return sjcl.codec.hex.toBits(hex);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.base64ToKey = function(base64) {
	try {
		return sjcl.codec.base64.toBits(base64);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptUtf8 = function(key, utf8) {
	try {
		return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptUtf8 = function(key, base64) {
	try {
		return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw e; //throw new tutao.crypto.CryptoError("aes utf8 decryption failed", e);
	}
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
    try {
        return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), false, true);
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptUtf8Index = function(key, base64) {
    try {
        return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptBytes = function(key, base64) {
	return this._encrypt(key, sjcl.codec.base64.toBits(base64), true, true);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptBytes = function(key, base64) {
	try {
		return sjcl.codec.base64.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return this._encrypt(key, keyToEncrypt, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptKey = function(key, base64) {
	try {
		return this._decrypt(key, base64, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return this._encrypt(key, sjcl.codec.hex.toBits(hexKeyToEncrypt), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
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
tutao.crypto.SjclAesGcm.prototype._encrypt = function(key, words, randomIv, usePadding) {
	var iv;
	if (randomIv) {
		iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.ivLength / 8));
	} else {
		// use the fixed iv, but do not append it to the ciphertext
		iv = this.fixedIv;
	}
	//var beforeTime = Date.now();
	var encrypted = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), words, iv, [], 128);
	//console.log("encrypt SjclAesGcm 256: " + (Date.now()- beforeTime))
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
tutao.crypto.SjclAesGcm.prototype._decrypt = function(key, base64, randomIv, usePadding) {
	var iv;
	var ciphertext;
	var encrypted = sjcl.codec.base64.toBits(base64);
	if (randomIv) {
		// take the iv from the front of the encrypted data
		iv = sjcl.bitArray.bitSlice(encrypted, 0, this.ivLength);
		ciphertext = sjcl.bitArray.bitSlice(encrypted, this.ivLength);
	} else {
		iv = this.fixedIv;
		ciphertext = encrypted;
	}
	//var beforeTime = Date.now();
	var cipherText = sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], 128);
	//console.log("decrypt SjclAesGcm 256: " + (Date.now()- beforeTime));
	return cipherText;
};


/**
 * Encrypt bytes with the provided key
 * @param {Object} key The key to use for the encryption.
 * @param {Uint8Array} bytes
 * @return {Promise.<Uint8Array, Error>} will return the encrypted bytes.  Resolves to an exception if the encryption failed.
 */
tutao.crypto.SjclAesGcm.prototype.aesEncrypt = function (key, bytes) {
	var self = this;
	return new Promise(function(resolve, reject) {
		try {
			var plainTextBitArray = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
			var iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(self.ivLength / 8));
			//var beforeTime = Date.now();
			var cipherTextBitArray = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), plainTextBitArray, iv, [], 128);
			//console.log("encrypt SjclAesGcm 256: " + (Date.now()- beforeTime))
			var cipherTextArrayBuffer = sjcl.codec.arrayBuffer.fromBits(sjcl.bitArray.concat(iv, cipherTextBitArray));
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
tutao.crypto.SjclAesGcm.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
	var self = this;
	return new Promise(function(resolve, reject){
		try {
			var cipherTextBitArray = sjcl.codec.arrayBuffer.toBits(bytes.buffer);

			// take the iv from the front of the encrypted data
			var iv = sjcl.bitArray.bitSlice(cipherTextBitArray, 0, self.ivLength);
			var ciphertext = sjcl.bitArray.bitSlice(cipherTextBitArray, self.ivLength);

			//var beforeTime = Date.now();
			var plainTextBitArray = sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], 128);
			//console.log("decrypt SjclAesGcm 256: " + (Date.now()- beforeTime));

			var painTextArrayBuffer = sjcl.codec.hex.fromBits(plainTextBitArray);
			resolve(new Uint8Array(painTextArrayBuffer));
		} catch(e){
			reject(e);
		}
	});
};




