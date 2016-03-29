"use strict";

tutao.provide('tutao.crypto.AsmCryptoAesCbc');

/**
 * AES 256 CBC without HMAC
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.AsmCryptoAesCbc = function() {
	this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.generateRandomKey = function() {
    return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes)));
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.keyToHex = function(key) {
    return tutao.util.EncodingConverter.arrayBufferToHex(key.buffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.keyToBase64 = function(key) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.hexToKey = function(hex) {
    return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(hex));
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.base64ToKey = function(base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.encryptUtf8 = function(key, string) {
    var iv = this._createIv();
    var plainText = tutao.util.EncodingConverter.stringToUtf8Uint8Array(string);
    var encrypted = asmCrypto.AES_CBC.encrypt(plainText, key, true, iv);
    var merged = tutao.crypto.WebCryptoAesGcm.mergeIvAndEncrypted(iv, encrypted.buffer);
    return tutao.util.EncodingConverter.uint8ArrayToBase64(merged);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.decryptUtf8 = function(key, base64) {
    var rawData = tutao.util.EncodingConverter.base64ToUint8Array(base64);
    var iv = new Uint8Array(rawData.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(rawData.buffer, this._ivLengthBytes);
    var decryptedUint8Array = asmCrypto.AES_CBC.decrypt(encryptedData, key, true, iv);
    return tutao.util.EncodingConverter.utf8Uint8ArrayToString(decryptedUint8Array);
};


/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.encryptUtf8Index = function(key, utf8) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.decryptUtf8Index = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.encryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.decryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.encryptKey = function(key, keyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.decryptKey = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesCbc.prototype.decryptPrivateRsaKey = function(key, base64) {
};


tutao.crypto.AsmCryptoAesCbc.prototype.aesEncrypt = function (key, bytes) {
    var iv = this._createIv();
    var encrypted = asmCrypto.AES_CBC.encrypt(bytes, key, true, iv);
    var merged = tutao.crypto.WebCryptoAesGcm.mergeIvAndEncrypted(iv, encrypted.buffer);
    return Promise.resolve(merged);
};

tutao.crypto.AsmCryptoAesCbc.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
    var iv = new Uint8Array(bytes.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(bytes.buffer, this._ivLengthBytes);
    var decrypted = asmCrypto.AES_CBC.decrypt(encryptedData, key, true, iv);
    return Promise.resolve(decrypted);
};

tutao.crypto.AsmCryptoAesCbc.prototype._createIv = function(iv, encrypted) {
    return tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
};
