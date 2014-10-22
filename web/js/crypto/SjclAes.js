"use strict";

tutao.provide('tutao.crypto.SjclAes');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.SjclAes = function() {
	// arbitrary fixed iv
	this.fixedIv = sjcl.codec.hex.toBits('88888888888888888888888888888888');
	this.keyLength = 128;
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.generateRandomKey = function() {
	return sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.keyLength / 8), false);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.keyToHex = function(key) {
	return sjcl.codec.hex.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.keyToBase64 = function(key) {
	return sjcl.codec.base64.fromBits(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.hexToKey = function(hex) {
	try {
		return sjcl.codec.hex.toBits(hex);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.base64ToKey = function(base64) {
	try {
		return sjcl.codec.base64.toBits(base64);
	} catch (e) {
		throw new tutao.crypto.CryptoError("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptUtf8 = function(key, utf8) {
	try {
		return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptUtf8 = function(key, base64) {
	try {
		return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes utf8 decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptUtf8Index = function(key, utf8) {
    try {
        return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), false, true);
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 encryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptUtf8Index = function(key, base64) {
    try {
        return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, false, true));
    } catch (e) {
        throw new tutao.crypto.CryptoError("aes utf8 decryption index failed", e);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptBytes = function(key, base64) {
	return this._encrypt(key, sjcl.codec.base64.toBits(base64), true, true);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptBytes = function(key, base64) {
	try {
		return sjcl.codec.base64.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return this._encrypt(key, keyToEncrypt, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptKey = function(key, base64) {
	try {
		return this._decrypt(key, base64, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return this._encrypt(key, sjcl.codec.hex.toBits(hexKeyToEncrypt), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoError("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptPrivateRsaKey = function(key, base64) {
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
tutao.crypto.SjclAes.prototype._encrypt = function(key, words, randomIv, usePadding) {
	var iv;
	if (randomIv) {
		iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.keyLength / 8));
	} else {
		// use the fixed iv, but do not append it to the ciphertext
		iv = this.fixedIv;
	}
	var encrypted = sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(key), words, iv, [], usePadding);
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
tutao.crypto.SjclAes.prototype._decrypt = function(key, base64, randomIv, usePadding) {
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
	return sjcl.mode.cbc.decrypt(new sjcl.cipher.aes(key), ciphertext, iv, [], usePadding);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptBase64 = function(key, srcBase64, decryptedSize) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (sjcl.bitArray.bitLength(key) !== self.keyLength) {
            throw new tutao.crypto.CryptoError("invalid key length: " + sjcl.bitArray.bitLength(key));
        }

        // calculate the original encrypted byte length
        var srcByteLen = srcBase64.length / 4 * 3;
        if (srcBase64.charAt(srcBase64.length - 2) == "=") {
            srcByteLen -= 2;
        } else if (srcBase64.charAt(srcBase64.length - 1) == "=") {
            srcByteLen -= 1;
        }

        var byteKeyLength = self.keyLength / 8;
        if (srcByteLen % byteKeyLength != 0 || srcByteLen < 2 * byteKeyLength) {
            throw new tutao.crypto.CryptoError("invalid src buffer len: " + srcByteLen);
        }
        if (decryptedSize < (srcByteLen - 2 * byteKeyLength)) {
            throw new tutao.crypto.CryptoError("invalid dst buffer len: " + decryptedSize + ", src buffer len: " + srcByteLen);
        }

        var aes = new sjcl.cipher.aes(key);

        // one big block is converted from base64 to bits on one step. a big block is 48 bytes = 64 chars per big block.
        // this is the lowest common multiple for key len (16 bytes) and base64 block (4 chars = 3 bytes).
        // one big block therefore consists of 3 blocks a 16 bytes
        var nbrOfFullBigBlocks = Math.floor(srcBase64.length / 64);

        // the destination base64 block array contains big blocks converted into base64
        var dstBase64BlockArray = [];
        dstBase64BlockArray.length = nbrOfFullBigBlocks + 1; // +1 for any partial last block

        // skip the iv
        self._decryptBase64Block(key, srcBase64, srcByteLen, dstBase64BlockArray, null, decryptedSize, aes, 0, 0, [], resolve, reject);
    });
};

/**
 * Decrypts the remaining base64 data.
 * @param {Object} key The key to use for the decryption.
 * @param {String} srcBase64 The encrypted base64 data.
 * @param {Number} srcByteLen The original encrypted byte length.
 * @param {Array.<String>} dstArray Contains the already decrypted base64 parts. Is merged later.
 * @param {Object} iv The sjcl initialization vector to use for the next block decryption.
 * @param {Number} decryptedSize The size of the decrypted data in bytes.
 * @param {Object} aes The sjcl crypto object.
 * @param {Number} i The index in the srcBase64 from where the decryption shall start.
 * @param {Number} a The index in dstArray where the next decrypted parts can be stored.
 * @param {Object} remainingOutputBits One decrypted source big block can not be directly converted to base64 again because of the initialization vector which splits the first big block.
 *                  therefore the remaining 2 blocks of each decrypted big block are stored in remainingOutputBits. as soon as the first block of the next big block is decrypted,
 *                  is is appended to the remainingOutputBits and converted to base64.
 * @param {function(string} resolve Called when successful.
 * @param {function(tutao.crypto.CryptoError)} reject Called when fails.
 */
tutao.crypto.SjclAes.prototype._decryptBase64Block = function(key, srcBase64, srcByteLen, dstArray, iv, decryptedSize, aes, i, a, remainingOutputBits, resolve, reject) {
	try {
		var byteKeyLength = this.keyLength / 8;
		var x = 2 * 1024; // x * 50 bytes is the next chunk = ~100 KB
		var nextStop = Math.min(srcBase64.length, (i + x) * 64);
		for (; i * 64 < nextStop; i++) {
			var bigBlock;
			if ((i + 1) * 64 > srcBase64.length) {
				// partial big block
				bigBlock = sjcl.codec.base64.toBits(srcBase64.substring(i * 64));
			} else {
				// full big block
				bigBlock = sjcl.codec.base64.toBits(srcBase64.substring(i * 64, (i + 1) * 64));
			}
			var bigBlockBitLen = sjcl.bitArray.bitLength(bigBlock);
			var bitIndex = 0;
			for (; bitIndex < bigBlockBitLen; bitIndex += this.keyLength) {
				if (i == 0 && bitIndex == 0) {
					// iv block
					iv = sjcl.bitArray.bitSlice(bigBlock, bitIndex, bitIndex + this.keyLength);
				} else if ((bitIndex == bigBlockBitLen - this.keyLength) && ((i + 1) * 64 >= srcBase64.length)) {
					// padding block
					var enc = sjcl.bitArray.bitSlice(bigBlock, bitIndex, bitIndex + this.keyLength);
					var dec = sjcl.bitArray._xor4(iv, aes.decrypt(enc));
					// check the padding length
					var nbrOfPaddingBytes = sjcl.bitArray.extract(dec, this.keyLength - 8, 8); // the last 8 bit contain the padding length
					if (nbrOfPaddingBytes == 0 || nbrOfPaddingBytes > byteKeyLength) {
						reject(new tutao.crypto.CryptoError("invalid padding value: " + nbrOfPaddingBytes));
						return;
					}
					if (decryptedSize != (srcByteLen - byteKeyLength - nbrOfPaddingBytes)) {
						reject(new tutao.crypto.CryptoError("invalid decrypted size: " + decryptedSize + ", expected: " + (srcByteLen - byteKeyLength - nbrOfPaddingBytes)));
						return;
					}

					// check the padding bytes
					var paddingBytes = sjcl.codec.bytes.fromBits(sjcl.bitArray.bitSlice(dec, this.keyLength - nbrOfPaddingBytes * 8, this.keyLength));
					for (var o = 0; o < paddingBytes.length; o++) {
						if (paddingBytes[o] != nbrOfPaddingBytes) {
							reject(new tutao.crypto.CryptoError("invalid padding byte found: " + paddingBytes[o] + ", expected: " + nbrOfPaddingBytes));
							return;
						}
					}

					// copy the remaining bytes
					remainingOutputBits = sjcl.bitArray.concat(remainingOutputBits, sjcl.bitArray.bitSlice(dec, 0, this.keyLength - nbrOfPaddingBytes * 8));
					dstArray[a] = sjcl.codec.base64.fromBits(remainingOutputBits);
					resolve(dstArray.join(''));
					return;
				} else {
					// normal block
					var enc = sjcl.bitArray.bitSlice(bigBlock, bitIndex, bitIndex + this.keyLength);
					var dec = sjcl.bitArray._xor4(iv, aes.decrypt(enc));
					iv = enc;
					remainingOutputBits = sjcl.bitArray.concat(remainingOutputBits, dec);
					if (sjcl.bitArray.bitLength(remainingOutputBits) == 384) { // one big block is 384 bits
						dstArray[a++] = sjcl.codec.base64.fromBits(remainingOutputBits);
						remainingOutputBits = [];
					}
				}
			}
		}
	} catch (e) {
		reject(new tutao.crypto.CryptoError("error during base64 decryption", e));
		return;
	}
	var self = this;
	setTimeout(function() {
		self._decryptBase64Block(key, srcBase64, srcByteLen, dstArray, iv, decryptedSize, aes, i, a, remainingOutputBits, resolve, reject);
	}, 50); // 50 ms for spinner time
};