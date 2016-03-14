"use strict";

tutao.provide('tutao.crypto.WebCryptoAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.WebCryptoAesGcm = function() {
	this.keyLength = 256;
	this.ivLength = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.generateRandomKey = function() {
	return tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this.keyLength / 8));
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.keyToHex = function(key) {
	return sjcl.codec.hex.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.keyToBase64 = function(key) {
	return sjcl.codec.base64.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.hexToKey = function(hex) {
	try {
		return sjcl.codec.hex.toBits(hex);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.base64ToKey = function(base64) {
	try {
		return sjcl.codec.base64.toBits(base64);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptUtf8 = function(webCryptoKey, utf8) {
	var self = this;

	// using a fixed size IV.
	var iv = tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this.ivLength));

	return new Promise(function(resolve, reject) {
		//returns the symmetric key
		//console.log(webCryptoKey);
		window.crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				//Don't re-use initialization vectors!
				//Always generate a new iv every time your encrypt!
				//Recommended to use 12 bytes length
				iv: iv,
				//Additional authentication data (optional)
				//additionalData: ArrayBuffer,
				//Tag length (optional)
				tagLength: 128 //can be 32, 64, 96, 104, 112, 120 or 128 (default)
				//addtl: window.crypto.getRandomValues(new Uint8Array(256))
			},
			webCryptoKey, //from generateKey or importKey above
			tutao.util.EncodingConverter.stringToArrayBuffer(utf8) //ArrayBuffer of data you want to encrypt
		).then(function (encrypted) {
				//returns an ArrayBuffer containing the encrypted data
				// iv + encrypted data
				var dstBuffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
				dstBuffer.set(new Uint8Array(iv), 0);
				dstBuffer.set(new Uint8Array(encrypted), iv.byteLength);
				resolve(tutao.util.EncodingConverter.arrayBufferToBase64(dstBuffer.buffer));
		}).catch(function (err) {
			reject(err);
		});
	});
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptUtf8 = function(webCryptoKey, base64) {
	var self = this;

	var rawData = new Uint8Array( tutao.util.EncodingConverter.base64ToArrayBuffer(base64));
	var iv = rawData.slice(0, this.ivLength);
	var encryptedData = rawData.slice(this.ivLength, rawData.byteLength);
	return new Promise(function(resolve, reject){
		window.crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: iv, //The initialization vector you used to encrypt
				//additionalData: ArrayBuffer, //The addtionalData you used to encrypt (if any)
				tagLength: 128, //The tagLength you used to encrypt (if any)
				//addtl: window.crypto.getRandomValues(new Uint8Array(256))
			},
			webCryptoKey, //from generateKey or importKey above
			encryptedData //ArrayBuffer of the data
		).then(function(decrypted){
			//returns an ArrayBuffer containing the decrypted data
			//console.log(new Uint8Array(decrypted));
			resolve(tutao.util.EncodingConverter.arrayBufferToString(decrypted));
		}).catch(function(err){
			reject(err);
		});
	});
};


tutao.crypto.WebCryptoAesGcm.prototype._importKey = function(key) {
	return window.crypto.subtle.importKey(
		"raw", //can be "jwk" or "raw"
		key,
		{   //this is the algorithm options
			name: "AES-GCM"
		},
		false, //whether the key is extractable (i.e. can be used in exportKey)
		["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
	);
};



/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
    try {
        return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), false, true);
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptUtf8Index = function(key, base64) {
    try {
        return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptBytes = function(key, base64) {
	return this._encrypt(key, sjcl.codec.base64.toBits(base64), true, true);
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptBytes = function(key, base64) {
	try {
		return sjcl.codec.base64.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return this._encrypt(key, keyToEncrypt, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptKey = function(key, base64) {
	try {
		return this._decrypt(key, base64, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return this._encrypt(key, sjcl.codec.hex.toBits(hexKeyToEncrypt), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.WebCryptoAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
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
tutao.crypto.WebCryptoAesGcm.prototype._encrypt = function(key, words, randomIv, usePadding) {
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
tutao.crypto.WebCryptoAesGcm.prototype._decrypt = function(key, base64, randomIv, usePadding) {
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




