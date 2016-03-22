"use strict";

tutao.provide('tutao.crypto.ForgeCryptoAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.ForgeCryptoAesGcm = function() {
	this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.generateRandomKey = function() {
    return forge.util.hexToBytes(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes));
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.keyToHex = function(key) {
    return forge.util.bytesToHex(key);
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.keyToBase64 = function(key) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.hexToKey = function(hex) {
    return forge.util.hexToBytes(hex);
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.base64ToKey = function(base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.encryptUtf8 = function(key, string) {
    var buffer = forge.util.createBuffer(string, "utf8");
    var result = this._encrypt(key, buffer);
    return tutao.util.EncodingConverter.uint8ArrayToBase64(result);
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.decryptUtf8 = function(key, base64) {
    var uint8Array = tutao.util.EncodingConverter.base64ToUint8Array(base64);
    var decrypted = this._decrypt(key, uint8Array);
    return forge.util.decodeUtf8(decrypted);
};


/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.decryptUtf8Index = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.encryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.decryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.decryptKey = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.ForgeCryptoAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
};


tutao.crypto.ForgeCryptoAesGcm.prototype.aesEncrypt = function (key, bytes) {
    var buffer = forge.util.createBuffer(bytes);
    var encrypted = this._encrypt(key, buffer);
    return Promise.resolve(encrypted);
};

tutao.crypto.ForgeCryptoAesGcm.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
    try {
        var decrypted = this._decrypt(key, bytes);
        return Promise.resolve(forge.util.binary.raw.decode(decrypted));
    } catch (e) {
        return Promise.reject(e);
    }
};

tutao.crypto.ForgeCryptoAesGcm.prototype._createIv = function(iv, encrypted) {
    return tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
};

tutao.crypto.ForgeCryptoAesGcm.prototype._encrypt = function (key, buffer) {
    var iv = forge.util.hexToBytes(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
    var cipher = forge.cipher.createCipher('AES-GCM', key);
    cipher.start({
        iv: iv, // should be a 12-byte binary-encoded string or byte buffer
        additionalData: '', // optional
        tagLength: this._tagSizeBytes * 8 // optional, defaults to 128 bits
    });
    cipher.update(buffer);
    cipher.finish();
    var result = new Uint8Array(iv.length + cipher.output.length() + cipher.mode.tag.length());
    forge.util.binary.raw.decode(iv, result, 0);
    forge.util.binary.raw.decode(cipher.output.data, result, iv.length);
    forge.util.binary.raw.decode(cipher.mode.tag.data, result, iv.length + cipher.output.length());
    return result;
};

tutao.crypto.ForgeCryptoAesGcm.prototype._decrypt = function (key, uint8Array) {
    var iv = forge.util.createBuffer(new Uint8Array(uint8Array.buffer, 0, this._ivLengthBytes));
    var encrypted = forge.util.createBuffer(new Uint8Array(uint8Array.buffer, this._ivLengthBytes, uint8Array.length - this._ivLengthBytes - this._tagSizeBytes));
    var tag = forge.util.createBuffer(new Uint8Array(uint8Array.buffer, uint8Array.length - this._tagSizeBytes));
    var decipher = forge.cipher.createDecipher('AES-GCM', key);
    decipher.start({
        iv: iv,
        additionalData: '', // optional
        tagLength: this._tagSizeBytes * 8, // optional, defaults to 128 bits
        tag: tag // authentication tag from encryption
    });
    decipher.update(encrypted);
    var pass = decipher.finish();
    if (pass) {
        return decipher.output.data;
    } else {
        throw new tutao.CryptoError();
    }
};
