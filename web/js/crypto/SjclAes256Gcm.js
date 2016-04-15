"use strict";

tutao.provide('tutao.crypto.SjclAes256Gcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.SjclAes256Gcm = function() {
    this._keyLengthBytes = 32;
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.generateRandomKey = function() {
	return sjcl.codec.arrayBuffer.toBits(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes).buffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.encryptUtf8 = function(key, utf8) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.stringToUtf8Uint8Array(utf8), true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.decryptUtf8 = function(key, base64) {
	try {
		return tutao.util.EncodingConverter.utf8Uint8ArrayToString(this._decrypt(key, sjcl.codec.base64.toBits(base64), true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 decryption failed", e);
	}
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.encryptUtf8Index = function(key, utf8) {
    try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.stringToUtf8Uint8Array(utf8), true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.decryptUtf8Index = function(key, base64) {
    try {
		return tutao.util.EncodingConverter.utf8Uint8ArrayToString(this._decrypt(key, sjcl.codec.base64.toBits(base64), true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.encryptBytes = function(key, base64) {
	return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.base64ToUint8Array(base64), true));
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.decryptBytes = function(key, base64) {
	try {
		return tutao.util.EncodingConverter.uint8ArrayToBase64(this._decrypt(key, sjcl.codec.base64.toBits(base64), true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, new Uint8Array(sjcl.codec.arrayBuffer.fromBits(keyToEncrypt)), false));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.decryptKey = function(key, base64) {
	try {
		return sjcl.codec.arrayBuffer.toBits(this._decrypt(key, sjcl.codec.base64.toBits(base64), false).buffer);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return sjcl.codec.base64.fromBits(this._encrypt(key, tutao.util.EncodingConverter.hexToUint8Array(hexKeyToEncrypt), true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes256Gcm.prototype.decryptPrivateRsaKey = function(key, base64) {
	try {
		return tutao.util.EncodingConverter.uint8ArrayToHex(this._decrypt(key, sjcl.codec.base64.toBits(base64), true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key decryption failed", e);
	}
};

/**
 * Encrypts bytes with AES in GCM mode.
 * @protected
 * @param {bitArray} key The key to use for the encryption.
 * @param {Uint8Array} bytes The plain text.
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {bitArray} The encrypted text as words (sjcl internal structure)..
 */
tutao.crypto.SjclAes256Gcm.prototype._encrypt = function(key, bytes, usePadding) {
	if (usePadding) {
		bytes = tutao.crypto.Utils.pad(bytes); // TODO (bdeterding) consider implementing padding for bit array.
	}
    var words = sjcl.codec.arrayBuffer.toBits(bytes.buffer);
	var iv = sjcl.codec.arrayBuffer.toBits(tutao.locator.randomizer.generateRandomData(tutao.crypto.AesInterface.IV_BYTE_LENGTH).buffer);
	var encrypted = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), words, iv, [], tutao.crypto.AesInterface.TAG_BIT_LENGTH);
	return sjcl.bitArray.concat(iv, encrypted);
};

/**
 * Decrypts the given words with AES in GCM mode.
 * @protected
 * @param {bitArray} key The key to use for the decryption.
 * @param {bitArray} words The ciphertext encoded as words.
 * @param {boolean} usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return {Uint8Array} The decrypted bytes.
 */
tutao.crypto.SjclAes256Gcm.prototype._decrypt = function(key, words, usePadding) {
	// take the iv from the front of the encrypted data
	var iv = sjcl.bitArray.bitSlice(words, 0, tutao.crypto.AesInterface.IV_BIT_LENGTH);
	var ciphertext = sjcl.bitArray.bitSlice(words, tutao.crypto.AesInterface.IV_BIT_LENGTH);
    var decrypted = sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], tutao.crypto.AesInterface.TAG_BIT_LENGTH);
    var decryptedBytes = new Uint8Array(sjcl.codec.arrayBuffer.fromBits(decrypted)); // TODO (bdeterding) consider to implement padding for bit array
	if (usePadding) {
		decryptedBytes = tutao.crypto.Utils.unpad(decryptedBytes);
	}
    return decryptedBytes;
};
