"use strict";

tutao.provide('tutao.crypto.AsmCryptoAesGcm');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.AsmCryptoAesGcm = function() {
	this._keyLengthBytes = 32;
    this._ivLengthBytes = 16;
    this._tagSizeBytes = 16;
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.generateRandomKey = function() {
    return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._keyLengthBytes)));
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.keyToHex = function(key) {
    return tutao.util.EncodingConverter.arrayBufferToHex(key.buffer);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.keyToBase64 = function(key) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.hexToKey = function(hex) {
    return new Uint8Array(tutao.util.EncodingConverter.hexToArrayBuffer(hex));
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.base64ToKey = function(base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptUtf8 = function(key, string) {
    var iv = this._createIv();
    var plainText = tutao.util.EncodingConverter.stringToUtf8Uint8Array(string);
    var encrypted = asmCrypto.AES_GCM.encrypt(plainText, key, iv, "", this._tagSizeBytes);
    var merged = tutao.crypto.WebCryptoAesGcm.mergeIvAndEncrypted(iv, encrypted);
    return tutao.util.EncodingConverter.uint8ArrayToBase64(merged);
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptUtf8 = function(key, base64) {
    var rawData = tutao.util.EncodingConverter.base64ToUint8Array(base64);
    var iv = new Uint8Array(rawData.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(rawData.buffer, this._ivLengthBytes);
    var decryptedUint8Array = asmCrypto.AES_GCM.decrypt(encryptedData, key, iv, "", this._tagSizeBytes);
    return tutao.util.EncodingConverter.utf8Uint8ArrayToString(decryptedUint8Array);
};


/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptUtf8Index = function(key, utf8) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptUtf8Index = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptBytes = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptKey = function(key, keyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptKey = function(key, base64) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.encryptPrivateRsaKey = function(key, hexKeyToEncrypt) {
};

/**
 * @inheritDoc
 */
tutao.crypto.AsmCryptoAesGcm.prototype.decryptPrivateRsaKey = function(key, base64) {
};


tutao.crypto.AsmCryptoAesGcm.prototype.aesEncrypt = function (key, bytes) {
    var iv = this._createIv();
    var encrypted = asmCrypto.AES_GCM.encrypt(bytes, key, iv, "", this._tagSizeBytes);
    var merged = tutao.crypto.WebCryptoAesGcm.mergeIvAndEncrypted(iv, encrypted);
    return Promise.resolve(merged);
};

tutao.crypto.AsmCryptoAesGcm.prototype.aesDecrypt = function (key, bytes, decryptedBytesLength) {
    var iv = new Uint8Array(bytes.buffer, 0, this._ivLengthBytes);
    var encryptedData = new Uint8Array(bytes.buffer, this._ivLengthBytes);
    var decrypted = asmCrypto.AES_GCM.decrypt(encryptedData, key, iv, "", this._tagSizeBytes);
    return Promise.resolve(decrypted);
};

tutao.crypto.AsmCryptoAesGcm.prototype._createIv = function(iv, encrypted) {
    return tutao.util.EncodingConverter.hexToArrayBuffer(tutao.locator.randomizer.generateRandomData(this._ivLengthBytes));
};
