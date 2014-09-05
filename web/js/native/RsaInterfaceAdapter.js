"use strict";

tutao.provide('tutao.native.RsaInterfaceAdapter');

/**
 * @constructor
 * @implements {tutao.crypto.RsaInterface}
 */
tutao.native.RsaInterfaceAdapter = function () {
    this.keyLengthInBits = 2048;
};

/**
 * @inheritDoc
 */
tutao.native.RsaInterfaceAdapter.prototype.generateKeyPair = function (callback) {
    var self = this;
    tutao.locator.crypto.generateRsaKey(this.keyLengthInBits).then(function (/*tutao.native.KeyPair*/keypair) {
        callback(self._convertFromKeyPair(keypair))
    });
};

/**
 * @param {tutao.native.KeyPair} keypair
 * @return {object}
 * @private
 */
tutao.native.RsaInterfaceAdapter.prototype._convertFromKeyPair = function (keypair) {
    return {
        publicKey: [this._base64ToBigInt(keypair.publicKey.modulus)],
        privateKey: [
            this._base64ToBigInt(keypair.publicKey.modulus),
            this._base64ToBigInt(keypair.privateKey.privateExponent),
            this._base64ToBigInt(keypair.privateKey.primeP),
            this._base64ToBigInt(keypair.privateKey.primeQ),
            this._base64ToBigInt(keypair.privateKey.primeExponentP),
            this._base64ToBigInt(keypair.privateKey.primeExponentQ),
            this._base64ToBigInt(keypair.privateKey.crtCoefficient)
        ]};
};

/**
 * @param {object}
 * @return {tutao.native.KeyPair}
 * @private
 */
tutao.native.RsaInterfaceAdapter.prototype._convertToKeyPair = function (object) {
    return {
        publicKey: this._convertToPublicKey(object.publicKey),
        privateKey: this._convertToPrivateKey(object.privateKey)
    };
};

tutao.native.RsaInterfaceAdapter.prototype._convertToPublicKey = function (privateKey) {
    var self = this;
    return {
        version: 0,
        keyLength: self.keyLengthInBits,
        modulus: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[0].toByteArray())),
        publicExponent: tutao.locator.crypto.publicExponent
    };
};

tutao.native.RsaInterfaceAdapter.prototype._convertToPrivateKey = function (privateKey) {
    var self = this;
    return {
        version: 0,
        keyLength: self.keyLengthInBits,
        privateExponent: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[1].toByteArray())),
        primeP: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[2].toByteArray())),
        primeQ: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[3].toByteArray())),
        primeExponentP: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[4].toByteArray())),
        primeExponentQ: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[5].toByteArray())),
        crtCoefficient: tutao.util.EncodingConverter.arrayBufferToBase64(new Uint8Array(privateKey[6].toByteArray()))
    };
};

tutao.native.RsaInterfaceAdapter.prototype._base64ToBigInt = function (base64) {
    return new BigInteger(new Int8Array(tutao.util.EncodingConverter.base64ToArray(base64)));
};

/**
 * Provides the length of the given string as hex string of 4 characters length. Padding to 4 characters is done with '0'.
 * @param {string} string A string to get the length of.
 * @return {string} A hex string containing the length of string.
 */
tutao.native.RsaInterfaceAdapter.prototype._hexLen = function (string) {
    var hexLen = string.length.toString(16);
    while (hexLen.length < 4) {
        hexLen = "0" + hexLen;
    }
    return hexLen;
};

/**
 * @inheritDoc
 */
tutao.native.RsaInterfaceAdapter.prototype.keyToHex = function (key) {
    var hex = "";
    for (var i = 0; i < key.length; i++) {
        var param = key[i].toString(16);
        if ((param.length % 2) == 1) {
            param = "0" + param;
        }
        hex += this._hexLen(param) + param;
    }
    return hex;
};

/**
 * @inheritDoc
 */
tutao.native.RsaInterfaceAdapter.prototype.hexToKey = function (hex) {
    try {
        var key = [];
        var pos = 0;
        while (pos < hex.length) {
            var nextParamLen = parseInt(hex.substring(pos, pos + 4), 16);
            pos += 4;
            key.push(parseBigInt(hex.substring(pos, pos + nextParamLen), 16));
            pos += nextParamLen;
        }
        this._validateKeyLength(key);
        return key;
    } catch (e) {
        throw new tutao.crypto.CryptoError("hex to rsa key failed", e);
    }
};

/**
 * @param {Array} key
 * @private
 */
tutao.native.RsaInterfaceAdapter.prototype._validateKeyLength = function (key) {
    if (key.length != 1 && key.length != 7) {
        throw new Error("invalid key params");
    }
    if (key[0].bitLength() < this.keyLengthInBits - 1 || key[0].bitLength() > this.keyLengthInBits) {
        throw new Error("invalid key length, expected: around " + this.keyLengthInBits + ", but was: " + key[0].bitLength());
    }
};

/**
 * @inheritDoc
 */
tutao.native.RsaInterfaceAdapter.prototype.encryptAesKey = function (publicKey, hex, callback) {
    try {
        var bytes = tutao.util.EncodingConverter.hexToBytes(hex);
        tutao.locator.crypto.rsaEncrypt(this._convertToPublicKey(publicKey), bytes).then(function (/*Uint8Array*/bytes) {
            callback(tutao.util.EncodingConverter.arrayBufferToBase64(bytes));
        }).caught(function (e) {
            callback(null, new tutao.crypto.CryptoError("rsa encryption failed", e));
        });
    } catch (e) {
        callback(null, new tutao.crypto.CryptoError("rsa encryption failed", e));
    }
};

/**
 * @inheritDoc
 */
tutao.native.RsaInterfaceAdapter.prototype.decryptAesKey = function (privateKey, base64, callback) {
    try {
        var bytes = tutao.util.EncodingConverter.base64ToArray(base64);
        tutao.locator.crypto.rsaDecrypt(this._convertToPrivateKey(privateKey), bytes).then(function (/*Uint8Array*/bytes) {
            callback(tutao.util.EncodingConverter.bytesToHex(bytes));
        }).caught(function (e) {
            callback(null, new tutao.crypto.CryptoError("rsa decryption failed", e));
        });
    } catch (e) {
        callback(null, new tutao.crypto.CryptoError("rsa decryption failed", e));
    }
};