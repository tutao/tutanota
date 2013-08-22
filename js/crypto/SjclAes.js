"use strict";

goog.provide('tutao.crypto.SjclAes');

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
		throw new tutao.crypto.CryptoException("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.base64ToKey = function(base64) {
	try {
		return sjcl.codec.base64.toBits(base64);
	} catch (e) {
		throw new tutao.crypto.CryptoException("hex to aes key failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptUtf8 = function(key, utf8, randomIv) {
	try {
		return this._encrypt(key, sjcl.codec.utf8String.toBits(utf8), randomIv, true);
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes utf8 encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptUtf8 = function(key, base64, randomIv) {
	try {
		return sjcl.codec.utf8String.fromBits(this._decrypt(key, base64, randomIv, true));
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes utf8 decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptBytes = function(key, base64, randomIv) {
	return this._encrypt(key, sjcl.codec.base64.toBits(base64), randomIv, true);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptBytes = function(key, base64, randomIv) {
	try {
		return sjcl.codec.base64.fromBits(this._decrypt(key, base64, randomIv, true));
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes bytes decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptKey = function(key, keyToEncrypt) {
	try {
		return this._encrypt(key, keyToEncrypt, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptKey = function(key, base64) {
	try {
		return this._decrypt(key, base64, false, false);
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes key decryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
	try {
		return this._encrypt(key, sjcl.codec.hex.toBits(hexKeyToEncrypt), true, true);
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes private key encryption failed", e);
	}
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptPrivateRsaKey = function(key, base64) {
	try {
		return sjcl.codec.hex.fromBits(this._decrypt(key, base64, true, true));
	} catch (e) {
		throw new tutao.crypto.CryptoException("aes private key decryption failed", e);
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
tutao.crypto.SjclAes.prototype.encryptArrayBuffer = function(key, srcBuffer, callback) {
	var iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(this.keyLength / 8));
	this._encryptArrayBuffer(key, srcBuffer, iv, callback);
};

/**
 * Encrypts the content of an array buffer with AES in CBC mode with the given initialization vector.
 * @param {Object} key The key to use for the encryption.
 * @param {ArrayBuffer} arrayBuffer The plain text data.
 * @param {Object} iv The initialization vector.
 * @param {function(?ArrayBuffer,tutao.crypto.CryptoException=)} callback Called when finished receiving the encrypted array buffer. Receives an exception if the encryption failed.
 */
tutao.crypto.SjclAes.prototype._encryptArrayBuffer = function(key, srcBuffer, iv, callback) {
	if (sjcl.bitArray.bitLength(iv) !== this.keyLength) {
		callback(null, new tutao.crypto.CryptoException("invalid iv length: " + sjcl.bitArray.bitLength(iv)));
		return;
	}
	if (sjcl.bitArray.bitLength(key) !== this.keyLength) {
		callback(null, new tutao.crypto.CryptoException("invalid key length: " + sjcl.bitArray.bitLength(key)));
		return;
	}
	var xor = sjcl.bitArray._xor4;

	var byteKeyLength = this.keyLength / 8;
	var uint32ArraysPerBlock = byteKeyLength / 4;
	var prp = new sjcl.cipher.aes(key);
	// the floor'ed division cuts off a last partial block which must be padded. if no partial block exists a padding block must be added.
	// so in both cases a padded block is added plus a block for the iv
	var nbrOfFullSrcBlocks = Math.floor(srcBuffer.byteLength / byteKeyLength);

	var dstBuffer = new ArrayBuffer((nbrOfFullSrcBlocks + 2) * byteKeyLength);
	var srcDataView = new DataView(srcBuffer);
	var dstDataView = new DataView(dstBuffer);

	// put the iv into first destination block
	for (var i = 0; i < uint32ArraysPerBlock; i++) {
		dstDataView.setUint32(i * 4, iv[i], false);
	}

	// encrypt full src blocks
	var plainBlock = [0, 0, 0, 0]; // dummy initialization
	for (var i = 0; i < (nbrOfFullSrcBlocks * uint32ArraysPerBlock); i += uint32ArraysPerBlock) {
		plainBlock[0] = srcDataView.getUint32(i * 4, false);
		plainBlock[1] = srcDataView.getUint32((i + 1) * 4, false);
		plainBlock[2] = srcDataView.getUint32((i + 2) * 4, false);
		plainBlock[3] = srcDataView.getUint32((i + 3) * 4, false);
		iv = prp.encrypt(xor(iv, plainBlock));
		var dstBlockOffset = (uint32ArraysPerBlock + i) * 4;
		dstDataView.setUint32(dstBlockOffset, iv[0], false);
		dstDataView.setUint32(dstBlockOffset + 4, iv[1], false);
		dstDataView.setUint32(dstBlockOffset + 8, iv[2], false);
		dstDataView.setUint32(dstBlockOffset + 12, iv[3], false);
	}

	// padding
	var srcDataViewLastBlock = new DataView(new ArrayBuffer(byteKeyLength));
	var i;
	// copy the remaining bytes to the last block
	var nbrOfRemainingSrcBytes = srcBuffer.byteLength - nbrOfFullSrcBlocks * byteKeyLength;
	for (i = 0; i < nbrOfRemainingSrcBytes; i++) {
		srcDataViewLastBlock.setUint8(i, srcDataView.getUint8(nbrOfFullSrcBlocks * byteKeyLength + i));
	}
	// fill the last block with padding bytes
	var paddingByte = byteKeyLength - (srcBuffer.byteLength % byteKeyLength);
	for (; i < byteKeyLength; i++) {
		srcDataViewLastBlock.setUint8(i, paddingByte);
	}
	plainBlock[0] = srcDataViewLastBlock.getUint32(0, false);
	plainBlock[1] = srcDataViewLastBlock.getUint32(4, false);
	plainBlock[2] = srcDataViewLastBlock.getUint32(8, false);
	plainBlock[3] = srcDataViewLastBlock.getUint32(12, false);
	iv = prp.encrypt(xor(iv, plainBlock));
	var dstLastBlockOffset = (nbrOfFullSrcBlocks + 1) * byteKeyLength;
	dstDataView.setUint32(dstLastBlockOffset, iv[0], false);
	dstDataView.setUint32(dstLastBlockOffset + 4, iv[1], false);
	dstDataView.setUint32(dstLastBlockOffset + 8, iv[2], false);
	dstDataView.setUint32(dstLastBlockOffset + 12, iv[3], false);
	callback(dstBuffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptArrayBuffer = function(key, srcBuffer, decryptedSize, callback) {
	if (sjcl.bitArray.bitLength(key) !== this.keyLength) {
		callback(null, new tutao.crypto.CryptoException("invalid key length: " + sjcl.bitArray.bitLength(key)));
		return;
	}
	var byteKeyLength = this.keyLength / 8;
	if (srcBuffer.byteLength % byteKeyLength != 0 || srcBuffer.byteLength < 2 * byteKeyLength) {
		callback(null, new tutao.crypto.CryptoException("invalid src buffer len: " + srcBuffer.byteLength));
		return;
	}
	if (decryptedSize < (srcBuffer.byteLength - 2 * byteKeyLength)) {
		callback(null, new tutao.crypto.CryptoException("invalid dst buffer len: " + decryptedSize + ", src buffer len: " + srcBuffer.byteLength));
		return;
	}
	var xor = sjcl.bitArray._xor4;

	var uint32ArraysPerBlock = byteKeyLength / 4;
	var prp = new sjcl.cipher.aes(key);
	// iv and padding block are not full blocks
	var nbrOfFullSrcBlocks = srcBuffer.byteLength / byteKeyLength - 2;

	var dstBuffer = new ArrayBuffer(decryptedSize);
	var srcDataView = new DataView(srcBuffer);
	var dstDataView = new DataView(dstBuffer);

	var iv = [];
	for (var i = 0; i < uint32ArraysPerBlock; i++) {
		iv.push(srcDataView.getUint32(i * 4, false));
	}
	// move the view behind the iv
	srcDataView = new DataView(srcBuffer, byteKeyLength);

	// decrypt full src blocks
	var decryptedBlock = null;
	for (var i = 0; i < ((nbrOfFullSrcBlocks + 1) * uint32ArraysPerBlock); i += uint32ArraysPerBlock) {
		var encryptedBlock = [srcDataView.getUint32(i * 4, false),
		                      srcDataView.getUint32((i + 1) * 4, false),
		                      srcDataView.getUint32((i + 2) * 4, false),
		                      srcDataView.getUint32((i + 3) * 4, false)];
		decryptedBlock = xor(iv, prp.decrypt(encryptedBlock));
		if (i < (nbrOfFullSrcBlocks * uint32ArraysPerBlock)) {
			dstDataView.setUint32(i * 4, decryptedBlock[0], false);
			dstDataView.setUint32(i * 4 + 4, decryptedBlock[1], false);
			dstDataView.setUint32(i * 4 + 8, decryptedBlock[2], false);
			dstDataView.setUint32(i * 4 + 12, decryptedBlock[3], false);
			iv = encryptedBlock;
		} else {
			var lastSrcBlock = new DataView(new ArrayBuffer(byteKeyLength));
			// copy the decrypted uint32 to the last block
			for (var a = 0; a < uint32ArraysPerBlock; a++) {
				lastSrcBlock.setUint32(a * 4, decryptedBlock[a], false);
			}
			// check the padding length
			var nbrOfPaddingBytes = decryptedBlock[3] & 255;
			if (nbrOfPaddingBytes == 0 || nbrOfPaddingBytes > 16) {
				callback(null, new tutao.crypto.CryptoException("invalid padding value: " + nbrOfPaddingBytes));
				return;
			}
			if (decryptedSize != ((nbrOfFullSrcBlocks + 1) * byteKeyLength - nbrOfPaddingBytes)) {
				callback(null, new tutao.crypto.CryptoException("invalid decrypted size: " + decryptedSize + ", expected: " + (nbrOfFullSrcBlocks * byteKeyLength + nbrOfPaddingBytes)));
				return;
			}
			// copy the remaining bytes
			var a;
			for (a = 0; a < (byteKeyLength - nbrOfPaddingBytes); a++) {
				dstDataView.setUint8(nbrOfFullSrcBlocks * byteKeyLength + a, lastSrcBlock.getUint8(a));
			}
			// check the padding bytes
			for (; a < byteKeyLength; a++) {
				if (lastSrcBlock.getUint8(a) != nbrOfPaddingBytes) {
					callback(null, new tutao.crypto.CryptoException("invalid padding byte found: " + lastSrcBlock.getUint8(a) + ", expected: " + nbrOfPaddingBytes));
					return;
				}
			}
		}
	}
	callback(dstBuffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes.prototype.decryptBase64 = function(key, srcBase64, decryptedSize, callback) {
	if (sjcl.bitArray.bitLength(key) !== this.keyLength) {
		callback(null, new tutao.crypto.CryptoException("invalid key length: " + sjcl.bitArray.bitLength(key)));
		return;
	}

	// calculate the original encrypted byte length
	var srcByteLen = srcBase64.length / 4 * 3;
	if (srcBase64.charAt(srcBase64.length - 2) == "=") {
		srcByteLen -= 2;
	} else if (srcBase64.charAt(srcBase64.length - 1) == "=") {
		srcByteLen -= 1;
	}

	var byteKeyLength = this.keyLength / 8;
	if (srcByteLen % byteKeyLength != 0 || srcByteLen < 2 * byteKeyLength) {
		callback(null, new tutao.crypto.CryptoException("invalid src buffer len: " + srcByteLen));
		return;
	}
	if (decryptedSize < (srcByteLen - 2 * byteKeyLength)) {
		callback(null, new tutao.crypto.CryptoException("invalid dst buffer len: " + decryptedSize + ", src buffer len: " + srcByteLen));
		return;
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
	this._decryptBase64Block(key, srcBase64, srcByteLen, dstBase64BlockArray, null, decryptedSize, aes, 0, 0, [], callback);
};

/**
 * Decrypts the remaining base64 data.
 * @param {} Object The key to use for the decryption.
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
 * @param {function(tutao.crypto.CryptoException=)} callback Receives an exception if the decryption failed.
 */
tutao.crypto.SjclAes.prototype._decryptBase64Block = function(key, srcBase64, srcByteLen, dstArray, iv, decryptedSize, aes, i, a, remainingOutputBits, callback) {
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
						callback(null, new tutao.crypto.CryptoException("invalid padding value: " + nbrOfPaddingBytes));
						return;
					}
					if (decryptedSize != (srcByteLen - byteKeyLength - nbrOfPaddingBytes)) {
						callback(null, new tutao.crypto.CryptoException("invalid decrypted size: " + decryptedSize + ", expected: " + (srcByteLen - byteKeyLength - nbrOfPaddingBytes)));
						return;
					}

					// check the padding bytes
					var paddingBytes = sjcl.codec.bytes.fromBits(sjcl.bitArray.bitSlice(dec, this.keyLength - nbrOfPaddingBytes * 8, this.keyLength));
					for (var o = 0; o < paddingBytes.length; o++) {
						if (paddingBytes[o] != nbrOfPaddingBytes) {
							callback(null, new tutao.crypto.CryptoException("invalid padding byte found: " + paddingBytes[o] + ", expected: " + nbrOfPaddingBytes));
							return;
						}
					}

					// copy the remaining bytes
					remainingOutputBits = sjcl.bitArray.concat(remainingOutputBits, sjcl.bitArray.bitSlice(dec, 0, this.keyLength - nbrOfPaddingBytes * 8));
					dstArray[a] = sjcl.codec.base64.fromBits(remainingOutputBits);
					callback(dstArray.join(''));
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
		callback(null, new tutao.crypto.CryptoException("error during base64 decryption", e));
		return;
	}
	var self = this;
	setTimeout(function() {
		self._decryptBase64Block(key, srcBase64, srcByteLen, dstArray, iv, decryptedSize, aes, i, a, remainingOutputBits, callback);
	}, 50); // 50 ms for spinner time
};

// not used currently, but nice implementation
///**
// * @inheritDoc
// */
//tutao.crypto.SjclAes.prototype.decryptArray = function(key, srcArray, decryptedSize, callback) {
//	if (sjcl.bitArray.bitLength(key) !== this.keyLength) {
//		callback(null, new tutao.crypto.CryptoException("invalid key length: " + sjcl.bitArray.bitLength(key)));
//		return;
//	}
//	var byteKeyLength = this.keyLength / 8;
//	if (srcArray.length % byteKeyLength != 0) {
//		callback(null, new tutao.crypto.CryptoException("invalid src buffer len: " + srcArray.length));
//		return;
//	}
//	if (decryptedSize < (srcArray.length - 2 * byteKeyLength)) {
//		callback(null, new tutao.crypto.CryptoException("invalid dst buffer len: " + decryptedSize + ", src buffer len: " + srcArray.length));
//		return;
//	}
//
//	var aes = new sjcl.cipher.aes(key);
//	// iv and padding block are not full blocks
//	var nbrOfFullSrcBlocks = srcArray.length / byteKeyLength - 2;
//
//
//	var dstArray = [];
//	dstArray.length = decryptedSize;
//
//	var iv = sjcl.codec.bytes.toBits(srcArray.slice(0, byteKeyLength));
//
//	// skip the iv
//	this._decryptArrayBlock(key, srcArray, dstArray, iv, decryptedSize, byteKeyLength, aes, 1, nbrOfFullSrcBlocks, callback);
//};
//
//tutao.crypto.SjclAes.prototype._decryptArrayBlock = function(key, srcArray, dstArray, iv, decryptedSize, byteKeyLength, aes, i, nbrOfFullSrcBlocks, callback) {
//	var nextStop = Math.min(nbrOfFullSrcBlocks + 2, i + 1024 * 100 / 16); // stop every 100 Kb or when finished
//	for (;i<nextStop;i++) {
//		var srcArrayOffset = i * byteKeyLength;
//		var dstArrayOffset = (i - 1) * byteKeyLength;
//		var encryptedBlock = sjcl.codec.bytes.toBits(srcArray.slice(srcArrayOffset, srcArrayOffset + byteKeyLength));
//		var decryptedBlock = sjcl.codec.bytes.fromBits(sjcl.bitArray._xor4(iv, aes.decrypt(encryptedBlock)));
//		if (i < (nbrOfFullSrcBlocks + 1)) {
//			for (var j = 0; j < byteKeyLength; j++) {
//				dstArray[j + dstArrayOffset] = decryptedBlock[j];
//			}
//			iv = encryptedBlock;
//		} else {
//			// check the padding length
//			var nbrOfPaddingBytes = decryptedBlock[decryptedBlock.length - 1];
//			if (nbrOfPaddingBytes == 0 || nbrOfPaddingBytes > 16) {
//				callback(null, new tutao.crypto.CryptoException("invalid padding value: " + nbrOfPaddingBytes));
//				return;
//			}
//			if (decryptedSize != ((nbrOfFullSrcBlocks + 1) * byteKeyLength - nbrOfPaddingBytes)) {
//				callback(null, new tutao.crypto.CryptoException("invalid decrypted size: " + decryptedSize + ", expected: " + (nbrOfFullSrcBlocks * byteKeyLength + nbrOfPaddingBytes)));
//				return;
//			}
//			// copy the remaining bytes
//			var a;
//			for (a=0; a<(byteKeyLength - nbrOfPaddingBytes); a++) {
//				dstArray[nbrOfFullSrcBlocks * byteKeyLength + a] = decryptedBlock[a];
//			}
//			// check the padding bytes
//			for (; a<byteKeyLength; a++) {
//				if (decryptedBlock[a] != nbrOfPaddingBytes) {
//					callback(null, new tutao.crypto.CryptoException("invalid padding byte found: " + decryptedBlock[a] + ", expected: " + nbrOfPaddingBytes));
//					return;
//				}
//			}
//		}
//	}
//	if (i == nbrOfFullSrcBlocks + 2) {
//		callback(dstArray);
//	} else {
//		var self = this;
//		setTimeout(function() {
//			self._decryptArrayBlock(key, srcArray, dstArray, iv, decryptedSize, byteKeyLength, aes, i, nbrOfFullSrcBlocks, callback);
//		}, 50); // 50 ms for spinner time
//	}
//};
