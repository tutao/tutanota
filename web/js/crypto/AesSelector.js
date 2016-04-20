"use strict";

tutao.provide('tutao.crypto.AesSelector');

/**
 * This implementation forwards function calls to either the 128 or 256 bit implemenation, depending on the key length.
 * @constructor
 * @implements {tutao.crypto.AesInterface}
 */
tutao.crypto.AesSelector = function() {
    this._aes256Crypter = new tutao.crypto.SjclAes256Gcm();
    this._switchedTo256 = false; // FIXME implement switch
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.generateRandomKey = function() {
    if (this._switchedTo256) {
        return this._aes256Crypter.generateRandomKey();
    } else {
        return tutao.locator.aesCrypter.generateRandomKey();
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.encryptUtf8 = function(key, utf8) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.encryptUtf8(key, utf8);
    } else {
        return this._aes256Crypter.encryptUtf8(key, utf8);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.decryptUtf8 = function(key, base64) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.decryptUtf8(key, base64);
    } else {
        return this._aes256Crypter.decryptUtf8(key, base64);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.encryptUtf8Index = function(key, utf8) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.encryptUtf8Index(key, utf8);
    } else {
        return this._aes256Crypter.encryptUtf8Index(key, utf8);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.decryptUtf8Index = function(key, base64) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.decryptUtf8Index(key, base64);
    } else {
        return this._aes256Crypter.decryptUtf8Index(key, base64);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.encryptBytes = function(key, base64) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.encryptBytes(key, base64);
    } else {
        return this._aes256Crypter.encryptBytes(key, base64);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.decryptBytes = function(key, base64) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.decryptBytes(key, base64);
    } else {
        return this._aes256Crypter.decryptBytes(key, base64);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.encryptKey = function(key, keyToEncrypt) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.encryptKey(key, keyToEncrypt);
    } else {
        return this._aes256Crypter.encryptKey(key, keyToEncrypt);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.decryptKey = function(key, base64) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.decryptKey(key, base64);
    } else {
        return this._aes256Crypter.decryptKey(key, base64);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.encryptPrivateRsaKey = function(key, hexRsaPrivateKey) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.encryptPrivateRsaKey(key, hexRsaPrivateKey);
    } else {
        return this._aes256Crypter.encryptPrivateRsaKey(key, hexRsaPrivateKey);
    }
};

/**
 * @inheritDoc
 */
tutao.crypto.AesSelector.prototype.decryptPrivateRsaKey = function(key, base64) {
    if (tutao.crypto.Utils.checkIs128BitKey(key)) {
        return tutao.locator.aesCrypter.decryptPrivateRsaKey(key, base64);
    } else {
        return this._aes256Crypter.decryptPrivateRsaKey(key, base64);
    }
};
