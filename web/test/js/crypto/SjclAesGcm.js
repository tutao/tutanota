"use strict";

tutao.provide('tutao.crypto.SjclAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.SjclAesGcm = function() {
	// arbitrary fixed iv
	this.fixedIv = sjcl.codec.hex.toBits('88888888888888888888888888888888');
    this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.generateRandomKey = function() {
	return sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes), false);
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
		return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.stringToUtf8Uint8Array(utf8), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptUtf8 = function(key, base64) {
	try {
		return tutao.util.EncodingConverter.utf8Uint8ArrayToString(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, true));
	} catch (e) {
		throw e; //throw new tutao.crypto.CryptoError("aes utf8 decryption failed", e);
	}
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
    try {
        return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.stringToUtf8Uint8Array(utf8), false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptUtf8Index = function(key, base64) {
    try {
        return tutao.util.EncodingConverter.utf8Uint8ArrayToString(this._decrypt(key, sjcl.codec.base64.toBits(base64), false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptBytes = function(key, base64) {
	return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.base64ToUint8Array(base64), true, true));
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptBytes = function(key, base64) {
	try {
		return tutao.util.EncodingConverter.uint8ArrayToBase64(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, new Uint8Array(sjcl.codec.arrayBuffer.fromBits(keyToEncrypt)), true, false));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptKey = function(key, base64) {
	try {
		return sjcl.codec.arrayBuffer.toBits(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, false).buffer);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(hexKeyToEncrypt)), true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
	try {
		return tutao.util.EncodingConverter.arrayBufferToHex(this._decrypt(key, sjcl.codec.base64.toBits(base64), true, true).buffer);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key decryption failed", e);
	}
};

/**
 * Encrypts a list of words with AES in CBC mode.
 * @protected
 * @param {Object} key The key to use for the encryption.
 * @param {Uint8Array} bytes The plain text.
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {Object} The encrypted text, as words.
 */
tutao.crypto.SjclAesGcm.prototype._encrypt = function(key, bytes, randomIv, usePadding) {
    if (usePadding) {
        bytes = tutao.crypto.Utils.pad(bytes);
    }
    var words = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
	var iv;
	if (randomIv) {
		iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
	} else {
		// use the fixed iv, but do not append it to the ciphertext
		iv = this.fixedIv;
	}
	var encrypted = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), words, iv, [], this._tagSizeBytes * 8);
	if (randomIv) {
		return sjcl.bitArray.concat(iv, encrypted);
	} else {
		return encrypted;
	}
};

/**
 * Decrypts a base64 coded string with AES in CBC mode into words.
 * @protected
 * @param {Object} key The key to use for the decryption.
 * @param {Object} words The ciphertext encoded as words.
 * @param {boolean} randomIv If true, a random initialization vector is used (the same plaintext is not encrypted to the same chiffre text).
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {Uint8Array} The decrypted bytes.
 */
tutao.crypto.SjclAesGcm.prototype._decrypt = function(key, words, randomIv, usePadding) {
	var iv;
	var ciphertext;
	if (randomIv) {
		// take the iv from the front of the encrypted data
		iv = sjcl.bitArray.bitSlice(words, 0, this._ivLengthBytes * 8);
		ciphertext = sjcl.bitArray.bitSlice(words, this._ivLengthBytes * 8);
	} else {
		iv = this.fixedIv;
		ciphertext = words;
	}
    var decrypted = sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], this._tagSizeBytes * 8);
    var decryptedBytes = new Uint8Array(sjcl.codec.arrayBuffer.fromBits(decrypted));
    if (usePadding) {
        decryptedBytes = tutao.crypto.Utils.unpad(decryptedBytes);
    }
    return decryptedBytes;
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
            var cipherTextBitArray = self._encrypt(key, bytes, true, true);
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
tutao.crypto.SjclAesGcm.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
	var self = this;
	return new Promise(function(resolve, reject){
		try {
			var cipherTextBitArray = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
			var plainText = self._decrypt(key, cipherTextBitArray, true, true);
			resolve(plainText);
		} catch(e){
			reject(e);
		}
	});
};




